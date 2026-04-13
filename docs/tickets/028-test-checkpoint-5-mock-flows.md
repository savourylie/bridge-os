# [TICKET-028] TEST: Checkpoint 5 — Mock Task Flows

## Status
`pending`

## Dependencies
- Requires: #026 ✅, #027 ✅

## Description
This checkpoint verifies that the two implemented task flows (folder organization and project inspection/guarded commands) work end-to-end through the full BridgeOS stack: conversation runtime → orchestration → policy engine → mock adapters → UI. Each flow must demonstrate the core interaction loop with correct state management, event propagation, and visual feedback.

This is a gate for Phase 7 (Voice Pipeline). Once task flows work with simulated input, the voice pipeline will replace text-based input with real speech-to-text.

## Acceptance Criteria
- [ ] Folder organization flow completes end-to-end: intent → plan → execute → completion
- [ ] Folder organization correctly groups files by type into subdirectories
- [ ] Folder organization respects exclusion constraints (e.g., "do not touch PDFs")
- [ ] Folder organization undo reverses all file operations
- [ ] Project inspection flow returns a structured directory summary
- [ ] Guarded command flow executes allowlisted commands as low-risk
- [ ] Non-allowlisted commands trigger high-risk approval flow
- [ ] All flows correctly propagate state through: conversation state, execution state, task state, step states
- [ ] Policy engine classifications are correct for all tested actions
- [ ] Timeline shows correct step progression with status dots and impact summaries
- [ ] CompletionSummary shows accurate outcome data for each flow
- [ ] Audit log contains a complete trace for each executed flow
- [ ] No state machine violations during any flow execution

## Implementation Notes
This is a manual test execution ticket — no code changes unless bugs are found during testing.

Common failure modes:
- Orchestration runtime generating invalid plans for edge-case intents
- Mock adapter state inconsistency after undo operations
- Policy engine misclassifying actions at the boundary between medium and high risk
- Event ordering issues causing UI to show stale state
- Audit log missing events due to async timing

## Testing
Execute each flow multiple times:
1. Folder organization with different constraints (by type, by date, with exclusions)
2. Folder organization followed by undo — verify clean reversal
3. Project inspection on different mock directories
4. Guarded commands: test 3+ allowlisted commands and 2+ non-allowlisted commands
5. Check audit logs for completeness after each flow
6. Check the state store for consistency after each flow completes
