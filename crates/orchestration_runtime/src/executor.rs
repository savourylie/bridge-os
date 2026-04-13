use adapters::{
    CommandOutput, FileEntry, ListDirectoryRequest, MoveFileRequest, PackageInstallRequest,
    PackageQuery, PrivilegeRequest,
};
use policy_engine::{PolicyAction, PolicyActionKind};

use crate::models::{ExecutionContext, PlannedTask, StepKind};
use crate::{OrchestrationRuntimeError, RuntimeDependencies};

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct StepRunResult {
    pub context: ExecutionContext,
    pub impact: Option<String>,
}

pub(crate) fn policy_action_for_step(
    task: &PlannedTask,
    step_index: usize,
) -> Option<PolicyAction> {
    let step = task.steps.get(step_index)?;

    match &step.kind {
        StepKind::ScanDirectory { scope } => Some(PolicyAction {
            kind: PolicyActionKind::SearchFiles,
            description: format!("Scan {scope}"),
            affected_resources: vec![scope.clone()],
            command: None,
        }),
        StepKind::FilterEntries | StepKind::AnalyzeProject | StepKind::SummarizeFolderOrganization
        | StepKind::SummarizeInspection | StepKind::SummarizeCommand
        | StepKind::PrepareInstall { .. } | StepKind::PrepareCommand { .. } => None,
        StepKind::CreateDirectories { scope } => Some(PolicyAction {
            kind: PolicyActionKind::CreateDirectory,
            description: format!("Create category folders inside {scope}"),
            affected_resources: vec![scope.clone()],
            command: None,
        }),
        StepKind::MoveEntries { scope } => Some(PolicyAction {
            kind: PolicyActionKind::MoveFile,
            description: format!("Move matching files inside {scope}"),
            affected_resources: vec![scope.clone()],
            command: None,
        }),
        StepKind::RunCommand {
            command,
            working_directory,
        } => Some(PolicyAction {
            kind: PolicyActionKind::RunCommand,
            description: format!("Run `{command}`"),
            affected_resources: working_directory
                .clone()
                .into_iter()
                .collect::<Vec<_>>(),
            command: Some(command.clone()),
        }),
        StepKind::CheckPackage { package_name } | StepKind::VerifyPackage { package_name } => {
            Some(PolicyAction {
                kind: PolicyActionKind::ReadLogs,
                description: format!("Inspect package metadata for `{package_name}`"),
                affected_resources: Vec::new(),
                command: Some(format!("apt-cache policy {package_name}")),
            })
        }
        StepKind::InstallPackage { package_name } => Some(PolicyAction {
            kind: PolicyActionKind::InstallPackage,
            description: format!("Install `{package_name}`"),
            affected_resources: Vec::new(),
            command: Some(format!("sudo apt install {package_name}")),
        }),
    }
}

pub(crate) async fn execute_step(
    dependencies: &RuntimeDependencies,
    task: &PlannedTask,
    step_index: usize,
) -> Result<StepRunResult, OrchestrationRuntimeError> {
    let step = task
        .steps
        .get(step_index)
        .ok_or_else(|| OrchestrationRuntimeError::InvalidOperation("Step index out of bounds.".into()))?;

    match &step.kind {
        StepKind::ScanDirectory { scope } => {
            let entries = dependencies
                .adapters
                .file_system
                .list_entries(ListDirectoryRequest {
                    scope: scope.clone(),
                })
                .await?;
            let mut context = task.context.clone();
            context.scanned_entries = entries.clone();

            Ok(StepRunResult {
                context,
                impact: Some(format!("Scanned {} entries in {scope}.", entries.len())),
            })
        }
        StepKind::FilterEntries => {
            let mut context = task.context.clone();
            let filtered = filter_entries(&task.context.scanned_entries, task);
            context.filtered_entries = filtered.clone();

            Ok(StepRunResult {
                context,
                impact: Some(format!("Selected {} files after applying the request rules.", filtered.len())),
            })
        }
        StepKind::CreateDirectories { scope } => {
            let mut context = task.context.clone();
            let directories = planned_directories(scope, &task.context.filtered_entries);

            for directory in &directories {
                dependencies
                    .adapters
                    .file_system
                    .create_directory(adapters::CreateDirectoryRequest {
                        path: directory.clone(),
                    })
                    .await?;
            }

            context.created_directories = directories.clone();
            Ok(StepRunResult {
                context,
                impact: Some(format!("Prepared {} folders inside {scope}.", directories.len())),
            })
        }
        StepKind::MoveEntries { scope } => {
            let mut context = task.context.clone();
            let planned_moves = planned_moves(scope, &task.context.filtered_entries);

            for (source, destination) in &planned_moves {
                dependencies
                    .adapters
                    .file_system
                    .move_file(MoveFileRequest {
                        source: source.clone(),
                        destination: destination.clone(),
                    })
                    .await?;
            }

            context.moved_files = planned_moves.clone();
            Ok(StepRunResult {
                context,
                impact: Some(format!("Moved {} files into their target folders.", planned_moves.len())),
            })
        }
        StepKind::SummarizeFolderOrganization => Ok(StepRunResult {
            context: task.context.clone(),
            impact: Some(format!(
                "Prepared {} folders and moved {} files.",
                task.context.created_directories.len(),
                task.context.moved_files.len()
            )),
        }),
        StepKind::AnalyzeProject => {
            let mut context = task.context.clone();
            let entries = &task.context.scanned_entries;
            let file_count = entries.iter().filter(|entry| !entry.is_directory).count();
            let directory_count = entries.iter().filter(|entry| entry.is_directory).count();
            let summary = format!(
                "Found {} files and {} directories in the selected project.",
                file_count, directory_count
            );
            context.inspection_summary = Some(summary.clone());

            Ok(StepRunResult {
                context,
                impact: Some(summary),
            })
        }
        StepKind::SummarizeInspection => Ok(StepRunResult {
            context: task.context.clone(),
            impact: task.context.inspection_summary.clone(),
        }),
        StepKind::PrepareCommand {
            command,
            working_directory,
        } => Ok(StepRunResult {
            context: task.context.clone(),
            impact: Some(match working_directory {
                Some(directory) => format!("Prepared `{command}` in {directory}."),
                None => format!("Prepared `{command}`."),
            }),
        }),
        StepKind::RunCommand {
            command,
            working_directory,
        } => {
            let mut context = task.context.clone();
            let output = dependencies
                .adapters
                .command
                .run_command(adapters::CommandRequest {
                    command: command.clone(),
                    working_directory: working_directory.clone(),
                })
                .await?;

            if !output.success {
                return Err(OrchestrationRuntimeError::InvalidOperation(
                    output
                        .stderr
                        .clone()
                        .unwrap_or_else(|| "Guarded command failed.".into()),
                ));
            }

            context.command_output = Some(output.clone());
            Ok(StepRunResult {
                context,
                impact: Some(summarize_command_output(&output)),
            })
        }
        StepKind::SummarizeCommand => Ok(StepRunResult {
            context: task.context.clone(),
            impact: task
                .context
                .command_output
                .as_ref()
                .map(summarize_command_output),
        }),
        StepKind::CheckPackage { package_name } => {
            let mut context = task.context.clone();
            let package = dependencies
                .adapters
                .package_manager
                .inspect_package(PackageQuery {
                    package_name: package_name.clone(),
                })
                .await?;
            let message = if package.installed {
                format!(
                    "`{package_name}` is already installed{}.",
                    package
                        .version
                        .as_deref()
                        .map(|version| format!(" (version {version})"))
                        .unwrap_or_default()
                )
            } else {
                format!("`{package_name}` is not currently installed.")
            };
            context.package_info = Some(package);

            Ok(StepRunResult {
                context,
                impact: Some(message),
            })
        }
        StepKind::PrepareInstall { package_name } => Ok(StepRunResult {
            context: task.context.clone(),
            impact: Some(format!(
                "Prepared the install plan for `{package_name}` and waiting for approval before the system changes."
            )),
        }),
        StepKind::InstallPackage { package_name } => {
            let elevation = dependencies
                .adapters
                .privilege
                .request_elevation(PrivilegeRequest {
                    reason: format!("Install `{package_name}`"),
                    command: Some(format!("sudo apt install {package_name}")),
                })
                .await?;

            if !elevation.granted {
                return Err(OrchestrationRuntimeError::InvalidOperation(
                    "Privilege escalation was denied.".into(),
                ));
            }

            let operation = dependencies
                .adapters
                .package_manager
                .install_package(PackageInstallRequest {
                    package_name: package_name.clone(),
                })
                .await?;

            if !operation.success {
                return Err(OrchestrationRuntimeError::InvalidOperation(
                    operation
                        .details
                        .clone()
                        .unwrap_or_else(|| "Package installation failed.".into()),
                ));
            }

            let mut context = task.context.clone();
            context.install_result = Some(operation.clone());
            Ok(StepRunResult {
                context,
                impact: operation.details,
            })
        }
        StepKind::VerifyPackage { package_name } => {
            let package = dependencies
                .adapters
                .package_manager
                .inspect_package(PackageQuery {
                    package_name: package_name.clone(),
                })
                .await?;

            if !package.installed {
                return Err(OrchestrationRuntimeError::InvalidOperation(format!(
                    "`{package_name}` was not installed after the install step."
                )));
            }

            let mut context = task.context.clone();
            context.package_info = Some(package);

            Ok(StepRunResult {
                context,
                impact: Some(format!("Verified `{package_name}` after installation.")),
            })
        }
    }
}

fn filter_entries(entries: &[FileEntry], task: &PlannedTask) -> Vec<FileEntry> {
    let goal = task.intent.goal.as_deref().unwrap_or_default().to_lowercase();
    let exclusions = task
        .intent
        .exclusions
        .as_deref()
        .unwrap_or_default()
        .to_lowercase();
    let wants_screenshots = goal.contains("screenshot");

    entries
        .iter()
        .filter(|entry| !entry.is_directory)
        .filter(|entry| {
            let file_name = entry
                .path
                .rsplit('/')
                .next()
                .unwrap_or_default()
                .to_lowercase();
            let extension = extension(entry);

            if exclusions.contains("hidden") && file_name.starts_with('.') {
                return false;
            }
            if exclusions.contains("pdf") && extension == "pdf" {
                return false;
            }
            if exclusions.contains("zip") && extension == "zip" {
                return false;
            }
            if exclusions.contains("installer") && matches!(extension.as_str(), "dmg" | "pkg" | "deb" | "msi") {
                return false;
            }
            if wants_screenshots {
                return file_name.contains("screenshot")
                    || matches!(extension.as_str(), "png" | "jpg" | "jpeg" | "webp");
            }
            true
        })
        .cloned()
        .collect()
}

fn planned_directories(scope: &str, entries: &[FileEntry]) -> Vec<String> {
    let mut directories = entries
        .iter()
        .map(|entry| format!("{scope}/{}", bucket_for_entry(entry)))
        .collect::<Vec<_>>();
    directories.sort();
    directories.dedup();
    directories
}

fn planned_moves(scope: &str, entries: &[FileEntry]) -> Vec<(String, String)> {
    entries
        .iter()
        .map(|entry| {
            let file_name = entry.path.rsplit('/').next().unwrap_or_default();
            (
                entry.path.clone(),
                format!("{scope}/{}/{}", bucket_for_entry(entry), file_name),
            )
        })
        .collect()
}

fn bucket_for_entry(entry: &FileEntry) -> &'static str {
    match extension(entry).as_str() {
        "png" | "jpg" | "jpeg" | "webp" => "Screenshots",
        "txt" | "md" | "pdf" | "doc" | "docx" => "Documents",
        "zip" | "tar" | "gz" => "Archives",
        "rs" | "ts" | "tsx" | "js" | "jsx" | "json" | "toml" | "yaml" | "yml" => "Code",
        _ => "Other",
    }
}

fn extension(entry: &FileEntry) -> String {
    entry.path
        .rsplit('.')
        .next()
        .unwrap_or_default()
        .to_lowercase()
}

fn summarize_command_output(output: &CommandOutput) -> String {
    let mut segments = Vec::new();
    if let Some(stdout) = output.stdout.as_deref() {
        let stdout = stdout.trim();
        if !stdout.is_empty() {
            segments.push(stdout.replace('\n', " "));
        }
    }
    if let Some(stderr) = output.stderr.as_deref() {
        let stderr = stderr.trim();
        if !stderr.is_empty() {
            segments.push(format!("stderr: {}", stderr.replace('\n', " ")));
        }
    }
    if segments.is_empty() {
        format!("`{}` completed.", output.command)
    } else {
        format!("`{}`: {}", output.command, segments.join(" "))
    }
}
