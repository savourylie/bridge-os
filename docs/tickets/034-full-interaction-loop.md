# [TICKET-034] Full Interaction Loop Integration

## Status
`blocked`

## Dependencies
- Requires: #032, #033

## Description
Integrate the entire BridgeOS stack into a seamless end-to-end experience: voice input → conversation runtime → intent formation → plan generation → policy check → approval (when needed) → execution → completion. This ticket removes any remaining seams between the voice pipeline, orchestration, and UI, ensuring all four MVP task flows work through a single unified interface.

## Acceptance Criteria
- [ ] All four MVP task flows work end-to-end via voice:
  1. Folder organization in approved directories
  2. Project inspection
  3. Guarded developer commands
  4. Package installation with approval
- [ ] The StatusCapsule correctly reflects system state throughout every flow
- [ ] The VoiceBar shows live transcript and correct turn state for every flow
- [ ] IntentBoard updates incrementally from voice input for every flow
- [ ] DraftPlan appears with "Execution: Not started" before execution begins
- [ ] Timeline tracks execution with correct step states and impact summaries
- [ ] ApprovalCard appears at the correct point for medium and high-risk actions
- [ ] CompletionSummary appears with accurate results at the end of every flow
- [ ] The system handles transitions between flows gracefully (completing one task and starting another)
- [ ] Error states (failed steps, denied approvals) are handled cleanly with appropriate UI feedback
- [ ] The experience is consistent across all four task types

## Implementation Notes
- This is primarily a wiring and polish ticket — all individual components should already work
- Focus on the seams: voice → intent parsing, intent → plan generation, plan → execution, execution → completion
- Ensure the task selector routes voice intent to the correct task flow (folder org vs. project inspection vs. commands vs. package install)
- Handle ambiguous intents gracefully — if the system can't determine the task category, use IntentBoard's unresolved questions to clarify
- Test transitioning between task types without restarting the app
- Address any latency issues in the voice → UI update pipeline

## Testing
- Complete each of the four MVP task flows entirely by voice from start to finish
- After completing one flow, start a different flow — verify clean state transition
- Test an ambiguous request that could match multiple task categories
- Test a request that fails mid-execution — verify error handling and UI feedback
- Verify no state leaks between consecutive task flows
