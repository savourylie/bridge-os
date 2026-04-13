use crate::models::{PendingApproval, PlannedTask, RuntimePlanStep, TaskCategory};
use task_models::{
    ApprovalRequest, CompletionChanges, CompletionSummary, Plan, PlanState, PlanStep, RiskLevel,
    StepState, TimelineStep,
};

pub(crate) fn plan_from_runtime_steps(title: &str, steps: &[RuntimePlanStep], state: PlanState) -> Plan {
    Plan {
        title: Some(title.into()),
        steps: steps
            .iter()
            .map(|step| PlanStep {
                id: step.id.clone(),
                description: step.description.clone(),
            })
            .collect(),
        plan_state: state,
    }
}

pub(crate) fn timeline_from_runtime_steps(steps: &[RuntimePlanStep]) -> Vec<TimelineStep> {
    steps.iter()
        .map(|step| TimelineStep {
            id: step.id.clone(),
            description: step.description.clone(),
            impact: Some(step.impact.clone()),
            status: StepState::Pending,
        })
        .collect()
}

pub(crate) fn derive_execution_progress(timeline: &[TimelineStep]) -> Option<task_models::ExecutionProgress> {
    if timeline.is_empty() {
        return None;
    }

    if let Some(active_index) = timeline
        .iter()
        .position(|step| matches!(step.status, StepState::Running | StepState::WaitingApproval))
    {
        return Some(task_models::ExecutionProgress {
            current: (active_index + 1) as u64,
            total: timeline.len() as u64,
        });
    }

    let touched = timeline
        .iter()
        .filter(|step| !matches!(step.status, StepState::Pending))
        .count();

    Some(task_models::ExecutionProgress {
        current: touched.min(timeline.len()) as u64,
        total: timeline.len() as u64,
    })
}

pub(crate) fn approval_request_for_task(task: &PlannedTask, approval: &PendingApproval) -> ApprovalRequest {
    let mut will_affect = Vec::new();
    let mut will_not_affect = Vec::new();

    match task.category {
        TaskCategory::FolderOrganization => {
            will_affect.push(format!(
                "create category folders inside {}",
                task.scope.as_deref().unwrap_or("the approved folder")
            ));
            will_affect.push("move matching files without renaming them".into());
            will_not_affect.push("delete files".into());
            will_not_affect.push("write outside the approved folder".into());
        }
        TaskCategory::ProjectInspection => {
            will_affect.push("read the selected project directory".into());
            will_not_affect.push("modify files".into());
        }
        TaskCategory::GuardedCommand => {
            will_affect.push(format!(
                "run `{}` inside the guarded workspace",
                approval
                    .action
                    .command
                    .as_deref()
                    .unwrap_or("the requested command")
            ));
            will_not_affect.push("install packages".into());
            will_not_affect.push("write outside the guarded workspace".into());
        }
        TaskCategory::PackageInstallation => {
            will_affect.push(format!(
                "install `{}` on the system",
                task.title.strip_prefix("Install ").unwrap_or("the requested package")
            ));
            will_affect.push("touch the package database".into());
            will_not_affect.push("receive raw passwords".into());
        }
    }

    ApprovalRequest {
        action: approval.action.description.clone(),
        risk_level: approval.decision.risk_level,
        explanation: approval.decision.explanation.clone(),
        will_affect,
        will_not_affect,
        impact_summary: task.scope.as_ref().map(|scope| format!("Primary scope: {scope}")),
        command: approval.action.command.clone(),
    }
}

pub(crate) fn completion_summary_for_task(task: &PlannedTask, success: bool, message: Option<String>) -> CompletionSummary {
    let outcome = message.unwrap_or_else(|| match task.category {
        TaskCategory::FolderOrganization => format!(
            "Organized {} files into {} folders.",
            task.context.moved_files.len(),
            task.context.created_directories.len()
        ),
        TaskCategory::ProjectInspection => task
            .context
            .inspection_summary
            .clone()
            .unwrap_or_else(|| "Project inspection completed.".into()),
        TaskCategory::GuardedCommand => {
            if let Some(output) = task.context.command_output.as_ref() {
                if output.success {
                    format!("Command `{}` completed successfully.", output.command)
                } else {
                    format!("Command `{}` failed.", output.command)
                }
            } else {
                "Guarded command completed.".into()
            }
        }
        TaskCategory::PackageInstallation => {
            let package_name = task.title.strip_prefix("Install ").unwrap_or("package");
            if success {
                format!("Installed `{package_name}` and verified the result.")
            } else {
                format!("Attempt to install `{package_name}` did not finish successfully.")
            }
        }
    });

    let changes = match task.category {
        TaskCategory::FolderOrganization => CompletionChanges {
            created: task.context.created_directories.len() as u64,
            modified: 0,
            moved: task.context.moved_files.len() as u64,
            deleted: 0,
            network: Some(false),
        },
        TaskCategory::ProjectInspection => CompletionChanges {
            created: 0,
            modified: 0,
            moved: 0,
            deleted: 0,
            network: Some(false),
        },
        TaskCategory::GuardedCommand => CompletionChanges {
            created: 0,
            modified: 0,
            moved: 0,
            deleted: 0,
            network: Some(false),
        },
        TaskCategory::PackageInstallation => CompletionChanges {
            created: 0,
            modified: u64::from(task.context.install_result.is_some() && success),
            moved: 0,
            deleted: 0,
            network: Some(task.context.install_result.is_some()),
        },
    };

    CompletionSummary {
        title: Some(if success {
            task.title.clone()
        } else {
            format!("{} Failed", task.title)
        }),
        outcome,
        changes,
        rollback_available: Some(matches!(task.category, TaskCategory::FolderOrganization) && success),
        rollback_time_remaining: matches!(task.category, TaskCategory::FolderOrganization)
            .then_some("30 minutes".into()),
    }
}

pub(crate) fn max_risk(lhs: RiskLevel, rhs: RiskLevel) -> RiskLevel {
    if risk_rank(rhs) > risk_rank(lhs) {
        rhs
    } else {
        lhs
    }
}

fn risk_rank(risk: RiskLevel) -> usize {
    match risk {
        RiskLevel::Low => 0,
        RiskLevel::Medium => 1,
        RiskLevel::High => 2,
    }
}
