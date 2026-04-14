import { useEffect, useRef } from "react"

import { tauriBridge } from "@/bridge/tauri"
import { bridgeStore, type BridgeStoreApi } from "@/state"
import type {
  ConversationSlice,
  ConversationState,
  TranscriptChunkInput,
} from "@/state/ipc-types"

const ACTIVE_LISTENING_STATES = new Set<ConversationState>([
  "listening",
  "holding_for_more",
  "clarifying",
])

type StopReason = "inactive" | "muted" | "cleanup" | "fatal" | null

interface SpeechRecognitionAlternativeLike {
  transcript: string
}

interface SpeechRecognitionResultLike {
  isFinal: boolean
  0: SpeechRecognitionAlternativeLike
}

interface SpeechRecognitionResultListLike {
  length: number
  [index: number]: SpeechRecognitionResultLike
}

interface SpeechRecognitionEventLike {
  resultIndex: number
  results: SpeechRecognitionResultListLike
}

interface SpeechRecognitionErrorEventLike {
  error: string
  message?: string
}

interface BrowserSpeechRecognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  onend: (() => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  abort: () => void
  start: () => void
  stop: () => void
}

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition

interface SpeechRecognitionGlobal {
  SpeechRecognition?: SpeechRecognitionConstructor
  webkitSpeechRecognition?: SpeechRecognitionConstructor
}

export interface UseTauriSpeechRecognitionOptions {
  enabled: boolean
  conversation: ConversationSlice
  onStatusChange?: (message: string) => void
  store?: BridgeStoreApi
}

export function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  const speechRecognitionGlobal = globalThis as typeof globalThis & SpeechRecognitionGlobal

  return (
    speechRecognitionGlobal.SpeechRecognition ??
    speechRecognitionGlobal.webkitSpeechRecognition ??
    null
  )
}

function isFatalSpeechRecognitionError(error: string) {
  return (
    error === "audio-capture" ||
    error === "network" ||
    error === "not-allowed" ||
    error === "service-not-allowed"
  )
}

function getFatalStatusMessage(error: string) {
  switch (error) {
    case "audio-capture":
      return "BridgeOS could not access microphone audio. Listening stopped."
    case "network":
      return "Speech recognition lost its network connection. Listening stopped."
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone permission was denied. Listening stopped."
    default:
      return "Speech recognition failed. Listening stopped."
  }
}

export function useTauriSpeechRecognition({
  enabled,
  conversation,
  onStatusChange,
  store = bridgeStore,
}: UseTauriSpeechRecognitionOptions) {
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null)
  const activeRef = useRef(false)
  const stopReasonRef = useRef<StopReason>(null)
  const shouldRestartRef = useRef(false)
  const fatalRef = useRef(false)
  const lastSubmittedKeyRef = useRef("")
  const storeRef = useRef(store)
  const onStatusChangeRef = useRef(onStatusChange)
  const submissionQueueRef = useRef<Promise<unknown>>(Promise.resolve())

  storeRef.current = store
  onStatusChangeRef.current = onStatusChange

  function reportStatus(message: string) {
    onStatusChangeRef.current?.(message)
  }

  function enqueueTranscriptChunk(chunk: TranscriptChunkInput) {
    submissionQueueRef.current = submissionQueueRef.current
      .then(() => tauriBridge.submitTranscriptChunk(chunk, storeRef.current))
      .catch(() => undefined)
  }

  function stopBackendListening() {
    submissionQueueRef.current = submissionQueueRef.current
      .then(() => tauriBridge.stopListening(storeRef.current))
      .catch(() => undefined)
  }

  function stopRecognition(reason: Exclude<StopReason, null>) {
    const recognition = recognitionRef.current
    if (recognition === null || !activeRef.current) {
      stopReasonRef.current = reason
      return
    }

    stopReasonRef.current = reason
    activeRef.current = false

    try {
      recognition.abort()
    } catch {
      recognition.stop()
    }
  }

  function startRecognition() {
    const recognition = recognitionRef.current
    if (recognition === null || activeRef.current || fatalRef.current) {
      return
    }

    stopReasonRef.current = null
    lastSubmittedKeyRef.current = ""

    try {
      recognition.start()
      activeRef.current = true
    } catch (error) {
      if (error instanceof Error && error.name === "InvalidStateError") {
        return
      }

      fatalRef.current = true
      shouldRestartRef.current = false
      reportStatus("BridgeOS could not start speech recognition. Listening stopped.")
      stopBackendListening()
    }
  }

  useEffect(() => {
    if (!enabled) {
      stopRecognition("cleanup")
      return
    }

    const SpeechRecognition = getSpeechRecognitionConstructor()
    if (SpeechRecognition === null) {
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onresult = (event) => {
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]
        const text = result?.[0]?.transcript.trim()

        if (!text) {
          continue
        }

        const submissionKey = `${result.isFinal ? "final" : "live"}:${text}`
        if (submissionKey === lastSubmittedKeyRef.current) {
          continue
        }

        lastSubmittedKeyRef.current = submissionKey
        enqueueTranscriptChunk({
          text,
          isFinal: result.isFinal,
        })
      }
    }

    recognition.onerror = (event) => {
      if (event.error === "aborted") {
        return
      }

      if (!isFatalSpeechRecognitionError(event.error)) {
        return
      }

      fatalRef.current = true
      shouldRestartRef.current = false
      reportStatus(getFatalStatusMessage(event.error))
      stopRecognition("fatal")
      stopBackendListening()
    }

    recognition.onend = () => {
      activeRef.current = false

      if (stopReasonRef.current !== null) {
        stopReasonRef.current = null
        return
      }

      if (shouldRestartRef.current && !fatalRef.current) {
        startRecognition()
      }
    }

    recognitionRef.current = recognition

    return () => {
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
      if (activeRef.current) {
        stopReasonRef.current = "cleanup"
        activeRef.current = false
        try {
          recognition.abort()
        } catch {
          recognition.stop()
        }
      }
      recognitionRef.current = null
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      return
    }

    const shouldListen =
      ACTIVE_LISTENING_STATES.has(conversation.state) && !conversation.muted
    shouldRestartRef.current = shouldListen

    if (getSpeechRecognitionConstructor() === null) {
      if (shouldListen && !fatalRef.current) {
        fatalRef.current = true
        reportStatus("Speech recognition is unavailable in this WebView. Listening stopped.")
        stopBackendListening()
      }
      return
    }

    if (shouldListen) {
      startRecognition()
      return
    }

    if (conversation.state === "idle") {
      fatalRef.current = false
    }

    if (conversation.muted) {
      stopRecognition("muted")
      return
    }

    stopRecognition("inactive")
  }, [conversation.muted, conversation.state, enabled])
}
