# [TICKET-021] Conversation Runtime (Rust)

## Status
`pending`

## Dependencies
- Requires: #020 ✅

## Description
Implement the conversation runtime in Rust — the module responsible for managing voice interaction state, transcript lifecycle, turn-taking logic, and user-holding-turn detection. This module runs in the Rust backend and communicates state changes to the frontend via the Tauri IPC bridge. It implements the conversation state machine and turn-holding policy from UX_DESIGN.md.

## Acceptance Criteria
- [ ] Conversation state machine is implemented in Rust with all 7 states: idle, listening, holding_for_more, clarifying, intent_locked, speaking, interrupted
- [ ] State transitions emit events via the Tauri event channel (`conversation_state_changed`)
- [ ] Transcript lifecycle: accepts text input, accumulates transcript, emits `transcript_updated` events
- [ ] Turn-holding detection: identifies signals that the user is still speaking (self-repair phrases, trailing conjunctions, short pauses)
- [ ] The runtime distinguishes between: "heard something", "user still talking", "ready to respond", "speaking now"
- [ ] Interruption handling: accepts an interrupt signal that transitions from `speaking` to `interrupted`
- [ ] Wake state: transitions from `idle` to `listening` on wake trigger
- [ ] All state transitions are logged to `audit_log` crate

## Implementation Notes
- Implement in `crates/conversation_runtime`
- The turn-holding detection uses heuristics for now — look for self-repair markers ("wait", "actually", "no", "I mean") and trailing conjunctions ("and", "then", "also") per UX_DESIGN.md § Conversation Policy: Turn Holding
- Silence duration thresholds: short pause (< 1.5s) = user may still be talking, long pause (> 2s) = turn likely complete. These are assumptions — note as configurable.
- The actual audio input comes from the voice adapter (mock for now) — this module processes text/state, not raw audio
- Wire the state machine to emit IPC events when state changes
- Integration with the frontend state store should cause VoiceBar and StatusCapsule to update automatically

## Testing
- Unit test the conversation state machine: all valid transitions, rejection of invalid transitions
- Unit test turn-holding heuristics with sample transcript fragments
- Integration test via Tauri: trigger wake → verify frontend receives `conversation_state_changed` → send transcript → verify `transcript_updated` → trigger interrupt → verify state changes
- Verify audit log records conversation events
