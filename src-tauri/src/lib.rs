mod ipc;

use std::collections::HashMap;
use std::sync::Arc;

use adapters::{ActiveWindowInfo, FileEntry};
use audit_log::{AuditSink, InMemoryAuditLog};
use conversation_runtime::ConversationRuntime;
use mock_adapters::{
    MockCommandAdapter, MockCommandConfig, MockDesktopAdapter, MockDesktopConfig,
    MockFileSystemAdapter, MockFileSystemConfig, MockPackageManagerAdapter,
    MockPackageManagerConfig, MockPrivilegeAdapter, MockPrivilegeConfig, MockVoiceAdapter,
    MockVoiceConfig,
};
use orchestration_runtime::{
    OrchestrationConfig, OrchestrationRuntime, RuntimeAdapters, RuntimeDependencies,
};
use policy_engine::{PolicyConfig, PolicyEngine};

#[derive(Clone)]
pub struct MockAdapterBundle {
    pub file_system: Arc<MockFileSystemAdapter>,
    pub voice: Arc<MockVoiceAdapter>,
    pub privilege: Arc<MockPrivilegeAdapter>,
    pub package_manager: Arc<MockPackageManagerAdapter>,
    pub desktop: Arc<MockDesktopAdapter>,
    pub command: Arc<MockCommandAdapter>,
}

impl MockAdapterBundle {
    fn bootstrap() -> Self {
        let mut directories = HashMap::new();
        directories.insert(
            "~/Projects/bridge-os".into(),
            vec![
                FileEntry {
                    path: "~/Projects/bridge-os/Cargo.toml".into(),
                    is_directory: false,
                    size_bytes: Some(512),
                },
                FileEntry {
                    path: "~/Projects/bridge-os/README.md".into(),
                    is_directory: false,
                    size_bytes: Some(2_048),
                },
                FileEntry {
                    path: "~/Projects/bridge-os/src-tauri/src/lib.rs".into(),
                    is_directory: false,
                    size_bytes: Some(8_192),
                },
                FileEntry {
                    path: "~/Projects/bridge-os/src-tauri/src/ipc.rs".into(),
                    is_directory: false,
                    size_bytes: Some(12_800),
                },
                FileEntry {
                    path: "~/Projects/bridge-os/src/App.tsx".into(),
                    is_directory: false,
                    size_bytes: Some(3_200),
                },
                FileEntry {
                    path: "~/Projects/bridge-os/src/pages/Demo.tsx".into(),
                    is_directory: false,
                    size_bytes: Some(9_600),
                },
                FileEntry {
                    path: "~/Projects/bridge-os/src/state/store.ts".into(),
                    is_directory: false,
                    size_bytes: Some(4_096),
                },
                FileEntry {
                    path: "~/Projects/bridge-os/src/state/machine.ts".into(),
                    is_directory: false,
                    size_bytes: Some(5_120),
                },
                FileEntry {
                    path: "~/Projects/bridge-os/package.json".into(),
                    is_directory: false,
                    size_bytes: Some(1_024),
                },
                FileEntry {
                    path: "~/Projects/bridge-os/tsconfig.json".into(),
                    is_directory: false,
                    size_bytes: Some(768),
                },
            ],
        );
        directories.insert(
            "~/Downloads".into(),
            vec![
                FileEntry {
                    path: "~/Downloads/bridge-screenshot-01.png".into(),
                    is_directory: false,
                    size_bytes: Some(245_760),
                },
                FileEntry {
                    path: "~/Downloads/bridge-screenshot-02.png".into(),
                    is_directory: false,
                    size_bytes: Some(198_344),
                },
                FileEntry {
                    path: "~/Downloads/bridge-screenshot-03.png".into(),
                    is_directory: false,
                    size_bytes: Some(310_220),
                },
                FileEntry {
                    path: "~/Downloads/ui-mockup.jpg".into(),
                    is_directory: false,
                    size_bytes: Some(512_800),
                },
                FileEntry {
                    path: "~/Downloads/notes.txt".into(),
                    is_directory: false,
                    size_bytes: Some(1_024),
                },
                FileEntry {
                    path: "~/Downloads/readme.md".into(),
                    is_directory: false,
                    size_bytes: Some(2_048),
                },
                FileEntry {
                    path: "~/Downloads/design-brief.pdf".into(),
                    is_directory: false,
                    size_bytes: Some(890_000),
                },
                FileEntry {
                    path: "~/Downloads/project-archive.zip".into(),
                    is_directory: false,
                    size_bytes: Some(1_540_000),
                },
                FileEntry {
                    path: "~/Downloads/backup.tar.gz".into(),
                    is_directory: false,
                    size_bytes: Some(980_000),
                },
                FileEntry {
                    path: "~/Downloads/config.json".into(),
                    is_directory: false,
                    size_bytes: Some(4_096),
                },
                FileEntry {
                    path: "~/Downloads/settings.toml".into(),
                    is_directory: false,
                    size_bytes: Some(3_200),
                },
                FileEntry {
                    path: "~/Downloads/installer.dmg".into(),
                    is_directory: false,
                    size_bytes: Some(88_000_000),
                },
            ],
        );

        Self {
            file_system: Arc::new(MockFileSystemAdapter::new(MockFileSystemConfig {
                directories,
                allow_mutations: true,
            })),
            voice: Arc::new(MockVoiceAdapter::new(MockVoiceConfig::default())),
            privilege: Arc::new(MockPrivilegeAdapter::new(MockPrivilegeConfig::default())),
            package_manager: Arc::new(MockPackageManagerAdapter::new(MockPackageManagerConfig {
                packages: HashMap::new(),
                install_succeeds: true,
                install_latency_ms: None,
            })),
            desktop: Arc::new(MockDesktopAdapter::new(MockDesktopConfig {
                active_window: ActiveWindowInfo {
                    app_id: Some("com.bridgeos.desktop".into()),
                    title: Some("BridgeOS".into()),
                },
                launch_succeeds: true,
            })),
            command: Arc::new(MockCommandAdapter::new(MockCommandConfig {
                outputs: HashMap::from([
                    (
                        "git status".into(),
                        adapters::CommandOutput {
                            command: "git status".into(),
                            working_directory: Some("~/Projects/bridge-os".into()),
                            success: true,
                            stdout: Some(
                                "On branch main\nnothing to commit, working tree clean".into(),
                            ),
                            stderr: None,
                            exit_code: Some(0),
                        },
                    ),
                    (
                        "cargo test".into(),
                        adapters::CommandOutput {
                            command: "cargo test".into(),
                            working_directory: Some("~/Projects/bridge-os".into()),
                            success: true,
                            stdout: Some("test result: ok. 12 passed; 0 failed".into()),
                            stderr: None,
                            exit_code: Some(0),
                        },
                    ),
                    (
                        "git log".into(),
                        adapters::CommandOutput {
                            command: "git log".into(),
                            working_directory: Some("~/Projects/bridge-os".into()),
                            success: true,
                            stdout: Some(
                                "commit 39aef0a6\nAuthor: Calvin Ku\nDate: Mon Apr 14 2026\n\n    feat: implement project inspection flow"
                                    .into(),
                            ),
                            stderr: None,
                            exit_code: Some(0),
                        },
                    ),
                    (
                        "git diff".into(),
                        adapters::CommandOutput {
                            command: "git diff".into(),
                            working_directory: Some("~/Projects/bridge-os".into()),
                            success: true,
                            stdout: Some(String::new()),
                            stderr: None,
                            exit_code: Some(0),
                        },
                    ),
                ]),
                default_working_directory: Some("~/Projects".into()),
            })),
        }
    }

    fn as_runtime_adapters(&self) -> RuntimeAdapters {
        RuntimeAdapters {
            file_system: self.file_system.clone(),
            voice: self.voice.clone(),
            privilege: self.privilege.clone(),
            package_manager: self.package_manager.clone(),
            desktop: self.desktop.clone(),
            command: self.command.clone(),
        }
    }
}

#[derive(Clone)]
pub struct BackendState {
    pub adapters: MockAdapterBundle,
    pub audit_log: Arc<InMemoryAuditLog>,
    pub policy_engine: Arc<PolicyEngine>,
    pub conversation_runtime: Arc<ConversationRuntime>,
    pub orchestration_runtime: Arc<OrchestrationRuntime>,
}

impl BackendState {
    fn bootstrap() -> Self {
        let adapters = MockAdapterBundle::bootstrap();
        let audit_log = Arc::new(InMemoryAuditLog::new());
        let audit_sink: Arc<dyn AuditSink> = audit_log.clone();
        let policy_engine = Arc::new(PolicyEngine::new(PolicyConfig::default()));
        let conversation_runtime = Arc::new(ConversationRuntime::new(
            adapters.voice.clone(),
            audit_sink.clone(),
        ));
        let orchestration_runtime = Arc::new(OrchestrationRuntime::with_config(
            RuntimeDependencies {
                adapters: adapters.as_runtime_adapters(),
                policy_engine: policy_engine.clone(),
                audit_log: audit_sink,
            },
            OrchestrationConfig::default(),
        ));

        Self {
            adapters,
            audit_log,
            policy_engine,
            conversation_runtime,
            orchestration_runtime,
        }
    }

    #[cfg(test)]
    fn bootstrap_with_config(config: OrchestrationConfig) -> Self {
        let adapters = MockAdapterBundle::bootstrap();
        let audit_log = Arc::new(InMemoryAuditLog::new());
        let audit_sink: Arc<dyn AuditSink> = audit_log.clone();
        let policy_engine = Arc::new(PolicyEngine::new(PolicyConfig::default()));
        let conversation_runtime = Arc::new(ConversationRuntime::new(
            adapters.voice.clone(),
            audit_sink.clone(),
        ));
        let orchestration_runtime = Arc::new(OrchestrationRuntime::with_config(
            RuntimeDependencies {
                adapters: adapters.as_runtime_adapters(),
                policy_engine: policy_engine.clone(),
                audit_log: audit_sink,
            },
            config,
        ));

        Self {
            adapters,
            audit_log,
            policy_engine,
            conversation_runtime,
            orchestration_runtime,
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(BackendState::bootstrap())
        .invoke_handler(tauri::generate_handler![
            ipc::start_listening,
            ipc::stop_listening,
            ipc::submit_transcript_chunk,
            ipc::interrupt_conversation,
            ipc::approve_action,
            ipc::deny_action,
            ipc::pause_execution,
            ipc::resume_execution,
            ipc::stop_execution,
            ipc::get_system_state,
            ipc::undo_folder_organization,
        ])
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
