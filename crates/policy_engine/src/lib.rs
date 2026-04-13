use std::env;
use std::path::{Component, Path, PathBuf};

use task_models::RiskLevel;

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub enum PolicyActionKind {
    ReadFile,
    SearchFiles,
    ReadLogs,
    OpenApplication,
    MoveFile,
    RenameFile,
    EditProjectFile,
    CreateDirectory,
    DeleteFile,
    RunCommand,
    InstallPackage,
    SystemSetting,
    #[default]
    Unknown,
}

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct PolicyAction {
    pub kind: PolicyActionKind,
    pub description: String,
    pub affected_resources: Vec<String>,
    pub command: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PolicyConfig {
    pub approved_folders: Vec<String>,
    pub command_allowlist: Vec<String>,
}

impl Default for PolicyConfig {
    fn default() -> Self {
        Self {
            approved_folders: vec!["~/Downloads".into(), "~/Projects".into()],
            command_allowlist: vec![
                "ls".into(),
                "cat".into(),
                "rg".into(),
                "git status".into(),
                "npm run".into(),
                "cargo build".into(),
            ],
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PolicyDecision {
    pub risk_level: RiskLevel,
    pub approval_required: bool,
    pub explanation: String,
    pub affected_resources: Vec<String>,
}

pub struct PolicyEngine {
    config: PolicyConfig,
}

impl PolicyEngine {
    pub fn new(config: PolicyConfig) -> Self {
        Self { config }
    }

    pub fn config(&self) -> &PolicyConfig {
        &self.config
    }

    pub fn evaluate(&self, action: &PolicyAction) -> PolicyDecision {
        if self.has_out_of_scope_resource(action) {
            return self.decision(
                RiskLevel::High,
                true,
                "This action touches files or folders outside the approved scope, so it requires explicit approval.",
                action,
            );
        }

        match action.kind {
            PolicyActionKind::ReadFile
            | PolicyActionKind::SearchFiles
            | PolicyActionKind::ReadLogs
            | PolicyActionKind::OpenApplication => self.decision(
                RiskLevel::Low,
                false,
                "This action is read-only or low impact inside an approved scope.",
                action,
            ),
            PolicyActionKind::MoveFile
            | PolicyActionKind::RenameFile
            | PolicyActionKind::EditProjectFile
            | PolicyActionKind::CreateDirectory => self.decision(
                RiskLevel::Medium,
                true,
                "This action changes files or folders inside an approved workspace, so it pauses for confirmation before writing.",
                action,
            ),
            PolicyActionKind::DeleteFile => self.decision(
                RiskLevel::High,
                true,
                "Deleting files is a high-impact action and requires explicit approval.",
                action,
            ),
            PolicyActionKind::RunCommand => {
                if let Some(explanation) = self.command_high_risk_explanation(action.command.as_deref())
                {
                    self.decision(RiskLevel::High, true, explanation, action)
                } else if self.command_is_allowlisted(action.command.as_deref()) {
                    self.decision(
                        RiskLevel::Medium,
                        true,
                        "This command is on the guarded allowlist, but it still needs a recap before it runs.",
                        action,
                    )
                } else {
                    self.decision(
                        RiskLevel::High,
                        true,
                        "This command is outside the guarded allowlist, so it requires explicit approval.",
                        action,
                    )
                }
            }
            PolicyActionKind::InstallPackage => self.decision(
                RiskLevel::High,
                true,
                "Installing a package changes the system and may require network access or elevation.",
                action,
            ),
            PolicyActionKind::SystemSetting => self.decision(
                RiskLevel::High,
                true,
                "Changing a system setting affects the device outside the current workspace and requires explicit approval.",
                action,
            ),
            PolicyActionKind::Unknown => self.decision(
                RiskLevel::High,
                true,
                "This action could not be classified safely, so it is treated as high risk.",
                action,
            ),
        }
    }

    fn decision(
        &self,
        risk_level: RiskLevel,
        approval_required: bool,
        explanation: impl Into<String>,
        action: &PolicyAction,
    ) -> PolicyDecision {
        PolicyDecision {
            risk_level,
            approval_required,
            explanation: explanation.into(),
            affected_resources: action.affected_resources.clone(),
        }
    }

    fn has_out_of_scope_resource(&self, action: &PolicyAction) -> bool {
        action.affected_resources.iter().any(|resource| {
            let resource_path = normalize_path(resource);
            !self.config.approved_folders.iter().any(|approved| {
                let approved_path = normalize_path(approved);
                resource_path.starts_with(&approved_path)
            })
        })
    }

    fn command_is_allowlisted(&self, command: Option<&str>) -> bool {
        command.is_some_and(|command| {
            let command_tokens = tokenize_command(command);
            self.config.command_allowlist.iter().any(|allowed| {
                let allowed_tokens = tokenize_command(allowed);
                command_tokens.starts_with(&allowed_tokens)
            })
        })
    }

    fn command_high_risk_explanation(&self, command: Option<&str>) -> Option<&'static str> {
        let command = command?.trim();
        if command.is_empty() {
            return Some(
                "This command could not be parsed safely, so it requires explicit approval.",
            );
        }

        let first_token = tokenize_command(command).first().copied();
        if matches!(first_token, Some("sudo" | "su" | "pkexec")) {
            return Some(
                "This command requests elevated privileges, so it is treated as high risk.",
            );
        }

        if has_shell_metacharacters(command) {
            return Some(
                "This command uses shell chaining or redirection, so it is treated as high risk.",
            );
        }

        None
    }
}

impl Default for PolicyEngine {
    fn default() -> Self {
        Self::new(PolicyConfig::default())
    }
}

fn expand_home(path: &str) -> String {
    let trimmed = path.trim();
    if trimmed == "~" {
        return env::var("HOME").unwrap_or_else(|_| trimmed.into());
    }

    if let Some(remainder) = trimmed.strip_prefix("~/") {
        if let Ok(home) = env::var("HOME") {
            return format!("{home}/{remainder}");
        }
    }

    trimmed.into()
}

fn normalize_path(path: &str) -> PathBuf {
    let expanded = expand_home(path);
    let mut normalized = PathBuf::new();

    for component in Path::new(&expanded).components() {
        match component {
            Component::CurDir => {}
            Component::ParentDir => {
                normalized.pop();
            }
            other => normalized.push(other.as_os_str()),
        }
    }

    normalized
}

fn tokenize_command(command: &str) -> Vec<&str> {
    command.split_whitespace().collect()
}

fn has_shell_metacharacters(command: &str) -> bool {
    command.contains("&&")
        || command.contains("||")
        || command.contains(';')
        || command.contains('|')
        || command.contains('>')
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn low_risk_actions_skip_approval() {
        let engine = PolicyEngine::default();
        let decision = engine.evaluate(&PolicyAction {
            kind: PolicyActionKind::ReadFile,
            description: "Read project README".into(),
            affected_resources: vec!["~/Projects/bridge-os/README.md".into()],
            command: None,
        });

        assert_eq!(decision.risk_level, RiskLevel::Low);
        assert!(!decision.approval_required);
        assert_eq!(
            decision.explanation,
            "This action is read-only or low impact inside an approved scope."
        );
    }

    #[test]
    fn unapproved_scopes_escalate_to_high_risk() {
        let engine = PolicyEngine::default();
        let decision = engine.evaluate(&PolicyAction {
            kind: PolicyActionKind::MoveFile,
            description: "Move a screenshot".into(),
            affected_resources: vec!["/etc/passwd".into()],
            command: None,
        });

        assert_eq!(decision.risk_level, RiskLevel::High);
        assert!(decision.approval_required);
        assert_eq!(
            decision.explanation,
            "This action touches files or folders outside the approved scope, so it requires explicit approval."
        );
    }

    #[test]
    fn allowlisted_commands_are_treated_as_guarded_medium_risk() {
        let engine = PolicyEngine::default();
        let decision = engine.evaluate(&PolicyAction {
            kind: PolicyActionKind::RunCommand,
            description: "Inspect git status".into(),
            affected_resources: vec!["~/Projects/bridge-os".into()],
            command: Some("git status --short".into()),
        });

        assert_eq!(decision.risk_level, RiskLevel::Medium);
        assert!(decision.approval_required);
        assert_eq!(
            decision.explanation,
            "This command is on the guarded allowlist, but it still needs a recap before it runs."
        );
    }

    #[test]
    fn create_directory_is_medium_risk_inside_approved_scope() {
        let engine = PolicyEngine::default();
        let decision = engine.evaluate(&PolicyAction {
            kind: PolicyActionKind::CreateDirectory,
            description: "Create screenshot archive folder".into(),
            affected_resources: vec!["~/Downloads/Screenshots".into()],
            command: None,
        });

        assert_eq!(decision.risk_level, RiskLevel::Medium);
        assert!(decision.approval_required);
    }

    #[test]
    fn delete_file_is_high_risk_even_inside_scope() {
        let engine = PolicyEngine::default();
        let decision = engine.evaluate(&PolicyAction {
            kind: PolicyActionKind::DeleteFile,
            description: "Delete screenshots".into(),
            affected_resources: vec!["~/Downloads/screenshot.png".into()],
            command: None,
        });

        assert_eq!(decision.risk_level, RiskLevel::High);
        assert!(decision.approval_required);
        assert_eq!(
            decision.explanation,
            "Deleting files is a high-impact action and requires explicit approval."
        );
    }

    #[test]
    fn path_normalization_allows_trailing_slashes_and_nested_paths() {
        let engine = PolicyEngine::new(PolicyConfig {
            approved_folders: vec!["~/Downloads/".into()],
            command_allowlist: PolicyConfig::default().command_allowlist,
        });
        let decision = engine.evaluate(&PolicyAction {
            kind: PolicyActionKind::MoveFile,
            description: "Move screenshot".into(),
            affected_resources: vec!["~/Downloads/screenshots/../shot.png".into()],
            command: None,
        });

        assert_eq!(decision.risk_level, RiskLevel::Medium);
    }

    #[test]
    fn non_allowlisted_commands_are_high_risk() {
        let engine = PolicyEngine::default();
        let decision = engine.evaluate(&PolicyAction {
            kind: PolicyActionKind::RunCommand,
            description: "List block devices".into(),
            affected_resources: vec!["~/Projects/bridge-os".into()],
            command: Some("lsblk".into()),
        });

        assert_eq!(decision.risk_level, RiskLevel::High);
        assert!(decision.approval_required);
        assert_eq!(
            decision.explanation,
            "This command is outside the guarded allowlist, so it requires explicit approval."
        );
    }

    #[test]
    fn elevated_commands_are_high_risk() {
        let engine = PolicyEngine::default();
        let decision = engine.evaluate(&PolicyAction {
            kind: PolicyActionKind::RunCommand,
            description: "Install a package".into(),
            affected_resources: vec!["~/Projects/bridge-os".into()],
            command: Some("sudo apt install ffmpeg".into()),
        });

        assert_eq!(decision.risk_level, RiskLevel::High);
        assert!(decision.approval_required);
        assert_eq!(
            decision.explanation,
            "This command requests elevated privileges, so it is treated as high risk."
        );
    }

    #[test]
    fn chained_commands_are_high_risk() {
        let engine = PolicyEngine::default();
        let decision = engine.evaluate(&PolicyAction {
            kind: PolicyActionKind::RunCommand,
            description: "Inspect and build".into(),
            affected_resources: vec!["~/Projects/bridge-os".into()],
            command: Some("git status && cargo build".into()),
        });

        assert_eq!(decision.risk_level, RiskLevel::High);
        assert!(decision.approval_required);
        assert_eq!(
            decision.explanation,
            "This command uses shell chaining or redirection, so it is treated as high risk."
        );
    }
}
