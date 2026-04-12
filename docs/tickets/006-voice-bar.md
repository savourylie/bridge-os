# [TICKET-006] VoiceBar Component

## Status
`done`

## Dependencies
- Requires: #004 ✅

## Description
Build the VoiceBar — the dedicated live voice interaction strip for BridgeOS. This component handles the conversational presence layer: displaying the live transcript, showing who holds the conversational turn, indicating voice activity, and providing mute/hold/interrupt controls. The VoiceBar must make the system feel alive and responsive while clearly distinguishing between "heard something," "user still talking," "ready to respond," and "speaking now."

## Acceptance Criteria
- [x] VoiceBar renders within the conversation corridor (480px max-width)
- [x] Displays a live transcript area using Body Large typography (Inter 16px weight 400, line-height 1.60)
- [x] Voice activity indicator renders as a 2px horizontal bar, full corridor width, in amber `#cc7a00`
- [x] Voice activity bar pulses width 60-100% based on a mock audio amplitude signal, with 150ms transitions
- [x] Bar dims to 40% opacity when no audio is detected
- [x] Turn state is visually distinguishable: idle, listening, user_holding_turn, ai_speaking, awaiting_clarification, barge_in_detected, muted
- [x] Mute/unmute control is present and functional (toggles muted state)
- [x] Background uses warm surface `#f9f3ea` (conversational register)
- [x] Warm ambient glow (radial gradient `rgba(201, 169, 110, 0.04)`) renders behind the voice activity area

## Design Reference
- **Voice Indicator**: DESIGN.md § 4 (Distinctive Components > Voice Activity Indicator)
- **Surface**: DESIGN.md § 2 (Surface & Background > Warm Panel `#f9f3ea`)
- **Glow**: DESIGN.md § 6 (Decorative Depth > Warm ambient glow)
- **Typography**: DESIGN.md § 3 (Body Large — 16px/400/1.60 for transcript)

## Visual Reference
Within a warm-surfaced strip at the top of the corridor, a faint amber bar pulses gently across the full width when "listening." Below it, transcript text appears in a clean, readable font. The overall feeling is calm presence — the bar breathes with the user's voice without being distracting. When the AI is speaking, the indicator shifts to a steady state. A small mute icon sits at the edge. Demo page cycles through all 7 turn states with mock transcript text.

## Implementation Notes
- Use Framer Motion for the voice activity bar width animation
- Mock the audio amplitude with a simple oscillating value for demo purposes
- Turn state drives the visual presentation — create a clear state-to-visual mapping
- Transcript text should support incremental updates (text appearing word-by-word or phrase-by-phrase)
- The warm ambient glow is subtle — use a `radial-gradient` positioned behind the bar, 200px radius
- Create at route `/components/voice-bar` for isolated development
- Controls (mute/interrupt) should use the Ghost button style (transparent, `#7a8494` text)

## Testing
- Navigate to `/components/voice-bar`
- Verify the voice activity bar pulses with mock amplitude data
- Verify the bar dims to 40% opacity when "idle"
- Cycle through all 7 turn states and verify visual changes
- Toggle mute and verify state change
- Verify transcript text renders in Body Large typography
- Verify warm surface background and ambient glow
