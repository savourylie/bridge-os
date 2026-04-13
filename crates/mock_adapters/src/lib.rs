use std::collections::{HashMap, VecDeque};
use std::sync::Mutex;

use adapters::{
    ActiveWindowInfo, AdapterError, AdapterResult, CommandAdapter, CommandOutput, CommandRequest,
    CreateDirectoryRequest, DeleteFileRequest, DesktopAdapter, FileEntry, FileSystemAdapter,
    LaunchAppRequest, LaunchAppResult, ListDirectoryRequest, MoveFileRequest, PackageInfo,
    PackageInstallRequest, PackageManagerAdapter, PackageOperationResult, PackageQuery,
    PrivilegeAdapter, PrivilegeOutcome, PrivilegeRequest, RenameFileRequest, TranscriptChunk,
    VoiceAdapter, VoiceSignal,
};

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FileSystemOperation {
    Move { source: String, destination: String },
    Rename { path: String, new_name: String },
    CreateDirectory { path: String },
    DeleteFile { path: String },
}

#[derive(Debug, Clone, Default)]
pub struct MockFileSystemConfig {
    pub directories: HashMap<String, Vec<FileEntry>>,
    pub allow_mutations: bool,
}

#[derive(Debug, Default)]
pub struct MockFileSystemAdapter {
    directories: Mutex<HashMap<String, Vec<FileEntry>>>,
    operations: Mutex<Vec<FileSystemOperation>>,
    allow_mutations: bool,
}

impl MockFileSystemAdapter {
    pub fn new(config: MockFileSystemConfig) -> Self {
        Self {
            directories: Mutex::new(config.directories),
            operations: Mutex::new(Vec::new()),
            allow_mutations: config.allow_mutations,
        }
    }

    pub fn with_directories(directories: HashMap<String, Vec<FileEntry>>) -> Self {
        Self::new(MockFileSystemConfig {
            directories,
            allow_mutations: true,
        })
    }

    pub fn operations(&self) -> Vec<FileSystemOperation> {
        self.operations
            .lock()
            .expect("mock file system operations lock poisoned")
            .clone()
    }
}

#[async_trait::async_trait]
impl FileSystemAdapter for MockFileSystemAdapter {
    async fn list_entries(&self, request: ListDirectoryRequest) -> AdapterResult<Vec<FileEntry>> {
        Ok(self
            .directories
            .lock()
            .expect("mock file system directories lock poisoned")
            .get(&request.scope)
            .cloned()
            .unwrap_or_default())
    }

    async fn move_file(&self, request: MoveFileRequest) -> AdapterResult<()> {
        if !self.allow_mutations {
            return Err(AdapterError::new("Mock file system is read-only."));
        }

        self.operations
            .lock()
            .expect("mock file system operations lock poisoned")
            .push(FileSystemOperation::Move {
                source: request.source,
                destination: request.destination,
            });
        Ok(())
    }

    async fn rename_file(&self, request: RenameFileRequest) -> AdapterResult<()> {
        if !self.allow_mutations {
            return Err(AdapterError::new("Mock file system is read-only."));
        }

        self.operations
            .lock()
            .expect("mock file system operations lock poisoned")
            .push(FileSystemOperation::Rename {
                path: request.path,
                new_name: request.new_name,
            });
        Ok(())
    }

    async fn create_directory(&self, request: CreateDirectoryRequest) -> AdapterResult<()> {
        if !self.allow_mutations {
            return Err(AdapterError::new("Mock file system is read-only."));
        }

        self.directories
            .lock()
            .expect("mock file system directories lock poisoned")
            .entry(request.path.clone())
            .or_default();
        self.operations
            .lock()
            .expect("mock file system operations lock poisoned")
            .push(FileSystemOperation::CreateDirectory { path: request.path });
        Ok(())
    }

    async fn delete_file(&self, request: DeleteFileRequest) -> AdapterResult<()> {
        if !self.allow_mutations {
            return Err(AdapterError::new("Mock file system is read-only."));
        }

        self.operations
            .lock()
            .expect("mock file system operations lock poisoned")
            .push(FileSystemOperation::DeleteFile { path: request.path });
        Ok(())
    }
}

#[derive(Debug, Clone, Default)]
pub struct MockVoiceConfig {
    pub signals: Vec<VoiceSignal>,
}

#[derive(Debug, Default)]
pub struct MockVoiceAdapter {
    listening: Mutex<bool>,
    signals: Mutex<VecDeque<VoiceSignal>>,
}

impl MockVoiceAdapter {
    pub fn new(config: MockVoiceConfig) -> Self {
        Self {
            listening: Mutex::new(false),
            signals: Mutex::new(VecDeque::from(config.signals)),
        }
    }

    pub fn with_transcript(text: impl Into<String>) -> Self {
        Self::new(MockVoiceConfig {
            signals: vec![VoiceSignal::TranscriptUpdated(TranscriptChunk {
                text: text.into(),
                is_final: true,
            })],
        })
    }

    pub fn is_listening(&self) -> bool {
        *self
            .listening
            .lock()
            .expect("mock voice adapter listening lock poisoned")
    }

    pub fn push_signal(&self, signal: VoiceSignal) {
        self.signals
            .lock()
            .expect("mock voice adapter signals lock poisoned")
            .push_back(signal);
    }
}

#[async_trait::async_trait]
impl VoiceAdapter for MockVoiceAdapter {
    async fn start_listening(&self) -> AdapterResult<()> {
        *self
            .listening
            .lock()
            .expect("mock voice adapter listening lock poisoned") = true;
        Ok(())
    }

    async fn stop_listening(&self) -> AdapterResult<()> {
        *self
            .listening
            .lock()
            .expect("mock voice adapter listening lock poisoned") = false;
        Ok(())
    }

    async fn next_signal(&self) -> AdapterResult<Option<VoiceSignal>> {
        Ok(self
            .signals
            .lock()
            .expect("mock voice adapter signals lock poisoned")
            .pop_front())
    }
}

#[derive(Debug, Clone, Default)]
pub struct MockPrivilegeConfig {
    pub outcome: PrivilegeOutcome,
}

#[derive(Debug, Default)]
pub struct MockPrivilegeAdapter {
    outcome: PrivilegeOutcome,
    requests: Mutex<Vec<PrivilegeRequest>>,
}

impl MockPrivilegeAdapter {
    pub fn new(config: MockPrivilegeConfig) -> Self {
        Self {
            outcome: config.outcome,
            requests: Mutex::new(Vec::new()),
        }
    }

    pub fn requests(&self) -> Vec<PrivilegeRequest> {
        self.requests
            .lock()
            .expect("mock privilege adapter requests lock poisoned")
            .clone()
    }
}

#[async_trait::async_trait]
impl PrivilegeAdapter for MockPrivilegeAdapter {
    async fn request_elevation(
        &self,
        request: PrivilegeRequest,
    ) -> AdapterResult<PrivilegeOutcome> {
        self.requests
            .lock()
            .expect("mock privilege adapter requests lock poisoned")
            .push(request);
        Ok(self.outcome.clone())
    }
}

#[derive(Debug, Clone, Default)]
pub struct MockPackageManagerConfig {
    pub packages: HashMap<String, PackageInfo>,
    pub install_succeeds: bool,
}

#[derive(Debug, Default)]
pub struct MockPackageManagerAdapter {
    packages: Mutex<HashMap<String, PackageInfo>>,
    install_succeeds: bool,
}

impl MockPackageManagerAdapter {
    pub fn new(config: MockPackageManagerConfig) -> Self {
        Self {
            packages: Mutex::new(config.packages),
            install_succeeds: config.install_succeeds,
        }
    }
}

#[async_trait::async_trait]
impl PackageManagerAdapter for MockPackageManagerAdapter {
    async fn inspect_package(&self, request: PackageQuery) -> AdapterResult<PackageInfo> {
        Ok(self
            .packages
            .lock()
            .expect("mock package manager packages lock poisoned")
            .get(&request.package_name)
            .cloned()
            .unwrap_or(PackageInfo {
                package_name: request.package_name,
                installed: false,
                version: None,
            }))
    }

    async fn install_package(
        &self,
        request: PackageInstallRequest,
    ) -> AdapterResult<PackageOperationResult> {
        if !self.install_succeeds {
            return Ok(PackageOperationResult {
                package_name: request.package_name,
                success: false,
                details: Some("Mock install configured to fail.".into()),
            });
        }

        self.packages
            .lock()
            .expect("mock package manager packages lock poisoned")
            .entry(request.package_name.clone())
            .and_modify(|package| package.installed = true)
            .or_insert(PackageInfo {
                package_name: request.package_name.clone(),
                installed: true,
                version: Some("mock-1.0.0".into()),
            });

        Ok(PackageOperationResult {
            package_name: request.package_name,
            success: true,
            details: Some("Installed via mock package manager.".into()),
        })
    }
}

#[derive(Debug, Clone, Default)]
pub struct MockDesktopConfig {
    pub active_window: ActiveWindowInfo,
    pub launch_succeeds: bool,
}

#[derive(Debug, Default)]
pub struct MockDesktopAdapter {
    active_window: Mutex<ActiveWindowInfo>,
    launch_history: Mutex<Vec<LaunchAppRequest>>,
    launch_succeeds: bool,
}

impl MockDesktopAdapter {
    pub fn new(config: MockDesktopConfig) -> Self {
        Self {
            active_window: Mutex::new(config.active_window),
            launch_history: Mutex::new(Vec::new()),
            launch_succeeds: config.launch_succeeds,
        }
    }

    pub fn launch_history(&self) -> Vec<LaunchAppRequest> {
        self.launch_history
            .lock()
            .expect("mock desktop adapter launch history lock poisoned")
            .clone()
    }
}

#[async_trait::async_trait]
impl DesktopAdapter for MockDesktopAdapter {
    async fn launch_app(&self, request: LaunchAppRequest) -> AdapterResult<LaunchAppResult> {
        self.launch_history
            .lock()
            .expect("mock desktop adapter launch history lock poisoned")
            .push(request.clone());

        if self.launch_succeeds {
            *self
                .active_window
                .lock()
                .expect("mock desktop adapter active window lock poisoned") = ActiveWindowInfo {
                app_id: Some(request.app_id),
                title: Some("Mock window".into()),
            };
        }

        Ok(LaunchAppResult {
            launched: self.launch_succeeds,
        })
    }

    async fn active_window(&self) -> AdapterResult<ActiveWindowInfo> {
        Ok(self
            .active_window
            .lock()
            .expect("mock desktop adapter active window lock poisoned")
            .clone())
    }
}

#[derive(Debug, Clone, Default)]
pub struct MockCommandConfig {
    pub outputs: HashMap<String, CommandOutput>,
    pub default_working_directory: Option<String>,
}

#[derive(Debug, Default)]
pub struct MockCommandAdapter {
    outputs: Mutex<HashMap<String, CommandOutput>>,
    requests: Mutex<Vec<CommandRequest>>,
    default_working_directory: Option<String>,
}

impl MockCommandAdapter {
    pub fn new(config: MockCommandConfig) -> Self {
        Self {
            outputs: Mutex::new(config.outputs),
            requests: Mutex::new(Vec::new()),
            default_working_directory: config.default_working_directory,
        }
    }

    pub fn requests(&self) -> Vec<CommandRequest> {
        self.requests
            .lock()
            .expect("mock command adapter requests lock poisoned")
            .clone()
    }
}

#[async_trait::async_trait]
impl CommandAdapter for MockCommandAdapter {
    async fn run_command(&self, request: CommandRequest) -> AdapterResult<CommandOutput> {
        let normalized_request = CommandRequest {
            working_directory: request
                .working_directory
                .clone()
                .or_else(|| self.default_working_directory.clone()),
            ..request
        };

        self.requests
            .lock()
            .expect("mock command adapter requests lock poisoned")
            .push(normalized_request.clone());

        if let Some(output) = self
            .outputs
            .lock()
            .expect("mock command adapter outputs lock poisoned")
            .get(&normalized_request.command)
            .cloned()
        {
            return Ok(CommandOutput {
                working_directory: normalized_request.working_directory,
                ..output
            });
        }

        Ok(CommandOutput {
            command: normalized_request.command,
            working_directory: normalized_request.working_directory,
            success: true,
            stdout: Some("mock command completed".into()),
            stderr: None,
            exit_code: Some(0),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn assert_file_system_adapter(_: &dyn FileSystemAdapter) {}
    fn assert_voice_adapter(_: &dyn VoiceAdapter) {}
    fn assert_privilege_adapter(_: &dyn PrivilegeAdapter) {}
    fn assert_package_manager_adapter(_: &dyn PackageManagerAdapter) {}
    fn assert_desktop_adapter(_: &dyn DesktopAdapter) {}
    fn assert_command_adapter(_: &dyn CommandAdapter) {}

    #[test]
    fn mock_adapters_construct_and_satisfy_trait_surfaces() {
        let file_system = MockFileSystemAdapter::default();
        let voice = MockVoiceAdapter::with_transcript("Computer");
        let privilege = MockPrivilegeAdapter::new(MockPrivilegeConfig {
            outcome: PrivilegeOutcome {
                granted: true,
                prompt_required: false,
            },
        });
        let package_manager = MockPackageManagerAdapter::new(MockPackageManagerConfig {
            packages: HashMap::new(),
            install_succeeds: true,
        });
        let desktop = MockDesktopAdapter::new(MockDesktopConfig {
            active_window: ActiveWindowInfo::default(),
            launch_succeeds: true,
        });
        let command = MockCommandAdapter::new(MockCommandConfig {
            outputs: HashMap::new(),
            default_working_directory: Some("~/Projects".into()),
        });

        assert_file_system_adapter(&file_system);
        assert_voice_adapter(&voice);
        assert_privilege_adapter(&privilege);
        assert_package_manager_adapter(&package_manager);
        assert_desktop_adapter(&desktop);
        assert_command_adapter(&command);
        assert!(!voice.is_listening());
        assert!(file_system.operations().is_empty());
        assert!(command.requests().is_empty());
    }
}
