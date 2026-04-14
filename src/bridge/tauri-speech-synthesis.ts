import { useEffect, useRef } from "react"

import { tauriBridge } from "@/bridge/tauri"
import {
  clearActiveSpeechSession,
  setActiveSpeechSession,
  type SpeechCancelReason,
} from "@/bridge/tauri-speech-controller"
import { bridgeStore, type BridgeStoreApi } from "@/state"
import type {
  ApprovalSnapshot,
  ConversationSlice,
  CurrentTaskSnapshot,
  ExecutionSlice,
} from "@/state"

interface SpeechSynthesisVoiceLike {
  default?: boolean
  lang: string
  localService?: boolean
  name: string
}

interface SpeechSynthesisUtteranceLike {
  onend: (() => void) | null
  onerror: (() => void) | null
  onstart: (() => void) | null
  pitch: number
  rate: number
  text: string
  voice: SpeechSynthesisVoiceLike | null
  volume: number
}

interface SpeechSynthesisLike {
  cancel: () => void
  getVoices: () => SpeechSynthesisVoiceLike[]
  speak: (utterance: SpeechSynthesisUtteranceLike) => void
}

interface SpeechSynthesisConstructor {
  new (text: string): SpeechSynthesisUtteranceLike
}

interface SpeechSynthesisGlobal {
  SpeechSynthesisUtterance?: SpeechSynthesisConstructor
  speechSynthesis?: SpeechSynthesisLike
}

type SpeechMilestone =
  | "clarification"
  | "execution_recap"
  | "approval"
  | "completion"
  | "failure"

interface SpeechRequest {
  key: string
  milestone: SpeechMilestone
  priority: number
  taskId: string
  text: string
}

export interface UseTauriSpeechSynthesisOptions {
  approval: ApprovalSnapshot
  conversation: ConversationSlice
  currentTask: CurrentTaskSnapshot
  enabled: boolean
  execution: ExecutionSlice
  onStatusChange?: (message: string) => void
  store?: BridgeStoreApi
}

const NOVELTY_VOICE_PATTERN = /novelty|whisper|pipe|boing|trinoids|bad news|good news/i

export function formatSpeechText(text: string) {
  const normalized = text
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^BridgeOS will\b/i, "I will")

  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .slice(0, 2)

  const spokenText = (sentences.length > 0 ? sentences.join(" ") : normalized).trim()
  if (!spokenText) {
    return ""
  }

  return /[.!?]$/.test(spokenText) ? spokenText : `${spokenText}.`
}

export function pickPreferredVoice(voices: SpeechSynthesisVoiceLike[]) {
  const eligibleVoices = voices.filter((voice) => /^en-(US|GB)\b/i.test(voice.lang))
  const filteredVoices = eligibleVoices.filter(
    (voice) => !NOVELTY_VOICE_PATTERN.test(voice.name),
  )
  const candidates = filteredVoices.length > 0 ? filteredVoices : eligibleVoices

  const preferredNames = [
    /^samantha$/i,
    /^daniel$/i,
    /^alex$/i,
    /^karen$/i,
    /^moira$/i,
    /^victoria$/i,
  ]

  for (const pattern of preferredNames) {
    const matchedVoice = candidates.find((voice) => pattern.test(voice.name))
    if (matchedVoice) {
      return matchedVoice
    }
  }

  return (
    candidates.find((voice) => voice.default) ??
    candidates.find((voice) => voice.localService) ??
    candidates[0] ??
    voices[0] ??
    null
  )
}

export function getSpeechSynthesisSupport() {
  const speechGlobal = globalThis as typeof globalThis & SpeechSynthesisGlobal
  const synthesis = speechGlobal.speechSynthesis
  const UtteranceConstructor = speechGlobal.SpeechSynthesisUtterance

  if (synthesis === undefined || UtteranceConstructor === undefined) {
    return null
  }

  return { synthesis, UtteranceConstructor }
}

function createSpeechRequest({
  approval,
  currentTask,
  execution,
}: Pick<
  UseTauriSpeechSynthesisOptions,
  "approval" | "currentTask" | "execution"
>): SpeechRequest | null {
  const taskId = currentTask.id
  if (!taskId) {
    return null
  }

  if (currentTask.state === "failed" && currentTask.completion?.outcome) {
    return {
      key: `${taskId}:failure`,
      milestone: "failure",
      priority: 3,
      taskId,
      text: currentTask.completion.outcome,
    }
  }

  if (currentTask.state === "completed" && currentTask.completion?.outcome) {
    return {
      key: `${taskId}:completion`,
      milestone: "completion",
      priority: 3,
      taskId,
      text: currentTask.completion.outcome,
    }
  }

  if (approval.state === "requested" && approval.request?.explanation) {
    return {
      key: `${taskId}:approval`,
      milestone: "approval",
      priority: 2,
      taskId,
      text: approval.request.explanation,
    }
  }

  if (
    currentTask.state === "understanding" &&
    currentTask.intent.unresolvedQuestions[0]?.text
  ) {
    return {
      key: `${taskId}:clarification`,
      milestone: "clarification",
      priority: 1,
      taskId,
      text: currentTask.intent.unresolvedQuestions[0].text,
    }
  }

  if (
    execution.state === "executing" &&
    currentTask.state === "executing" &&
    currentTask.risk === "low" &&
    currentTask.summary
  ) {
    return {
      key: `${taskId}:execution_recap`,
      milestone: "execution_recap",
      priority: 0,
      taskId,
      text: currentTask.summary,
    }
  }

  return null
}

function shouldReplaceQueuedRequest(
  queuedRequest: SpeechRequest,
  incomingRequest: SpeechRequest,
) {
  return incomingRequest.priority >= queuedRequest.priority
}

export function useTauriSpeechSynthesis({
  approval,
  conversation,
  currentTask,
  enabled,
  execution,
  onStatusChange,
  store = bridgeStore,
}: UseTauriSpeechSynthesisOptions) {
  const activeRequestRef = useRef<SpeechRequest | null>(null)
  const pendingRequestRef = useRef<SpeechRequest | null>(null)
  const spokenKeysRef = useRef(new Set<string>())
  const storeRef = useRef(store)
  const onStatusChangeRef = useRef(onStatusChange)
  const unsupportedReportedRef = useRef(false)
  const cancelReasonRef = useRef<SpeechCancelReason | null>(null)

  storeRef.current = store
  onStatusChangeRef.current = onStatusChange

  function reportStatus(message: string) {
    onStatusChangeRef.current?.(message)
  }

  function startRequest(request: SpeechRequest) {
    const support = getSpeechSynthesisSupport()
    if (support === null) {
      if (!unsupportedReportedRef.current) {
        unsupportedReportedRef.current = true
        reportStatus("Speech synthesis is unavailable in this WebView. Spoken responses are off.")
      }
      return
    }

    const spokenText = formatSpeechText(request.text)
    if (!spokenText) {
      spokenKeysRef.current.add(request.key)
      return
    }

    const { synthesis, UtteranceConstructor } = support
    const utterance = new UtteranceConstructor(spokenText)
    utterance.rate = 0.92
    utterance.pitch = 1
    utterance.volume = 1
    utterance.voice = pickPreferredVoice(synthesis.getVoices()) as typeof utterance.voice
    cancelReasonRef.current = null
    activeRequestRef.current = request

    const cancelCurrentSpeech = (reason: SpeechCancelReason) => {
      cancelReasonRef.current = reason
      if (reason === "barge-in") {
        pendingRequestRef.current = null
      }
      clearActiveSpeechSession()
      synthesis.cancel()
    }

    utterance.onstart = () => {
      spokenKeysRef.current.add(request.key)
      setActiveSpeechSession(spokenText, cancelCurrentSpeech)
      void tauriBridge.startSpeaking(storeRef.current).catch(() => undefined)
    }

    utterance.onend = () => {
      const cancelReason = cancelReasonRef.current
      cancelReasonRef.current = null
      clearActiveSpeechSession()
      activeRequestRef.current = null

      const nextRequest = pendingRequestRef.current
      pendingRequestRef.current = null

      if (cancelReason !== null) {
        return
      }

      void tauriBridge
        .finishSpeaking(storeRef.current)
        .catch(() => undefined)
        .finally(() => {
          if (nextRequest !== null) {
            startRequest(nextRequest)
          }
        })
    }

    utterance.onerror = () => {
      clearActiveSpeechSession()
      activeRequestRef.current = null
      pendingRequestRef.current = null
      cancelReasonRef.current = null
      void tauriBridge.finishSpeaking(storeRef.current).catch(() => undefined)
    }

    synthesis.speak(utterance)
  }

  useEffect(() => {
    if (!enabled) {
      cancelReasonRef.current = "cleanup"
      clearActiveSpeechSession()
      getSpeechSynthesisSupport()?.synthesis.cancel()
      activeRequestRef.current = null
      pendingRequestRef.current = null
      return
    }

    if (conversation.muted) {
      return
    }

    const request = createSpeechRequest({
      approval,
      currentTask,
      execution,
    })
    if (request === null || spokenKeysRef.current.has(request.key)) {
      return
    }

    if (activeRequestRef.current?.key === request.key) {
      return
    }

    if (pendingRequestRef.current?.key === request.key) {
      return
    }

    if (activeRequestRef.current === null) {
      startRequest(request)
      return
    }

    if (
      pendingRequestRef.current === null ||
      shouldReplaceQueuedRequest(pendingRequestRef.current, request)
    ) {
      pendingRequestRef.current = request
    }
  }, [
    approval,
    conversation.muted,
    currentTask,
    enabled,
    execution,
  ])

  useEffect(() => {
    return () => {
      cancelReasonRef.current = "cleanup"
      clearActiveSpeechSession()
      activeRequestRef.current = null
      pendingRequestRef.current = null
      getSpeechSynthesisSupport()?.synthesis.cancel()
    }
  }, [])
}
