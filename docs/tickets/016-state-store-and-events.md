# [TICKET-016] State Store & Event System

## Status
`blocked`

## Dependencies
- Requires: #015

## Description
Build the centralized state store and event system that powers BridgeOS's UI. The store manages all application state (conversation, execution, tasks, steps, approvals) and exposes it to React components via hooks. The event system follows the event-driven architecture recommended in TECH_STACK.md, where state changes are triggered by events (transcript_updated, intent_updated, plan_drafted, approval_requested, step_completed, etc.) rather than direct state mutations.

## Acceptance Criteria
- [ ] Centralized state store holds: conversation state, execution state, current task, task steps, approval state, transcript, intent fields, draft plan
- [ ] State changes are triggered by typed events (e.g., `{ type: "TRANSCRIPT_UPDATED", payload: { text: string } }`)
- [ ] React hooks provide component access to state slices: `useConversationState()`, `useExecutionState()`, `useCurrentTask()`, `useTimeline()`, `useApproval()`
- [ ] State transitions are validated through the state machines from #015
- [ ] Event history is maintained for debugging and future audit trail support
- [ ] State updates trigger efficient React re-renders (only affected components re-render)
- [ ] Mock event dispatcher can fire sequences of events for demo/testing purposes

## Implementation Notes
- Use Zustand for the state store — it's lightweight, TypeScript-friendly, and works well with React
- Events flow through a central dispatcher that validates transitions via state machines before updating the store
- Event types should be defined as a discriminated union for type safety
- Event history can be a simple array with a configurable max length
- The mock event dispatcher should support timed sequences (e.g., "fire event A, wait 500ms, fire event B") for demo walkthroughs
- Place store in `apps/desktop/state/store.ts` and hooks in `apps/desktop/state/hooks.ts`

## Testing
- Unit test the event dispatcher with typed events
- Verify state machine validation prevents invalid transitions via events
- Verify React hooks return correct state slices
- Fire a sequence of events simulating a full task lifecycle and verify state at each point
- Verify event history records all dispatched events
