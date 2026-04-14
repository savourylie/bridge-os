use std::thread;
use std::time::Duration;

use adapters::TranscriptChunk;
use futures::executor::block_on;
use orchestration_runtime::{OrchestrationOutcome, StabilizationSchedule};
use task_models::{ConversationSlice, SystemState, TranscriptChunkInput};
use tauri::{AppHandle, State};

use crate::BackendState;

pub const CONVERSATION_STATE_CHANGED: &str = "conversation_state_changed";
pub const TRANSCRIPT_UPDATED: &str = "transcript_updated";
pub const INTENT_UPDATED: &str = "intent_updated";
pub const PLAN_UPDATED: &str = "plan_updated";
pub const EXECUTION_STATE_CHANGED: &str = "execution_state_changed";
pub const STEP_UPDATED: &str = "step_updated";
pub const APPROVAL_REQUESTED: &str = "approval_requested";
pub const TASK_COMPLETED: &str = "task_completed";

trait BridgeEventEmitter: Clone + Send + Sync + 'static {
    fn emit_system_state(&self, event_name: &str, state: &SystemState) -> Result<(), String>;
}

impl BridgeEventEmitter for AppHandle {
    fn emit_system_state(&self, event_name: &str, state: &SystemState) -> Result<(), String> {
        use tauri::Emitter;

        self.emit(event_name, state.clone())
            .map_err(|error| error.to_string())
    }
}

fn emit_channels<E: BridgeEventEmitter>(
    emitter: &E,
    channels: &[&str],
    state: &SystemState,
) -> Result<(), String> {
    for channel in channels {
        emitter.emit_system_state(channel, state)?;
    }

    Ok(())
}

fn current_conversation_slice(backend_state: &BackendState) -> ConversationSlice {
    ConversationSlice {
        state: backend_state.conversation_runtime.state(),
        transcript: backend_state.conversation_runtime.transcript(),
    }
}

fn listening_conversation_slice() -> ConversationSlice {
    ConversationSlice {
        state: task_models::ConversationState::Listening,
        transcript: String::new(),
    }
}

fn idle_conversation_slice() -> ConversationSlice {
    ConversationSlice {
        state: task_models::ConversationState::Idle,
        transcript: String::new(),
    }
}

fn transcript_channels() -> [&'static str; 2] {
    [CONVERSATION_STATE_CHANGED, TRANSCRIPT_UPDATED]
}

fn stabilization_channels(outcome: &OrchestrationOutcome) -> Vec<&'static str> {
    let mut channels = vec![INTENT_UPDATED, PLAN_UPDATED, EXECUTION_STATE_CHANGED];
    if !outcome.state.timeline.is_empty() {
        channels.push(STEP_UPDATED);
    }
    if outcome.state.approval.state == task_models::ApprovalFlow::Requested {
        channels.push(APPROVAL_REQUESTED);
    }
    channels
}

fn approval_channels() -> [&'static str; 5] {
    [
        INTENT_UPDATED,
        PLAN_UPDATED,
        APPROVAL_REQUESTED,
        EXECUTION_STATE_CHANGED,
        STEP_UPDATED,
    ]
}

fn execution_channels(task_completed: bool) -> Vec<&'static str> {
    let mut channels = vec![EXECUTION_STATE_CHANGED, STEP_UPDATED];
    if task_completed {
        channels.push(TASK_COMPLETED);
    }
    channels
}

fn emit_stabilization_outcome<E: BridgeEventEmitter>(
    emitter: &E,
    outcome: &OrchestrationOutcome,
) -> Result<(), String> {
    if !outcome.state_changed {
        return Ok(());
    }

    emit_channels(emitter, &stabilization_channels(outcome), &outcome.state)
}

#[cfg(test)]
fn drive_execution_to_idle<E: BridgeEventEmitter>(
    emitter: &E,
    backend_state: &BackendState,
    token: u64,
) -> Result<(), String> {
    loop {
        let advance = block_on(backend_state.orchestration_runtime.execute_next_step(token))
            .map_err(|error| error.to_string())?;
        emit_channels(
            emitter,
            &execution_channels(advance.task_completed),
            &advance.state,
        )?;

        if !advance.continue_running {
            return Ok(());
        }
    }
}

fn spawn_execution_driver<E: BridgeEventEmitter>(
    emitter: E,
    backend_state: BackendState,
    token: u64,
) {
    thread::spawn(move || {
        let mut should_continue = true;

        while should_continue {
            let advance = match block_on(backend_state.orchestration_runtime.execute_next_step(token))
            {
                Ok(advance) => advance,
                Err(_) => return,
            };

            let _ = emit_channels(
                &emitter,
                &execution_channels(advance.task_completed),
                &advance.state,
            );

            should_continue = advance.continue_running;
            if should_continue {
                thread::sleep(Duration::from_millis(15));
            }
        }
    });
}

fn spawn_stabilization_timer<E: BridgeEventEmitter>(
    emitter: E,
    backend_state: BackendState,
    schedule: StabilizationSchedule,
) {
    thread::spawn(move || {
        thread::sleep(Duration::from_millis(schedule.delay_ms));
        let outcome = match backend_state
            .orchestration_runtime
            .stabilize_if_due(schedule.revision)
        {
            Ok(outcome) if outcome.state_changed => outcome,
            _ => return,
        };

        let _ = emit_stabilization_outcome(&emitter, &outcome);
        if let Some(token) = outcome.execution_token {
            spawn_execution_driver(emitter, backend_state, token);
        }
    });
}

fn submit_transcript_to_runtime(
    backend_state: &BackendState,
    chunk: TranscriptChunkInput,
) -> Result<OrchestrationOutcome, String> {
    backend_state
        .conversation_runtime
        .submit_transcript_chunk(TranscriptChunk {
            text: chunk.text,
            is_final: chunk.is_final,
        })
        .map_err(|error| error.to_string())?;

    Ok(backend_state
        .orchestration_runtime
        .observe_transcript(current_conversation_slice(backend_state)))
}

#[tauri::command]
pub async fn start_listening(
    app: AppHandle,
    state: State<'_, BackendState>,
) -> Result<SystemState, String> {
    let backend_state = state.inner().clone();
    backend_state
        .conversation_runtime
        .start_listening()
        .await
        .map_err(|error| error.to_string())?;

    let outcome = backend_state
        .orchestration_runtime
        .start_session(listening_conversation_slice());
    emit_channels(&app, &transcript_channels(), &outcome.state)?;

    Ok(outcome.state)
}

#[tauri::command]
pub async fn stop_listening(
    app: AppHandle,
    state: State<'_, BackendState>,
) -> Result<SystemState, String> {
    let backend_state = state.inner().clone();
    backend_state
        .conversation_runtime
        .stop_listening()
        .await
        .map_err(|error| error.to_string())?;

    let outcome = backend_state
        .orchestration_runtime
        .stop_session(idle_conversation_slice());
    emit_channels(&app, &transcript_channels(), &outcome.state)?;

    Ok(outcome.state)
}

#[tauri::command]
pub fn submit_transcript_chunk(
    app: AppHandle,
    state: State<'_, BackendState>,
    chunk: TranscriptChunkInput,
) -> Result<SystemState, String> {
    let backend_state = state.inner().clone();
    let outcome = submit_transcript_to_runtime(&backend_state, chunk)?;
    emit_channels(&app, &transcript_channels(), &outcome.state)?;

    if let Some(schedule) = outcome.stabilization.clone() {
        spawn_stabilization_timer(app, backend_state, schedule);
    }

    Ok(outcome.state)
}

#[tauri::command]
pub fn interrupt_conversation(
    app: AppHandle,
    state: State<'_, BackendState>,
) -> Result<SystemState, String> {
    let backend_state = state.inner().clone();
    backend_state
        .conversation_runtime
        .interrupt()
        .map_err(|error| error.to_string())?;

    let outcome = backend_state
        .orchestration_runtime
        .sync_conversation(current_conversation_slice(&backend_state));
    emit_channels(&app, &transcript_channels(), &outcome.state)?;

    Ok(outcome.state)
}

#[tauri::command]
pub fn approve_action(
    app: AppHandle,
    state: State<'_, BackendState>,
) -> Result<SystemState, String> {
    let backend_state = state.inner().clone();
    let outcome = backend_state
        .orchestration_runtime
        .approve_pending()
        .map_err(|error| error.to_string())?;
    emit_channels(&app, &approval_channels(), &outcome.state)?;

    if let Some(token) = outcome.execution_token {
        spawn_execution_driver(app, backend_state, token);
    }

    Ok(outcome.state)
}

#[tauri::command]
pub fn deny_action(app: AppHandle, state: State<'_, BackendState>) -> Result<SystemState, String> {
    let backend_state = state.inner().clone();
    let outcome = backend_state
        .orchestration_runtime
        .deny_pending()
        .map_err(|error| error.to_string())?;
    emit_channels(&app, &approval_channels(), &outcome.state)?;

    Ok(outcome.state)
}

#[tauri::command]
pub fn pause_execution(
    app: AppHandle,
    state: State<'_, BackendState>,
) -> Result<SystemState, String> {
    let backend_state = state.inner().clone();
    let outcome = backend_state
        .orchestration_runtime
        .pause_execution()
        .map_err(|error| error.to_string())?;
    emit_channels(&app, &execution_channels(false), &outcome.state)?;

    Ok(outcome.state)
}

#[tauri::command]
pub fn resume_execution(
    app: AppHandle,
    state: State<'_, BackendState>,
) -> Result<SystemState, String> {
    let backend_state = state.inner().clone();
    let outcome = backend_state
        .orchestration_runtime
        .resume_execution()
        .map_err(|error| error.to_string())?;
    emit_channels(&app, &execution_channels(false), &outcome.state)?;

    if let Some(token) = outcome.execution_token {
        spawn_execution_driver(app, backend_state, token);
    }

    Ok(outcome.state)
}

#[tauri::command]
pub fn stop_execution(
    app: AppHandle,
    state: State<'_, BackendState>,
) -> Result<SystemState, String> {
    let backend_state = state.inner().clone();
    let outcome = backend_state
        .orchestration_runtime
        .stop_execution()
        .map_err(|error| error.to_string())?;
    emit_channels(&app, &execution_channels(outcome.task_completed), &outcome.state)?;

    Ok(outcome.state)
}

#[tauri::command]
pub fn get_system_state(state: State<'_, BackendState>) -> SystemState {
    state.inner().orchestration_runtime.system_state()
}

#[tauri::command]
pub fn undo_folder_organization(state: State<'_, BackendState>) -> Result<(), String> {
    let count = state.adapters.file_system.operations().len();
    state
        .adapters
        .file_system
        .undo_operations(count)
        .map_err(|error| error.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use adapters::FileSystemAdapter;

    #[derive(Clone, Default)]
    struct MockEmitter {
        emitted: std::sync::Arc<std::sync::Mutex<Vec<String>>>,
    }

    impl BridgeEventEmitter for MockEmitter {
        fn emit_system_state(&self, event_name: &str, _state: &SystemState) -> Result<(), String> {
            self.emitted
                .lock()
                .expect("mock emitter lock poisoned")
                .push(event_name.into());
            Ok(())
        }
    }

    #[test]
    fn transcript_submission_returns_pre_debounce_understanding_state() {
        let backend_state = BackendState::bootstrap_with_config(
            orchestration_runtime::OrchestrationConfig {
                intent_stability_ms: 0,
            },
        );
        block_on(backend_state.conversation_runtime.start_listening()).expect("start listening");

        let outcome = submit_transcript_to_runtime(
            &backend_state,
            TranscriptChunkInput {
                text: "Computer, organize my Downloads.".into(),
                is_final: true,
            },
        )
        .expect("submit transcript");

        assert_eq!(outcome.state.current_task.state, task_models::TaskState::Understanding);
        assert!(outcome.state.current_task.plan.steps.is_empty());
        assert!(outcome.stabilization.is_some());
    }

    #[test]
    fn stabilization_emits_approval_request_without_placeholder_state() {
        let backend_state = BackendState::bootstrap_with_config(
            orchestration_runtime::OrchestrationConfig {
                intent_stability_ms: 0,
            },
        );
        let emitter = MockEmitter::default();
        block_on(backend_state.conversation_runtime.start_listening()).expect("start listening");

        let observed = submit_transcript_to_runtime(
            &backend_state,
            TranscriptChunkInput {
                text: "Organize my Downloads and do not touch PDFs.".into(),
                is_final: true,
            },
        )
        .expect("submit transcript");
        let outcome = backend_state
            .orchestration_runtime
            .stabilize_if_due(observed.stabilization.expect("schedule").revision)
            .expect("stabilize");

        emit_stabilization_outcome(&emitter, &outcome).expect("emit stabilization");

        let emitted = emitter
            .emitted
            .lock()
            .expect("mock emitter lock poisoned")
            .clone();

        assert!(emitted.contains(&APPROVAL_REQUESTED.to_string()));
        assert_eq!(
            outcome.state.current_task.summary.as_deref(),
            Some(
                "BridgeOS will review ~/Downloads, prepare folders, move matching files, and summarize the result."
            )
        );
        assert_ne!(
            outcome.state.current_task.summary.as_deref(),
            Some("Stub runtime task used to validate the Tauri IPC bridge.")
        );
    }

    #[test]
    fn approval_and_execution_driver_emit_completion_channels() {
        let backend_state = BackendState::bootstrap_with_config(
            orchestration_runtime::OrchestrationConfig {
                intent_stability_ms: 0,
            },
        );
        let emitter = MockEmitter::default();
        block_on(backend_state.conversation_runtime.start_listening()).expect("start listening");

        let observed = submit_transcript_to_runtime(
            &backend_state,
            TranscriptChunkInput {
                text: "Inspect my bridge-os project".into(),
                is_final: true,
            },
        )
        .expect("submit transcript");
        let stabilized = backend_state
            .orchestration_runtime
            .stabilize_if_due(observed.stabilization.expect("schedule").revision)
            .expect("stabilize");
        emit_stabilization_outcome(&emitter, &stabilized).expect("emit stabilization");
        let token = stabilized.execution_token.expect("execution token");

        drive_execution_to_idle(&emitter, &backend_state, token).expect("drive execution");

        let emitted = emitter
            .emitted
            .lock()
            .expect("mock emitter lock poisoned")
            .clone();
        assert!(emitted.contains(&TASK_COMPLETED.to_string()));
        assert_eq!(
            backend_state
                .orchestration_runtime
                .system_state()
                .current_task
                .state,
            task_models::TaskState::Completed
        );
    }

    #[test]
    fn stale_stabilization_revisions_are_ignored() {
        let backend_state = BackendState::bootstrap_with_config(
            orchestration_runtime::OrchestrationConfig {
                intent_stability_ms: 0,
            },
        );
        block_on(backend_state.conversation_runtime.start_listening()).expect("start listening");

        let first = submit_transcript_to_runtime(
            &backend_state,
            TranscriptChunkInput {
                text: "Organize my Downloads".into(),
                is_final: false,
            },
        )
        .expect("first transcript");
        let second = submit_transcript_to_runtime(
            &backend_state,
            TranscriptChunkInput {
                text: "Organize my Downloads and keep original filenames.".into(),
                is_final: true,
            },
        )
        .expect("second transcript");

        let stale = backend_state
            .orchestration_runtime
            .stabilize_if_due(first.stabilization.expect("first schedule").revision)
            .expect("stale stabilize");
        assert!(!stale.state_changed);

        let latest = backend_state
            .orchestration_runtime
            .stabilize_if_due(second.stabilization.expect("second schedule").revision)
            .expect("latest stabilize");
        assert!(latest.state_changed);
    }

    #[test]
    fn folder_organization_full_flow_completes_with_correct_counts() {
        use adapters::ListDirectoryRequest;

        let backend_state = BackendState::bootstrap_with_config(
            orchestration_runtime::OrchestrationConfig {
                intent_stability_ms: 0,
            },
        );
        let emitter = MockEmitter::default();
        block_on(backend_state.conversation_runtime.start_listening()).expect("start listening");

        let observed = submit_transcript_to_runtime(
            &backend_state,
            TranscriptChunkInput {
                text: "Organize my Downloads".into(),
                is_final: true,
            },
        )
        .expect("submit transcript");
        let _stabilized = backend_state
            .orchestration_runtime
            .stabilize_if_due(observed.stabilization.expect("schedule").revision)
            .expect("stabilize");

        let approved = backend_state
            .orchestration_runtime
            .approve_pending()
            .expect("approve pending");
        let token = approved.execution_token.expect("execution token after approval");

        drive_execution_to_idle(&emitter, &backend_state, token).expect("drive execution");

        let state = backend_state.orchestration_runtime.system_state();
        assert_eq!(state.current_task.state, task_models::TaskState::Completed);

        let completion = state.current_task.completion.expect("completion summary");
        assert_eq!(completion.changes.moved, 12);
        assert_eq!(completion.changes.created, 5);
        assert_eq!(completion.changes.deleted, 0);
        assert_eq!(completion.rollback_available, Some(true));

        assert!(
            !backend_state.adapters.file_system.operations().is_empty(),
            "operations should be recorded"
        );

        // Confirm no files remain at a subdirectory path in ~/Downloads
        let downloads_entries = block_on(
            backend_state.adapters.file_system.list_entries(ListDirectoryRequest {
                scope: "~/Downloads".into(),
            }),
        )
        .expect("list downloads");
        assert!(
            downloads_entries.is_empty(),
            "all files should have moved out of ~/Downloads"
        );
    }

    #[test]
    fn folder_organization_pdf_exclusion_leaves_pdfs_unmoved() {
        use mock_adapters::FileSystemOperation;

        let backend_state = BackendState::bootstrap_with_config(
            orchestration_runtime::OrchestrationConfig {
                intent_stability_ms: 0,
            },
        );
        let emitter = MockEmitter::default();
        block_on(backend_state.conversation_runtime.start_listening()).expect("start listening");

        let observed = submit_transcript_to_runtime(
            &backend_state,
            TranscriptChunkInput {
                text: "Organize my Downloads and do not touch PDFs".into(),
                is_final: true,
            },
        )
        .expect("submit transcript");
        let _stabilized = backend_state
            .orchestration_runtime
            .stabilize_if_due(observed.stabilization.expect("schedule").revision)
            .expect("stabilize");

        let approved = backend_state
            .orchestration_runtime
            .approve_pending()
            .expect("approve pending");
        let token = approved.execution_token.expect("execution token after approval");

        drive_execution_to_idle(&emitter, &backend_state, token).expect("drive execution");

        let state = backend_state.orchestration_runtime.system_state();
        assert_eq!(state.current_task.state, task_models::TaskState::Completed);

        let completion = state.current_task.completion.expect("completion summary");
        assert_eq!(completion.changes.moved, 11, "PDF should remain unmoved");

        let operations = backend_state.adapters.file_system.operations();
        let pdf_move = operations.iter().any(|op| {
            matches!(op, FileSystemOperation::Move { source, .. } if source.contains(".pdf"))
        });
        assert!(!pdf_move, "no Move operation should touch a .pdf file");
    }

    #[test]
    fn project_inspection_completes_with_file_summary() {
        let backend_state = BackendState::bootstrap_with_config(
            orchestration_runtime::OrchestrationConfig {
                intent_stability_ms: 0,
            },
        );
        let emitter = MockEmitter::default();
        block_on(backend_state.conversation_runtime.start_listening()).expect("start listening");

        let observed = submit_transcript_to_runtime(
            &backend_state,
            TranscriptChunkInput {
                text: "Inspect my bridge-os project".into(),
                is_final: true,
            },
        )
        .expect("submit transcript");

        // Project inspection is low-risk (read-only scan) — execution token comes
        // directly from stabilization without any approval step.
        let stabilized = backend_state
            .orchestration_runtime
            .stabilize_if_due(observed.stabilization.expect("schedule").revision)
            .expect("stabilize");
        assert!(
            stabilized.execution_token.is_some(),
            "project inspection should execute without approval"
        );
        let token = stabilized.execution_token.expect("execution token");

        drive_execution_to_idle(&emitter, &backend_state, token).expect("drive execution");

        let state = backend_state.orchestration_runtime.system_state();
        assert_eq!(state.current_task.state, task_models::TaskState::Completed);

        let completion = state.current_task.completion.expect("completion summary");
        // AnalyzeProject counts the 10 files added to the ~/Projects/bridge-os fixture.
        assert!(
            completion.outcome.contains("Found"),
            "completion outcome should describe files found: {}",
            completion.outcome
        );
    }

    #[test]
    fn guarded_command_allowlisted_requires_approval_then_executes() {
        let backend_state = BackendState::bootstrap_with_config(
            orchestration_runtime::OrchestrationConfig {
                intent_stability_ms: 0,
            },
        );
        let emitter = MockEmitter::default();
        block_on(backend_state.conversation_runtime.start_listening()).expect("start listening");

        let observed = submit_transcript_to_runtime(
            &backend_state,
            TranscriptChunkInput {
                text: "Run git status in my bridge-os project".into(),
                is_final: true,
            },
        )
        .expect("submit transcript");

        let stabilized = backend_state
            .orchestration_runtime
            .stabilize_if_due(observed.stabilization.expect("schedule").revision)
            .expect("stabilize");

        // Allowlisted commands are medium-risk — approval is required before execution.
        assert!(
            stabilized.execution_token.is_none(),
            "allowlisted command should pause for approval"
        );
        assert_eq!(
            stabilized.state.approval.state,
            task_models::ApprovalFlow::Requested,
        );
        assert_eq!(
            stabilized.state.current_task.risk,
            Some(task_models::RiskLevel::Medium),
        );

        // Approve and execute.
        let approved = backend_state
            .orchestration_runtime
            .approve_pending()
            .expect("approve pending");
        let token = approved.execution_token.expect("execution token after approval");

        drive_execution_to_idle(&emitter, &backend_state, token).expect("drive execution");

        let emitted = emitter
            .emitted
            .lock()
            .expect("mock emitter lock poisoned")
            .clone();
        assert!(emitted.contains(&TASK_COMPLETED.to_string()));

        let state = backend_state.orchestration_runtime.system_state();
        assert_eq!(state.current_task.state, task_models::TaskState::Completed);

        let completion = state.current_task.completion.expect("completion summary");
        assert!(
            completion.outcome.contains("git status"),
            "completion should reference the executed command: {}",
            completion.outcome
        );
    }

    #[test]
    fn guarded_command_non_allowlisted_requests_high_risk_approval() {
        let backend_state = BackendState::bootstrap_with_config(
            orchestration_runtime::OrchestrationConfig {
                intent_stability_ms: 0,
            },
        );
        block_on(backend_state.conversation_runtime.start_listening()).expect("start listening");

        let observed = submit_transcript_to_runtime(
            &backend_state,
            TranscriptChunkInput {
                text: "Run lsblk in my bridge-os project".into(),
                is_final: true,
            },
        )
        .expect("submit transcript");

        let stabilized = backend_state
            .orchestration_runtime
            .stabilize_if_due(observed.stabilization.expect("schedule").revision)
            .expect("stabilize");

        // Non-allowlisted commands are high-risk — approval is required.
        assert!(
            stabilized.execution_token.is_none(),
            "non-allowlisted command should not auto-execute"
        );
        assert_eq!(
            stabilized.state.approval.state,
            task_models::ApprovalFlow::Requested,
        );
        assert_eq!(
            stabilized.state.current_task.risk,
            Some(task_models::RiskLevel::High),
        );

        let approval = stabilized
            .state
            .approval
            .request
            .expect("approval request should be present");
        assert_eq!(approval.risk_level, task_models::RiskLevel::High);
        assert!(
            approval.explanation.contains("outside the guarded allowlist"),
            "explanation should mention the allowlist: {}",
            approval.explanation
        );
    }

    #[test]
    fn folder_organization_undo_reverses_all_move_operations() {
        use adapters::ListDirectoryRequest;

        let backend_state = BackendState::bootstrap_with_config(
            orchestration_runtime::OrchestrationConfig {
                intent_stability_ms: 0,
            },
        );
        let emitter = MockEmitter::default();
        block_on(backend_state.conversation_runtime.start_listening()).expect("start listening");

        let observed = submit_transcript_to_runtime(
            &backend_state,
            TranscriptChunkInput {
                text: "Organize my Downloads".into(),
                is_final: true,
            },
        )
        .expect("submit transcript");
        let _stabilized = backend_state
            .orchestration_runtime
            .stabilize_if_due(observed.stabilization.expect("schedule").revision)
            .expect("stabilize");

        let approved = backend_state
            .orchestration_runtime
            .approve_pending()
            .expect("approve pending");
        let token = approved.execution_token.expect("execution token after approval");

        drive_execution_to_idle(&emitter, &backend_state, token).expect("drive execution");

        let ops_count = backend_state.adapters.file_system.operations().len();
        assert!(ops_count > 0, "operations should be recorded before undo");

        backend_state
            .adapters
            .file_system
            .undo_operations(ops_count)
            .expect("undo operations");

        assert!(
            backend_state.adapters.file_system.operations().is_empty(),
            "operations log should be empty after undo"
        );

        let downloads_entries = block_on(
            backend_state.adapters.file_system.list_entries(ListDirectoryRequest {
                scope: "~/Downloads".into(),
            }),
        )
        .expect("list downloads after undo");
        assert_eq!(
            downloads_entries.len(),
            12,
            "all 12 files should be restored to ~/Downloads"
        );

        let screenshots_entries = block_on(
            backend_state.adapters.file_system.list_entries(ListDirectoryRequest {
                scope: "~/Downloads/Screenshots".into(),
            }),
        )
        .expect("list screenshots after undo");
        assert!(
            screenshots_entries.is_empty(),
            "Screenshots subdirectory should be empty after undo"
        );
    }
}
