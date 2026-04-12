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
            return PolicyDecision {
                risk_level: RiskLevel::High,
                approval_required: true,
                explanation: "Action touches resources outside the approved folders.".into(),
                affected_resources: action.affected_resources.clone(),
            };
        }

        match action.kind {
            PolicyActionKind::ReadFile
            | PolicyActionKind::SearchFiles
            | PolicyActionKind::ReadLogs
            | PolicyActionKind::OpenApplication => PolicyDecision {
                risk_level: RiskLevel::Low,
                approval_required: false,
                explanation: "Read-only or low-impact action.".into(),
                affected_resources: action.affected_resources.clone(),
            },
            PolicyActionKind::MoveFile
            | PolicyActionKind::RenameFile
            | PolicyActionKind::EditProjectFile => PolicyDecision {
                risk_level: RiskLevel::Medium,
                approval_required: true,
                explanation: "Action changes project or file structure and needs confirmation."
                    .into(),
                affected_resources: action.affected_resources.clone(),
            },
            PolicyActionKind::RunCommand => {
                if self.command_is_allowlisted(action.command.as_deref()) {
                    PolicyDecision {
                        risk_level: RiskLevel::Medium,
                        approval_required: true,
                        explanation: "Guarded command allowed with a lightweight recap.".into(),
                        affected_resources: action.affected_resources.clone(),
                    }
                } else {
                    PolicyDecision {
                        risk_level: RiskLevel::High,
                        approval_required: true,
                        explanation: "Command is outside the conservative allowlist.".into(),
                        affected_resources: action.affected_resources.clone(),
                    }
                }
            }
            PolicyActionKind::InstallPackage | PolicyActionKind::SystemSetting => PolicyDecision {
                risk_level: RiskLevel::High,
                approval_required: true,
                explanation: "High-impact system action requires explicit approval.".into(),
                affected_resources: action.affected_resources.clone(),
            },
            PolicyActionKind::Unknown => PolicyDecision {
                risk_level: RiskLevel::High,
                approval_required: true,
                explanation: "Unclassified action defaults to the safest risk level.".into(),
                affected_resources: action.affected_resources.clone(),
            },
        }
    }

    fn has_out_of_scope_resource(&self, action: &PolicyAction) -> bool {
        action.affected_resources.iter().any(|resource| {
            !self
                .config
                .approved_folders
                .iter()
                .any(|approved| resource.starts_with(approved))
        })
    }

    fn command_is_allowlisted(&self, command: Option<&str>) -> bool {
        command.is_some_and(|command| {
            self.config
                .command_allowlist
                .iter()
                .any(|allowed| command.starts_with(allowed))
        })
    }
}

impl Default for PolicyEngine {
    fn default() -> Self {
        Self::new(PolicyConfig::default())
    }
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
    }
}
