use serde::{Deserialize, Serialize};
use ts_rs::{Config, TS};

pub const IPC_TYPES_RELATIVE_PATH: &str = "../../src/state/ipc-types.ts";

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default, TS)]
#[serde(rename_all = "snake_case")]
#[ts(rename_all = "snake_case")]
pub enum ConversationState {
    #[default]
    Idle,
    Listening,
    HoldingForMore,
    Clarifying,
    IntentLocked,
    Speaking,
    Interrupted,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default, TS)]
#[serde(rename_all = "snake_case")]
#[ts(rename_all = "snake_case")]
pub enum ExecutionState {
    #[default]
    NotStarted,
    DraftingPlan,
    WaitingConfirmation,
    Executing,
    Paused,
    Completed,
    Failed,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default, TS)]
#[serde(rename_all = "snake_case")]
#[ts(rename_all = "snake_case")]
pub enum TaskState {
    #[default]
    Idle,
    Listening,
    Understanding,
    Planning,
    WaitingApproval,
    Executing,
    Paused,
    Completed,
    Cancelled,
    Reverted,
    Failed,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default, TS)]
#[serde(rename_all = "snake_case")]
#[ts(rename_all = "snake_case")]
pub enum StepState {
    #[default]
    Pending,
    Running,
    WaitingApproval,
    Completed,
    Failed,
    Skipped,
    Blocked,
    Reverted,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default, TS)]
#[serde(rename_all = "snake_case")]
#[ts(rename_all = "snake_case")]
pub enum ApprovalFlow {
    #[default]
    NotNeeded,
    Requested,
    Editing,
    Granted,
    Authorizing,
    Denied,
    Done,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default, TS)]
#[serde(rename_all = "snake_case")]
#[ts(rename_all = "snake_case")]
pub enum RiskLevel {
    #[default]
    Low,
    Medium,
    High,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default, TS)]
#[serde(rename_all = "snake_case")]
#[ts(rename_all = "snake_case")]
pub enum PlanState {
    #[default]
    Drafting,
    Ready,
    Approved,
    Cancelled,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Default, TS)]
#[serde(rename_all = "camelCase")]
#[ts(rename_all = "camelCase")]
pub struct IntentQuestion {
    pub id: String,
    pub text: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Default, TS)]
#[serde(rename_all = "camelCase")]
#[ts(rename_all = "camelCase")]
pub struct Intent {
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub goal: Option<String>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub scope: Option<String>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub constraints: Option<String>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub exclusions: Option<String>,
    #[serde(default)]
    pub unresolved_questions: Vec<IntentQuestion>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Default, TS)]
#[serde(rename_all = "camelCase")]
#[ts(rename_all = "camelCase")]
pub struct PlanStep {
    pub id: String,
    pub description: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Default, TS)]
#[serde(rename_all = "camelCase")]
#[ts(rename_all = "camelCase")]
pub struct Plan {
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(default)]
    pub steps: Vec<PlanStep>,
    #[serde(default)]
    pub plan_state: PlanState,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Default, TS)]
#[serde(rename_all = "camelCase")]
#[ts(rename_all = "camelCase")]
pub struct CompletionChanges {
    pub created: u64,
    pub modified: u64,
    pub moved: u64,
    pub deleted: u64,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub network: Option<bool>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Default, TS)]
#[serde(rename_all = "camelCase")]
#[ts(rename_all = "camelCase")]
pub struct CompletionSummary {
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    pub outcome: String,
    #[serde(default)]
    pub changes: CompletionChanges,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub rollback_available: Option<bool>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub rollback_time_remaining: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Default, TS)]
#[serde(rename_all = "camelCase")]
#[ts(rename_all = "camelCase")]
pub struct ApprovalRequest {
    pub action: String,
    #[serde(default)]
    pub will_affect: Vec<String>,
    #[serde(default)]
    pub will_not_affect: Vec<String>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub impact_summary: Option<String>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub command: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Default, TS)]
#[serde(rename_all = "camelCase")]
#[ts(rename_all = "camelCase")]
pub struct TimelineStep {
    pub id: String,
    pub description: String,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub impact: Option<String>,
    #[serde(default)]
    pub status: StepState,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Default, TS)]
#[serde(rename_all = "camelCase")]
#[ts(rename_all = "camelCase")]
pub struct TranscriptChunkInput {
    pub text: String,
    pub is_final: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Default, TS)]
#[serde(rename_all = "camelCase")]
#[ts(rename_all = "camelCase")]
pub struct ConversationSlice {
    #[serde(default)]
    pub state: ConversationState,
    #[serde(default)]
    pub transcript: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Default, TS)]
#[serde(rename_all = "camelCase")]
#[ts(rename_all = "camelCase")]
pub struct ExecutionProgress {
    pub current: u64,
    pub total: u64,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Default, TS)]
#[serde(rename_all = "camelCase")]
#[ts(rename_all = "camelCase")]
pub struct ExecutionSlice {
    #[serde(default)]
    pub state: ExecutionState,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub progress: Option<ExecutionProgress>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Default, TS)]
#[serde(rename_all = "camelCase")]
#[ts(rename_all = "camelCase")]
pub struct ApprovalSnapshot {
    #[serde(default)]
    pub state: ApprovalFlow,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub request: Option<ApprovalRequest>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Default, TS)]
#[serde(rename_all = "camelCase")]
#[ts(rename_all = "camelCase")]
pub struct TaskSnapshot {
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub summary: Option<String>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub risk: Option<RiskLevel>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub scope: Option<String>,
    #[serde(default)]
    pub state: TaskState,
    #[serde(default)]
    pub intent: Intent,
    #[serde(default)]
    pub plan: Plan,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub completion: Option<CompletionSummary>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Default, TS)]
#[serde(rename_all = "camelCase")]
#[ts(rename_all = "camelCase")]
pub struct SystemState {
    #[serde(default)]
    pub conversation: ConversationSlice,
    #[serde(default)]
    pub execution: ExecutionSlice,
    #[serde(default)]
    pub current_task: TaskSnapshot,
    #[serde(default)]
    pub approval: ApprovalSnapshot,
    #[serde(default)]
    pub timeline: Vec<TimelineStep>,
}

pub fn ipc_typescript_config() -> Config {
    Config::new().with_large_int("number")
}

fn append_decl<T: TS>(output: &mut String, config: &Config) {
    output.push_str("export ");
    output.push_str(&T::decl(config));
    output.push('\n');
    output.push('\n');
}

pub fn ipc_typescript() -> String {
    let config = ipc_typescript_config();
    let mut output = String::from(
        "// This file is generated by `cargo run -p task_models --bin export_ipc_types`.\n\
// Do not edit it by hand.\n\n",
    );

    append_decl::<ConversationState>(&mut output, &config);
    append_decl::<ExecutionState>(&mut output, &config);
    append_decl::<TaskState>(&mut output, &config);
    append_decl::<StepState>(&mut output, &config);
    append_decl::<ApprovalFlow>(&mut output, &config);
    append_decl::<RiskLevel>(&mut output, &config);
    append_decl::<PlanState>(&mut output, &config);
    append_decl::<IntentQuestion>(&mut output, &config);
    append_decl::<Intent>(&mut output, &config);
    append_decl::<PlanStep>(&mut output, &config);
    append_decl::<Plan>(&mut output, &config);
    append_decl::<CompletionChanges>(&mut output, &config);
    append_decl::<CompletionSummary>(&mut output, &config);
    append_decl::<ApprovalRequest>(&mut output, &config);
    append_decl::<TimelineStep>(&mut output, &config);
    append_decl::<TranscriptChunkInput>(&mut output, &config);
    append_decl::<ConversationSlice>(&mut output, &config);
    append_decl::<ExecutionProgress>(&mut output, &config);
    append_decl::<ExecutionSlice>(&mut output, &config);
    append_decl::<ApprovalSnapshot>(&mut output, &config);
    append_decl::<TaskSnapshot>(&mut output, &config);
    append_decl::<SystemState>(&mut output, &config);

    output
}

#[cfg(test)]
mod tests {
    use super::*;

    const CHECKED_IN_IPC_TYPES: &str = include_str!("../../../src/state/ipc-types.ts");

    #[test]
    fn system_state_serde_round_trip_preserves_frontend_field_names() {
        let state = SystemState {
            conversation: ConversationSlice {
                state: ConversationState::Listening,
                transcript: "Computer, organize Downloads".into(),
            },
            execution: ExecutionSlice {
                state: ExecutionState::WaitingConfirmation,
                progress: Some(ExecutionProgress {
                    current: 1,
                    total: 3,
                }),
            },
            current_task: TaskSnapshot {
                title: Some("Organize Downloads".into()),
                risk: Some(RiskLevel::Medium),
                state: TaskState::Planning,
                intent: Intent {
                    goal: Some("Organize Downloads".into()),
                    unresolved_questions: vec![IntentQuestion {
                        id: "scope".into(),
                        text: "Only screenshots?".into(),
                    }],
                    ..Intent::default()
                },
                plan: Plan {
                    title: Some("Draft plan".into()),
                    steps: vec![PlanStep {
                        id: "step-1".into(),
                        description: "Scan Downloads".into(),
                    }],
                    plan_state: PlanState::Ready,
                },
                ..TaskSnapshot::default()
            },
            approval: ApprovalSnapshot {
                state: ApprovalFlow::Requested,
                request: Some(ApprovalRequest {
                    action: "Move 14 files".into(),
                    will_affect: vec!["~/Downloads".into()],
                    impact_summary: Some("Reorganizes screenshots into dated folders".into()),
                    ..ApprovalRequest::default()
                }),
            },
            timeline: vec![TimelineStep {
                id: "step-1".into(),
                description: "Scan Downloads".into(),
                impact: Some("Reads files only".into()),
                status: StepState::Running,
            }],
        };

        let json = serde_json::to_value(&state).expect("serialize system state");
        assert!(json.get("currentTask").is_some());
        assert_eq!(
            json["conversation"]["state"],
            serde_json::Value::String("listening".into())
        );

        let round_trip: SystemState =
            serde_json::from_value(json).expect("deserialize system state");
        assert_eq!(round_trip, state);
    }

    #[test]
    fn default_models_match_expected_idle_shapes() {
        let state = SystemState::default();

        assert_eq!(state.conversation.state, ConversationState::Idle);
        assert_eq!(state.execution.state, ExecutionState::NotStarted);
        assert_eq!(state.current_task.state, TaskState::Idle);
        assert_eq!(state.current_task.plan.plan_state, PlanState::Drafting);
        assert!(state.timeline.is_empty());
    }

    #[test]
    fn checked_in_ipc_types_match_generated_contract() {
        assert_eq!(CHECKED_IN_IPC_TYPES, ipc_typescript());
    }
}
