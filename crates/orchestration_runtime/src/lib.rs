use std::sync::{Arc, RwLock};

use adapters::{
    DesktopAdapter, FileSystemAdapter, PackageManagerAdapter, PrivilegeAdapter, VoiceAdapter,
};
use audit_log::{AuditEvent, AuditScope, AuditSink};
use policy_engine::{PolicyAction, PolicyDecision, PolicyEngine};
use task_models::{Plan, PlanState, SystemState, TaskSnapshot, TaskState};

#[derive(Clone)]
pub struct RuntimeAdapters {
    pub file_system: Arc<dyn FileSystemAdapter>,
    pub voice: Arc<dyn VoiceAdapter>,
    pub privilege: Arc<dyn PrivilegeAdapter>,
    pub package_manager: Arc<dyn PackageManagerAdapter>,
    pub desktop: Arc<dyn DesktopAdapter>,
}

#[derive(Clone)]
pub struct RuntimeDependencies {
    pub adapters: RuntimeAdapters,
    pub policy_engine: Arc<PolicyEngine>,
    pub audit_log: Arc<dyn AuditSink>,
}

pub struct OrchestrationRuntime {
    dependencies: RuntimeDependencies,
    system_state: RwLock<SystemState>,
}

impl OrchestrationRuntime {
    pub fn new(dependencies: RuntimeDependencies) -> Self {
        Self {
            dependencies,
            system_state: RwLock::new(SystemState::default()),
        }
    }

    pub fn dependencies(&self) -> &RuntimeDependencies {
        &self.dependencies
    }

    pub fn system_state(&self) -> SystemState {
        self.system_state
            .read()
            .expect("orchestration state lock poisoned")
            .clone()
    }

    pub fn replace_system_state(&self, next_state: SystemState) {
        *self
            .system_state
            .write()
            .expect("orchestration state lock poisoned") = next_state.clone();

        self.dependencies.audit_log.record(AuditEvent {
            scope: AuditScope::Orchestration,
            action: "replace_system_state".into(),
            detail: next_state.current_task.title.clone(),
            task_id: next_state.current_task.id.clone(),
            task_state: Some(next_state.current_task.state),
        });
    }

    pub fn evaluate_action(&self, action: &PolicyAction) -> PolicyDecision {
        self.dependencies.policy_engine.evaluate(action)
    }

    pub fn draft_placeholder_task(&self, title: impl Into<String>) -> TaskSnapshot {
        let title = title.into();
        let task = TaskSnapshot {
            title: Some(title.clone()),
            state: TaskState::Planning,
            plan: Plan {
                title: Some(title),
                steps: Vec::new(),
                plan_state: PlanState::Drafting,
            },
            ..TaskSnapshot::default()
        };

        let mut state = self
            .system_state
            .write()
            .expect("orchestration state lock poisoned");
        state.current_task = task.clone();
        drop(state);

        self.dependencies.audit_log.record(AuditEvent {
            scope: AuditScope::Orchestration,
            action: "draft_placeholder_task".into(),
            detail: task.title.clone(),
            task_id: task.id.clone(),
            task_state: Some(task.state),
        });

        task
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use adapters::{
        ActiveWindowInfo, AdapterResult, CreateDirectoryRequest, DeleteFileRequest, FileEntry,
        LaunchAppRequest, LaunchAppResult, ListDirectoryRequest, MoveFileRequest, PackageInfo,
        PackageInstallRequest, PackageOperationResult, PackageQuery, PrivilegeOutcome,
        PrivilegeRequest, RenameFileRequest, VoiceSignal,
    };
    use audit_log::InMemoryAuditLog;

    struct TestAdapters;

    #[async_trait::async_trait]
    impl FileSystemAdapter for TestAdapters {
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

    #[async_trait::async_trait]
    impl VoiceAdapter for TestAdapters {
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

    #[async_trait::async_trait]
    impl PrivilegeAdapter for TestAdapters {
        async fn request_elevation(
            &self,
            _request: PrivilegeRequest,
        ) -> AdapterResult<PrivilegeOutcome> {
            Ok(PrivilegeOutcome::default())
        }
    }

    #[async_trait::async_trait]
    impl PackageManagerAdapter for TestAdapters {
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

    #[async_trait::async_trait]
    impl DesktopAdapter for TestAdapters {
        async fn launch_app(&self, _request: LaunchAppRequest) -> AdapterResult<LaunchAppResult> {
            Ok(LaunchAppResult { launched: true })
        }

        async fn active_window(&self) -> AdapterResult<ActiveWindowInfo> {
            Ok(ActiveWindowInfo::default())
        }
    }

    #[test]
    fn runtime_bootstraps_with_default_state() {
        let shared = Arc::new(TestAdapters);
        let runtime = OrchestrationRuntime::new(RuntimeDependencies {
            adapters: RuntimeAdapters {
                file_system: shared.clone(),
                voice: shared.clone(),
                privilege: shared.clone(),
                package_manager: shared.clone(),
                desktop: shared,
            },
            policy_engine: Arc::new(PolicyEngine::default()),
            audit_log: Arc::new(InMemoryAuditLog::new()),
        });

        let task = runtime.draft_placeholder_task("Bootstrap plan");
        assert_eq!(task.state, TaskState::Planning);
        assert_eq!(
            runtime.system_state().current_task.title.as_deref(),
            Some("Bootstrap plan")
        );
    }
}
