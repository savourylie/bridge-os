# [TICKET-020] Tauri IPC Bridge

## Status
`done`

## Dependencies
- Requires: #019 ✅

## Description
Implement the Tauri IPC bridge that connects the React frontend to the Rust backend runtime. This defines the command interface and event channel through which the frontend dispatches user actions (voice input, approvals, control commands) and the backend emits state updates (transcript updates, intent changes, execution progress). The IPC bridge is the communication spine of BridgeOS.

## Acceptance Criteria
- [x] Tauri commands are defined for frontend → backend communication:
  - `start_listening` — initiate voice capture
  - `stop_listening` — stop voice capture
  - `approve_action` — user approves a pending approval
  - `deny_action` — user denies a pending approval
  - `pause_execution` — pause current task
  - `resume_execution` — resume paused task
  - `stop_execution` — cancel current task
  - `get_system_state` — query current state snapshot
- [x] Tauri event channels are defined for backend → frontend communication:
  - `conversation_state_changed` — conversation state updates
  - `transcript_updated` — live transcript text
  - `intent_updated` — intent field changes
  - `plan_updated` — draft plan changes
  - `execution_state_changed` — execution state updates
  - `step_updated` — individual step status changes
  - `approval_requested` — new approval needed
  - `task_completed` — task finished with results
- [x] TypeScript types match Rust types for all IPC payloads (type-safe bridge)
- [x] Frontend can invoke commands and receive responses
- [x] Frontend can listen to event channels and update state store accordingly
- [x] A basic round-trip test works: frontend calls `get_system_state`, backend returns current state

## Implementation Notes
- Use Tauri 2's `tauri::command` for commands and `tauri::Emitter` for events
- Define shared payload types in `crates/task_models` and use `ts-rs` or `specta` to generate TypeScript type definitions
- Create a `useTauriBridge` React hook that wraps the invoke/listen patterns
- Event listeners should feed directly into the state store from #016
- For now, the Rust side can return stub/mock data — real implementations come in later tickets
- Place TypeScript types in `apps/desktop/state/ipc-types.ts`

## Testing
- Start the Tauri app with `npm run dev`
- Call `get_system_state` from the frontend and verify a response is received
- Emit a test event from the Rust backend and verify the frontend receives it
- Verify TypeScript types align with Rust struct definitions
- Verify no serialization errors in the IPC channel
