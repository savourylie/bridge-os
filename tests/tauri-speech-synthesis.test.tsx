// @vitest-environment jsdom

import { cleanup, render, waitFor } from "@testing-library/react"
import { clearMocks, mockIPC, mockWindows } from "@tauri-apps/api/mocks"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  getSpeechSynthesisSupport,
  useTauriSpeechSynthesis,
} from "../src/bridge/tauri-speech-synthesis"
import { TAURI_COMMANDS } from "../src/bridge/tauri"
import {
  createBridgeStore,
  useApproval,
  useConversationState,
  useCurrentTask,
  useExecutionState,
  type BridgeStoreApi,
  type SystemState,
} from "../src/state"
import { resetSpeechSynthesisController } from "../src/bridge/tauri-speech-controller"

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

class FakeSpeechSynthesisUtterance {
  onend: (() => void) | null = null
  onerror: (() => void) | null = null
  onstart: (() => void) | null = null
  pitch = 1
  rate = 1
  text: string
  voice: { name: string, lang: string } | null = null
  volume = 1

  constructor(text: string) {
    this.text = text
  }
}

const fakeSpeechSynthesis = {
  cancel: vi.fn(() => undefined),
  getVoices: vi.fn(() => [
    { name: "Novelty Voice", lang: "en-US" },
    { name: "Samantha", lang: "en-US", default: true, localService: true },
    { name: "Daniel", lang: "en-GB", localService: true },
  ]),
  speak: vi.fn((utterance: FakeSpeechSynthesisUtterance) => {
    fakeSpeechSynthesis.utterances.push(utterance)
    utterance.onstart?.()
  }),
  utterances: [] as FakeSpeechSynthesisUtterance[],
}

function setSystemState(store: BridgeStoreApi, systemState: SystemState) {
  store.getState().replaceFromSystemState(systemState)
}

function Harness({
  onStatusChange,
  store,
}: {
  onStatusChange?: (message: string) => void
  store: BridgeStoreApi
}) {
  const approval = useApproval(store)
  const conversation = useConversationState(store)
  const currentTask = useCurrentTask(store)
  const execution = useExecutionState(store)

  useTauriSpeechSynthesis({
    approval,
    conversation,
    currentTask,
    enabled: true,
    execution,
    onStatusChange,
    store,
  })

  return null
}

describe("useTauriSpeechSynthesis", () => {
  beforeEach(() => {
    mockWindows("main")
    fakeSpeechSynthesis.cancel.mockClear()
    fakeSpeechSynthesis.getVoices.mockClear()
    fakeSpeechSynthesis.speak.mockClear()
    fakeSpeechSynthesis.utterances = []
    Reflect.set(globalThis, "speechSynthesis", fakeSpeechSynthesis)
    Reflect.set(globalThis, "SpeechSynthesisUtterance", FakeSpeechSynthesisUtterance)
  })

  afterEach(() => {
    cleanup()
    clearMocks()
    resetSpeechSynthesisController()
    Reflect.deleteProperty(globalThis, "speechSynthesis")
    Reflect.deleteProperty(globalThis, "SpeechSynthesisUtterance")
  })

  it("starts and finishes backend speaking commands around an approval utterance", async () => {
    const store = createBridgeStore()
    const invoked: string[] = []
    setSystemState(store, createSystemState({
      conversation: {
        state: "intent_locked",
        transcript: "Organize my Downloads.",
        muted: false,
      },
      execution: {
        state: "waiting_confirmation",
      },
      currentTask: {
        id: "task-030",
        state: "waiting_approval",
        summary: "BridgeOS will review ~/Downloads and move matching files.",
        risk: "medium",
        intent: {
          unresolvedQuestions: [],
        },
        plan: {
          steps: [],
          planState: "ready",
        },
      },
      approval: {
        state: "requested",
        request: {
          action: "Move matching files",
          explanation: "This action changes files or folders inside an approved workspace, so it pauses for confirmation before writing.",
          riskLevel: "medium",
          willAffect: [],
          willNotAffect: [],
        },
      },
    }))

    mockIPC((command) => {
      invoked.push(command)

      if (command === TAURI_COMMANDS.startSpeaking) {
        return createSystemState({
          conversation: {
            state: "speaking",
            transcript: "Approval recap",
            muted: false,
          },
        })
      }

      if (command === TAURI_COMMANDS.finishSpeaking) {
        return createSystemState({
          conversation: {
            state: "listening",
            transcript: "Approval recap",
            muted: false,
          },
        })
      }

      throw new Error(`Unexpected command: ${command}`)
    })

    render(<Harness store={store} />)

    await waitFor(() => {
      expect(getSpeechSynthesisSupport()).not.toBeNull()
      expect(fakeSpeechSynthesis.speak).toHaveBeenCalledTimes(1)
      expect(invoked).toEqual([TAURI_COMMANDS.startSpeaking])
      expect(fakeSpeechSynthesis.utterances[0]?.voice?.name).toBe("Samantha")
    })

    fakeSpeechSynthesis.utterances[0]?.onend?.()

    await waitFor(() => {
      expect(invoked).toEqual([
        TAURI_COMMANDS.startSpeaking,
        TAURI_COMMANDS.finishSpeaking,
      ])
    })
  })

  it("deduplicates a milestone across repeated hydrations", async () => {
    const store = createBridgeStore()
    const approvalState = createSystemState({
      conversation: {
        state: "intent_locked",
        transcript: "Organize my Downloads.",
        muted: false,
      },
      currentTask: {
        id: "task-030",
        state: "waiting_approval",
        summary: "BridgeOS will review ~/Downloads and move matching files.",
        risk: "medium",
        intent: {
          unresolvedQuestions: [],
        },
        plan: {
          steps: [],
          planState: "ready",
        },
      },
      approval: {
        state: "requested",
        request: {
          action: "Move matching files",
          explanation: "This action changes files or folders inside an approved workspace, so it pauses for confirmation before writing.",
          riskLevel: "medium",
          willAffect: [],
          willNotAffect: [],
        },
      },
    })
    setSystemState(store, approvalState)

    mockIPC((command) => {
      if (command === TAURI_COMMANDS.startSpeaking) {
        return createSystemState({
          conversation: {
            state: "speaking",
            transcript: "Approval recap",
            muted: false,
          },
        })
      }

      if (command === TAURI_COMMANDS.finishSpeaking) {
        return createSystemState({
          conversation: {
            state: "listening",
            transcript: "Approval recap",
            muted: false,
          },
        })
      }

      throw new Error(`Unexpected command: ${command}`)
    })

    render(<Harness store={store} />)

    await waitFor(() => {
      expect(fakeSpeechSynthesis.speak).toHaveBeenCalledTimes(1)
    })

    setSystemState(store, approvalState)

    await waitFor(() => {
      expect(fakeSpeechSynthesis.speak).toHaveBeenCalledTimes(1)
    })
  })

  it("replaces a queued recap with a queued completion update", async () => {
    const store = createBridgeStore()
    setSystemState(store, createSystemState({
      conversation: {
        state: "intent_locked",
        transcript: "Inspect my bridge-os project.",
        muted: false,
      },
      execution: {
        state: "executing",
      },
      currentTask: {
        id: "task-a",
        state: "executing",
        summary: "BridgeOS will scan ~/Projects/bridge-os and produce a concise summary.",
        risk: "low",
        intent: {
          unresolvedQuestions: [],
        },
        plan: {
          steps: [],
          planState: "approved",
        },
      },
    }))

    mockIPC((command) => {
      if (command === TAURI_COMMANDS.startSpeaking) {
        return createSystemState({
          conversation: {
            state: "speaking",
            transcript: "Task recap",
            muted: false,
          },
        })
      }

      if (command === TAURI_COMMANDS.finishSpeaking) {
        return createSystemState({
          conversation: {
            state: "listening",
            transcript: "Task recap",
            muted: false,
          },
        })
      }

      throw new Error(`Unexpected command: ${command}`)
    })

    render(<Harness store={store} />)

    await waitFor(() => {
      expect(fakeSpeechSynthesis.speak).toHaveBeenCalledTimes(1)
      expect(fakeSpeechSynthesis.utterances[0]?.text).toMatch(/I will scan/)
    })

    setSystemState(store, createSystemState({
      conversation: {
        state: "speaking",
        transcript: "Task recap",
        muted: false,
      },
      execution: {
        state: "executing",
      },
      currentTask: {
        id: "task-b",
        state: "executing",
        summary: "BridgeOS will scan ~/Projects and produce a concise summary.",
        risk: "low",
        intent: {
          unresolvedQuestions: [],
        },
        plan: {
          steps: [],
          planState: "approved",
        },
      },
    }))

    setSystemState(store, createSystemState({
      conversation: {
        state: "speaking",
        transcript: "Task recap",
        muted: false,
      },
      execution: {
        state: "completed",
      },
      currentTask: {
        id: "task-b",
        state: "completed",
        completion: {
          outcome: "Found 10 files and 2 directories in the selected project.",
          changes: {
            created: 0,
            modified: 0,
            moved: 0,
            deleted: 0,
          },
        },
        intent: {
          unresolvedQuestions: [],
        },
        plan: {
          steps: [],
          planState: "approved",
        },
      },
    }))

    fakeSpeechSynthesis.utterances[0]?.onend?.()

    await waitFor(() => {
      expect(fakeSpeechSynthesis.speak).toHaveBeenCalledTimes(2)
      expect(fakeSpeechSynthesis.utterances[1]?.text).toBe(
        "Found 10 files and 2 directories in the selected project.",
      )
    })
  })

  it("reports unsupported speech synthesis once and skips speaking", async () => {
    Reflect.deleteProperty(globalThis, "speechSynthesis")
    Reflect.deleteProperty(globalThis, "SpeechSynthesisUtterance")

    const store = createBridgeStore()
    const statusSpy = vi.fn()
    setSystemState(store, createSystemState({
      conversation: {
        state: "intent_locked",
        transcript: "Organize my Downloads.",
        muted: false,
      },
      execution: {
        state: "waiting_confirmation",
      },
      currentTask: {
        id: "task-030",
        state: "waiting_approval",
        summary: "BridgeOS will review ~/Downloads and move matching files.",
        risk: "medium",
        intent: {
          unresolvedQuestions: [],
        },
        plan: {
          steps: [],
          planState: "ready",
        },
      },
      approval: {
        state: "requested",
        request: {
          action: "Move matching files",
          explanation: "This action changes files or folders inside an approved workspace, so it pauses for confirmation before writing.",
          riskLevel: "medium",
          willAffect: [],
          willNotAffect: [],
        },
      },
    }))

    render(<Harness store={store} onStatusChange={statusSpy} />)

    await waitFor(() => {
      expect(statusSpy).toHaveBeenCalledWith(
        "Speech synthesis is unavailable in this WebView. Spoken responses are off.",
      )
      expect(fakeSpeechSynthesis.speak).not.toHaveBeenCalled()
    })
  })
})
