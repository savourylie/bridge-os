# [TICKET-032] TEST: Checkpoint 6 — Voice Pipeline

## Status
`blocked`

## Dependencies
- Requires: #031

## Description
This checkpoint verifies that the voice pipeline (STT + TTS + turn-taking) works as an integrated system, producing the natural conversational experience that defines BridgeOS. The system must feel responsive, must not act prematurely, and must support the full range of conversational behaviors (interruption, self-correction, mid-task queries).

This is a gate for Phase 8 (Integration & MVP QA). The final integration phase depends on a working voice pipeline to deliver the complete BridgeOS experience.

## Acceptance Criteria
- [ ] Speaking a request produces live transcript text in the VoiceBar with perceptibly low latency
- [ ] The system waits for the user to finish speaking before acting (turn-holding works)
- [ ] Self-correction mid-sentence updates IntentBoard without triggering execution
- [ ] Short pauses do not prematurely end the user's turn
- [ ] Long pauses (> 2s) signal turn completion
- [ ] The system responds via voice with a calm, brief, natural tone
- [ ] Barge-in during AI speech immediately stops TTS
- [ ] StatusCapsule and VoiceBar correctly reflect turn state at all times
- [ ] Mid-task status query gets a brief voice answer while execution continues
- [ ] The voice interaction feels conversational, not command-and-response
- [ ] No dead air: the system always communicates what it's doing (via voice or visual state)

## Implementation Notes
This is a manual test execution ticket — no code changes unless bugs are found during testing.

Common failure modes:
- STT latency making the interface feel sluggish
- Turn-holding thresholds too aggressive (acts too early) or too conservative (waits too long)
- Barge-in detection lag — TTS continues for noticeable time after user starts speaking
- TTS voice quality sounding robotic or unnatural
- Audio feedback loops (TTS output being picked up by STT)

Test with different speaking styles:
- Fast continuous speech
- Slow speech with natural pauses
- Speech with self-corrections
- Questions during execution
- Loud interruptions
- Quiet trailing speech

## Testing
Run through the "Organize Downloads" flow entirely by voice:
1. Say "Computer" (or trigger wake) — verify system enters listening
2. Speak the request with a mid-sentence correction — verify handling
3. Let the system respond — verify voice quality and content
4. During execution, ask "what are you doing?" — verify brief answer
5. Interrupt the AI mid-response — verify immediate stop
6. Complete the flow and verify CompletionSummary
7. Assess: does the interaction feel natural and trustworthy?
