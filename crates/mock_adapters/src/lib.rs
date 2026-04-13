use std::collections::{HashMap, VecDeque};
use std::sync::Mutex;

use adapters::{
    ActiveWindowInfo, AdapterError, AdapterResult, CommandOutput, CommandRequest,
    CreateDirectoryRequest, DeleteFileRequest, DesktopAdapter, FileEntry, FileSystemAdapter,
    LaunchAppRequest, LaunchAppResult, ListDirectoryRequest, MoveFileRequest, PackageInfo,
    PackageInstallRequest, PackageManagerAdapter, PackageOperationResult, PackageQuery,
    PrivilegeAdapter, PrivilegeOutcome, PrivilegeRequest, RenameFileRequest, TranscriptChunk,
    VoiceAdapter, VoiceSignal,
};

fn parent_dir(path: &str) -> String {
    match path.rfind('/') {
        Some(idx) => path[..idx].to_string(),
        None => String::new(),
    }
}

fn filename(path: &str) -> &str {
    match path.rfind('/') {
        Some(idx) => &path[idx + 1..],
        None => path,
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FileSystemOperation {
    Move { source: String, destination: String },
    Rename { path: String, new_name: String },
    CreateDirectory { path: String },
    DeleteFile { path: String, entry: FileEntry },
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

    /// Undo the most recent recorded operation, restoring the in-memory state.
    /// Returns an error if there are no operations to undo.
    pub fn undo_last_operation(&self) -> AdapterResult<()> {
        let op = self
            .operations
            .lock()
            .expect("mock file system operations lock poisoned")
            .pop()
            .ok_or_else(|| AdapterError::new("No operations to undo."))?;

        let mut dirs = self
            .directories
            .lock()
            .expect("mock file system directories lock poisoned");

        match op {
            FileSystemOperation::Move { source, destination } => {
                // Find and move the entry back from destination to source.
                let dir = parent_dir(&destination);
                if let Some(entries) = dirs.get_mut(&dir) {
                    if let Some(idx) = entries.iter().position(|e| e.path == destination) {
                        let mut entry = entries.remove(idx);
                        entry.path = source.clone();
                        let source_dir = parent_dir(&source);
                        dirs.entry(source_dir).or_default().push(entry);
                        return Ok(());
                    }
                }
                Err(AdapterError::new(format!(
                    "Undo failed: '{}' not found in '{}'.",
                    destination,
                    parent_dir(&destination),
                )))
            }
            FileSystemOperation::Rename { path, new_name } => {
                // The renamed entry now lives at parent(path)/new_name.
                let dir = parent_dir(&path);
                let current_path = format!("{}/{}", dir, new_name);
                let original_name = filename(&path).to_string();
                if let Some(entries) = dirs.get_mut(&dir) {
                    if let Some(entry) = entries.iter_mut().find(|e| e.path == current_path) {
                        entry.path = format!("{}/{}", dir, original_name);
                        return Ok(());
                    }
                }
                Err(AdapterError::new(format!(
                    "Undo failed: renamed entry '{}' not found.",
                    current_path,
                )))
            }
            FileSystemOperation::CreateDirectory { path } => {
                dirs.remove(&path);
                Ok(())
            }
            FileSystemOperation::DeleteFile { path, entry } => {
                let dir = parent_dir(&path);
                dirs.entry(dir).or_default().push(entry);
                Ok(())
            }
        }
    }

    /// Undo the last `n` operations in reverse order.
    pub fn undo_operations(&self, n: usize) -> AdapterResult<()> {
        for _ in 0..n {
            self.undo_last_operation()?;
        }
        Ok(())
    }

    fn check_mutations(&self) -> AdapterResult<()> {
        if self.allow_mutations {
            Ok(())
        } else {
            Err(AdapterError::new("Mock file system is read-only."))
        }
    }

    /// Find the entry with the given path across all directories.
    /// Returns the directory key and the index within that directory's Vec.
    fn find_entry_location(
        dirs: &HashMap<String, Vec<FileEntry>>,
        path: &str,
    ) -> Option<(String, usize)> {
        for (dir_key, entries) in dirs {
            if let Some(idx) = entries.iter().position(|e| e.path == path) {
                return Some((dir_key.clone(), idx));
            }
        }
        None
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
        self.check_mutations()?;

        let mut dirs = self
            .directories
            .lock()
            .expect("mock file system directories lock poisoned");

        let location = Self::find_entry_location(&dirs, &request.source).ok_or_else(|| {
            AdapterError::new(format!("File not found: '{}'.", request.source))
        })?;

        let mut entry = dirs.get_mut(&location.0).unwrap().remove(location.1);
        entry.path = request.destination.clone();
        let dest_dir = parent_dir(&request.destination);
        dirs.entry(dest_dir).or_default().push(entry);

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
        self.check_mutations()?;

        let mut dirs = self
            .directories
            .lock()
            .expect("mock file system directories lock poisoned");

        let location = Self::find_entry_location(&dirs, &request.path).ok_or_else(|| {
            AdapterError::new(format!("File not found: '{}'.", request.path))
        })?;

        let dir = parent_dir(&request.path);
        let new_path = format!("{}/{}", dir, request.new_name);
        dirs.get_mut(&location.0).unwrap()[location.1].path = new_path;

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
        self.check_mutations()?;

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
        self.check_mutations()?;

        let mut dirs = self
            .directories
            .lock()
            .expect("mock file system directories lock poisoned");

        let location = Self::find_entry_location(&dirs, &request.path).ok_or_else(|| {
            AdapterError::new(format!("File not found: '{}'.", request.path))
        })?;

        let entry = dirs.get_mut(&location.0).unwrap().remove(location.1);

        self.operations
            .lock()
            .expect("mock file system operations lock poisoned")
            .push(FileSystemOperation::DeleteFile {
                path: request.path,
                entry,
            });

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
    /// Simulated install latency in milliseconds. `None` means no delay.
    pub install_latency_ms: Option<u64>,
}

#[derive(Debug, Default)]
pub struct MockPackageManagerAdapter {
    packages: Mutex<HashMap<String, PackageInfo>>,
    install_succeeds: bool,
    install_latency_ms: Option<u64>,
}

impl MockPackageManagerAdapter {
    pub fn new(config: MockPackageManagerConfig) -> Self {
        Self {
            packages: Mutex::new(config.packages),
            install_succeeds: config.install_succeeds,
            install_latency_ms: config.install_latency_ms,
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
        if let Some(ms) = self.install_latency_ms {
            std::thread::sleep(std::time::Duration::from_millis(ms));
        }

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
impl adapters::CommandAdapter for MockCommandAdapter {
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

/// Pre-built fixture data sets for use in demos and integration tests.
pub mod fixtures {
    use std::collections::HashMap;

    use adapters::FileEntry;

    use crate::MockFileSystemConfig;

    /// Returns a `MockFileSystemConfig` seeded with a realistic Downloads folder
    /// containing 50 mixed files, suitable for the folder-organisation demo flow.
    pub fn downloads_fixture() -> MockFileSystemConfig {
        let entries = vec![
            // --- Images (10) ---
            fe("~/Downloads/holiday-photo-01.jpg", 3_145_728),
            fe("~/Downloads/holiday-photo-02.jpg", 2_883_584),
            fe("~/Downloads/holiday-photo-03.jpg", 4_194_304),
            fe("~/Downloads/screenshot-2026-01-15.png", 512_000),
            fe("~/Downloads/screenshot-2026-02-03.png", 348_160),
            fe("~/Downloads/avatar-draft.png", 102_400),
            fe("~/Downloads/banner-design-v2.png", 1_572_864),
            fe("~/Downloads/product-mockup.jpg", 2_097_152),
            fe("~/Downloads/team-headshot.jpg", 1_048_576),
            fe("~/Downloads/wallpaper-space.jpg", 5_242_880),
            // --- PDFs (8) ---
            fe("~/Downloads/invoice-2025-11.pdf", 204_800),
            fe("~/Downloads/invoice-2025-12.pdf", 209_920),
            fe("~/Downloads/contract-nda-signed.pdf", 819_200),
            fe("~/Downloads/rust-async-book.pdf", 6_291_456),
            fe("~/Downloads/tax-return-2025.pdf", 307_200),
            fe("~/Downloads/flight-confirmation.pdf", 153_600),
            fe("~/Downloads/apartment-lease.pdf", 1_048_576),
            fe("~/Downloads/course-certificate.pdf", 256_000),
            // --- Word / Excel (5) ---
            fe("~/Downloads/project-proposal.docx", 122_880),
            fe("~/Downloads/meeting-notes-q1.docx", 81_920),
            fe("~/Downloads/resume-2026.docx", 94_208),
            fe("~/Downloads/budget-tracker.xlsx", 163_840),
            fe("~/Downloads/inventory-sheet.xlsx", 245_760),
            // --- Archives (7) ---
            fe("~/Downloads/bridge-os-source.zip", 10_485_760),
            fe("~/Downloads/design-assets-v3.zip", 52_428_800),
            fe("~/Downloads/backup-2026-01.zip", 104_857_600),
            fe("~/Downloads/fonts-pack.zip", 8_388_608),
            fe("~/Downloads/node-modules-cache.zip", 31_457_280),
            fe("~/Downloads/logs-archive.tar.gz", 2_097_152),
            fe("~/Downloads/dotfiles.tar.gz", 327_680),
            // --- Video (4) ---
            fe("~/Downloads/demo-recording.mp4", 209_715_200),
            fe("~/Downloads/tutorial-rust-async.mp4", 524_288_000),
            fe("~/Downloads/conference-talk.mp4", 734_003_200),
            fe("~/Downloads/screen-capture-bug.mp4", 52_428_800),
            // --- Audio (3) ---
            fe("~/Downloads/podcast-ep-42.mp3", 41_943_040),
            fe("~/Downloads/ambient-focus.mp3", 62_914_560),
            fe("~/Downloads/voice-memo-ideas.m4a", 5_242_880),
            // --- Installers / disk images (3) ---
            fe("~/Downloads/Cursor-1.2.0.dmg", 209_715_200),
            fe("~/Downloads/Postgres-17.1.dmg", 83_886_080),
            fe("~/Downloads/GIMP-2.10.36.dmg", 157_286_400),
            // --- Shell scripts (3) ---
            fe("~/Downloads/setup-dev-env.sh", 4_096),
            fe("~/Downloads/deploy-staging.sh", 6_144),
            fe("~/Downloads/migrate-db.sh", 3_072),
            // --- Text files (4) ---
            fe("~/Downloads/README-old.txt", 8_192),
            fe("~/Downloads/todo-list.txt", 2_048),
            fe("~/Downloads/api-keys-sample.txt", 1_024),
            fe("~/Downloads/changelog-draft.txt", 16_384),
            // --- Misc data files (3) ---
            fe("~/Downloads/app-debug.log", 204_800),
            fe("~/Downloads/config-export.json", 12_288),
            fe("~/Downloads/contacts-backup.csv", 65_536),
        ];

        assert_eq!(entries.len(), 50, "downloads_fixture must contain exactly 50 entries");

        let mut directories = HashMap::new();
        directories.insert("~/Downloads".to_string(), entries);

        MockFileSystemConfig {
            directories,
            allow_mutations: true,
        }
    }

    fn fe(path: &str, size_bytes: u64) -> FileEntry {
        FileEntry {
            path: path.to_string(),
            is_directory: false,
            size_bytes: Some(size_bytes),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use futures::executor::block_on;

    fn assert_file_system_adapter(_: &dyn FileSystemAdapter) {}
    fn assert_voice_adapter(_: &dyn VoiceAdapter) {}
    fn assert_privilege_adapter(_: &dyn PrivilegeAdapter) {}
    fn assert_package_manager_adapter(_: &dyn PackageManagerAdapter) {}
    fn assert_desktop_adapter(_: &dyn DesktopAdapter) {}
    fn assert_command_adapter(_: &dyn adapters::CommandAdapter) {}

    fn make_downloads_fs() -> MockFileSystemAdapter {
        let mut dirs = HashMap::new();
        dirs.insert(
            "~/Downloads".into(),
            vec![
                FileEntry {
                    path: "~/Downloads/report.pdf".into(),
                    is_directory: false,
                    size_bytes: Some(102_400),
                },
                FileEntry {
                    path: "~/Downloads/photo.jpg".into(),
                    is_directory: false,
                    size_bytes: Some(2_097_152),
                },
            ],
        );
        MockFileSystemAdapter::with_directories(dirs)
    }

    // ── FileSystemAdapter: in-memory state consistency ────────────────────────

    #[test]
    fn file_system_maintains_in_memory_state_across_move() {
        let fs = make_downloads_fs();

        block_on(fs.move_file(MoveFileRequest {
            source: "~/Downloads/report.pdf".into(),
            destination: "~/Documents/report.pdf".into(),
        }))
        .expect("move_file");

        let downloads = block_on(fs.list_entries(ListDirectoryRequest {
            scope: "~/Downloads".into(),
        }))
        .expect("list_entries Downloads");
        let documents = block_on(fs.list_entries(ListDirectoryRequest {
            scope: "~/Documents".into(),
        }))
        .expect("list_entries Documents");

        assert!(
            downloads.iter().all(|e| e.path != "~/Downloads/report.pdf"),
            "file should no longer be in source directory"
        );
        assert!(
            documents.iter().any(|e| e.path == "~/Documents/report.pdf"),
            "file should appear in destination directory"
        );
    }

    #[test]
    fn file_system_maintains_in_memory_state_across_rename() {
        let fs = make_downloads_fs();

        block_on(fs.rename_file(RenameFileRequest {
            path: "~/Downloads/photo.jpg".into(),
            new_name: "holiday.jpg".into(),
        }))
        .expect("rename_file");

        let entries = block_on(fs.list_entries(ListDirectoryRequest {
            scope: "~/Downloads".into(),
        }))
        .expect("list_entries");

        assert!(
            entries.iter().all(|e| e.path != "~/Downloads/photo.jpg"),
            "old path should be gone"
        );
        assert!(
            entries.iter().any(|e| e.path == "~/Downloads/holiday.jpg"),
            "new path should be present"
        );
    }

    #[test]
    fn file_system_maintains_in_memory_state_across_delete() {
        let fs = make_downloads_fs();

        block_on(fs.delete_file(DeleteFileRequest {
            path: "~/Downloads/report.pdf".into(),
        }))
        .expect("delete_file");

        let entries = block_on(fs.list_entries(ListDirectoryRequest {
            scope: "~/Downloads".into(),
        }))
        .expect("list_entries");

        assert!(
            entries.iter().all(|e| e.path != "~/Downloads/report.pdf"),
            "deleted entry should be gone"
        );
        assert_eq!(entries.len(), 1, "one entry should remain");
    }

    // ── FileSystemAdapter: undo / rollback ────────────────────────────────────

    #[test]
    fn undo_reverses_move_operation() {
        let fs = make_downloads_fs();

        block_on(fs.move_file(MoveFileRequest {
            source: "~/Downloads/report.pdf".into(),
            destination: "~/Documents/report.pdf".into(),
        }))
        .expect("move_file");

        fs.undo_last_operation().expect("undo_last_operation");

        let downloads = block_on(fs.list_entries(ListDirectoryRequest {
            scope: "~/Downloads".into(),
        }))
        .expect("list_entries Downloads");
        let documents = block_on(fs.list_entries(ListDirectoryRequest {
            scope: "~/Documents".into(),
        }))
        .expect("list_entries Documents");

        assert!(
            downloads.iter().any(|e| e.path == "~/Downloads/report.pdf"),
            "file should be restored to Downloads"
        );
        assert!(
            documents.iter().all(|e| e.path != "~/Documents/report.pdf"),
            "file should no longer be in Documents"
        );
        assert!(fs.operations().is_empty(), "operation log should be empty after undo");
    }

    #[test]
    fn undo_reverses_rename_operation() {
        let fs = make_downloads_fs();

        block_on(fs.rename_file(RenameFileRequest {
            path: "~/Downloads/photo.jpg".into(),
            new_name: "holiday.jpg".into(),
        }))
        .expect("rename_file");

        fs.undo_last_operation().expect("undo_last_operation");

        let entries = block_on(fs.list_entries(ListDirectoryRequest {
            scope: "~/Downloads".into(),
        }))
        .expect("list_entries");

        assert!(
            entries.iter().any(|e| e.path == "~/Downloads/photo.jpg"),
            "original path should be restored"
        );
        assert!(
            entries.iter().all(|e| e.path != "~/Downloads/holiday.jpg"),
            "renamed path should be gone"
        );
    }

    #[test]
    fn undo_reverses_delete_operation() {
        let fs = make_downloads_fs();

        block_on(fs.delete_file(DeleteFileRequest {
            path: "~/Downloads/report.pdf".into(),
        }))
        .expect("delete_file");

        fs.undo_last_operation().expect("undo_last_operation");

        let entries = block_on(fs.list_entries(ListDirectoryRequest {
            scope: "~/Downloads".into(),
        }))
        .expect("list_entries");

        assert!(
            entries.iter().any(|e| e.path == "~/Downloads/report.pdf"),
            "deleted entry should be restored"
        );
    }

    #[test]
    fn undo_reverses_multiple_operations() {
        let fs = make_downloads_fs();

        // Perform 3 operations.
        block_on(fs.move_file(MoveFileRequest {
            source: "~/Downloads/report.pdf".into(),
            destination: "~/Documents/report.pdf".into(),
        }))
        .expect("move");
        block_on(fs.rename_file(RenameFileRequest {
            path: "~/Downloads/photo.jpg".into(),
            new_name: "holiday.jpg".into(),
        }))
        .expect("rename");
        block_on(fs.create_directory(CreateDirectoryRequest {
            path: "~/Downloads/Archive".into(),
        }))
        .expect("create_directory");

        // Undo all 3.
        fs.undo_operations(3).expect("undo_operations");

        // All state should be restored.
        let downloads = block_on(fs.list_entries(ListDirectoryRequest {
            scope: "~/Downloads".into(),
        }))
        .expect("list_entries Downloads");

        assert!(downloads.iter().any(|e| e.path == "~/Downloads/report.pdf"));
        assert!(downloads.iter().any(|e| e.path == "~/Downloads/photo.jpg"));
        assert!(downloads.iter().all(|e| e.path != "~/Downloads/holiday.jpg"));

        let archive = block_on(fs.list_entries(ListDirectoryRequest {
            scope: "~/Downloads/Archive".into(),
        }))
        .expect("list_entries Archive");
        assert!(archive.is_empty(), "created directory should be removed by undo");
        assert!(fs.operations().is_empty(), "all operations should be undone");
    }

    #[test]
    fn undo_on_empty_history_returns_error() {
        let fs = make_downloads_fs();
        assert!(
            fs.undo_last_operation().is_err(),
            "undo with no history should return an error"
        );
    }

    // ── FileSystemAdapter: read-only mode ─────────────────────────────────────

    #[test]
    fn file_system_read_only_rejects_mutations() {
        let fs = MockFileSystemAdapter::new(MockFileSystemConfig {
            directories: HashMap::new(),
            allow_mutations: false,
        });

        let result = block_on(fs.move_file(MoveFileRequest {
            source: "a".into(),
            destination: "b".into(),
        }));
        assert!(result.is_err(), "move_file should fail on read-only adapter");

        let result = block_on(fs.rename_file(RenameFileRequest {
            path: "a".into(),
            new_name: "b".into(),
        }));
        assert!(result.is_err(), "rename_file should fail on read-only adapter");

        let result = block_on(fs.delete_file(DeleteFileRequest { path: "a".into() }));
        assert!(result.is_err(), "delete_file should fail on read-only adapter");

        let result = block_on(fs.create_directory(CreateDirectoryRequest {
            path: "a".into(),
        }));
        assert!(result.is_err(), "create_directory should fail on read-only adapter");
    }

    // ── VoiceAdapter ──────────────────────────────────────────────────────────

    #[test]
    fn voice_adapter_tracks_listening_state() {
        let voice = MockVoiceAdapter::default();
        assert!(!voice.is_listening());

        block_on(voice.start_listening()).expect("start_listening");
        assert!(voice.is_listening());

        block_on(voice.stop_listening()).expect("stop_listening");
        assert!(!voice.is_listening());
    }

    #[test]
    fn voice_adapter_queues_and_dequeues_signals() {
        let voice = MockVoiceAdapter::default();
        voice.push_signal(VoiceSignal::WakeWordDetected);
        voice.push_signal(VoiceSignal::TranscriptUpdated(TranscriptChunk {
            text: "Computer".into(),
            is_final: false,
        }));
        voice.push_signal(VoiceSignal::Muted(true));

        assert_eq!(
            block_on(voice.next_signal()).expect("signal 1"),
            Some(VoiceSignal::WakeWordDetected)
        );
        assert!(matches!(
            block_on(voice.next_signal()).expect("signal 2"),
            Some(VoiceSignal::TranscriptUpdated(_))
        ));
        assert_eq!(
            block_on(voice.next_signal()).expect("signal 3"),
            Some(VoiceSignal::Muted(true))
        );
        assert_eq!(
            block_on(voice.next_signal()).expect("signal 4 (empty)"),
            None
        );
    }

    // ── PrivilegeAdapter ──────────────────────────────────────────────────────

    #[test]
    fn privilege_adapter_configurable_failure() {
        let adapter = MockPrivilegeAdapter::new(MockPrivilegeConfig {
            outcome: PrivilegeOutcome {
                granted: false,
                prompt_required: true,
            },
        });

        let outcome = block_on(adapter.request_elevation(PrivilegeRequest {
            reason: "install package".into(),
            command: Some("apt install ripgrep".into()),
        }))
        .expect("request_elevation");

        assert!(!outcome.granted, "elevation should be denied");
        assert!(outcome.prompt_required);
        assert_eq!(adapter.requests().len(), 1);
    }

    #[test]
    fn privilege_adapter_configurable_success() {
        let adapter = MockPrivilegeAdapter::new(MockPrivilegeConfig {
            outcome: PrivilegeOutcome {
                granted: true,
                prompt_required: false,
            },
        });

        let outcome = block_on(adapter.request_elevation(PrivilegeRequest {
            reason: "install package".into(),
            command: None,
        }))
        .expect("request_elevation");

        assert!(outcome.granted);
        assert!(!outcome.prompt_required);
    }

    // ── PackageManagerAdapter ─────────────────────────────────────────────────

    #[test]
    fn package_manager_install_updates_in_memory_state() {
        let adapter = MockPackageManagerAdapter::new(MockPackageManagerConfig {
            packages: HashMap::new(),
            install_succeeds: true,
            install_latency_ms: None,
        });

        let before = block_on(adapter.inspect_package(PackageQuery {
            package_name: "ripgrep".into(),
        }))
        .expect("inspect before");
        assert!(!before.installed);

        let result = block_on(adapter.install_package(PackageInstallRequest {
            package_name: "ripgrep".into(),
        }))
        .expect("install_package");
        assert!(result.success);

        let after = block_on(adapter.inspect_package(PackageQuery {
            package_name: "ripgrep".into(),
        }))
        .expect("inspect after");
        assert!(after.installed, "package should be marked installed after install");
    }

    #[test]
    fn package_manager_install_respects_configured_latency() {
        let adapter = MockPackageManagerAdapter::new(MockPackageManagerConfig {
            packages: HashMap::new(),
            install_succeeds: true,
            install_latency_ms: Some(10),
        });

        let start = std::time::Instant::now();
        let result = block_on(adapter.install_package(PackageInstallRequest {
            package_name: "htop".into(),
        }))
        .expect("install_package");
        assert!(result.success);
        assert!(
            start.elapsed() >= std::time::Duration::from_millis(10),
            "install should observe the configured latency"
        );
    }

    #[test]
    fn package_manager_configured_failure_does_not_install() {
        let adapter = MockPackageManagerAdapter::new(MockPackageManagerConfig {
            packages: HashMap::new(),
            install_succeeds: false,
            install_latency_ms: None,
        });

        let result = block_on(adapter.install_package(PackageInstallRequest {
            package_name: "ripgrep".into(),
        }))
        .expect("install_package");
        assert!(!result.success);

        let info = block_on(adapter.inspect_package(PackageQuery {
            package_name: "ripgrep".into(),
        }))
        .expect("inspect");
        assert!(!info.installed, "package should not be installed after a failed install");
    }

    // ── DesktopAdapter ────────────────────────────────────────────────────────

    #[test]
    fn desktop_adapter_records_launch_history() {
        let adapter = MockDesktopAdapter::new(MockDesktopConfig {
            active_window: ActiveWindowInfo::default(),
            launch_succeeds: true,
        });

        block_on(adapter.launch_app(LaunchAppRequest {
            app_id: "org.gnome.Nautilus".into(),
            arguments: vec![],
        }))
        .expect("launch_app");
        block_on(adapter.launch_app(LaunchAppRequest {
            app_id: "org.gnome.Terminal".into(),
            arguments: vec!["--title=BridgeOS".into()],
        }))
        .expect("launch_app 2");

        let history = adapter.launch_history();
        assert_eq!(history.len(), 2);
        assert_eq!(history[0].app_id, "org.gnome.Nautilus");
        assert_eq!(history[1].app_id, "org.gnome.Terminal");
    }

    #[test]
    fn desktop_adapter_launch_failure_does_not_update_active_window() {
        let adapter = MockDesktopAdapter::new(MockDesktopConfig {
            active_window: ActiveWindowInfo {
                app_id: Some("existing-app".into()),
                title: Some("Existing".into()),
            },
            launch_succeeds: false,
        });

        let result = block_on(adapter.launch_app(LaunchAppRequest {
            app_id: "new-app".into(),
            arguments: vec![],
        }))
        .expect("launch_app");
        assert!(!result.launched);

        let window = block_on(adapter.active_window()).expect("active_window");
        assert_eq!(
            window.app_id.as_deref(),
            Some("existing-app"),
            "active window should be unchanged after failed launch"
        );
    }

    // ── Fixtures ──────────────────────────────────────────────────────────────

    #[test]
    fn downloads_fixture_contains_fifty_files() {
        let config = fixtures::downloads_fixture();
        let entries = config
            .directories
            .get("~/Downloads")
            .expect("Downloads directory should exist");
        assert_eq!(entries.len(), 50, "Downloads fixture must have exactly 50 entries");
        assert!(
            entries.iter().all(|e| !e.is_directory),
            "all fixture entries should be files, not directories"
        );
        assert!(
            entries.iter().all(|e| e.size_bytes.is_some()),
            "all fixture entries should have a size"
        );
    }

    #[test]
    fn downloads_fixture_covers_expected_file_types() {
        let config = fixtures::downloads_fixture();
        let entries = &config.directories["~/Downloads"];

        let has_pdf = entries.iter().any(|e| e.path.ends_with(".pdf"));
        let has_image = entries
            .iter()
            .any(|e| e.path.ends_with(".jpg") || e.path.ends_with(".png"));
        let has_archive = entries
            .iter()
            .any(|e| e.path.ends_with(".zip") || e.path.ends_with(".tar.gz"));
        let has_video = entries.iter().any(|e| e.path.ends_with(".mp4"));

        assert!(has_pdf, "fixture should include PDFs");
        assert!(has_image, "fixture should include images");
        assert!(has_archive, "fixture should include archives");
        assert!(has_video, "fixture should include videos");
    }

    // ── Trait surface compile-time check ─────────────────────────────────────

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
            install_latency_ms: None,
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
