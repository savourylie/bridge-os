# CLAUDE.md

## macOS Microphone and Speech Recognition Testing

When testing BridgeOS voice input on macOS, use the bundled app for permission flows.

### Do this

```bash
npm run tauri build -- --debug --bundles app
open target/debug/bundle/macos/BridgeOS.app
```

If you need a clean permission prompt:

```bash
tccutil reset Microphone com.bridgeos.desktop
tccutil reset SpeechRecognition com.bridgeos.desktop
```

### Do not assume this works

```bash
npm run tauri dev
```

`tauri dev` is fine for normal iteration, but it may launch a raw executable that macOS does not treat like a registered app bundle for Privacy settings.

### Required files / keys

- `src-tauri/Info.plist`
- `NSMicrophoneUsageDescription`
- `NSSpeechRecognitionUsageDescription`

### Voice test entrypoint

- Use `/demo` for end-to-end microphone testing.

### Failure interpretation

- `Speech recognition is unavailable in this WebView. Listening stopped.`:
  Web Speech API missing in the runtime.
- `Microphone permission was denied. Listening stopped.`:
  Web Speech API is present, but macOS permission is denied.
- No `BridgeOS` entry in macOS Microphone settings:
  You likely launched the wrong binary instead of the bundled `.app`.

