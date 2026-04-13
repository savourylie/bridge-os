use std::time::Instant;

use adapters::{CommandOutput, FileEntry, PackageInfo, PackageOperationResult};
use policy_engine::{PolicyAction, PolicyDecision};
use task_models::{Intent, RiskLevel, SystemState};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum TaskCategory {
    FolderOrganization,
    ProjectInspection,
    GuardedCommand,
    PackageInstallation,
}

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub(crate) struct ParsedIntentCandidate {
    pub category: Option<TaskCategory>,
    pub normalized_scope: Option<String>,
    pub command: Option<String>,
    pub package_name: Option<String>,
    pub title: Option<String>,
    pub summary: Option<String>,
    pub intent: Intent,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum StepKind {
    ScanDirectory { scope: String },
    FilterEntries,
    CreateDirectories { scope: String },
    MoveEntries { scope: String },
    SummarizeFolderOrganization,
    AnalyzeProject,
    SummarizeInspection,
    PrepareCommand {
        command: String,
        working_directory: Option<String>,
    },
    RunCommand {
        command: String,
        working_directory: Option<String>,
    },
    SummarizeCommand,
    CheckPackage { package_name: String },
    PrepareInstall { package_name: String },
    InstallPackage { package_name: String },
    VerifyPackage { package_name: String },
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct RuntimePlanStep {
    pub id: String,
    pub description: String,
    pub impact: String,
    pub kind: StepKind,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct PendingApproval {
    pub step_index: usize,
    pub action: PolicyAction,
    pub decision: PolicyDecision,
}

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub(crate) struct ExecutionContext {
    pub scanned_entries: Vec<FileEntry>,
    pub filtered_entries: Vec<FileEntry>,
    pub created_directories: Vec<String>,
    pub moved_files: Vec<(String, String)>,
    pub inspection_summary: Option<String>,
    pub command_output: Option<CommandOutput>,
    pub package_info: Option<PackageInfo>,
    pub install_result: Option<PackageOperationResult>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct PlannedTask {
    pub id: String,
    pub category: TaskCategory,
    pub title: String,
    pub summary: Option<String>,
    pub scope: Option<String>,
    pub intent: Intent,
    pub steps: Vec<RuntimePlanStep>,
    pub max_risk: RiskLevel,
    pub approval_step_indices: Vec<usize>,
    pub approved_step_indices: Vec<usize>,
    pub pending_approval: Option<PendingApproval>,
    pub context: ExecutionContext,
}

#[derive(Debug, Clone)]
pub(crate) struct PendingStabilization {
    pub revision: u64,
    pub due_at: Instant,
}

#[derive(Debug, Clone, Default)]
pub(crate) struct RuntimeState {
    pub system_state: SystemState,
    pub transcript_revision: u64,
    pub pending_stabilization: Option<PendingStabilization>,
    pub planned_task: Option<PlannedTask>,
    pub active_execution_token: Option<u64>,
    pub next_execution_token: u64,
}
