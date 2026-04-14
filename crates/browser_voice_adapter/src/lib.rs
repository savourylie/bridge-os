use std::collections::VecDeque;
use std::sync::Mutex;

use adapters::{AdapterResult, TranscriptChunk, VoiceAdapter, VoiceSignal};
use async_trait::async_trait;

#[derive(Debug, Default)]
pub struct BrowserVoiceAdapter {
    listening: Mutex<bool>,
    muted: Mutex<bool>,
    signals: Mutex<VecDeque<VoiceSignal>>,
}

impl BrowserVoiceAdapter {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn is_listening(&self) -> bool {
        *self
            .listening
            .lock()
            .expect("browser voice adapter listening lock poisoned")
    }

    pub fn is_muted(&self) -> bool {
        *self
            .muted
            .lock()
            .expect("browser voice adapter muted lock poisoned")
    }

    pub fn push_signal(&self, signal: VoiceSignal) {
        if let VoiceSignal::Muted(muted) = signal {
            *self
                .muted
                .lock()
                .expect("browser voice adapter muted lock poisoned") = muted;
        }

        self.signals
            .lock()
            .expect("browser voice adapter signals lock poisoned")
            .push_back(signal);
    }

    pub fn push_transcript_chunk(&self, chunk: TranscriptChunk) -> bool {
        if self.is_muted() || chunk.text.trim().is_empty() {
            return false;
        }

        self.push_signal(VoiceSignal::TranscriptUpdated(chunk));
        true
    }

    pub fn set_muted(&self, muted: bool) -> bool {
        let mut current = self
            .muted
            .lock()
            .expect("browser voice adapter muted lock poisoned");
        if *current == muted {
            return false;
        }

        *current = muted;
        drop(current);

        let mut signals = self
            .signals
            .lock()
            .expect("browser voice adapter signals lock poisoned");
        if muted {
            signals.push_front(VoiceSignal::Muted(muted));
        } else {
            signals.push_back(VoiceSignal::Muted(muted));
        }
        true
    }
}

#[async_trait]
impl VoiceAdapter for BrowserVoiceAdapter {
    async fn start_listening(&self) -> AdapterResult<()> {
        *self
            .listening
            .lock()
            .expect("browser voice adapter listening lock poisoned") = true;
        Ok(())
    }

    async fn stop_listening(&self) -> AdapterResult<()> {
        *self
            .listening
            .lock()
            .expect("browser voice adapter listening lock poisoned") = false;
        Ok(())
    }

    async fn next_signal(&self) -> AdapterResult<Option<VoiceSignal>> {
        Ok(self
            .signals
            .lock()
            .expect("browser voice adapter signals lock poisoned")
            .pop_front())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use futures::executor::block_on;

    #[test]
    fn adapter_tracks_listening_and_mute_state() {
        let adapter = BrowserVoiceAdapter::new();
        assert!(!adapter.is_listening());
        assert!(!adapter.is_muted());

        block_on(adapter.start_listening()).expect("start listening");
        assert!(adapter.is_listening());

        assert!(adapter.set_muted(true));
        assert!(adapter.is_muted());
        assert!(!adapter.set_muted(true));

        block_on(adapter.stop_listening()).expect("stop listening");
        assert!(!adapter.is_listening());
    }

    #[test]
    fn adapter_prioritizes_mute_ahead_of_pending_transcript_updates() {
        let adapter = BrowserVoiceAdapter::new();
        assert!(adapter.push_transcript_chunk(TranscriptChunk {
            text: "Computer".into(),
            is_final: false,
        }));
        assert!(adapter.set_muted(true));
        assert!(!adapter.push_transcript_chunk(TranscriptChunk {
            text: "ignored".into(),
            is_final: true,
        }));
        adapter.push_signal(VoiceSignal::Interrupted);

        assert_eq!(
            block_on(adapter.next_signal()).expect("signal 1"),
            Some(VoiceSignal::Muted(true))
        );
        assert!(matches!(
            block_on(adapter.next_signal()).expect("signal 2"),
            Some(VoiceSignal::TranscriptUpdated(_))
        ));
        assert_eq!(
            block_on(adapter.next_signal()).expect("signal 3"),
            Some(VoiceSignal::Interrupted)
        );
        assert_eq!(
            block_on(adapter.next_signal()).expect("signal 4"),
            None
        );
    }
}
