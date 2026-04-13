use adapters::TranscriptChunk;
use policy_engine::{PolicyAction, PolicyActionKind, PolicyDecision};
use task_models::{
    ApprovalFlow, ApprovalRequest, ApprovalSnapshot, CompletionChanges, CompletionSummary,
    ConversationSlice, ConversationState, ExecutionProgress, ExecutionSlice, ExecutionState,
    Intent, Plan, PlanState, PlanStep, StepState, SystemState, TaskSnapshot, TaskState,
    TimelineStep, TranscriptChunkInput,
};
use tauri::{AppHandle, State};

use crate::BackendState;

pub const CONVERSATION_STATE_CHANGED: &str = "conversation_state_changed";
pub const TRANSCRIPT_UPDATED: &str = "transcript_updated";
pub const INTENT_UPDATED: &str = "intent_updated";
pub const PLAN_UPDATED: &str = "plan_updated";
pub const EXECUTION_STATE_CHANGED: &str = "execution_state_changed";
pub const STEP_UPDATED: &str = "step_updated";
pub const APPROVAL_REQUESTED: &str = "approval_requested";
pub const TASK_COMPLETED: &str = "task_completed";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum IpcCommand {
    StartListening,
    StopListening,
    SubmitTranscriptChunk,
    InterruptConversation,
    ApproveAction,
    DenyAction,
    PauseExecution,
    ResumeExecution,
    StopExecution,
}

trait BridgeEventEmitter {
    fn emit_system_state(&self, event_name: &str, state: &SystemState) -> Result<(), String>;
}

impl BridgeEventEmitter for AppHandle {
    fn emit_system_state(&self, event_name: &str, state: &SystemState) -> Result<(), String> {
        use tauri::Emitter;

        self.emit(event_name, state.clone())
            .map_err(|error| error.to_string())
    }
}

fn placeholder_plan_steps() -> Vec<PlanStep> {
    vec![
        PlanStep {
            id: "step-1".into(),
            description: "Scan ~/Downloads for screenshots".into(),
        },
        PlanStep {
            id: "step-2".into(),
            description: "Prepare dated folders and move matching files".into(),
        },
        PlanStep {
            id: "step-3".into(),
            description: "Verify the result and summarize the outcome".into(),
        },
    ]
}

fn placeholder_timeline() -> Vec<TimelineStep> {
    vec![
        TimelineStep {
            id: "step-1".into(),
            description: "Scan ~/Downloads for screenshots".into(),
            impact: Some("Read-only scan of the approved folder.".into()),
            status: StepState::Pending,
        },
        TimelineStep {
            id: "step-2".into(),
            description: "Prepare dated folders and move matching files".into(),
            impact: Some("Writes stay inside ~/Downloads.".into()),
            status: StepState::Pending,
        },
        TimelineStep {
            id: "step-3".into(),
            description: "Verify the result and summarize the outcome".into(),
            impact: Some("Produces a completion summary for the user.".into()),
            status: StepState::Pending,
        },
    ]
}

fn derive_execution_progress(timeline: &[TimelineStep]) -> Option<ExecutionProgress> {
    if timeline.is_empty() {
        return None;
    }

    if let Some(active_index) = timeline
        .iter()
        .position(|step| matches!(step.status, StepState::Running | StepState::WaitingApproval))
    {
        return Some(ExecutionProgress {
            current: (active_index + 1) as u64,
            total: timeline.len() as u64,
        });
    }

    let touched = timeline
        .iter()
        .filter(|step| !matches!(step.status, StepState::Pending))
        .count();

    Some(ExecutionProgress {
        current: touched.min(timeline.len()) as u64,
        total: timeline.len() as u64,
    })
}

fn placeholder_policy_action() -> PolicyAction {
    PolicyAction {
        kind: PolicyActionKind::MoveFile,
        description: "Move screenshots into month folders inside ~/Downloads".into(),
        affected_resources: vec!["~/Downloads".into()],
        command: Some(
            "bridgeos file-organize --target ~/Downloads --group-by month --exclude pdf,zip".into(),
        ),
    }
}

fn placeholder_approval_request(
    action: &PolicyAction,
    decision: &PolicyDecision,
) -> ApprovalRequest {
    let affected_scope = decision
        .affected_resources
        .first()
        .cloned()
        .unwrap_or_else(|| "the approved workspace".into());

    ApprovalRequest {
        action: action.description.clone(),
        risk_level: decision.risk_level,
        explanation: decision.explanation.clone(),
        will_affect: vec![
            "create dated folders inside ~/Downloads".into(),
            "move screenshots without changing filenames".into(),
        ],
        will_not_affect: vec![
            "delete files".into(),
            "write outside the approved folders".into(),
        ],
        impact_summary: Some(format!("Writes remain inside {affected_scope} only.")),
        command: action.command.clone(),
    }
}

fn seed_placeholder_task(state: &mut SystemState) {
    if state.current_task.id.is_none() {
        state.current_task.id = Some("task-020-placeholder".into());
    }

    if state.current_task.title.is_none() {
        state.current_task.title = Some("Organize Downloads".into());
    }

    if state.current_task.summary.is_none() {
        state.current_task.summary =
            Some("Stub runtime task used to validate the Tauri IPC bridge.".into());
    }

    if state.current_task.scope.is_none() {
        state.current_task.scope = Some("~/Downloads only".into());
    }

    if state.current_task.intent.goal.is_none() {
        state.current_task.intent = Intent {
            goal: Some("Organize screenshots in ~/Downloads by month".into()),
            scope: Some("~/Downloads only".into()),
            constraints: Some("Preserve original filenames.".into()),
            exclusions: Some("Ignore PDFs, zip files, hidden files, and installers.".into()),
            unresolved_questions: Vec::new(),
        };
    }

    if state.current_task.plan.steps.is_empty() {
        state.current_task.plan = Plan {
            title: Some("Draft plan".into()),
            steps: placeholder_plan_steps(),
            plan_state: PlanState::Ready,
        };
    }

    if state.timeline.is_empty() {
        state.timeline = placeholder_timeline();
    }
}

fn reset_runtime_for_new_listening_session(state: &mut SystemState) {
    state.current_task = TaskSnapshot {
        state: TaskState::Listening,
        ..TaskSnapshot::default()
    };
    state.execution = ExecutionSlice {
        state: ExecutionState::NotStarted,
        progress: None,
    };
    state.approval = ApprovalSnapshot::default();
    state.timeline.clear();
}

fn sync_policy_state_for_locked_intent(backend_state: &BackendState, state: &mut SystemState) {
    if state.conversation.state != ConversationState::IntentLocked {
        return;
    }

    if state.execution.state != ExecutionState::NotStarted {
        return;
    }

    if !matches!(
        state.approval.state,
        ApprovalFlow::NotNeeded | ApprovalFlow::Editing
    ) {
        return;
    }

    seed_placeholder_task(state);

    let action = placeholder_policy_action();
    let decision = backend_state.orchestration_runtime.evaluate_action(&action);
    state.current_task.risk = Some(decision.risk_level);
    state.current_task.state = if decision.approval_required {
        TaskState::WaitingApproval
    } else {
        TaskState::Planning
    };
    state.current_task.plan.plan_state = PlanState::Ready;
    state.execution = ExecutionSlice {
        state: if decision.approval_required {
            ExecutionState::WaitingConfirmation
        } else {
            ExecutionState::DraftingPlan
        },
        progress: None,
    };

    if decision.approval_required {
        state.approval = ApprovalSnapshot {
            state: ApprovalFlow::Requested,
            request: Some(placeholder_approval_request(&action, &decision)),
        };
        set_step_status(
            &mut state.timeline,
            0,
            StepState::Completed,
            Some("Planning completed inside the approved folder scope."),
        );
        set_step_status(
            &mut state.timeline,
            1,
            StepState::WaitingApproval,
            Some("Awaiting confirmation before BridgeOS moves files in ~/Downloads."),
        );
        set_step_status(&mut state.timeline, 2, StepState::Pending, None);
    } else {
        state.approval = ApprovalSnapshot::default();
    }
}

fn set_step_status(
    timeline: &mut [TimelineStep],
    index: usize,
    status: StepState,
    impact: Option<&str>,
) {
    if let Some(step) = timeline.get_mut(index) {
        step.status = status;
        if let Some(impact) = impact {
            step.impact = Some(impact.into());
        }
    }
}

fn event_names_for_command(command: IpcCommand, state: &SystemState) -> Vec<&'static str> {
    match command {
        IpcCommand::StartListening => vec![CONVERSATION_STATE_CHANGED, TRANSCRIPT_UPDATED],
        IpcCommand::StopListening => vec![CONVERSATION_STATE_CHANGED, TRANSCRIPT_UPDATED],
        IpcCommand::SubmitTranscriptChunk => {
            let mut events = vec![CONVERSATION_STATE_CHANGED, TRANSCRIPT_UPDATED];
            if state.approval.state == ApprovalFlow::Requested {
                events.extend([
                    INTENT_UPDATED,
                    PLAN_UPDATED,
                    EXECUTION_STATE_CHANGED,
                    STEP_UPDATED,
                    APPROVAL_REQUESTED,
                ]);
            }
            events
        }
        IpcCommand::InterruptConversation => vec![CONVERSATION_STATE_CHANGED, TRANSCRIPT_UPDATED],
        IpcCommand::ApproveAction => vec![
            INTENT_UPDATED,
            PLAN_UPDATED,
            APPROVAL_REQUESTED,
            EXECUTION_STATE_CHANGED,
            STEP_UPDATED,
        ],
        IpcCommand::DenyAction => vec![
            INTENT_UPDATED,
            PLAN_UPDATED,
            APPROVAL_REQUESTED,
            EXECUTION_STATE_CHANGED,
            STEP_UPDATED,
        ],
        IpcCommand::PauseExecution => vec![EXECUTION_STATE_CHANGED, STEP_UPDATED],
        IpcCommand::ResumeExecution => vec![EXECUTION_STATE_CHANGED, STEP_UPDATED],
        IpcCommand::StopExecution => vec![EXECUTION_STATE_CHANGED, STEP_UPDATED, TASK_COMPLETED],
    }
}

fn apply_ipc_command(command: IpcCommand, state: &mut SystemState) {
    match command {
        IpcCommand::StartListening => {
            if matches!(
                state.current_task.state,
                TaskState::Idle | TaskState::Cancelled
            ) {
                reset_runtime_for_new_listening_session(state);
            }
        }
        IpcCommand::StopListening => {
            if state.current_task.state == TaskState::Listening {
                state.current_task = TaskSnapshot::default();
                state.execution = ExecutionSlice {
                    state: ExecutionState::NotStarted,
                    progress: None,
                };
                state.approval = ApprovalSnapshot::default();
                state.timeline.clear();
            }
        }
        IpcCommand::SubmitTranscriptChunk | IpcCommand::InterruptConversation => {}
        IpcCommand::ApproveAction => {
            seed_placeholder_task(state);
            state.current_task.state = TaskState::Executing;
            state.current_task.plan.plan_state = PlanState::Approved;
            state.execution = ExecutionSlice {
                state: ExecutionState::Executing,
                progress: None,
            };
            state.approval = ApprovalSnapshot {
                state: ApprovalFlow::Done,
                request: state.approval.request.clone(),
            };

            set_step_status(
                &mut state.timeline,
                0,
                StepState::Completed,
                Some("133 screenshots identified."),
            );
            set_step_status(
                &mut state.timeline,
                1,
                StepState::Running,
                Some("Preparing dated folders inside ~/Downloads."),
            );
            set_step_status(&mut state.timeline, 2, StepState::Pending, None);
        }
        IpcCommand::DenyAction => {
            seed_placeholder_task(state);
            state.current_task.state = TaskState::Cancelled;
            state.execution = ExecutionSlice {
                state: ExecutionState::NotStarted,
                progress: None,
            };
            state.approval = ApprovalSnapshot {
                state: ApprovalFlow::Denied,
                request: state.approval.request.clone(),
            };

            set_step_status(
                &mut state.timeline,
                0,
                StepState::Completed,
                Some("133 screenshots identified."),
            );
            set_step_status(
                &mut state.timeline,
                1,
                StepState::Skipped,
                Some("Execution was denied before any file moves ran."),
            );
            set_step_status(&mut state.timeline, 2, StepState::Skipped, None);
        }
        IpcCommand::PauseExecution => {
            seed_placeholder_task(state);
            state.current_task.state = TaskState::Paused;
            state.current_task.plan.plan_state = PlanState::Approved;
            state.execution = ExecutionSlice {
                state: ExecutionState::Paused,
                progress: None,
            };
            state.approval.state = ApprovalFlow::Done;

            set_step_status(
                &mut state.timeline,
                0,
                StepState::Completed,
                Some("133 screenshots identified."),
            );
            set_step_status(
                &mut state.timeline,
                1,
                StepState::Running,
                Some("Execution is paused at the next safe point."),
            );
        }
        IpcCommand::ResumeExecution => {
            seed_placeholder_task(state);
            state.current_task.state = TaskState::Executing;
            state.current_task.plan.plan_state = PlanState::Approved;
            state.execution = ExecutionSlice {
                state: ExecutionState::Executing,
                progress: None,
            };
            state.approval.state = ApprovalFlow::Done;

            set_step_status(
                &mut state.timeline,
                0,
                StepState::Completed,
                Some("133 screenshots identified."),
            );
            set_step_status(
                &mut state.timeline,
                1,
                StepState::Running,
                Some("Resumed execution inside ~/Downloads."),
            );
        }
        IpcCommand::StopExecution => {
            seed_placeholder_task(state);
            state.current_task.state = TaskState::Cancelled;
            state.current_task.plan.plan_state = PlanState::Approved;
            state.current_task.completion = Some(CompletionSummary {
                title: Some("Execution stopped".into()),
                outcome: "Execution stopped by user request.".into(),
                changes: CompletionChanges {
                    created: 0,
                    modified: 0,
                    moved: 0,
                    deleted: 0,
                    network: Some(false),
                },
                rollback_available: Some(false),
                rollback_time_remaining: None,
            });
            state.execution = ExecutionSlice {
                state: ExecutionState::Failed,
                progress: None,
            };
            state.approval.state = ApprovalFlow::Done;

            set_step_status(
                &mut state.timeline,
                0,
                StepState::Completed,
                Some("133 screenshots identified."),
            );
            set_step_status(
                &mut state.timeline,
                1,
                StepState::Blocked,
                Some("Execution stopped before any file moves completed."),
            );
            set_step_status(
                &mut state.timeline,
                2,
                StepState::Skipped,
                Some("No completion verification ran after stop."),
            );
        }
    }

    state.execution.progress = derive_execution_progress(&state.timeline);
}

fn sync_conversation_slice(backend_state: &BackendState, state: &mut SystemState) {
    state.conversation = ConversationSlice {
        state: backend_state.conversation_runtime.state(),
        transcript: backend_state.conversation_runtime.transcript(),
    };
}

fn sync_placeholder_task_state_for_conversation(state: &mut SystemState) {
    if state.execution.state != ExecutionState::NotStarted {
        return;
    }

    if state.approval.state == ApprovalFlow::Requested {
        return;
    }

    match state.conversation.state {
        ConversationState::Idle => {
            if state.current_task.state == TaskState::Listening {
                state.current_task.state = TaskState::Idle;
            }
        }
        ConversationState::Listening => {
            if matches!(
                state.current_task.state,
                TaskState::Idle | TaskState::Cancelled
            ) {
                state.current_task.state = TaskState::Listening;
            }
        }
        ConversationState::HoldingForMore
        | ConversationState::Clarifying
        | ConversationState::IntentLocked
        | ConversationState::Speaking
        | ConversationState::Interrupted => {
            if state.current_task.state == TaskState::Listening {
                state.current_task.state = TaskState::Idle;
            }
        }
    }
}

fn build_system_state(backend_state: &BackendState) -> SystemState {
    let mut state = backend_state.orchestration_runtime.system_state();
    sync_conversation_slice(backend_state, &mut state);
    sync_placeholder_task_state_for_conversation(&mut state);
    sync_policy_state_for_locked_intent(backend_state, &mut state);

    if state.execution.progress.is_none() {
        state.execution.progress = derive_execution_progress(&state.timeline);
    }

    state
}

fn persist_system_state(backend_state: &BackendState, state: SystemState) -> SystemState {
    backend_state
        .orchestration_runtime
        .replace_system_state(state.clone());
    state
}

fn apply_and_persist(command: IpcCommand, backend_state: &BackendState) -> SystemState {
    let mut state = build_system_state(backend_state);
    apply_ipc_command(command, &mut state);
    persist_system_state(backend_state, state)
}

fn emit_events<E: BridgeEventEmitter>(
    emitter: &E,
    command: IpcCommand,
    state: &SystemState,
) -> Result<(), String> {
    for event_name in event_names_for_command(command, state) {
        emitter.emit_system_state(event_name, state)?;
    }

    Ok(())
}

#[tauri::command]
pub async fn start_listening(
    app: AppHandle,
    state: State<'_, BackendState>,
) -> Result<SystemState, String> {
    let backend_state = state.inner();
    backend_state
        .conversation_runtime
        .start_listening()
        .await
        .map_err(|error| error.to_string())?;

    let next_state = apply_and_persist(IpcCommand::StartListening, backend_state);
    emit_events(&app, IpcCommand::StartListening, &next_state)?;

    Ok(next_state)
}

#[tauri::command]
pub async fn stop_listening(
    app: AppHandle,
    state: State<'_, BackendState>,
) -> Result<SystemState, String> {
    let backend_state = state.inner();
    backend_state
        .conversation_runtime
        .stop_listening()
        .await
        .map_err(|error| error.to_string())?;

    let next_state = apply_and_persist(IpcCommand::StopListening, backend_state);
    emit_events(&app, IpcCommand::StopListening, &next_state)?;

    Ok(next_state)
}

#[tauri::command]
pub fn submit_transcript_chunk(
    app: AppHandle,
    state: State<'_, BackendState>,
    chunk: TranscriptChunkInput,
) -> Result<SystemState, String> {
    let backend_state = state.inner();
    backend_state
        .conversation_runtime
        .submit_transcript_chunk(TranscriptChunk {
            text: chunk.text,
            is_final: chunk.is_final,
        })
        .map_err(|error| error.to_string())?;

    let next_state = apply_and_persist(IpcCommand::SubmitTranscriptChunk, backend_state);
    emit_events(&app, IpcCommand::SubmitTranscriptChunk, &next_state)?;

    Ok(next_state)
}

#[tauri::command]
pub fn interrupt_conversation(
    app: AppHandle,
    state: State<'_, BackendState>,
) -> Result<SystemState, String> {
    let backend_state = state.inner();
    backend_state
        .conversation_runtime
        .interrupt()
        .map_err(|error| error.to_string())?;

    let next_state = apply_and_persist(IpcCommand::InterruptConversation, backend_state);
    emit_events(&app, IpcCommand::InterruptConversation, &next_state)?;

    Ok(next_state)
}

#[tauri::command]
pub fn approve_action(
    app: AppHandle,
    state: State<'_, BackendState>,
) -> Result<SystemState, String> {
    let backend_state = state.inner();
    let next_state = apply_and_persist(IpcCommand::ApproveAction, backend_state);
    emit_events(&app, IpcCommand::ApproveAction, &next_state)?;

    Ok(next_state)
}

#[tauri::command]
pub fn deny_action(app: AppHandle, state: State<'_, BackendState>) -> Result<SystemState, String> {
    let backend_state = state.inner();
    let next_state = apply_and_persist(IpcCommand::DenyAction, backend_state);
    emit_events(&app, IpcCommand::DenyAction, &next_state)?;

    Ok(next_state)
}

#[tauri::command]
pub fn pause_execution(
    app: AppHandle,
    state: State<'_, BackendState>,
) -> Result<SystemState, String> {
    let backend_state = state.inner();
    let next_state = apply_and_persist(IpcCommand::PauseExecution, backend_state);
    emit_events(&app, IpcCommand::PauseExecution, &next_state)?;

    Ok(next_state)
}

#[tauri::command]
pub fn resume_execution(
    app: AppHandle,
    state: State<'_, BackendState>,
) -> Result<SystemState, String> {
    let backend_state = state.inner();
    let next_state = apply_and_persist(IpcCommand::ResumeExecution, backend_state);
    emit_events(&app, IpcCommand::ResumeExecution, &next_state)?;

    Ok(next_state)
}

#[tauri::command]
pub fn stop_execution(
    app: AppHandle,
    state: State<'_, BackendState>,
) -> Result<SystemState, String> {
    let backend_state = state.inner();
    let next_state = apply_and_persist(IpcCommand::StopExecution, backend_state);
    emit_events(&app, IpcCommand::StopExecution, &next_state)?;

    Ok(next_state)
}

#[tauri::command]
pub fn get_system_state(state: State<'_, BackendState>) -> SystemState {
    build_system_state(state.inner())
}

#[cfg(test)]
mod tests {
    use super::*;
    use futures::executor::block_on;

    #[derive(Default)]
    struct MockEmitter {
        emitted: std::sync::Mutex<Vec<String>>,
    }

    impl BridgeEventEmitter for MockEmitter {
        fn emit_system_state(&self, event_name: &str, _state: &SystemState) -> Result<(), String> {
            self.emitted
                .lock()
                .expect("mock emitter lock poisoned")
                .push(event_name.into());
            Ok(())
        }
    }

    fn command_result(mut state: SystemState, command: IpcCommand) -> SystemState {
        apply_ipc_command(command, &mut state);
        state
    }

    fn requested_state() -> SystemState {
        let backend_state = BackendState::bootstrap();
        block_on(backend_state.conversation_runtime.start_listening()).expect("start listening");
        backend_state
            .conversation_runtime
            .submit_transcript_chunk(TranscriptChunk {
                text: "this week".into(),
                is_final: true,
            })
            .expect("submit final transcript");

        apply_and_persist(IpcCommand::SubmitTranscriptChunk, &backend_state)
    }

    #[test]
    fn command_mutations_return_expected_stub_states() {
        let requested = requested_state();
        let approved = command_result(requested.clone(), IpcCommand::ApproveAction);
        assert_eq!(approved.execution.state, ExecutionState::Executing);
        assert_eq!(approved.current_task.state, TaskState::Executing);
        assert_eq!(approved.timeline[1].status, StepState::Running);
        assert_eq!(approved.approval.request, requested.approval.request);

        let denied = command_result(requested.clone(), IpcCommand::DenyAction);
        assert_eq!(denied.execution.state, ExecutionState::NotStarted);
        assert_eq!(denied.current_task.state, TaskState::Cancelled);
        assert_eq!(denied.approval.state, ApprovalFlow::Denied);
        assert_eq!(denied.approval.request, requested.approval.request);

        let paused = command_result(requested.clone(), IpcCommand::PauseExecution);
        assert_eq!(paused.execution.state, ExecutionState::Paused);
        assert_eq!(paused.current_task.state, TaskState::Paused);

        let resumed = command_result(requested.clone(), IpcCommand::ResumeExecution);
        assert_eq!(resumed.execution.state, ExecutionState::Executing);
        assert_eq!(resumed.current_task.state, TaskState::Executing);

        let stopped = command_result(requested, IpcCommand::StopExecution);
        assert_eq!(stopped.execution.state, ExecutionState::Failed);
        assert_eq!(stopped.current_task.state, TaskState::Cancelled);
        assert_eq!(
            stopped
                .current_task
                .completion
                .as_ref()
                .expect("completion summary")
                .outcome,
            "Execution stopped by user request."
        );
    }

    #[test]
    fn event_emission_mapping_matches_public_channels() {
        let emitter = MockEmitter::default();
        let state = command_result(requested_state(), IpcCommand::StopExecution);

        emit_events(&emitter, IpcCommand::StopExecution, &state).expect("emit stop events");

        let emitted = emitter
            .emitted
            .lock()
            .expect("mock emitter lock poisoned")
            .clone();

        assert_eq!(
            emitted,
            vec![
                EXECUTION_STATE_CHANGED.to_string(),
                STEP_UPDATED.to_string(),
                TASK_COMPLETED.to_string(),
            ]
        );
        assert_eq!(
            event_names_for_command(IpcCommand::ApproveAction, &state),
            vec![
                INTENT_UPDATED,
                PLAN_UPDATED,
                APPROVAL_REQUESTED,
                EXECUTION_STATE_CHANGED,
                STEP_UPDATED,
            ]
        );
        assert_eq!(
            event_names_for_command(IpcCommand::StartListening, &state),
            vec![CONVERSATION_STATE_CHANGED, TRANSCRIPT_UPDATED]
        );
        assert_eq!(
            event_names_for_command(IpcCommand::SubmitTranscriptChunk, &requested_state()),
            vec![
                CONVERSATION_STATE_CHANGED,
                TRANSCRIPT_UPDATED,
                INTENT_UPDATED,
                PLAN_UPDATED,
                EXECUTION_STATE_CHANGED,
                STEP_UPDATED,
                APPROVAL_REQUESTED,
            ]
        );
        assert_eq!(
            event_names_for_command(IpcCommand::InterruptConversation, &state),
            vec![CONVERSATION_STATE_CHANGED, TRANSCRIPT_UPDATED]
        );
    }

    #[test]
    fn conversation_runtime_commands_build_expected_system_state() {
        let backend_state = BackendState::bootstrap();
        let emitter = MockEmitter::default();

        block_on(backend_state.conversation_runtime.start_listening()).expect("start listening");
        let listening_state = apply_and_persist(IpcCommand::StartListening, &backend_state);
        emit_events(&emitter, IpcCommand::StartListening, &listening_state)
            .expect("emit listening events");
        assert_eq!(
            listening_state.conversation.state,
            ConversationState::Listening
        );
        assert_eq!(listening_state.current_task.state, TaskState::Listening);

        backend_state
            .conversation_runtime
            .submit_transcript_chunk(TranscriptChunk {
                text: "wait, not yesterday".into(),
                is_final: false,
            })
            .expect("submit holding transcript");
        let holding_state = apply_and_persist(IpcCommand::SubmitTranscriptChunk, &backend_state);
        assert_eq!(
            holding_state.conversation.state,
            ConversationState::HoldingForMore
        );
        assert_eq!(holding_state.current_task.state, TaskState::Idle);

        backend_state
            .conversation_runtime
            .submit_transcript_chunk(TranscriptChunk {
                text: "this week".into(),
                is_final: true,
            })
            .expect("submit final transcript");
        let locked_state = apply_and_persist(IpcCommand::SubmitTranscriptChunk, &backend_state);
        assert_eq!(
            locked_state.conversation.state,
            ConversationState::IntentLocked
        );
        assert_eq!(locked_state.conversation.transcript, "this week");
        assert_eq!(locked_state.current_task.state, TaskState::WaitingApproval);
        assert_eq!(
            locked_state.execution.state,
            ExecutionState::WaitingConfirmation
        );
        assert_eq!(
            locked_state.current_task.risk,
            Some(task_models::RiskLevel::Medium)
        );
        assert_eq!(locked_state.approval.state, ApprovalFlow::Requested);
        assert_eq!(
            locked_state
                .approval
                .request
                .as_ref()
                .expect("approval request")
                .risk_level,
            task_models::RiskLevel::Medium
        );
        assert_eq!(
            locked_state
                .approval
                .request
                .as_ref()
                .expect("approval request")
                .explanation,
            "This action changes files or folders inside an approved workspace, so it pauses for confirmation before writing."
        );
        assert_eq!(locked_state.timeline[1].status, StepState::WaitingApproval);

        backend_state
            .conversation_runtime
            .start_speaking()
            .expect("force speaking");
        backend_state
            .conversation_runtime
            .interrupt()
            .expect("interrupt speaking");
        let interrupt_state = apply_and_persist(IpcCommand::InterruptConversation, &backend_state);
        assert_eq!(
            interrupt_state.conversation.state,
            ConversationState::Interrupted
        );
    }

    #[test]
    fn interrupt_command_requires_speaking_state() {
        let backend_state = BackendState::bootstrap();
        let before = build_system_state(&backend_state);

        let error = backend_state
            .conversation_runtime
            .interrupt()
            .expect_err("interrupt should fail before speaking");
        assert_eq!(
            error.to_string(),
            "Invalid conversation transition: Idle -> Interrupted"
        );

        let after = build_system_state(&backend_state);
        assert_eq!(before, after);
    }

    #[test]
    fn final_transcript_emits_policy_backed_approval_channels() {
        let emitter = MockEmitter::default();
        let state = requested_state();

        emit_events(&emitter, IpcCommand::SubmitTranscriptChunk, &state)
            .expect("emit transcript events");

        let emitted = emitter
            .emitted
            .lock()
            .expect("mock emitter lock poisoned")
            .clone();

        assert!(emitted.contains(&APPROVAL_REQUESTED.to_string()));
        assert!(emitted.contains(&EXECUTION_STATE_CHANGED.to_string()));
        assert!(emitted.contains(&INTENT_UPDATED.to_string()));
    }
}
