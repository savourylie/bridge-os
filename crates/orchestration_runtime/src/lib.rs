mod executor;
mod models;
mod parser;
mod planner;
mod projection;
mod stabilizer;

use std::fmt;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, RwLock};

use adapters::{
    AdapterError, CommandAdapter, DesktopAdapter, FileSystemAdapter, PackageManagerAdapter,
    PrivilegeAdapter, VoiceAdapter,
};
use audit_log::{AuditEvent, AuditScope, AuditSink};
use executor::{execute_step, policy_action_for_step};
use models::{ParsedIntentCandidate, PendingApproval, PlannedTask, RuntimeState};
use parser::parse_transcript;
use planner::plan_for_intent;
use policy_engine::{PolicyAction, PolicyEngine};
use projection::{
    approval_request_for_task, completion_summary_for_task, derive_execution_progress,
    max_risk, plan_from_runtime_steps, timeline_from_runtime_steps,
};
use stabilizer::{is_due, schedule_stabilization};
use task_models::{
    ApprovalFlow, ApprovalSnapshot, ConversationSlice, ExecutionSlice, ExecutionState, PlanState,
    RiskLevel, StepState, SystemState, TaskSnapshot, TaskState,
};

#[derive(Clone)]
pub struct RuntimeAdapters {
    pub file_system: Arc<dyn FileSystemAdapter>,
    pub voice: Arc<dyn VoiceAdapter>,
    pub privilege: Arc<dyn PrivilegeAdapter>,
    pub package_manager: Arc<dyn PackageManagerAdapter>,
    pub desktop: Arc<dyn DesktopAdapter>,
    pub command: Arc<dyn CommandAdapter>,
}

#[derive(Clone)]
pub struct RuntimeDependencies {
    pub adapters: RuntimeAdapters,
    pub policy_engine: Arc<PolicyEngine>,
    pub audit_log: Arc<dyn AuditSink>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OrchestrationConfig {
    pub intent_stability_ms: u64,
}

impl Default for OrchestrationConfig {
    fn default() -> Self {
        Self {
            intent_stability_ms: 2_000,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StabilizationSchedule {
    pub revision: u64,
    pub delay_ms: u64,
}

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct OrchestrationOutcome {
    pub state: SystemState,
    pub state_changed: bool,
    pub stabilization: Option<StabilizationSchedule>,
    pub execution_token: Option<u64>,
    pub task_completed: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ExecutionAdvance {
    pub state: SystemState,
    pub continue_running: bool,
    pub task_completed: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum OrchestrationRuntimeError {
    Adapter(String),
    InvalidOperation(String),
}

impl fmt::Display for OrchestrationRuntimeError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Adapter(message) | Self::InvalidOperation(message) => f.write_str(message),
        }
    }
}

impl std::error::Error for OrchestrationRuntimeError {}

impl From<AdapterError> for OrchestrationRuntimeError {
    fn from(value: AdapterError) -> Self {
        Self::Adapter(value.to_string())
    }
}

pub struct OrchestrationRuntime {
    dependencies: RuntimeDependencies,
    config: OrchestrationConfig,
    state: RwLock<RuntimeState>,
    next_task_id: AtomicU64,
}

impl OrchestrationRuntime {
    pub fn new(dependencies: RuntimeDependencies) -> Self {
        Self::with_config(dependencies, OrchestrationConfig::default())
    }

    pub fn with_config(dependencies: RuntimeDependencies, config: OrchestrationConfig) -> Self {
        Self {
            dependencies,
            config,
            state: RwLock::new(RuntimeState::default()),
            next_task_id: AtomicU64::new(1),
        }
    }

    pub fn dependencies(&self) -> &RuntimeDependencies {
        &self.dependencies
    }

    pub fn config(&self) -> &OrchestrationConfig {
        &self.config
    }

    pub fn system_state(&self) -> SystemState {
        let state = self.state.read().expect("orchestration state lock poisoned");
        snapshot_from_runtime_state(&state)
    }

    pub fn start_session(&self, conversation: ConversationSlice) -> OrchestrationOutcome {
        let mut state = self.state.write().expect("orchestration state lock poisoned");
        state.system_state = SystemState {
            conversation,
            execution: ExecutionSlice {
                state: ExecutionState::NotStarted,
                progress: None,
            },
            current_task: TaskSnapshot {
                state: TaskState::Listening,
                ..TaskSnapshot::default()
            },
            approval: ApprovalSnapshot::default(),
            timeline: Vec::new(),
        };
        state.transcript_revision = 0;
        state.pending_stabilization = None;
        state.planned_task = None;
        state.active_execution_token = None;

        let snapshot = snapshot_from_runtime_state(&state);
        drop(state);

        self.record_audit(
            "session_started",
            Some("Listening for a new request.".into()),
            None,
            Some(TaskState::Listening),
        );
        OrchestrationOutcome {
            state: snapshot,
            state_changed: true,
            ..OrchestrationOutcome::default()
        }
    }

    pub fn stop_session(&self, conversation: ConversationSlice) -> OrchestrationOutcome {
        let mut state = self.state.write().expect("orchestration state lock poisoned");
        state.system_state = SystemState {
            conversation,
            ..SystemState::default()
        };
        state.transcript_revision = 0;
        state.pending_stabilization = None;
        state.planned_task = None;
        state.active_execution_token = None;

        let snapshot = snapshot_from_runtime_state(&state);
        drop(state);

        self.record_audit(
            "session_stopped",
            Some("Reset runtime state.".into()),
            None,
            Some(TaskState::Idle),
        );
        OrchestrationOutcome {
            state: snapshot,
            state_changed: true,
            ..OrchestrationOutcome::default()
        }
    }

    pub fn sync_conversation(&self, conversation: ConversationSlice) -> OrchestrationOutcome {
        let mut state = self.state.write().expect("orchestration state lock poisoned");
        state.system_state.conversation = conversation.clone();

        if state.system_state.execution.state == ExecutionState::NotStarted
            && state.planned_task.is_none()
        {
            state.system_state.current_task.state = match conversation.state {
                task_models::ConversationState::Idle => TaskState::Idle,
                task_models::ConversationState::Listening => TaskState::Listening,
                _ if !conversation.transcript.trim().is_empty() => TaskState::Understanding,
                _ => state.system_state.current_task.state,
            };
        }

        let snapshot = snapshot_from_runtime_state(&state);
        OrchestrationOutcome {
            state: snapshot,
            state_changed: true,
            ..OrchestrationOutcome::default()
        }
    }

    pub fn observe_transcript(&self, conversation: ConversationSlice) -> OrchestrationOutcome {
        let mut state = self.state.write().expect("orchestration state lock poisoned");
        state.system_state.conversation = conversation.clone();

        if matches!(
            state.system_state.current_task.state,
            TaskState::Executing | TaskState::Paused
        ) {
            let snapshot = snapshot_from_runtime_state(&state);
            return OrchestrationOutcome {
                state: snapshot,
                state_changed: true,
                ..OrchestrationOutcome::default()
            };
        }

        state.transcript_revision += 1;
        let revision = state.transcript_revision;
        state.pending_stabilization =
            Some(schedule_stabilization(revision, self.config.intent_stability_ms));
        state.planned_task = None;
        state.active_execution_token = None;
        state.system_state.execution = ExecutionSlice {
            state: ExecutionState::NotStarted,
            progress: None,
        };
        state.system_state.approval = ApprovalSnapshot::default();
        state.system_state.timeline.clear();
        state.system_state.current_task = TaskSnapshot {
            state: if conversation.transcript.trim().is_empty() {
                TaskState::Listening
            } else {
                TaskState::Understanding
            },
            summary: (!conversation.transcript.trim().is_empty())
                .then_some("BridgeOS is stabilizing your request.".into()),
            ..TaskSnapshot::default()
        };

        let snapshot = snapshot_from_runtime_state(&state);
        drop(state);

        self.record_audit(
            "transcript_observed",
            Some(conversation.transcript),
            None,
            Some(TaskState::Understanding),
        );

        OrchestrationOutcome {
            state: snapshot,
            state_changed: true,
            stabilization: Some(StabilizationSchedule {
                revision,
                delay_ms: self.config.intent_stability_ms,
            }),
            ..OrchestrationOutcome::default()
        }
    }

    pub fn stabilize_if_due(
        &self,
        revision: u64,
    ) -> Result<OrchestrationOutcome, OrchestrationRuntimeError> {
        let mut state = self.state.write().expect("orchestration state lock poisoned");
        let Some(pending) = state.pending_stabilization.clone() else {
            return Ok(OrchestrationOutcome {
                state: snapshot_from_runtime_state(&state),
                ..OrchestrationOutcome::default()
            });
        };

        if pending.revision != revision || !is_due(&pending) {
            return Ok(OrchestrationOutcome {
                state: snapshot_from_runtime_state(&state),
                ..OrchestrationOutcome::default()
            });
        }

        state.pending_stabilization = None;
        let transcript = state.system_state.conversation.transcript.clone();
        if transcript.trim().is_empty() {
            return Ok(OrchestrationOutcome {
                state: snapshot_from_runtime_state(&state),
                ..OrchestrationOutcome::default()
            });
        }

        let parsed = parse_transcript(&transcript);
        let detail = parsed.intent.goal.clone().or_else(|| Some(transcript.clone()));
        drop(state);
        self.record_audit("intent_parsed", detail, None, Some(TaskState::Understanding));

        let mut state = self.state.write().expect("orchestration state lock poisoned");
        apply_stabilized_intent(self, &mut state, parsed)
    }

    pub fn approve_pending(&self) -> Result<OrchestrationOutcome, OrchestrationRuntimeError> {
        let mut state = self.state.write().expect("orchestration state lock poisoned");
        let task = state
            .planned_task
            .as_mut()
            .ok_or_else(|| OrchestrationRuntimeError::InvalidOperation("No pending plan to approve.".into()))?;
        let approval = task
            .pending_approval
            .take()
            .ok_or_else(|| OrchestrationRuntimeError::InvalidOperation("No approval is currently pending.".into()))?;

        task.approved_step_indices = task.approval_step_indices.clone();
        if let Some(step) = state.system_state.timeline.get_mut(approval.step_index) {
            step.status = StepState::Pending;
        }

        state.system_state.approval.state = ApprovalFlow::Done;
        state.system_state.current_task.plan.plan_state = PlanState::Approved;
        let token = begin_execution(&mut state);
        let snapshot = snapshot_from_runtime_state(&state);
        let task_id = state.system_state.current_task.id.clone();
        let task_title = state.system_state.current_task.title.clone();
        drop(state);

        self.record_audit(
            "approval_granted",
            task_title,
            task_id,
            Some(TaskState::Executing),
        );

        Ok(OrchestrationOutcome {
            state: snapshot,
            state_changed: true,
            execution_token: Some(token),
            ..OrchestrationOutcome::default()
        })
    }

    pub fn deny_pending(&self) -> Result<OrchestrationOutcome, OrchestrationRuntimeError> {
        let mut state = self.state.write().expect("orchestration state lock poisoned");
        let task = state
            .planned_task
            .as_mut()
            .ok_or_else(|| OrchestrationRuntimeError::InvalidOperation("No pending plan to deny.".into()))?;
        let approval = task
            .pending_approval
            .take()
            .ok_or_else(|| OrchestrationRuntimeError::InvalidOperation("No approval is currently pending.".into()))?;

        if let Some(step) = state.system_state.timeline.get_mut(approval.step_index) {
            step.status = StepState::Skipped;
            step.impact = Some("Execution was denied before BridgeOS ran this step.".into());
        }

        state.active_execution_token = None;
        state.system_state.execution = ExecutionSlice {
            state: ExecutionState::NotStarted,
            progress: derive_execution_progress(&state.system_state.timeline),
        };
        state.system_state.current_task.state = TaskState::Cancelled;
        state.system_state.current_task.plan.plan_state = PlanState::Cancelled;
        state.system_state.approval.state = ApprovalFlow::Denied;
        let snapshot = snapshot_from_runtime_state(&state);
        let task_id = state.system_state.current_task.id.clone();
        let task_title = state.system_state.current_task.title.clone();
        drop(state);

        self.record_audit(
            "approval_denied",
            task_title,
            task_id,
            Some(TaskState::Cancelled),
        );
        Ok(OrchestrationOutcome {
            state: snapshot,
            state_changed: true,
            ..OrchestrationOutcome::default()
        })
    }

    pub fn pause_execution(&self) -> Result<OrchestrationOutcome, OrchestrationRuntimeError> {
        let mut state = self.state.write().expect("orchestration state lock poisoned");
        if state.system_state.execution.state != ExecutionState::Executing {
            return Err(OrchestrationRuntimeError::InvalidOperation(
                "Execution is not currently running.".into(),
            ));
        }

        state.active_execution_token = None;
        state.system_state.execution.state = ExecutionState::Paused;
        state.system_state.current_task.state = TaskState::Paused;
        let snapshot = snapshot_from_runtime_state(&state);
        let task_id = state.system_state.current_task.id.clone();
        let task_title = state.system_state.current_task.title.clone();
        drop(state);

        self.record_audit(
            "execution_paused",
            task_title,
            task_id,
            Some(TaskState::Paused),
        );
        Ok(OrchestrationOutcome {
            state: snapshot,
            state_changed: true,
            ..OrchestrationOutcome::default()
        })
    }

    pub fn resume_execution(&self) -> Result<OrchestrationOutcome, OrchestrationRuntimeError> {
        let mut state = self.state.write().expect("orchestration state lock poisoned");
        if state.system_state.execution.state != ExecutionState::Paused {
            return Err(OrchestrationRuntimeError::InvalidOperation(
                "Execution is not paused.".into(),
            ));
        }
        if state.planned_task.is_none() {
            return Err(OrchestrationRuntimeError::InvalidOperation(
                "No planned task is available to resume.".into(),
            ));
        }

        let token = begin_execution(&mut state);
        let snapshot = snapshot_from_runtime_state(&state);
        let task_id = state.system_state.current_task.id.clone();
        let task_title = state.system_state.current_task.title.clone();
        drop(state);

        self.record_audit(
            "execution_resumed",
            task_title,
            task_id,
            Some(TaskState::Executing),
        );
        Ok(OrchestrationOutcome {
            state: snapshot,
            state_changed: true,
            execution_token: Some(token),
            ..OrchestrationOutcome::default()
        })
    }

    pub fn stop_execution(&self) -> Result<OrchestrationOutcome, OrchestrationRuntimeError> {
        let mut state = self.state.write().expect("orchestration state lock poisoned");
        if matches!(state.system_state.current_task.state, TaskState::Idle) {
            return Err(OrchestrationRuntimeError::InvalidOperation(
                "No active task is running.".into(),
            ));
        }

        let task_completed = matches!(
            state.system_state.current_task.state,
            TaskState::Executing | TaskState::Paused
        );
        state.active_execution_token = None;
        mark_incomplete_steps_stopped(&mut state.system_state.timeline);

        if let Some(task) = state.planned_task.as_ref() {
            state.system_state.current_task.completion = Some(completion_summary_for_task(
                task,
                false,
                Some("Execution stopped by user request.".into()),
            ));
        }

        state.system_state.current_task.state = TaskState::Cancelled;
        state.system_state.execution.state = if task_completed {
            ExecutionState::Failed
        } else {
            ExecutionState::NotStarted
        };
        state.system_state.execution.progress = derive_execution_progress(&state.system_state.timeline);
        if !matches!(state.system_state.approval.state, ApprovalFlow::Denied) {
            state.system_state.approval.state = ApprovalFlow::Done;
        }
        let snapshot = snapshot_from_runtime_state(&state);
        let task_id = state.system_state.current_task.id.clone();
        let task_title = state.system_state.current_task.title.clone();
        if task_completed {
            state.planned_task = None;
        }
        drop(state);

        self.record_audit(
            "execution_stopped",
            task_title,
            task_id,
            Some(TaskState::Cancelled),
        );
        Ok(OrchestrationOutcome {
            state: snapshot,
            state_changed: true,
            task_completed,
            ..OrchestrationOutcome::default()
        })
    }

    pub async fn execute_next_step(
        &self,
        token: u64,
    ) -> Result<ExecutionAdvance, OrchestrationRuntimeError> {
        let (task, step_index) = {
            let mut state = self.state.write().expect("orchestration state lock poisoned");
            if state.active_execution_token != Some(token)
                || state.system_state.execution.state != ExecutionState::Executing
            {
                return Ok(ExecutionAdvance {
                    state: snapshot_from_runtime_state(&state),
                    continue_running: false,
                    task_completed: false,
                });
            }

            let task = state
                .planned_task
                .clone()
                .ok_or_else(|| OrchestrationRuntimeError::InvalidOperation("No planned task is active.".into()))?;
            let step_index = next_pending_step_index(&state.system_state.timeline);
            let Some(step_index) = step_index else {
                state.active_execution_token = None;
                state.system_state.execution.state = ExecutionState::Completed;
                state.system_state.current_task.state = TaskState::Completed;
                let snapshot = snapshot_from_runtime_state(&state);
                return Ok(ExecutionAdvance {
                    state: snapshot,
                    continue_running: false,
                    task_completed: true,
                });
            };

            if let Some(action) = policy_action_for_step(&task, step_index) {
                let decision = self.dependencies.policy_engine.evaluate(&action);
                self.record_audit(
                    "policy_evaluated",
                    Some(action.description.clone()),
                    state.system_state.current_task.id.clone(),
                    Some(state.system_state.current_task.state),
                );

                if decision.approval_required && !task.approved_step_indices.contains(&step_index) {
                    let approval_request = {
                        let planned_task = state
                            .planned_task
                            .as_mut()
                            .expect("planned task should still exist");
                        planned_task.pending_approval = Some(PendingApproval {
                            step_index,
                            action,
                            decision: decision.clone(),
                        });
                        approval_request_for_task(
                            planned_task,
                            planned_task
                                .pending_approval
                                .as_ref()
                                .expect("pending approval should exist"),
                        )
                    };
                    state.active_execution_token = None;
                    state.system_state.execution.state = ExecutionState::WaitingConfirmation;
                    state.system_state.current_task.state = TaskState::WaitingApproval;
                    state.system_state.approval = ApprovalSnapshot {
                        state: ApprovalFlow::Requested,
                        request: Some(approval_request),
                    };
                    if let Some(step) = state.system_state.timeline.get_mut(step_index) {
                        step.status = StepState::WaitingApproval;
                    }
                    let snapshot = snapshot_from_runtime_state(&state);
                    return Ok(ExecutionAdvance {
                        state: snapshot,
                        continue_running: false,
                        task_completed: false,
                    });
                }
            }

            if let Some(step) = state.system_state.timeline.get_mut(step_index) {
                step.status = StepState::Running;
            }
            state.system_state.execution.progress = derive_execution_progress(&state.system_state.timeline);
            let task_id = state.system_state.current_task.id.clone();
            let step_description = task.steps[step_index].description.clone();
            drop(state);

            self.record_audit(
                "step_started",
                Some(step_description),
                task_id,
                Some(TaskState::Executing),
            );

            (task, step_index)
        };

        let result = execute_step(&self.dependencies, &task, step_index).await;

        let mut state = self.state.write().expect("orchestration state lock poisoned");
        let task_slot = state
            .planned_task
            .as_mut()
            .ok_or_else(|| OrchestrationRuntimeError::InvalidOperation("Planned task disappeared during execution.".into()))?;

        match result {
            Ok(step_result) => {
                task_slot.context = step_result.context.clone();
                if let Some(step) = state.system_state.timeline.get_mut(step_index) {
                    step.status = StepState::Completed;
                    if let Some(impact) = step_result.impact {
                        step.impact = Some(impact);
                    }
                }

                self.record_audit(
                    "step_completed",
                    Some(task.steps[step_index].description.clone()),
                    state.system_state.current_task.id.clone(),
                    Some(TaskState::Executing),
                );

                let continue_running = next_pending_step_index(&state.system_state.timeline).is_some();
                if continue_running {
                    state.system_state.execution.state = ExecutionState::Executing;
                    state.system_state.current_task.state = TaskState::Executing;
                    state.system_state.execution.progress =
                        derive_execution_progress(&state.system_state.timeline);
                    return Ok(ExecutionAdvance {
                        state: snapshot_from_runtime_state(&state),
                        continue_running: true,
                        task_completed: false,
                    });
                }

                let finished_task = state
                    .planned_task
                    .take()
                    .expect("planned task should be present when finalizing");
                state.active_execution_token = None;
                state.system_state.execution.state = ExecutionState::Completed;
                state.system_state.execution.progress =
                    derive_execution_progress(&state.system_state.timeline);
                state.system_state.current_task.state = TaskState::Completed;
                state.system_state.current_task.completion =
                    Some(completion_summary_for_task(&finished_task, true, None));
                state.system_state.approval.state = if finished_task.approval_step_indices.is_empty()
                {
                    ApprovalFlow::NotNeeded
                } else {
                    ApprovalFlow::Done
                };
                let snapshot = snapshot_from_runtime_state(&state);
                drop(state);

                self.record_audit(
                    "task_completed",
                    Some(finished_task.title),
                    Some(finished_task.id),
                    Some(TaskState::Completed),
                );

                Ok(ExecutionAdvance {
                    state: snapshot,
                    continue_running: false,
                    task_completed: true,
                })
            }
            Err(error) => {
                if let Some(step) = state.system_state.timeline.get_mut(step_index) {
                    step.status = StepState::Failed;
                    step.impact = Some(error.to_string());
                }
                let failed_task = state
                    .planned_task
                    .take()
                    .expect("planned task should be present when failing");
                state.active_execution_token = None;
                state.system_state.execution.state = ExecutionState::Failed;
                state.system_state.execution.progress =
                    derive_execution_progress(&state.system_state.timeline);
                state.system_state.current_task.state = TaskState::Failed;
                state.system_state.current_task.completion = Some(completion_summary_for_task(
                    &failed_task,
                    false,
                    Some(error.to_string()),
                ));
                let snapshot = snapshot_from_runtime_state(&state);
                drop(state);

                self.record_audit(
                    "step_failed",
                    Some(error.to_string()),
                    Some(failed_task.id),
                    Some(TaskState::Failed),
                );

                Ok(ExecutionAdvance {
                    state: snapshot,
                    continue_running: false,
                    task_completed: true,
                })
            }
        }
    }

    pub fn evaluate_action(&self, action: &PolicyAction) -> policy_engine::PolicyDecision {
        self.dependencies.policy_engine.evaluate(action)
    }

    fn record_audit(
        &self,
        action: &str,
        detail: Option<String>,
        task_id: Option<String>,
        task_state: Option<TaskState>,
    ) {
        self.dependencies.audit_log.record(AuditEvent {
            scope: AuditScope::Orchestration,
            action: action.into(),
            detail,
            task_id,
            task_state,
        });
    }

    fn next_task_id(&self) -> String {
        format!(
            "task-024-{}",
            self.next_task_id.fetch_add(1, Ordering::SeqCst)
        )
    }
}

fn apply_stabilized_intent(
    runtime: &OrchestrationRuntime,
    state: &mut RuntimeState,
    parsed: ParsedIntentCandidate,
) -> Result<OrchestrationOutcome, OrchestrationRuntimeError> {
    if !parsed.intent.unresolved_questions.is_empty() || parsed.category.is_none() {
        state.planned_task = None;
        state.active_execution_token = None;
        state.system_state.execution = ExecutionSlice {
            state: ExecutionState::NotStarted,
            progress: None,
        };
        state.system_state.approval = ApprovalSnapshot::default();
        state.system_state.timeline.clear();
        state.system_state.current_task = TaskSnapshot {
            id: Some(runtime.next_task_id()),
            title: parsed.title,
            summary: parsed.summary,
            risk: None,
            scope: parsed.normalized_scope,
            state: TaskState::Understanding,
            intent: parsed.intent,
            ..TaskSnapshot::default()
        };
        let snapshot = snapshot_from_runtime_state(state);
        return Ok(OrchestrationOutcome {
            state: snapshot,
            state_changed: true,
            ..OrchestrationOutcome::default()
        });
    }

    let steps = plan_for_intent(&parsed);
    let mut max_seen_risk = RiskLevel::Low;
    let mut approval_step_indices = Vec::new();
    let task_id = runtime.next_task_id();
    let mut task = PlannedTask {
        id: task_id.clone(),
        category: parsed.category.expect("category should be present"),
        title: parsed
            .title
            .clone()
            .unwrap_or_else(|| "BridgeOS Task".into()),
        summary: parsed.summary.clone(),
        scope: parsed.normalized_scope.clone(),
        intent: parsed.intent.clone(),
        steps: steps.clone(),
        max_risk: RiskLevel::Low,
        approval_step_indices: Vec::new(),
        approved_step_indices: Vec::new(),
        pending_approval: None,
        context: models::ExecutionContext::default(),
    };

    for index in 0..task.steps.len() {
        if let Some(action) = policy_action_for_step(&task, index) {
            let decision = runtime.dependencies.policy_engine.evaluate(&action);
            max_seen_risk = max_risk(max_seen_risk, decision.risk_level);
            if decision.approval_required {
                approval_step_indices.push(index);
                if task.pending_approval.is_none() {
                    task.pending_approval = Some(PendingApproval {
                        step_index: index,
                        action,
                        decision,
                    });
                }
            }
        }
    }
    task.max_risk = max_seen_risk;
    task.approval_step_indices = approval_step_indices;

    let plan_state = if task.pending_approval.is_some() {
        PlanState::Ready
    } else {
        PlanState::Approved
    };
    let mut timeline = timeline_from_runtime_steps(&task.steps);
    if let Some(approval) = task.pending_approval.as_ref() {
        if let Some(step) = timeline.get_mut(approval.step_index) {
            step.status = StepState::WaitingApproval;
        }
    }

    state.system_state.current_task = TaskSnapshot {
        id: Some(task_id),
        title: Some(task.title.clone()),
        summary: task.summary.clone(),
        risk: Some(task.max_risk),
        scope: task.scope.clone(),
        state: if task.pending_approval.is_some() {
            TaskState::WaitingApproval
        } else {
            TaskState::Executing
        },
        intent: task.intent.clone(),
        plan: plan_from_runtime_steps(&task.title, &task.steps, plan_state),
        completion: None,
    };
    state.system_state.timeline = timeline;
    state.system_state.execution = ExecutionSlice {
        state: if task.pending_approval.is_some() {
            ExecutionState::WaitingConfirmation
        } else {
            ExecutionState::Executing
        },
        progress: derive_execution_progress(&state.system_state.timeline),
    };
    state.system_state.approval = if let Some(approval) = task.pending_approval.as_ref() {
        ApprovalSnapshot {
            state: ApprovalFlow::Requested,
            request: Some(approval_request_for_task(&task, approval)),
        }
    } else {
        ApprovalSnapshot::default()
    };

    runtime.record_audit(
        "intent_stabilized",
        state.system_state.current_task.title.clone(),
        state.system_state.current_task.id.clone(),
        Some(state.system_state.current_task.state),
    );
    runtime.record_audit(
        "plan_generated",
        Some(format!("{} steps", task.steps.len())),
        state.system_state.current_task.id.clone(),
        Some(state.system_state.current_task.state),
    );

    let execution_token = if task.pending_approval.is_some() {
        None
    } else {
        Some(begin_execution(state))
    };
    if task.pending_approval.is_some() {
        runtime.record_audit(
            "approval_requested",
            state.system_state.current_task.title.clone(),
            state.system_state.current_task.id.clone(),
            Some(TaskState::WaitingApproval),
        );
    }
    state.planned_task = Some(task);

    let snapshot = snapshot_from_runtime_state(state);
    Ok(OrchestrationOutcome {
        state: snapshot,
        state_changed: true,
        execution_token,
        ..OrchestrationOutcome::default()
    })
}

fn begin_execution(state: &mut RuntimeState) -> u64 {
    state.next_execution_token += 1;
    let token = state.next_execution_token;
    state.active_execution_token = Some(token);
    state.system_state.execution.state = ExecutionState::Executing;
    state.system_state.current_task.state = TaskState::Executing;
    state.system_state.current_task.plan.plan_state = PlanState::Approved;
    state.system_state.execution.progress = derive_execution_progress(&state.system_state.timeline);
    token
}

fn next_pending_step_index(timeline: &[task_models::TimelineStep]) -> Option<usize> {
    timeline
        .iter()
        .position(|step| matches!(step.status, StepState::Pending))
}

fn mark_incomplete_steps_stopped(timeline: &mut [task_models::TimelineStep]) {
    let mut first_incomplete_marked = false;
    for step in timeline.iter_mut() {
        if matches!(step.status, StepState::Pending | StepState::Running | StepState::WaitingApproval)
        {
            if !first_incomplete_marked {
                step.status = StepState::Blocked;
                step.impact = Some("Execution stopped before this step completed.".into());
                first_incomplete_marked = true;
            } else {
                step.status = StepState::Skipped;
            }
        }
    }
}

fn snapshot_from_runtime_state(state: &RuntimeState) -> SystemState {
    let mut snapshot = state.system_state.clone();
    snapshot.execution.progress = derive_execution_progress(&snapshot.timeline);
    snapshot
}

#[cfg(test)]
mod tests {
    use super::*;
    use adapters::{
        ActiveWindowInfo, AdapterResult, CommandOutput, CommandRequest, CreateDirectoryRequest,
        DeleteFileRequest, FileEntry, LaunchAppRequest, LaunchAppResult, ListDirectoryRequest,
        MoveFileRequest, PackageInfo, PackageInstallRequest, PackageOperationResult, PackageQuery,
        PrivilegeOutcome, PrivilegeRequest, RenameFileRequest, VoiceSignal,
    };
    use audit_log::InMemoryAuditLog;
    use futures::executor::block_on;

    #[derive(Default)]
    struct TestAdapters;

    #[async_trait::async_trait]
    impl FileSystemAdapter for TestAdapters {
        async fn list_entries(
            &self,
            request: ListDirectoryRequest,
        ) -> AdapterResult<Vec<FileEntry>> {
            if request.scope == "~/Downloads" {
                return Ok(vec![
                    FileEntry {
                        path: "~/Downloads/bridge-screenshot-01.png".into(),
                        is_directory: false,
                        size_bytes: Some(2_048),
                    },
                    FileEntry {
                        path: "~/Downloads/archive.pdf".into(),
                        is_directory: false,
                        size_bytes: Some(1_024),
                    },
                ]);
            }

            Ok(vec![FileEntry {
                path: format!("{}/Cargo.toml", request.scope),
                is_directory: false,
                size_bytes: Some(256),
            }])
        }

        async fn move_file(&self, _request: MoveFileRequest) -> AdapterResult<()> {
            Ok(())
        }

        async fn rename_file(&self, _request: RenameFileRequest) -> AdapterResult<()> {
            Ok(())
        }

        async fn create_directory(&self, _request: CreateDirectoryRequest) -> AdapterResult<()> {
            Ok(())
        }

        async fn delete_file(&self, _request: DeleteFileRequest) -> AdapterResult<()> {
            Ok(())
        }
    }

    #[async_trait::async_trait]
    impl VoiceAdapter for TestAdapters {
        async fn start_listening(&self) -> AdapterResult<()> {
            Ok(())
        }

        async fn stop_listening(&self) -> AdapterResult<()> {
            Ok(())
        }

        async fn next_signal(&self) -> AdapterResult<Option<VoiceSignal>> {
            Ok(None)
        }
    }

    #[async_trait::async_trait]
    impl PrivilegeAdapter for TestAdapters {
        async fn request_elevation(
            &self,
            _request: PrivilegeRequest,
        ) -> AdapterResult<PrivilegeOutcome> {
            Ok(PrivilegeOutcome {
                granted: true,
                prompt_required: true,
            })
        }
    }

    #[async_trait::async_trait]
    impl PackageManagerAdapter for TestAdapters {
        async fn inspect_package(&self, request: PackageQuery) -> AdapterResult<PackageInfo> {
            Ok(PackageInfo {
                package_name: request.package_name,
                installed: false,
                version: None,
            })
        }

        async fn install_package(
            &self,
            request: PackageInstallRequest,
        ) -> AdapterResult<PackageOperationResult> {
            Ok(PackageOperationResult {
                package_name: request.package_name,
                success: true,
                details: Some("Installed via test adapter.".into()),
            })
        }
    }

    #[async_trait::async_trait]
    impl DesktopAdapter for TestAdapters {
        async fn launch_app(&self, _request: LaunchAppRequest) -> AdapterResult<LaunchAppResult> {
            Ok(LaunchAppResult { launched: true })
        }

        async fn active_window(&self) -> AdapterResult<ActiveWindowInfo> {
            Ok(ActiveWindowInfo::default())
        }
    }

    #[async_trait::async_trait]
    impl CommandAdapter for TestAdapters {
        async fn run_command(&self, request: CommandRequest) -> AdapterResult<CommandOutput> {
            Ok(CommandOutput {
                command: request.command,
                working_directory: request.working_directory,
                success: true,
                stdout: Some("On branch main".into()),
                stderr: None,
                exit_code: Some(0),
            })
        }
    }

    fn runtime() -> OrchestrationRuntime {
        let shared = Arc::new(TestAdapters);
        OrchestrationRuntime::with_config(
            RuntimeDependencies {
                adapters: RuntimeAdapters {
                    file_system: shared.clone(),
                    voice: shared.clone(),
                    privilege: shared.clone(),
                    package_manager: shared.clone(),
                    desktop: shared.clone(),
                    command: shared,
                },
                policy_engine: Arc::new(PolicyEngine::default()),
                audit_log: Arc::new(InMemoryAuditLog::new()),
            },
            OrchestrationConfig {
                intent_stability_ms: 0,
            },
        )
    }

    fn conversation(transcript: &str) -> ConversationSlice {
        ConversationSlice {
            state: task_models::ConversationState::IntentLocked,
            transcript: transcript.into(),
            muted: false,
        }
    }

    #[test]
    fn runtime_bootstraps_with_default_state() {
        let runtime = runtime();
        let state = runtime.system_state();
        assert_eq!(state.current_task.state, TaskState::Idle);
        assert_eq!(state.execution.state, ExecutionState::NotStarted);
    }

    #[test]
    fn transcript_observation_schedules_stabilization() {
        let runtime = runtime();
        runtime.start_session(ConversationSlice {
            state: task_models::ConversationState::Listening,
            transcript: String::new(),
            muted: false,
        });

        let outcome = runtime.observe_transcript(conversation("Organize my Downloads"));
        assert_eq!(outcome.state.current_task.state, TaskState::Understanding);
        assert_eq!(outcome.stabilization.as_ref().map(|item| item.revision), Some(1));
    }

    #[test]
    fn stabilization_requests_scope_clarification_when_missing() {
        let runtime = runtime();
        runtime.start_session(ConversationSlice {
            state: task_models::ConversationState::Listening,
            transcript: String::new(),
            muted: false,
        });
        let observed = runtime.observe_transcript(conversation("run git status"));
        let stabilized = runtime
            .stabilize_if_due(observed.stabilization.expect("schedule").revision)
            .expect("stabilize");

        assert_eq!(stabilized.state.current_task.state, TaskState::Understanding);
        assert!(stabilized
            .state
            .current_task
            .intent
            .unresolved_questions
            .iter()
            .any(|question| question.id == "scope"));
    }

    #[test]
    fn stabilization_generates_plan_and_requests_approval_for_folder_writes() {
        let runtime = runtime();
        runtime.start_session(ConversationSlice {
            state: task_models::ConversationState::Listening,
            transcript: String::new(),
            muted: false,
        });
        let observed =
            runtime.observe_transcript(conversation("Organize my Downloads and do not touch PDFs."));
        let stabilized = runtime
            .stabilize_if_due(observed.stabilization.expect("schedule").revision)
            .expect("stabilize");

        assert_eq!(stabilized.state.current_task.state, TaskState::WaitingApproval);
        assert_eq!(stabilized.state.execution.state, ExecutionState::WaitingConfirmation);
        assert_eq!(stabilized.state.timeline.len(), 5);
        assert_eq!(stabilized.state.timeline[2].status, StepState::WaitingApproval);
    }

    #[test]
    fn approval_path_executes_low_risk_steps_and_completes() {
        let runtime = runtime();
        runtime.start_session(ConversationSlice {
            state: task_models::ConversationState::Listening,
            transcript: String::new(),
            muted: false,
        });
        let observed =
            runtime.observe_transcript(conversation("Organize my Downloads and do not touch PDFs."));
        runtime
            .stabilize_if_due(observed.stabilization.expect("schedule").revision)
            .expect("stabilize");
        let approved = runtime.approve_pending().expect("approve");

        let token = approved.execution_token.expect("execution token");
        let mut current = block_on(runtime.execute_next_step(token)).expect("advance");
        while current.continue_running {
            current = block_on(runtime.execute_next_step(token)).expect("advance");
        }

        assert!(current.task_completed);
        assert_eq!(current.state.execution.state, ExecutionState::Completed);
        assert_eq!(current.state.current_task.state, TaskState::Completed);
        assert_eq!(
            current
                .state
                .current_task
                .completion
                .as_ref()
                .expect("completion")
                .changes
                .moved,
            1
        );
    }

    #[test]
    fn low_risk_project_inspection_starts_execution_without_approval() {
        let runtime = runtime();
        runtime.start_session(ConversationSlice {
            state: task_models::ConversationState::Listening,
            transcript: String::new(),
            muted: false,
        });
        let observed = runtime.observe_transcript(conversation("Inspect my memfuse project"));
        let stabilized = runtime
            .stabilize_if_due(observed.stabilization.expect("schedule").revision)
            .expect("stabilize");

        assert_eq!(stabilized.state.execution.state, ExecutionState::Executing);
        let token = stabilized.execution_token.expect("execution token");
        let mut current = block_on(runtime.execute_next_step(token)).expect("advance");
        while current.continue_running {
            current = block_on(runtime.execute_next_step(token)).expect("advance");
        }

        assert_eq!(current.state.current_task.state, TaskState::Completed);
        assert!(current
            .state
            .current_task
            .completion
            .as_ref()
            .expect("completion")
            .outcome
            .contains("Found"));
    }

    #[test]
    fn guarded_command_plan_uses_command_adapter() {
        let runtime = runtime();
        runtime.start_session(ConversationSlice {
            state: task_models::ConversationState::Listening,
            transcript: String::new(),
            muted: false,
        });
        let observed =
            runtime.observe_transcript(conversation("Run git status in my project"));
        runtime
            .stabilize_if_due(observed.stabilization.expect("schedule").revision)
            .expect("stabilize");
        let approved = runtime.approve_pending().expect("approve");
        let token = approved.execution_token.expect("execution token");

        let mut current = block_on(runtime.execute_next_step(token)).expect("advance");
        while current.continue_running {
            current = block_on(runtime.execute_next_step(token)).expect("advance");
        }

        assert!(current
            .state
            .current_task
            .completion
            .as_ref()
            .expect("completion")
            .outcome
            .contains("Command"));
    }

    #[test]
    fn stop_and_deny_paths_do_not_emit_false_completion_state() {
        let runtime = runtime();
        runtime.start_session(ConversationSlice {
            state: task_models::ConversationState::Listening,
            transcript: String::new(),
            muted: false,
        });
        let observed =
            runtime.observe_transcript(conversation("Install ffmpeg for this project"));
        let stabilized = runtime
            .stabilize_if_due(observed.stabilization.expect("schedule").revision)
            .expect("stabilize");
        assert_eq!(stabilized.state.current_task.state, TaskState::WaitingApproval);

        let denied = runtime.deny_pending().expect("deny");
        assert_eq!(denied.state.current_task.state, TaskState::Cancelled);
        assert!(denied.state.current_task.completion.is_none());
    }

    #[test]
    fn stopping_package_install_before_execution_keeps_change_counts_at_zero() {
        let runtime = runtime();
        runtime.start_session(ConversationSlice {
            state: task_models::ConversationState::Listening,
            transcript: String::new(),
            muted: false,
        });
        let observed =
            runtime.observe_transcript(conversation("Install ffmpeg for this project"));
        runtime
            .stabilize_if_due(observed.stabilization.expect("schedule").revision)
            .expect("stabilize");
        runtime.approve_pending().expect("approve");

        let stopped = runtime.stop_execution().expect("stop execution");
        let completion = stopped
            .state
            .current_task
            .completion
            .as_ref()
            .expect("completion summary");

        assert_eq!(completion.changes.modified, 0);
        assert_eq!(completion.changes.network, Some(false));
    }
}
