use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

use task_models::TaskState;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum AuditScope {
    #[default]
    System,
    Conversation,
    Policy,
    Orchestration,
    Adapter,
}

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct AuditEvent {
    pub scope: AuditScope,
    pub action: String,
    pub detail: Option<String>,
    pub task_id: Option<String>,
    pub task_state: Option<TaskState>,
}

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct AuditEntry {
    pub id: u64,
    pub timestamp_ms: u128,
    pub event: AuditEvent,
}

pub trait AuditSink: Send + Sync {
    fn record(&self, event: AuditEvent) -> AuditEntry;
    fn entries(&self) -> Vec<AuditEntry>;
}

#[derive(Debug, Default)]
pub struct InMemoryAuditLog {
    next_id: AtomicU64,
    entries: Mutex<Vec<AuditEntry>>,
}

impl InMemoryAuditLog {
    pub fn new() -> Self {
        Self::default()
    }
}

impl AuditSink for InMemoryAuditLog {
    fn record(&self, event: AuditEvent) -> AuditEntry {
        let entry = AuditEntry {
            id: self.next_id.fetch_add(1, Ordering::SeqCst) + 1,
            timestamp_ms: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("system time after epoch")
                .as_millis(),
            event,
        };

        self.entries
            .lock()
            .expect("audit log mutex poisoned")
            .push(entry.clone());

        entry
    }

    fn entries(&self) -> Vec<AuditEntry> {
        self.entries
            .lock()
            .expect("audit log mutex poisoned")
            .clone()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn in_memory_audit_log_records_and_retrieves_entries() {
        let log = InMemoryAuditLog::new();

        let first = log.record(AuditEvent {
            scope: AuditScope::Conversation,
            action: "start_listening".into(),
            detail: Some("Wake word detected".into()),
            task_id: Some("task-1".into()),
            task_state: Some(TaskState::Listening),
        });
        let second = log.record(AuditEvent {
            scope: AuditScope::Policy,
            action: "evaluate".into(),
            detail: None,
            task_id: Some("task-1".into()),
            task_state: Some(TaskState::Planning),
        });

        let entries = log.entries();
        assert_eq!(entries.len(), 2);
        assert_eq!(entries[0], first);
        assert_eq!(entries[1], second);
        assert!(entries[1].timestamp_ms >= entries[0].timestamp_ms);
    }
}
