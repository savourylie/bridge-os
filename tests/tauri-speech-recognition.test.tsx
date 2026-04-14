// @vitest-environment jsdom

import { act, cleanup, render, waitFor } from "@testing-library/react"
import { clearMocks, mockIPC, mockWindows } from "@tauri-apps/api/mocks"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  getSpeechRecognitionConstructor,
  useTauriSpeechRecognition,
} from "../src/bridge/tauri-speech-recognition"
import { TAURI_COMMANDS } from "../src/bridge/tauri"
import { createBridgeStore, useConversationState, type BridgeStoreApi, type SystemState } from "../src/state"

function createSystemState(overrides: Partial<SystemState> = {}): SystemState {
  return {
    conversation: {
      state: "idle",
      transcript: "",
      muted: false,
    },
    execution: {
      state: "not_started",
    },
    currentTask: {
      state: "idle",
      intent: {
        unresolvedQuestions: [],
      },
      plan: {
        steps: [],
        planState: "drafting",
      },
    },
    approval: {
      state: "not_needed",
    },
    timeline: [],
    ...overrides,
  }
}

function setConversationState(
  store: BridgeStoreApi,
  conversation: SystemState["conversation"],
) {
  store.getState().replaceFromSystemState(createSystemState({
    conversation,
    currentTask: {
      state: conversation.state === "idle" ? "idle" : "listening",
      intent: {
        unresolvedQuestions: [],
      },
      plan: {
        steps: [],
        planState: "drafting",
      },
    },
  }))
}

class FakeSpeechRecognition {
  static instances: FakeSpeechRecognition[] = []

  continuous = false
  interimResults = false
  lang = ""
  onend: (() => void) | null = null
  onerror: ((event: { error: string, message?: string }) => void) | null = null
  onresult:
    | ((event: { resultIndex: number, results: { length: number, [index: number]: { isFinal: boolean, 0: { transcript: string }, }, }, }) => void)
    | null = null

  start = vi.fn(() => undefined)
  stop = vi.fn(() => {
    this.onend?.()
  })
  abort = vi.fn(() => {
    this.onerror?.({ error: "aborted" })
    this.onend?.()
  })

  constructor() {
    FakeSpeechRecognition.instances.push(this)
  }

  emitResults(entries: Array<{ text: string, isFinal: boolean }>) {
    const results = entries.reduce(
      (accumulator, entry, index) => {
        accumulator[index] = {
          isFinal: entry.isFinal,
          0: { transcript: entry.text },
        }
        return accumulator
      },
      { length: entries.length } as {
        length: number
        [index: number]: { isFinal: boolean, 0: { transcript: string } }
      },
    )

    this.onresult?.({
      resultIndex: 0,
      results,
    })
  }

  emitError(error: string) {
    this.onerror?.({ error })
  }
}

function Harness({
  onStatusChange,
  store,
}: {
  onStatusChange?: (message: string) => void
  store: BridgeStoreApi
}) {
  const conversation = useConversationState(store)

  useTauriSpeechRecognition({
    enabled: true,
    conversation,
    onStatusChange,
    store,
  })

  return null
}

describe("useTauriSpeechRecognition", () => {
  beforeEach(() => {
    FakeSpeechRecognition.instances = []
    mockWindows("main")
    Reflect.set(globalThis, "webkitSpeechRecognition", FakeSpeechRecognition)
  })

  afterEach(() => {
    cleanup()
    clearMocks()
    Reflect.deleteProperty(globalThis, "SpeechRecognition")
    Reflect.deleteProperty(globalThis, "webkitSpeechRecognition")
  })

  it("starts and stops recognition as conversation listening and mute state change", async () => {
    const store = createBridgeStore()
    setConversationState(store, {
      state: "listening",
      transcript: "",
      muted: false,
    })

    mockIPC((command) => {
      if (command === TAURI_COMMANDS.stopListening) {
        return createSystemState()
      }

      throw new Error(`Unexpected command: ${command}`)
    })

    render(<Harness store={store} />)

    await waitFor(() => {
      expect(FakeSpeechRecognition.instances).toHaveLength(1)
      expect(FakeSpeechRecognition.instances[0]?.start).toHaveBeenCalledTimes(1)
    })

    setConversationState(store, {
      state: "listening",
      transcript: "",
      muted: true,
    })
    await waitFor(() => {
      expect(FakeSpeechRecognition.instances[0]?.abort).toHaveBeenCalledTimes(1)
    })

    setConversationState(store, {
      state: "listening",
      transcript: "",
      muted: false,
    })
    await waitFor(() => {
      expect(FakeSpeechRecognition.instances[0]?.start).toHaveBeenCalledTimes(2)
    })
  })

  it("submits interim and final chunks without repeating duplicate interim text", async () => {
    const store = createBridgeStore()
    const payloads: Array<Record<string, unknown> | undefined> = []
    setConversationState(store, {
      state: "listening",
      transcript: "",
      muted: false,
    })

    mockIPC((command, payload) => {
      payloads.push(payload)

      if (command === TAURI_COMMANDS.submitTranscriptChunk) {
        const chunk = payload?.chunk as { text: string, isFinal: boolean }
        return createSystemState({
          conversation: {
            state: chunk.isFinal ? "intent_locked" : "listening",
            transcript: chunk.text,
            muted: false,
          },
          currentTask: {
            state: chunk.isFinal ? "understanding" : "listening",
            intent: {
              unresolvedQuestions: [],
            },
            plan: {
              steps: [],
              planState: "drafting",
            },
          },
        })
      }

      if (command === TAURI_COMMANDS.stopListening) {
        return createSystemState()
      }

      throw new Error(`Unexpected command: ${command}`)
    })

    render(<Harness store={store} />)

    await waitFor(() => {
      expect(FakeSpeechRecognition.instances[0]?.start).toHaveBeenCalledTimes(1)
    })

    act(() => {
      FakeSpeechRecognition.instances[0]?.emitResults([
        { text: "Computer organize", isFinal: false },
      ])
      FakeSpeechRecognition.instances[0]?.emitResults([
        { text: "Computer organize", isFinal: false },
      ])
      FakeSpeechRecognition.instances[0]?.emitResults([
        { text: "Computer organize", isFinal: true },
      ])
    })

    await waitFor(() => {
      expect(payloads).toEqual([
        { chunk: { text: "Computer organize", isFinal: false } },
        { chunk: { text: "Computer organize", isFinal: true } },
      ])
    })
  })

  it("stops listening cleanly when microphone permission is denied", async () => {
    const store = createBridgeStore()
    const invoked: string[] = []
    const statusSpy = vi.fn()
    setConversationState(store, {
      state: "listening",
      transcript: "",
      muted: false,
    })

    mockIPC((command) => {
      invoked.push(command)

      if (command === TAURI_COMMANDS.stopListening) {
        return createSystemState()
      }

      throw new Error(`Unexpected command: ${command}`)
    })

    render(<Harness store={store} onStatusChange={statusSpy} />)

    await waitFor(() => {
      expect(FakeSpeechRecognition.instances[0]?.start).toHaveBeenCalledTimes(1)
    })

    act(() => {
      FakeSpeechRecognition.instances[0]?.emitError("not-allowed")
    })

    await waitFor(() => {
      expect(invoked).toContain(TAURI_COMMANDS.stopListening)
      expect(statusSpy).toHaveBeenCalledWith("Microphone permission was denied. Listening stopped.")
    })
  })

  it("reports unsupported speech recognition and stops the backend session", async () => {
    Reflect.deleteProperty(globalThis, "webkitSpeechRecognition")

    const store = createBridgeStore()
    const invoked: string[] = []
    const statusSpy = vi.fn()
    setConversationState(store, {
      state: "listening",
      transcript: "",
      muted: false,
    })

    mockIPC((command) => {
      invoked.push(command)

      if (command === TAURI_COMMANDS.stopListening) {
        return createSystemState()
      }

      throw new Error(`Unexpected command: ${command}`)
    })

    render(<Harness store={store} onStatusChange={statusSpy} />)

    await waitFor(() => {
      expect(getSpeechRecognitionConstructor()).toBeNull()
      expect(invoked).toContain(TAURI_COMMANDS.stopListening)
      expect(statusSpy).toHaveBeenCalledWith(
        "Speech recognition is unavailable in this WebView. Listening stopped.",
      )
    })
  })
})
