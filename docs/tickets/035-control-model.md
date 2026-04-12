# [TICKET-035] Control Model

## Status
`blocked`

## Dependencies
- Requires: #034

## Description
Implement the full user control model for BridgeOS: pause, stop, cancel, redirect, and mid-task status queries. This is the final piece of the MVP interaction model — it ensures users remain in control at all times, can interrupt or redirect the system, and can query execution status naturally. The control model is what transforms BridgeOS from a capable system into a trustworthy one.

## Acceptance Criteria
- [ ] **Pause**: user can pause execution at the next safe point — execution halts, TaskPanel shows "Paused by user", resume is available
- [ ] **Stop**: user can stop/cancel the current task entirely — execution terminates, partial results shown
- [ ] **Cancel**: during planning/approval, user can cancel before execution begins
- [ ] **Interrupt AI speech**: user speaking during AI response immediately stops TTS
- [ ] **Redirect**: user can say "actually, do this instead" during planning — system captures new intent
- [ ] **Mid-task status query**: user can ask "what are you doing now?" during execution — AI answers briefly in voice while highlighting the current step in the TaskPanel
- [ ] Pause and stop controls are visually accessible during execution (per UX_DESIGN.md § Required Trust Signals)
- [ ] After interruption, IntentBoard and DraftPlan become editable/updatable again
- [ ] After stop/cancel, the system handles partial completion gracefully (shows what was done)
- [ ] Control commands work via both voice and UI buttons

## Implementation Notes
- Pause: the orchestration runtime should complete the current step, then hold before starting the next
- Stop: immediately signal the orchestration runtime to terminate — emit a partial completion event
- The "next safe point" for pause means: don't interrupt a file move mid-operation, wait until the current atomic operation completes
- Redirect requires: pause execution → clear or update intent → regenerate plan → optionally resume
- Mid-task status query routing: the conversation runtime detects a question during execution, generates a brief voice response about the current step, without pausing execution
- Control buttons (pause/stop) should be persistently visible in the TaskPanel during execution state
- Per UX_DESIGN.md § Interaction Controls: pause, stop, hide panel, ask status, request technical details

## Testing
- Start a folder organization flow
- Mid-execution, click "Pause" — verify execution stops at the next step boundary, UI shows "Paused"
- Click "Resume" — verify execution continues from where it paused
- Start another flow, click "Stop" mid-execution — verify task is cancelled with partial results shown
- During planning, say "actually, let me change that" — verify intent capture restarts
- During execution, ask "what are you doing now?" — verify brief voice answer + current step highlighted
- Verify pause/stop buttons are visible throughout execution
- Test all controls via both voice commands and UI buttons
