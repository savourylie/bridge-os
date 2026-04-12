# [TICKET-023] TEST: Checkpoint 4 — Rust Runtime

## Status
`blocked`

## Dependencies
- Requires: #020, #021, #022

## Description
This checkpoint verifies that the Rust backend runtime compiles, communicates with the frontend via IPC, and correctly implements the conversation state machine and policy engine. It validates the backend-frontend communication spine before building the full orchestration system.

This is a gate for Phase 6 (Orchestration & Mock Adapters). The orchestration runtime depends on all three components verified here: IPC bridge, conversation runtime, and policy engine.

## Acceptance Criteria
- [ ] `cargo build --workspace` compiles all crates without errors or warnings
- [ ] `cargo test --workspace` passes all unit tests
- [ ] Tauri app launches and the frontend connects to the Rust backend
- [ ] Frontend can invoke `get_system_state` and receive a valid response
- [ ] Frontend can invoke `start_listening` and the conversation state transitions to `listening`
- [ ] Conversation state changes propagate to the frontend via IPC events
- [ ] VoiceBar and StatusCapsule update in response to backend state changes
- [ ] Mock transcript text sent from the backend appears in the VoiceBar
- [ ] Policy engine correctly classifies at least one action of each risk level (low, medium, high)
- [ ] Policy engine rejects actions outside approved folder scope
- [ ] Interruption signal from frontend reaches backend and transitions conversation to `interrupted`
- [ ] All IPC payloads serialize/deserialize without errors

## Implementation Notes
This is a manual test execution ticket — no code changes unless bugs are found during testing.

Common failure modes:
- Serialization mismatches between Rust structs and TypeScript types
- IPC event listeners not registered before events are emitted
- Tauri command panics not surfaced to the frontend
- State machine transitions in Rust not reflected in frontend state store
- Cargo workspace dependency resolution issues

## Testing
1. Run `cargo test --workspace` — all tests pass
2. Run `npm run dev` — Tauri app launches
3. Open browser dev tools and verify IPC round-trips
4. Trigger conversation state changes and verify frontend updates
5. Call policy engine classification for sample actions and verify results
6. Test the interrupt flow end-to-end
