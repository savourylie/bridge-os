# [TICKET-030] Text-to-Speech & Spoken Response

## Status
`blocked`

## Dependencies
- Requires: #028

## Description
Integrate text-to-speech (TTS) into BridgeOS so the system can speak responses naturally. The AI persona should sound calm, competent, brief, and slightly formal — like a reliable ship computer, not a novelty assistant. Spoken responses must be interruptible: when the user starts speaking, TTS playback should stop immediately.

## Acceptance Criteria
- [ ] The system generates spoken audio from text responses
- [ ] Voice persona sounds calm, competent, and slightly formal (not overly friendly or theatrical)
- [ ] Responses are short and natural (per UX_DESIGN.md § Writing Style Rules)
- [ ] TTS output plays through the system audio device
- [ ] TTS is interruptible: if the user starts speaking (barge-in), TTS stops immediately
- [ ] Conversation state transitions to `speaking` during TTS playback and to `interrupted` if barge-in occurs
- [ ] TTS does not block execution — the system can continue processing while speaking
- [ ] Response scheduling: TTS waits for appropriate moments (not mid-user-utterance)

## Implementation Notes
- TTS service options (choose one):
  - **System TTS** (macOS: `say` command or NSSpeechSynthesizer; Linux: espeak/piper) — zero latency, limited voice quality
  - **ElevenLabs** or **OpenAI TTS** — high-quality voices, requires API key and network
  - **Piper** (local neural TTS) — good quality, runs locally, cross-platform
- For MVP, start with the simplest option that sounds acceptable. Voice quality can be upgraded later.
- Implement response scheduling in the conversation runtime: only speak when the user is not actively talking
- Barge-in detection: monitor the STT input stream — if new transcript appears during TTS playback, immediately stop TTS and transition to `interrupted`
- Keep responses short: per UX_DESIGN.md, voice responses should be 1-2 sentences max
- Example responses from UX spec: "I think I understand...", "I have a plan ready...", "This next step changes your file structure..."

## Testing
- Trigger a system response and verify audio plays through speakers
- Verify the voice tone is calm and formal (subjective but important)
- Start speaking during TTS playback — verify TTS stops immediately (barge-in)
- Verify conversation state shows `speaking` during TTS and `interrupted` after barge-in
- Verify TTS does not block other system operations (execution continues during speech)
