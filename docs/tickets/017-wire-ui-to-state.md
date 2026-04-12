# [TICKET-017] Wire UI to State & Mock Interaction Demo

## Status
`done`

## Dependencies
- Requires: #016 ✅

## Description
Connect all UI components to the state store and build a mock interaction demo that walks through a complete BridgeOS task flow using simulated events. This ticket bridges the static components from Phases 2-3 with the state management from Phase 4, creating the first interactive prototype of the BridgeOS experience. The demo should simulate the "Organize Downloads" user flow from UX_DESIGN.md.

This is a critical milestone — it proves the core BridgeOS interaction loop (conversation → intent → plan → execution → completion) works as an integrated experience, even without real voice or backend.

## Acceptance Criteria
- [x] StatusCapsule reflects current system state from the store (idle → listening → understanding → planning → executing → completed)
- [x] VoiceBar displays transcript text from the store and shows correct turn state
- [x] IntentBoard updates incrementally as intent events fire (goal appears, then scope, then constraints)
- [x] DraftPlan populates with steps as plan events fire, showing "Execution: Not started" until execution begins
- [x] Timeline steps update their status dots and connector colors as execution events progress
- [x] ApprovalCard appears when an approval event fires, and proceeding depends on user clicking Approve/Deny
- [x] CompletionSummary appears with correct outcome data when the task completes
- [x] The demo auto-plays through the full "Organize Downloads" flow with realistic timing
- [x] A manual mode allows stepping through events one at a time
- [x] The demo is accessible at the app root (`/`) or a `/demo` route

## Design Reference
- **Flow**: UX_DESIGN.md § Primary User Flows > Flow 1: Organize Downloads
- **State model**: UX_DESIGN.md § Recommended State Model

## Visual Reference
The full BridgeOS interface animates through a task flow: StatusCapsule shifts from idle to listening as mock transcript appears in the VoiceBar. IntentBoard fills in with "Organize Downloads" goal, scope, and constraints. A DraftPlan appears with 5 steps. The timeline begins executing, each step completing in sequence. Mid-flow, an ApprovalCard appears for a file move operation. After approval, execution continues to completion, and a warm CompletionSummary panel displays the results with an undo option.

## Implementation Notes
- Create a `DemoRunner` utility that dispatches a sequence of timed events to the store
- The "Organize Downloads" flow should simulate: transcript → intent formation → plan draft → execution start → step progress → optional approval → completion
- Event timing should feel natural (200-500ms between minor updates, 1-2s between major phases)
- Manual mode: provide "Next step" and "Previous step" controls (useful for presentations and testing)
- Wire each component to its respective state hook:
  - `StatusCapsule` → `useConversationState()` + `useExecutionState()`
  - `VoiceBar` → `useConversationState()` + transcript state
  - `IntentBoard` → `useCurrentTask().intent`
  - `DraftPlan` → `useCurrentTask().plan`
  - `Timeline` → `useTimeline()`
  - `ApprovalCard` → `useApproval()`
  - `CompletionSummary` → `useCurrentTask().completion`

## Testing
- Navigate to `/demo` and let the auto-play run through the full flow
- Verify each component updates at the correct time in the sequence
- Verify StatusCapsule state label matches the current phase
- Verify IntentBoard fields populate incrementally
- Verify Timeline step dots change color as steps complete
- Use manual mode to step through and verify each transition point
- Verify the ApprovalCard blocks execution until Approve is clicked
