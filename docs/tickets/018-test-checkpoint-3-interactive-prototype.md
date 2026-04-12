# [TICKET-018] TEST: Checkpoint 3 — Interactive Prototype

## Status
`pending`

## Dependencies
- Requires: #017 ✅

## Description
This checkpoint verifies that the BridgeOS interactive prototype functions as a cohesive experience. The full UI stack (StatusCapsule through CompletionSummary) must be wired to the state store and driven by the event system. The "Organize Downloads" demo flow must run end-to-end, demonstrating the core BridgeOS interaction loop.

This is a major gate — it validates the entire product interaction model before Rust runtime work begins in Phase 5. If the interaction loop doesn't feel right as a prototype, the runtime won't fix it. Product and UX issues must be addressed here.

## Acceptance Criteria
- [ ] The demo auto-play runs the full "Organize Downloads" flow without errors or visual glitches
- [ ] StatusCapsule transitions through all relevant states during the flow: idle → listening → understanding → planning → executing → completed
- [ ] VoiceBar shows simulated transcript text appearing incrementally
- [ ] IntentBoard fields populate in sequence: goal first, then scope, then constraints
- [ ] DraftPlan shows "Execution: Not started" until execution begins
- [ ] Timeline steps execute sequentially with correct status dot colors and connector transitions
- [ ] ApprovalCard appears at the correct point and blocks execution until user interacts
- [ ] Clicking "Approve" resumes execution; clicking "Deny" cancels the task
- [ ] CompletionSummary shows correct outcome data with warm surface
- [ ] Manual step-through mode works for each transition
- [ ] State machines prevent invalid transitions (e.g., cannot go from "completed" directly to "listening")
- [ ] All state transitions are recorded in the event history
- [ ] The experience feels smooth — no jarring layout shifts, no delayed updates, no animation conflicts

## Implementation Notes
This is a manual test execution ticket — no code changes unless bugs are found during testing.

Common failure modes:
- Race conditions between event dispatch and React re-renders
- Layout shifts when components appear/disappear (especially TaskPanel slide-in)
- Animation conflicts between Framer Motion components
- State machine deadlocks when approval and conversation events overlap
- Demo timing feeling too fast or too slow

Focus areas:
- Test both auto-play and manual modes
- Test the Approve and Deny paths through the approval flow
- Test interrupting the auto-play mid-flow
- Verify event history in browser console or dev tools

## Testing
Run the demo at `/demo`. Watch the full auto-play. Then use manual mode to step through each transition. Test the Deny path through approval. Check the browser console for state machine errors. Verify the event history contains all expected events. Assess the overall feel: does the interaction loop feel natural and trustworthy?
