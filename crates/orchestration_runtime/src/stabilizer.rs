use std::time::{Duration, Instant};

use crate::models::PendingStabilization;

pub(crate) fn schedule_stabilization(revision: u64, delay_ms: u64) -> PendingStabilization {
    PendingStabilization {
        revision,
        due_at: Instant::now() + Duration::from_millis(delay_ms),
    }
}

pub(crate) fn is_due(pending: &PendingStabilization) -> bool {
    Instant::now() >= pending.due_at
}
