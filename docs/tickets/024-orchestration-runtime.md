# [TICKET-024] Orchestration Runtime

## Status
`blocked`

## Dependencies
- Requires: #023

## Description
Implement the orchestration runtime — the operational core of BridgeOS that handles intent parsing, intent stabilization, plan generation, task state management, tool routing, and execution coordination. This module takes a stabilized user intent, generates an action plan, validates each step against the policy engine, executes steps sequentially through adapters, and emits events for every meaningful state change.

## Acceptance Criteria
- [ ] Intent parser extracts structured intent (goal, scope, constraints, exclusions) from transcript text
- [ ] Intent stabilization logic detects when intent is "stable enough to plan" (no recent changes for a configurable threshold)
- [ ] Plan generator produces a sequence of steps from a stabilized intent
- [ ] Each step is validated against the policy engine before execution
- [ ] Steps requiring approval emit `approval_requested` and pause until approval is granted or denied
- [ ] Task state machine transitions are driven by execution events
- [ ] Step execution is delegated to the appropriate adapter (via trait dispatch)
- [ ] Execution emits `step_updated` and `execution_state_changed` events for every state change
- [ ] Task completion generates a `task_completed` event with outcome summary (changes made, resources affected)
- [ ] Audit events are logged for every plan generation, step execution, and state transition

## Implementation Notes
- Implement in `crates/orchestration_runtime`
- Intent parsing can start simple: extract key phrases for goal, file patterns for scope, negation phrases for constraints
- Intent stabilization: use a debounce timer — if no intent changes for N seconds (configurable, default 2s), consider intent stable. This is an open question from the PRD; note it as an assumption.
- Plan generation for MVP is rule-based per task category:
  - Folder organization: scan → filter → create dirs → move files → summarize
  - Project inspection: scan → analyze → summarize
  - Guarded commands: validate → execute → report
  - Package installation: check → plan → approve → install → verify
- Tool routing: match step types to adapter trait methods (e.g., "move file" → `FileSystemAdapter::move_file()`)
- The orchestration runtime depends on `policy_engine`, `task_models`, `adapters`, and `audit_log`

## Testing
- Unit test intent parsing with sample transcripts
- Unit test plan generation for each of the 4 MVP task categories
- Integration test: feed a mock intent → generate plan → execute with mock adapters → verify events emitted
- Test approval blocking: execution pauses at an approval step, resumes after approval
- Verify audit log contains complete execution trace
