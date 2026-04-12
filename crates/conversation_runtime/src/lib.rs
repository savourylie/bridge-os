mod state_machine;
mod turn_holding;

use std::sync::{Arc, RwLock};

use adapters::{AdapterResult, VoiceAdapter};
use audit_log::{AuditEvent, AuditScope, AuditSink};
use task_models::ConversationState;

pub use state_machine::can_transition;
pub use turn_holding::{TurnHoldingAnalyzer, TurnHoldingAssessment, TurnHoldingConfig};

pub struct ConversationRuntime {
    voice_adapter: Arc<dyn VoiceAdapter>,
    audit_log: Arc<dyn AuditSink>,
    turn_holding: TurnHoldingAnalyzer,
    state: RwLock<ConversationState>,
    transcript: RwLock<String>,
}

impl ConversationRuntime {
    pub fn new(voice_adapter: Arc<dyn VoiceAdapter>, audit_log: Arc<dyn AuditSink>) -> Self {
        Self {
            voice_adapter,
            audit_log,
            turn_holding: TurnHoldingAnalyzer::default(),
            state: RwLock::new(ConversationState::default()),
            transcript: RwLock::new(String::new()),
        }
    }

    pub fn state(&self) -> ConversationState {
        *self.state.read().expect("conversation state lock poisoned")
    }

    pub fn transcript(&self) -> String {
        self.transcript
            .read()
            .expect("conversation transcript lock poisoned")
            .clone()
    }

    pub fn transition_to(&self, next_state: ConversationState) -> bool {
        let mut state = self
            .state
            .write()
            .expect("conversation state lock poisoned");
        if !can_transition(*state, next_state) {
            return false;
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

        true
    }

    pub fn replace_transcript(&self, transcript: impl Into<String>) {
        let transcript = transcript.into();
        *self
            .transcript
            .write()
            .expect("conversation transcript lock poisoned") = transcript.clone();

        self.audit_log.record(AuditEvent {
            scope: AuditScope::Conversation,
            action: "transcript_updated".into(),
            detail: Some(transcript),
            task_id: None,
            task_state: None,
        });
    }

    pub fn analyze_turn_holding(&self) -> TurnHoldingAssessment {
        self.turn_holding.assess(&self.transcript())
    }

    pub async fn start_listening(&self) -> AdapterResult<ConversationState> {
        self.voice_adapter.start_listening().await?;
        self.transition_to(ConversationState::Listening);
        Ok(self.state())
    }

    pub async fn stop_listening(&self) -> AdapterResult<ConversationState> {
        self.voice_adapter.stop_listening().await?;
        self.transition_to(ConversationState::Idle);
        Ok(self.state())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use adapters::{AdapterResult, VoiceSignal};
    use audit_log::InMemoryAuditLog;
    use std::sync::Mutex;

    struct TestVoiceAdapter {
        listening: Mutex<bool>,
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
            Ok(None)
        }
    }

    #[test]
    fn runtime_starts_with_idle_state_and_audits_local_changes() {
        let audit_log = Arc::new(InMemoryAuditLog::new());
        let runtime = ConversationRuntime::new(
            Arc::new(TestVoiceAdapter {
                listening: Mutex::new(false),
            }),
            audit_log.clone(),
        );

        assert_eq!(runtime.state(), ConversationState::Idle);
        runtime.replace_transcript("actually sort the screenshots");
        assert!(runtime.transition_to(ConversationState::Listening));
        assert!(runtime.analyze_turn_holding().should_hold);
        assert_eq!(audit_log.entries().len(), 2);
    }
}
