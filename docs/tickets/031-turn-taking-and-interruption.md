# [TICKET-031] Turn-Taking, Barge-In & Interruption

## Status
`pending`

## Dependencies
- Requires: #029 ✅, #030 ✅

## Description
Implement the full turn-taking and interruption system that makes BridgeOS feel like a natural conversational partner rather than a command-and-response interface. This ticket brings together STT and TTS with the conversation runtime's turn-holding logic, creating the full-duplex voice interaction described in the PRD. Users must be able to self-correct, trail off, interrupt the AI, and continue talking while the system works.

## Acceptance Criteria
- [ ] Turn-holding: the system detects when the user is still speaking and does not act prematurely
- [ ] Self-repair detection: phrases like "wait", "actually", "no", "I mean" keep the user's turn active and update the IntentBoard
- [ ] Trailing conjunctions: "and", "then", "also" signal the user has more to say
- [ ] Short pauses (< 1.5s) do not end the user's turn; long pauses (> 2s) do
- [ ] Barge-in: user speaking during AI speech immediately stops TTS and returns turn to user
- [ ] The system clearly indicates turn state in the VoiceBar: listening, holding, AI speaking, interrupted
- [ ] Mid-task status query: user can ask "What are you doing now?" during execution — AI answers briefly in voice while execution continues
- [ ] Redirection: user can say "Actually, do this instead" and the system pauses to capture new intent
- [ ] Voice interaction continues independently of execution state (conversation does not block execution)

## Implementation Notes
- Turn-holding heuristics from the conversation runtime (#021) are now driven by real STT input
- Silence detection uses VAD or STT timestamps to measure pause duration
- Self-repair detection: maintain a list of repair markers and check against incoming transcript words
- The threshold for "intent stable enough to plan" is intentionally conservative for MVP — better to wait too long than to act too early (PRD § 18.1: premature execution risk)
- Barge-in implementation: STT input during `speaking` state triggers immediate TTS stop + state transition to `interrupted`
- Mid-task queries: detect question patterns in transcript during execution state, route to AI for a brief spoken answer without interrupting execution
- Redirection: "actually" or "stop" + new intent triggers execution pause + intent update
- This is the most complex voice interaction ticket — focus on getting the common cases right, edge cases can be refined

## Testing
- Speak a request with a mid-sentence correction ("organize my downloads... wait, not downloads, my desktop") — verify IntentBoard updates and execution doesn't start
- Pause briefly (1s) mid-sentence — verify the system waits for more
- Pause for 3s — verify the system treats the turn as complete
- Interrupt AI speech — verify TTS stops immediately
- Ask "what are you doing?" during execution — verify brief voice answer while execution continues
- Say "actually, do this instead" during planning — verify system pauses and captures new intent
- Verify conversation and execution run independently (speak while the timeline is executing)
