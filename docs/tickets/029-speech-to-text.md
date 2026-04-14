# [TICKET-029] Speech-to-Text Integration

## Status
`pending`

## Dependencies
- Requires: #028 ✅

## Description
Integrate a speech-to-text (STT) service into BridgeOS to replace mock transcript input with real voice capture. This connects the microphone audio stream to a transcription engine that produces live, incremental transcript text fed into the conversation runtime. The STT integration is what makes BridgeOS voice-native rather than text-native.

## Acceptance Criteria
- [ ] Microphone audio is captured when the system enters `listening` state
- [ ] Audio is streamed to an STT service/engine for real-time transcription
- [ ] Transcript text appears incrementally in the VoiceBar (word-by-word or phrase-by-phrase)
- [ ] Transcription latency is perceptibly low — text appears within ~200-500ms of speech
- [ ] The system correctly handles silence (no phantom transcriptions during pauses)
- [ ] Microphone capture stops when the system leaves `listening` or enters `muted` state
- [ ] The STT adapter implements the `VoiceAdapter` trait interface from `crates/adapters`
- [ ] Audio permission is requested gracefully on first use

## Implementation Notes
- STT service options (choose one based on quality and latency):
  - **Whisper** (local, via whisper.cpp or whisper-rs) — good for privacy, no network dependency
  - **Deepgram** or **AssemblyAI** — cloud-based, lower latency streaming, requires API key
  - **Web Speech API** — browser-native, zero setup, but limited to WebView
- For MVP, prioritize getting any STT working end-to-end. Quality and provider can be refined later.
- Implement as a real `VoiceAdapter` in `crates/adapters` (or a new `crates/stt_adapter` if provider-specific)
- Audio capture on macOS uses CoreAudio; on Linux will use PipeWire — abstract behind the adapter
- For macOS development, CoreAudio or the WebView's media API is sufficient
- Stream transcript text into the conversation runtime's transcript lifecycle
- Consider a VAD (Voice Activity Detection) pre-filter to avoid sending silence to the STT engine

## Testing
- Start the app and trigger `start_listening`
- Speak into the microphone — verify transcript text appears in the VoiceBar in real-time
- Verify transcription is reasonably accurate for clear English speech
- Test with pauses — verify no phantom text during silence
- Mute the microphone — verify transcription stops
- Verify the transcript feeds into the IntentBoard (intent fields begin to populate)
