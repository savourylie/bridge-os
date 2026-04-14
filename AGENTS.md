# AGENTS.md

## Voice Testing on macOS

BridgeOS uses browser speech recognition and speech synthesis inside Tauri. On macOS, microphone and speech-recognition permissions must be tested with a real `.app` bundle, not only with `npm run tauri dev`.

### Important rule

- Do not rely on `npm run tauri dev` for first-time microphone permission testing.
- `tauri dev` launches the raw debug executable, which may not register as a normal macOS app for Privacy settings.
- For permission prompts, build and open the bundled debug app instead.

### Recommended workflow

1. Build a debug app bundle:

```bash
npm run tauri build -- --debug --bundles app
```

2. Open the bundled app:

```bash
open target/debug/bundle/macos/BridgeOS.app
```

3. If you need to force macOS to prompt again, reset permissions for the current bundle id:

```bash
tccutil reset Microphone com.bridgeos.desktop
tccutil reset SpeechRecognition com.bridgeos.desktop
```

4. Test voice input on the `/demo` route.

### Required macOS bundle metadata

The app bundle must include both of these keys in `src-tauri/Info.plist`:

- `NSMicrophoneUsageDescription`
- `NSSpeechRecognitionUsageDescription`

If these are missing, macOS may deny access or fail to present the correct prompt.

### Quick diagnostics

- If the app says `Speech recognition is unavailable in this WebView. Listening stopped.`, the Web Speech API is not available in the current runtime.
- If the app says `Microphone permission was denied. Listening stopped.`, the Web Speech API exists, but macOS denied microphone access.
- If `BridgeOS` does not appear in `System Settings > Privacy & Security > Microphone`, you are probably not testing through the bundled `.app`.

### Current app identity

- Bundle id: `com.bridgeos.desktop`
- Voice hooks are currently mounted on `/demo`

