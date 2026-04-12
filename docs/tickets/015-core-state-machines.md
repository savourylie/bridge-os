# [TICKET-015] Core State Machines

## Status
`blocked`

## Dependencies
- Requires: #014

## Description
Implement the TypeScript state machine definitions for all BridgeOS state models: ConversationState, ExecutionState, TaskState, StepState, and ApprovalFlow. These state machines encode the valid transitions defined in UX_DESIGN.md, ensuring that the UI can only represent valid system states. This is the logic backbone that prevents invalid state combinations (e.g., executing while also not started).

## Acceptance Criteria
- [ ] `ConversationState` machine implements all 7 states: idle, listening, holding_for_more, clarifying, intent_locked, speaking, interrupted
- [ ] `ExecutionState` machine implements all 7 states: not_started, drafting_plan, waiting_confirmation, executing, paused, completed, failed
- [ ] `TaskState` machine implements the full task lifecycle: idle → listening → understanding → planning → executing → completed (and all branching paths including waiting_approval, paused, cancelled, reverted, failed)
- [ ] `StepState` machine implements: pending, running, waiting_approval, completed, failed, skipped, blocked, reverted
- [ ] `ApprovalFlow` machine implements: not_needed, requested, editing, granted, authorizing, denied, done
- [ ] All machines enforce valid transitions only — invalid transitions throw or are no-ops
- [ ] Conversation can continue independently of execution state (parallel state tracks)
- [ ] State machines are unit-tested with at least 3 test cases each covering valid transitions, invalid transitions, and edge cases

## Implementation Notes
- Implement as pure TypeScript state machine functions or use a lightweight library like XState or Zustand with state machine patterns
- Follow the exact state diagrams from UX_DESIGN.md (Task State Machine, Step State Machine, Approval Flow)
- Key invariant: ConversationState and ExecutionState are parallel — conversation must not block execution and vice versa (UX_DESIGN.md: "Conversation can continue while execution is paused, planning, or running")
- Export typed state machine definitions so components can use discriminated unions
- Place in `apps/desktop/state/` or equivalent state management directory
- Each machine should expose: `currentState`, `transition(event)`, `canTransition(event)`

## Testing
- Run unit tests for all 5 state machines
- Verify valid transitions succeed and return correct next state
- Verify invalid transitions are rejected
- Verify ConversationState and ExecutionState can be in any combination of states simultaneously
- Test the full task lifecycle: idle → listening → understanding → planning → waiting_approval → executing → completed
