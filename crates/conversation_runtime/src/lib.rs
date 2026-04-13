mod state_machine;
mod turn_holding;

use std::fmt;
use std::sync::{Arc, RwLock};

use adapters::{AdapterError, TranscriptChunk, VoiceAdapter, VoiceSignal};
use audit_log::{AuditEvent, AuditScope, AuditSink};
use task_models::ConversationState;

pub use state_machine::can_transition;
pub use turn_holding::{TurnHoldingAnalyzer, TurnHoldingAssessment, TurnHoldingConfig};

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ConversationRuntimeError {
    Adapter(String),
    InvalidTransition {
        from: ConversationState,
        to: ConversationState,
    },
    InvalidOperation(String),
}

impl fmt::Display for ConversationRuntimeError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Adapter(message) => f.write_str(message),
            Self::InvalidTransition { from, to } => {
                write!(f, "Invalid conversation transition: {from:?} -> {to:?}")
            }
            Self::InvalidOperation(message) => f.write_str(message),
        }
    }
}

impl std::error::Error for ConversationRuntimeError {}

impl From<AdapterError> for ConversationRuntimeError {
    fn from(value: AdapterError) -> Self {
        Self::Adapter(value.to_string())
    }
}

pub type ConversationRuntimeResult<T> = Result<T, ConversationRuntimeError>;

#[derive(Debug, Clone, PartialEq, Eq, Default)]
struct TranscriptBuffer {
    committed: String,
    live: String,
}

impl TranscriptBuffer {
    fn display_text(&self) -> String {
        join_transcript_segments(&self.committed, &self.live)
    }

    fn apply_chunk(&mut self, chunk: &TranscriptChunk) -> Option<String> {
        let normalized = chunk.text.trim();
        if normalized.is_empty() {
            return None;
        }

        if chunk.is_final {
            self.live.clear();
            self.committed = join_transcript_segments(&self.committed, normalized);
        } else {
            self.live = normalized.into();
        }

        Some(self.display_text())
    }

    fn clear(&mut self) {
        self.committed.clear();
        self.live.clear();
    }
}

fn join_transcript_segments(existing: &str, next: &str) -> String {
    match (existing.trim(), next.trim()) {
        ("", "") => String::new(),
        ("", next) => next.into(),
        (existing, "") => existing.into(),
        (existing, next) => format!("{existing} {next}"),
    }
}

pub struct ConversationRuntime {
    voice_adapter: Arc<dyn VoiceAdapter>,
    audit_log: Arc<dyn AuditSink>,
    turn_holding: TurnHoldingAnalyzer,
    state: RwLock<ConversationState>,
    transcript: RwLock<TranscriptBuffer>,
}

impl ConversationRuntime {
    pub fn new(voice_adapter: Arc<dyn VoiceAdapter>, audit_log: Arc<dyn AuditSink>) -> Self {
        Self {
            voice_adapter,
            audit_log,
            turn_holding: TurnHoldingAnalyzer::default(),
            state: RwLock::new(ConversationState::default()),
            transcript: RwLock::new(TranscriptBuffer::default()),
        }
    }

    pub fn state(&self) -> ConversationState {
        *self.state.read().expect("conversation state lock poisoned")
    }

    pub fn transcript(&self) -> String {
        self.transcript
            .read()
            .expect("conversation transcript lock poisoned")
            .display_text()
    }

    pub fn transition_to(
        &self,
        next_state: ConversationState,
    ) -> ConversationRuntimeResult<ConversationState> {
        let mut state = self
            .state
            .write()
            .expect("conversation state lock poisoned");
        if !can_transition(*state, next_state) {
            return Err(ConversationRuntimeError::InvalidTransition {
                from: *state,
                to: next_state,
            });
        }

        let previous = *state;
        *state = next_state;
        drop(state);

        self.audit_log.record(AuditEvent {
            scope: AuditScope::Conversation,
            action: "state_transition".into(),
            detail: Some(format!("{previous:?} -> {next_state:?}")),
            task_id: None,
            task_state: None,
        });

        Ok(next_state)
    }

    fn record_transcript_update(&self, transcript: String) {
        self.audit_log.record(AuditEvent {
            scope: AuditScope::Conversation,
            action: "transcript_updated".into(),
            detail: Some(transcript),
            task_id: None,
            task_state: None,
        });
    }

    pub fn reset(&self) -> ConversationRuntimeResult<ConversationState> {
        self.transition_to(ConversationState::Idle)
    }

    pub fn set_clarifying(&self) -> ConversationRuntimeResult<ConversationState> {
        self.transition_to(ConversationState::Clarifying)
    }

    pub fn lock_intent(&self) -> ConversationRuntimeResult<ConversationState> {
        self.transition_to(ConversationState::IntentLocked)
    }

    pub fn start_speaking(&self) -> ConversationRuntimeResult<ConversationState> {
        self.transition_to(ConversationState::Speaking)
    }

    pub fn interrupt(&self) -> ConversationRuntimeResult<ConversationState> {
        self.transition_to(ConversationState::Interrupted)
    }

    pub fn handle_signal(
        &self,
        signal: VoiceSignal,
    ) -> ConversationRuntimeResult<ConversationState> {
        match signal {
            VoiceSignal::WakeWordDetected => self.transition_to(ConversationState::Listening),
            VoiceSignal::TranscriptUpdated(chunk) => self.submit_transcript_chunk(chunk),
            VoiceSignal::Interrupted => self.interrupt(),
            VoiceSignal::Muted(_) => Ok(self.state()),
        }
    }

    pub async fn consume_next_signal(
        &self,
    ) -> ConversationRuntimeResult<Option<ConversationState>> {
        let signal = self.voice_adapter.next_signal().await?;
        signal.map(|signal| self.handle_signal(signal)).transpose()
    }

    pub fn submit_transcript_chunk(
        &self,
        chunk: TranscriptChunk,
    ) -> ConversationRuntimeResult<ConversationState> {
        let normalized = chunk.text.trim();
        if normalized.is_empty() {
            return Ok(self.state());
        }

        match self.state() {
            ConversationState::Idle => {
                return Err(ConversationRuntimeError::InvalidOperation(
                    "Cannot accept transcript while idle.".into(),
                ));
            }
            ConversationState::Speaking => {
                return Err(ConversationRuntimeError::InvalidOperation(
                    "Cannot accept transcript while speaking; interrupt first.".into(),
                ));
            }
            ConversationState::Interrupted | ConversationState::IntentLocked => {
                self.transition_to(ConversationState::Listening)?;
            }
            ConversationState::Listening
            | ConversationState::HoldingForMore
            | ConversationState::Clarifying => {}
        }

        let transcript = {
            let mut transcript = self
                .transcript
                .write()
                .expect("conversation transcript lock poisoned");
            transcript
                .apply_chunk(&chunk)
                .expect("non-empty transcript chunk should produce display text")
        };
        self.record_transcript_update(transcript);

        let assessment = self.turn_holding.assess(normalized);
        let current_state = self.state();
        let next_state = if assessment.should_hold {
            ConversationState::HoldingForMore
        } else if chunk.is_final {
            ConversationState::IntentLocked
        } else if current_state == ConversationState::Clarifying {
            ConversationState::Clarifying
        } else {
            ConversationState::Listening
        };

        if next_state == current_state {
            Ok(current_state)
        } else {
            self.transition_to(next_state)
        }
    }

    pub fn analyze_turn_holding(&self) -> TurnHoldingAssessment {
        self.turn_holding.assess(&self.transcript())
    }

    pub async fn start_listening(&self) -> ConversationRuntimeResult<ConversationState> {
        self.voice_adapter.start_listening().await?;
        self.handle_signal(VoiceSignal::WakeWordDetected)
    }

    pub async fn stop_listening(&self) -> ConversationRuntimeResult<ConversationState> {
        self.voice_adapter.stop_listening().await?;
        self.transcript
            .write()
            .expect("conversation transcript lock poisoned")
            .clear();
        self.reset()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use adapters::{AdapterResult, TranscriptChunk, VoiceSignal};
    use audit_log::InMemoryAuditLog;
    use std::collections::VecDeque;
    use std::sync::Mutex;
    use futures::executor::block_on;

    struct TestVoiceAdapter {
        listening: Mutex<bool>,
        signals: Mutex<VecDeque<VoiceSignal>>,
    }

    #[async_trait::async_trait]
    impl VoiceAdapter for TestVoiceAdapter {
        async fn start_listening(&self) -> AdapterResult<()> {
            *self.listening.lock().expect("voice adapter lock poisoned") = true;
            Ok(())
        }

        async fn stop_listening(&self) -> AdapterResult<()> {
            *self.listening.lock().expect("voice adapter lock poisoned") = false;
            Ok(())
        }

        async fn next_signal(&self) -> AdapterResult<Option<VoiceSignal>> {
            Ok(self
                .signals
                .lock()
                .expect("voice signals lock poisoned")
                .pop_front())
        }
    }

    fn runtime_with_signals(
        signals: Vec<VoiceSignal>,
    ) -> (ConversationRuntime, Arc<InMemoryAuditLog>) {
        let audit_log = Arc::new(InMemoryAuditLog::new());
        let runtime = ConversationRuntime::new(
            Arc::new(TestVoiceAdapter {
                listening: Mutex::new(false),
                signals: Mutex::new(VecDeque::from(signals)),
            }),
            audit_log.clone(),
        );

        (runtime, audit_log)
    }

    #[test]
    fn runtime_accumulates_partial_and_final_transcript_chunks() {
        let (runtime, audit_log) = runtime_with_signals(Vec::new());

        assert_eq!(
            block_on(runtime.start_listening()).expect("start listening"),
            ConversationState::Listening
        );
        assert_eq!(
            runtime
                .submit_transcript_chunk(TranscriptChunk {
                    text: "Computer, organize".into(),
                    is_final: false,
                })
                .expect("accept partial transcript"),
            ConversationState::Listening
        );
        assert_eq!(runtime.transcript(), "Computer, organize");
        assert_eq!(
            runtime
                .submit_transcript_chunk(TranscriptChunk {
                    text: "Computer, organize my downloads".into(),
                    is_final: true,
                })
                .expect("accept final transcript"),
            ConversationState::IntentLocked
        );
        assert_eq!(runtime.transcript(), "Computer, organize my downloads");

        let audit_entries = audit_log.entries();
        assert_eq!(audit_entries.len(), 4);
        assert_eq!(audit_entries[0].event.action, "state_transition");
        assert_eq!(audit_entries[1].event.action, "transcript_updated");
        assert_eq!(audit_entries[2].event.action, "transcript_updated");
        assert_eq!(audit_entries[3].event.action, "state_transition");
    }

    #[test]
    fn runtime_routes_turn_holding_and_interrupt_paths() {
        let (runtime, _) = runtime_with_signals(Vec::new());

        block_on(runtime.start_listening()).expect("start listening");
        assert_eq!(
            runtime
                .submit_transcript_chunk(TranscriptChunk {
                    text: "wait, not yesterday".into(),
                    is_final: false,
                })
                .expect("detect self repair"),
            ConversationState::HoldingForMore
        );
        assert_eq!(
            runtime.set_clarifying().expect("enter clarifying"),
            ConversationState::Clarifying
        );
        assert_eq!(
            runtime
                .submit_transcript_chunk(TranscriptChunk {
                    text: "this week".into(),
                    is_final: true,
                })
                .expect("lock intent after clarification"),
            ConversationState::IntentLocked
        );
        assert_eq!(
            runtime.start_speaking().expect("start speaking"),
            ConversationState::Speaking
        );
        assert_eq!(
            runtime.interrupt().expect("interrupt speaking"),
            ConversationState::Interrupted
        );
        assert_eq!(runtime.reset().expect("reset"), ConversationState::Idle);
    }

    #[test]
    fn runtime_rejects_invalid_transcript_and_interrupt_operations() {
        let (runtime, _) = runtime_with_signals(Vec::new());

        let idle_error = runtime
            .submit_transcript_chunk(TranscriptChunk {
                text: "Computer".into(),
                is_final: true,
            })
            .expect_err("idle transcript should fail");
        assert!(matches!(
            idle_error,
            ConversationRuntimeError::InvalidOperation(_)
        ));

        block_on(runtime.start_listening()).expect("start listening");
        let interrupt_error = runtime
            .interrupt()
            .expect_err("interrupt without speaking should fail");
        assert!(matches!(
            interrupt_error,
            ConversationRuntimeError::InvalidTransition {
                from: ConversationState::Listening,
                to: ConversationState::Interrupted,
            }
        ));
    }

    #[test]
    fn runtime_consumes_mock_voice_signals() {
        let (runtime, _) = runtime_with_signals(vec![
            VoiceSignal::WakeWordDetected,
            VoiceSignal::TranscriptUpdated(TranscriptChunk {
                text: "actually, the screenshots".into(),
                is_final: false,
            }),
            VoiceSignal::TranscriptUpdated(TranscriptChunk {
                text: "the screenshots from this week".into(),
                is_final: true,
            }),
        ]);

        assert_eq!(runtime.state(), ConversationState::Idle);
        assert_eq!(
            futures::executor::block_on(runtime.consume_next_signal())
                .expect("consume wake signal"),
            Some(ConversationState::Listening)
        );
        assert_eq!(
            futures::executor::block_on(runtime.consume_next_signal())
                .expect("consume partial signal"),
            Some(ConversationState::HoldingForMore)
        );
        assert_eq!(
            futures::executor::block_on(runtime.consume_next_signal())
                .expect("consume final signal"),
            Some(ConversationState::IntentLocked)
        );
        assert_eq!(runtime.transcript(), "the screenshots from this week");
    }

    #[test]
    fn stop_listening_clears_the_full_transcript_buffer() {
        let (runtime, _) = runtime_with_signals(Vec::new());

        block_on(runtime.start_listening()).expect("start listening");
        runtime
            .submit_transcript_chunk(TranscriptChunk {
                text: "Computer, organize Downloads".into(),
                is_final: true,
            })
            .expect("submit transcript");

        block_on(runtime.stop_listening()).expect("stop listening");

        assert_eq!(runtime.transcript(), "");
        assert_eq!(runtime.state(), ConversationState::Idle);
    }
}
