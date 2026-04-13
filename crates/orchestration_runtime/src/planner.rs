use crate::models::{ParsedIntentCandidate, RuntimePlanStep, StepKind, TaskCategory};

pub(crate) fn plan_for_intent(parsed: &ParsedIntentCandidate) -> Vec<RuntimePlanStep> {
    match parsed.category.expect("category should be resolved before planning") {
        TaskCategory::FolderOrganization => folder_organization_plan(
            parsed
                .normalized_scope
                .as_deref()
                .expect("folder organization scope should be present"),
        ),
        TaskCategory::ProjectInspection => project_inspection_plan(
            parsed
                .normalized_scope
                .as_deref()
                .expect("project inspection scope should be present"),
        ),
        TaskCategory::GuardedCommand => guarded_command_plan(
            parsed
                .command
                .as_deref()
                .expect("guarded command should be present"),
            parsed.normalized_scope.clone(),
        ),
        TaskCategory::PackageInstallation => package_install_plan(
            parsed
                .package_name
                .as_deref()
                .expect("package name should be present"),
        ),
    }
}

fn folder_organization_plan(scope: &str) -> Vec<RuntimePlanStep> {
    vec![
        RuntimePlanStep {
            id: "step-1".into(),
            description: format!("Scan {scope} for matching files"),
            impact: "Read-only scan of the approved folder.".into(),
            kind: StepKind::ScanDirectory { scope: scope.into() },
        },
        RuntimePlanStep {
            id: "step-2".into(),
            description: "Filter files by the requested rules".into(),
            impact: "Keeps excluded file types and hidden items out of scope.".into(),
            kind: StepKind::FilterEntries,
        },
        RuntimePlanStep {
            id: "step-3".into(),
            description: format!("Create category folders inside {scope}"),
            impact: format!("Writes stay inside {scope}."),
            kind: StepKind::CreateDirectories { scope: scope.into() },
        },
        RuntimePlanStep {
            id: "step-4".into(),
            description: "Move matching files into those folders".into(),
            impact: "Preserves original filenames while reorganizing the folder.".into(),
            kind: StepKind::MoveEntries { scope: scope.into() },
        },
        RuntimePlanStep {
            id: "step-5".into(),
            description: "Verify the result and summarize the outcome".into(),
            impact: "Produces a completion summary for the user.".into(),
            kind: StepKind::SummarizeFolderOrganization,
        },
    ]
}

fn project_inspection_plan(scope: &str) -> Vec<RuntimePlanStep> {
    vec![
        RuntimePlanStep {
            id: "step-1".into(),
            description: format!("Scan {scope}"),
            impact: "Read-only scan of the selected project.".into(),
            kind: StepKind::ScanDirectory { scope: scope.into() },
        },
        RuntimePlanStep {
            id: "step-2".into(),
            description: "Analyze the directory structure and file mix".into(),
            impact: "Produces counts and a concise structural summary.".into(),
            kind: StepKind::AnalyzeProject,
        },
        RuntimePlanStep {
            id: "step-3".into(),
            description: "Summarize the inspection results".into(),
            impact: "Returns a completion summary without changing files.".into(),
            kind: StepKind::SummarizeInspection,
        },
    ]
}

fn guarded_command_plan(
    command: &str,
    working_directory: Option<String>,
) -> Vec<RuntimePlanStep> {
    vec![
        RuntimePlanStep {
            id: "step-1".into(),
            description: "Prepare the guarded command and scope".into(),
            impact: format!("Command preview: `{command}`"),
            kind: StepKind::PrepareCommand {
                command: command.into(),
                working_directory: working_directory.clone(),
            },
        },
        RuntimePlanStep {
            id: "step-2".into(),
            description: format!("Run `{command}`"),
            impact: "Runs inside the guarded project scope.".into(),
            kind: StepKind::RunCommand {
                command: command.into(),
                working_directory,
            },
        },
        RuntimePlanStep {
            id: "step-3".into(),
            description: "Summarize stdout and stderr".into(),
            impact: "Returns the command result in the task timeline.".into(),
            kind: StepKind::SummarizeCommand,
        },
    ]
}

fn package_install_plan(package_name: &str) -> Vec<RuntimePlanStep> {
    vec![
        RuntimePlanStep {
            id: "step-1".into(),
            description: format!("Check whether `{package_name}` is already installed"),
            impact: "Read-only package inspection.".into(),
            kind: StepKind::CheckPackage {
                package_name: package_name.into(),
            },
        },
        RuntimePlanStep {
            id: "step-2".into(),
            description: format!("Prepare the install plan for `{package_name}`"),
            impact: "Builds the install recap before any system changes.".into(),
            kind: StepKind::PrepareInstall {
                package_name: package_name.into(),
            },
        },
        RuntimePlanStep {
            id: "step-3".into(),
            description: format!("Install `{package_name}`"),
            impact: "Requires approval before BridgeOS changes the system.".into(),
            kind: StepKind::InstallPackage {
                package_name: package_name.into(),
            },
        },
        RuntimePlanStep {
            id: "step-4".into(),
            description: format!("Verify `{package_name}` after installation"),
            impact: "Confirms the package is available after install.".into(),
            kind: StepKind::VerifyPackage {
                package_name: package_name.into(),
            },
        },
    ]
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::parser::parse_transcript;

    #[test]
    fn builds_plans_for_all_mvp_categories() {
        let folder = plan_for_intent(&parse_transcript("Organize my Downloads by file type"));
        assert_eq!(folder.len(), 5);

        let inspection = plan_for_intent(&parse_transcript("Inspect my memfuse project"));
        assert_eq!(inspection.len(), 3);

        let command = plan_for_intent(&parse_transcript("Run git status in my project"));
        assert_eq!(command.len(), 3);

        let package = plan_for_intent(&parse_transcript("Install ffmpeg for this project"));
        assert_eq!(package.len(), 4);
    }
}
