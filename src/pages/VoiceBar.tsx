import { useState, useEffect, useRef, useCallback } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Panel } from "@/components/ui/panel"
import {
  VoiceBar,
  getVoiceBarStateConfig,
} from "@/components/ui/voice-bar"
import { CONVERSATION_STATES, type ConversationState } from "@/state"

const MOCK_TRANSCRIPT_PHRASES = [
  "Computer,",
  "Computer, organize",
  "Computer, organize my",
  "Computer, organize my downloads",
  "Computer, organize my downloads folder",
  "Computer, organize my downloads folder by",
  "Computer, organize my downloads folder by file type.",
]

function useAmplitudeSimulation(active: boolean) {
  const [amplitude, setAmplitude] = useState(0)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    if (!active) {
      setAmplitude(0)
      return
    }

    let t = 0
    const tick = () => {
      t += 0.05
      const value =
        0.5 +
        0.3 * Math.sin(t * 2.1) +
        0.2 * Math.sin(t * 5.7)
      setAmplitude(Math.max(0, Math.min(1, value)))
      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(frameRef.current)
  }, [active])

  return amplitude
}

export default function VoiceBarPage() {
  const [activeState, setActiveState] = useState<ConversationState>("idle")
  const [manualAmplitude, setManualAmplitude] = useState<number | null>(null)
  const [isMuted, setIsMuted] = useState(false)

  // Transcript simulation
  const [transcriptIndex, setTranscriptIndex] = useState(-1)
  const [isTranscriptPlaying, setIsTranscriptPlaying] = useState(false)
  const transcriptTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const simulatedAmplitude = useAmplitudeSimulation(
    getVoiceBarStateConfig(activeState).barAnimating && manualAmplitude === null,
  )

  const currentAmplitude =
    manualAmplitude !== null ? manualAmplitude : simulatedAmplitude

  const handleMuteToggle = useCallback(() => {
    setIsMuted((prev) => !prev)
  }, [])

  const currentTranscript =
    transcriptIndex >= 0
      ? MOCK_TRANSCRIPT_PHRASES[transcriptIndex]
      : undefined

  const activeConfig = getVoiceBarStateConfig(activeState, isMuted)

  const startTranscript = useCallback(() => {
    setTranscriptIndex(-1)
    setIsTranscriptPlaying(true)
    setActiveState("listening")
    setIsMuted(false)

    let idx = 0
    const advance = () => {
      setTranscriptIndex(idx)
      idx++
      if (idx < MOCK_TRANSCRIPT_PHRASES.length) {
        transcriptTimerRef.current = setTimeout(advance, 400)
      } else {
        transcriptTimerRef.current = setTimeout(() => {
          setIsTranscriptPlaying(false)
          setActiveState("clarifying")
        }, 600)
      }
    }
    transcriptTimerRef.current = setTimeout(advance, 300)
  }, [])

  const resetTranscript = useCallback(() => {
    if (transcriptTimerRef.current) clearTimeout(transcriptTimerRef.current)
    setTranscriptIndex(-1)
    setIsTranscriptPlaying(false)
    setActiveState("idle")
  }, [])

  useEffect(() => {
    return () => {
      if (transcriptTimerRef.current) clearTimeout(transcriptTimerRef.current)
    }
  }, [])

  return (
    <div className="min-h-screen bg-page p-6 md:p-12">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-12">
          <Link to="/" className="type-caption text-link hover:underline">
            &larr; Back
          </Link>
          <h1 className="type-h1 text-ink mt-4">VoiceBar</h1>
          <p className="type-body text-body-text mt-2">
            Live voice interaction strip — displays transcript, voice activity
            indicator, canonical conversation state, and a separate mute
            override within the conversational corridor.
          </p>
          <p className="type-caption text-subtle mt-1">
            Source: <span className="type-code">TICKET-006</span>
          </p>
        </div>

        {/* Section 1: Interactive Demo */}
        <section className="mb-16">
          <h2 className="type-h2 text-ink mb-6">Interactive Demo</h2>
          <p className="type-body text-body-text mb-6">
            Select a conversation state and adjust amplitude. Mute is modeled
            separately from the conversation state machine.
          </p>

          <Panel surface="cool" padding="spacious">
            <div className="mb-6 flex justify-center">
              <VoiceBar
                conversationState={activeState}
                muted={isMuted}
                amplitude={currentAmplitude}
                transcript={currentTranscript}
                onMuteToggle={handleMuteToggle}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {CONVERSATION_STATES.map((state) => (
                <Button
                  key={state}
                  variant={activeState === state ? "default" : "outline"}
                  size="sm"
                  className={
                    activeState === state
                      ? "cursor-pointer bg-brand text-white hover:bg-brand-hover"
                      : "cursor-pointer"
                  }
                  onClick={() => {
                    setActiveState(state)
                    setIsMuted(false)
                  }}
                >
                  {state.replace(/_/g, " ")}
                </Button>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-3 border-t border-divider pt-4">
              <span className="type-label text-subtle">AMPLITUDE</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={manualAmplitude ?? currentAmplitude}
                onChange={(e) =>
                  setManualAmplitude(parseFloat(e.target.value))
                }
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                className="cursor-pointer"
                onClick={() => setManualAmplitude(null)}
              >
                Auto
              </Button>
            </div>

            <div className="mt-3 border-t border-divider pt-3">
              <p className="type-caption text-subtle">
                Conversation:{" "}
                <span className="type-code">{activeState}</span>
                {" "}&middot; Muted:{" "}
                <span className="type-code">{isMuted ? "true" : "false"}</span>
                {" "}&middot; Amplitude:{" "}
                <span className="type-code">
                  {Math.round(currentAmplitude * 100)}%
                </span>
                {" "}&middot; Bar opacity:{" "}
                <span className="type-code">{activeConfig.barOpacity}</span>
                {" "}&middot; Animating:{" "}
                <span className="type-code">
                  {activeConfig.barAnimating ? "yes" : "no"}
                </span>
              </p>
            </div>
          </Panel>
        </section>

        {/* Section 2: Canonical Conversation States */}
        <section className="mb-16">
          <h2 className="type-h2 text-ink mb-6">Canonical Conversation States</h2>
          <p className="type-body text-body-text mb-6">
            All 7 conversation states rendered with their current bar behavior,
            followed by a muted preview using the same component.
          </p>

          <div className="flex flex-col gap-4">
            {CONVERSATION_STATES.map((state) => {
              const stateConfig = getVoiceBarStateConfig(state)

              return (
                <Panel key={state} surface="cool" padding="compact">
                  <div className="mb-2 flex items-center gap-3">
                    <span className="type-label text-subtle">
                      {state.replace(/_/g, " ").toUpperCase()}
                    </span>
                    <span className="type-caption text-subtle">
                      bar: {stateConfig.indicatorColor} &middot; opacity:{" "}
                      {stateConfig.barOpacity} &middot;
                      {stateConfig.barAnimating ? " animating" : " static"}
                    </span>
                  </div>
                  <VoiceBar
                    conversationState={state}
                    amplitude={stateConfig.barAnimating ? 0.7 : 0}
                    transcript={
                      state === "idle"
                        ? undefined
                        : "Computer, organize my downloads folder by file type."
                    }
                  />
                </Panel>
              )
            })}

            <Panel surface="cool" padding="compact">
              <div className="mb-2 flex items-center gap-3">
                <span className="type-label text-subtle">MUTED OVERRIDE</span>
                <span className="type-caption text-subtle">
                  Uses the idle conversation state with mute enabled.
                </span>
              </div>
              <VoiceBar conversationState="idle" muted />
            </Panel>
          </div>
        </section>

        {/* Section 3: Transcript Demo */}
        <section className="mb-16">
          <h2 className="type-h2 text-ink mb-6">Transcript Demo</h2>
          <p className="type-body text-body-text mb-6">
            Simulates incremental transcript text appearing word-by-word as the
            user speaks.
          </p>

          <Panel surface="cool" padding="spacious">
            <div className="mb-4">
              <VoiceBar
                conversationState={activeState}
                muted={isMuted}
                amplitude={currentAmplitude}
                transcript={currentTranscript}
                onMuteToggle={handleMuteToggle}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={startTranscript}
                disabled={isTranscriptPlaying}
              >
                {isTranscriptPlaying ? "Speaking\u2026" : "Simulate Speech"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="cursor-pointer"
                onClick={resetTranscript}
              >
                Reset
              </Button>
            </div>
          </Panel>
        </section>

        {/* Section 4: Mute Toggle */}
        <section className="mb-16">
          <h2 className="type-h2 text-ink mb-6">Mute Toggle</h2>
          <p className="type-body text-body-text mb-6">
            The mute control overrides the visual state without changing the
            underlying conversation machine.
          </p>

          <Panel surface="cool" padding="spacious">
            <VoiceBar
              conversationState="listening"
              muted={isMuted}
              amplitude={isMuted ? 0 : 0.7}
              transcript={
                isMuted
                  ? undefined
                  : "Computer, organize my downloads folder by file type."
              }
              onMuteToggle={handleMuteToggle}
            />
            <p className="type-caption text-subtle mt-3">
              Muted:{" "}
              <span className="type-code">{isMuted ? "true" : "false"}</span>
            </p>
          </Panel>
        </section>

        {/* Footer */}
        <footer className="border-t border-hairline pt-6">
          <p className="type-caption text-subtle">
            Development-only component showcase &mdash;{" "}
            <span className="type-code">TICKET-006</span>
          </p>
        </footer>
      </div>
    </div>
  )
}
