use async_trait::async_trait;
use std::error::Error;
use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct AdapterError {
    pub message: String,
}

impl AdapterError {
    pub fn new(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
        }
    }
}

impl fmt::Display for AdapterError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.message)
    }
}

impl Error for AdapterError {}

pub type AdapterResult<T> = Result<T, AdapterError>;

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct FileEntry {
    pub path: String,
    pub is_directory: bool,
    pub size_bytes: Option<u64>,
}

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct ListDirectoryRequest {
    pub scope: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct MoveFileRequest {
    pub source: String,
    pub destination: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct RenameFileRequest {
    pub path: String,
    pub new_name: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct CreateDirectoryRequest {
    pub path: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct DeleteFileRequest {
    pub path: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct TranscriptChunk {
    pub text: String,
    pub is_final: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum VoiceSignal {
    WakeWordDetected,
    TranscriptUpdated(TranscriptChunk),
    Interrupted,
    Muted(bool),
}

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct PrivilegeRequest {
    pub reason: String,
    pub command: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct PrivilegeOutcome {
    pub granted: bool,
    pub prompt_required: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct PackageQuery {
    pub package_name: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct PackageInfo {
    pub package_name: String,
    pub installed: bool,
    pub version: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct PackageInstallRequest {
    pub package_name: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct PackageOperationResult {
    pub package_name: String,
    pub success: bool,
    pub details: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct LaunchAppRequest {
    pub app_id: String,
    pub arguments: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct LaunchAppResult {
    pub launched: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct ActiveWindowInfo {
    pub app_id: Option<String>,
    pub title: Option<String>,
}

#[async_trait]
pub trait FileSystemAdapter: Send + Sync {
    async fn list_entries(&self, request: ListDirectoryRequest) -> AdapterResult<Vec<FileEntry>>;
    async fn move_file(&self, request: MoveFileRequest) -> AdapterResult<()>;
    async fn rename_file(&self, request: RenameFileRequest) -> AdapterResult<()>;
    async fn create_directory(&self, request: CreateDirectoryRequest) -> AdapterResult<()>;
    async fn delete_file(&self, request: DeleteFileRequest) -> AdapterResult<()>;
}

#[async_trait]
pub trait VoiceAdapter: Send + Sync {
    async fn start_listening(&self) -> AdapterResult<()>;
    async fn stop_listening(&self) -> AdapterResult<()>;
    async fn next_signal(&self) -> AdapterResult<Option<VoiceSignal>>;
}

#[async_trait]
pub trait PrivilegeAdapter: Send + Sync {
    async fn request_elevation(&self, request: PrivilegeRequest)
        -> AdapterResult<PrivilegeOutcome>;
}

#[async_trait]
pub trait PackageManagerAdapter: Send + Sync {
    async fn inspect_package(&self, request: PackageQuery) -> AdapterResult<PackageInfo>;
    async fn install_package(
        &self,
        request: PackageInstallRequest,
    ) -> AdapterResult<PackageOperationResult>;
}

#[async_trait]
pub trait DesktopAdapter: Send + Sync {
    async fn launch_app(&self, request: LaunchAppRequest) -> AdapterResult<LaunchAppResult>;
    async fn active_window(&self) -> AdapterResult<ActiveWindowInfo>;
}

#[cfg(test)]
mod tests {
    use super::*;

    struct DummyAdapter;

    #[async_trait]
    impl FileSystemAdapter for DummyAdapter {
        async fn list_entries(
            &self,
            _request: ListDirectoryRequest,
        ) -> AdapterResult<Vec<FileEntry>> {
            Ok(Vec::new())
        }

        async fn move_file(&self, _request: MoveFileRequest) -> AdapterResult<()> {
            Ok(())
        }

        async fn rename_file(&self, _request: RenameFileRequest) -> AdapterResult<()> {
            Ok(())
        }

        async fn create_directory(&self, _request: CreateDirectoryRequest) -> AdapterResult<()> {
            Ok(())
        }

        async fn delete_file(&self, _request: DeleteFileRequest) -> AdapterResult<()> {
            Ok(())
        }
    }

    #[async_trait]
    impl VoiceAdapter for DummyAdapter {
        async fn start_listening(&self) -> AdapterResult<()> {
            Ok(())
        }

        async fn stop_listening(&self) -> AdapterResult<()> {
            Ok(())
        }

        async fn next_signal(&self) -> AdapterResult<Option<VoiceSignal>> {
            Ok(None)
        }
    }

    #[async_trait]
    impl PrivilegeAdapter for DummyAdapter {
        async fn request_elevation(
            &self,
            _request: PrivilegeRequest,
        ) -> AdapterResult<PrivilegeOutcome> {
            Ok(PrivilegeOutcome::default())
        }
    }

    #[async_trait]
    impl PackageManagerAdapter for DummyAdapter {
        async fn inspect_package(&self, request: PackageQuery) -> AdapterResult<PackageInfo> {
            Ok(PackageInfo {
                package_name: request.package_name,
                ..PackageInfo::default()
            })
        }

        async fn install_package(
            &self,
            request: PackageInstallRequest,
        ) -> AdapterResult<PackageOperationResult> {
            Ok(PackageOperationResult {
                package_name: request.package_name,
                success: true,
                details: None,
            })
        }
    }

    #[async_trait]
    impl DesktopAdapter for DummyAdapter {
        async fn launch_app(&self, _request: LaunchAppRequest) -> AdapterResult<LaunchAppResult> {
            Ok(LaunchAppResult { launched: true })
        }

        async fn active_window(&self) -> AdapterResult<ActiveWindowInfo> {
            Ok(ActiveWindowInfo::default())
        }
    }

    fn assert_file_system_adapter(_: &dyn FileSystemAdapter) {}
    fn assert_voice_adapter(_: &dyn VoiceAdapter) {}
    fn assert_privilege_adapter(_: &dyn PrivilegeAdapter) {}
    fn assert_package_manager_adapter(_: &dyn PackageManagerAdapter) {}
    fn assert_desktop_adapter(_: &dyn DesktopAdapter) {}

    #[test]
    fn traits_are_object_safe_and_share_a_single_error_shape() {
        let adapter = DummyAdapter;

        assert_file_system_adapter(&adapter);
        assert_voice_adapter(&adapter);
        assert_privilege_adapter(&adapter);
        assert_package_manager_adapter(&adapter);
        assert_desktop_adapter(&adapter);
        assert_eq!(AdapterError::new("boom").to_string(), "boom");
    }
}
