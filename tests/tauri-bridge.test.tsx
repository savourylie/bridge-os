// @vitest-environment jsdom

import { act, cleanup, render, waitFor } from "@testing-library/react"
import { emit } from "@tauri-apps/api/event"
import { clearMocks, mockIPC, mockWindows } from "@tauri-apps/api/mocks"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { TauriBridgeBootstrap } from "../src/bridge/tauri-bootstrap"
import {
  TAURI_COMMANDS,
  TAURI_EVENT_CHANNELS,
  tauriBridge,
} from "../src/bridge/tauri"
import { createBridgeStore, type SystemState } from "../src/state"

function createSystemState(overrides: Partial<SystemState> = {}): SystemState {
  return {
    conversation: {
      state: "idle",
      transcript: "",
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

describe("tauri bridge", () => {
  beforeEach(() => {
    mockWindows("main")
  })

  afterEach(() => {
    cleanup()
    clearMocks()
  })

  it("hydrates the store from get_system_state on bootstrap", async () => {
    const store = createBridgeStore()
    const invoked: string[] = []
    const systemState = createSystemState({
      conversation: {
        state: "listening",
        transcript: "Listening for your request.",
      },
      currentTask: {
        id: "task-020-placeholder",
        title: "Organize Downloads",
        summary: "Hydrated from the Tauri backend.",
        risk: "medium",
        scope: "~/Downloads only",
        state: "listening",
        intent: {
          goal: "Organize screenshots in ~/Downloads by month",
          unresolvedQuestions: [],
        },
        plan: {
          title: "Draft plan",
          steps: [{ id: "step-1", description: "Scan ~/Downloads" }],
          planState: "ready",
        },
      },
      timeline: [{ id: "step-1", description: "Scan ~/Downloads", status: "pending" }],
    })

    mockIPC(
      (command) => {
        invoked.push(command)

        if (command === TAURI_COMMANDS.getSystemState) {
          return systemState
        }

        throw new Error(`Unexpected command: ${command}`)
      },
      { shouldMockEvents: true },
    )

    render(<TauriBridgeBootstrap store={store} />)

    await waitFor(() => {
      expect(store.getState().conversation.state).toBe("listening")
      expect(store.getState().currentTask.title).toBe("Organize Downloads")
    })

    expect(invoked).toEqual([TAURI_COMMANDS.getSystemState])
  })

  it("applies backend event payloads directly into the store", async () => {
    const store = createBridgeStore()
    const initialState = createSystemState()
    const eventState = createSystemState({
      execution: {
        state: "executing",
        progress: {
          current: 2,
          total: 3,
        },
      },
      currentTask: {
        id: "task-020-placeholder",
        title: "Organize Downloads",
        summary: "Event-driven execution update.",
        risk: "medium",
        scope: "~/Downloads only",
        state: "executing",
        intent: {
          goal: "Organize screenshots in ~/Downloads by month",
          unresolvedQuestions: [],
        },
        plan: {
          title: "Draft plan",
          steps: [{ id: "step-1", description: "Scan ~/Downloads" }],
          planState: "approved",
        },
      },
      timeline: [
        { id: "step-1", description: "Scan ~/Downloads", status: "completed" },
        {
          id: "step-2",
          description: "Move screenshots into dated folders",
          status: "running",
        },
      ],
    })

    mockIPC(
      (command) => {
        if (command === TAURI_COMMANDS.getSystemState) {
          return initialState
        }

        throw new Error(`Unexpected command: ${command}`)
      },
      { shouldMockEvents: true },
    )

    render(<TauriBridgeBootstrap store={store} />)

    await waitFor(() => {
      expect(store.getState().execution.state).toBe("not_started")
    })

    await act(async () => {
      await emit(TAURI_EVENT_CHANNELS[4], eventState)
    })

    await waitFor(() => {
      expect(store.getState().execution.state).toBe("executing")
      expect(store.getState().timeline[1]?.status).toBe("running")
    })
  })

  it("invokes conversation and execution commands with the documented payloads", async () => {
    const store = createBridgeStore()
    const invoked: string[] = []
    const payloads: Array<Record<string, unknown> | undefined> = []

    mockIPC((command, payload) => {
      invoked.push(command)
      payloads.push(payload)

      if (command === TAURI_COMMANDS.startListening) {
        return createSystemState({
          conversation: {
            state: "listening",
            transcript: "",
          },
          currentTask: {
            state: "listening",
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

      if (command === TAURI_COMMANDS.submitTranscriptChunk) {
        return createSystemState({
          conversation: {
            state: "holding_for_more",
            transcript: "wait, not yesterday",
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
        })
      }

      if (command === TAURI_COMMANDS.interruptConversation) {
        return createSystemState({
          conversation: {
            state: "interrupted",
            transcript: "BridgeOS speaking summary",
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
        })
      }

      if (command === TAURI_COMMANDS.pauseExecution) {
        return createSystemState({
          execution: {
            state: "paused",
            progress: {
              current: 2,
              total: 3,
            },
          },
          currentTask: {
            id: "task-020-placeholder",
            title: "Organize Downloads",
            summary: "Paused through the bridge wrapper.",
            risk: "medium",
            scope: "~/Downloads only",
            state: "paused",
            intent: {
              goal: "Organize screenshots in ~/Downloads by month",
              unresolvedQuestions: [],
            },
            plan: {
              title: "Draft plan",
              steps: [{ id: "step-1", description: "Scan ~/Downloads" }],
              planState: "approved",
            },
          },
          timeline: [{ id: "step-1", description: "Scan ~/Downloads", status: "completed" }],
        })
      }

      throw new Error(`Unexpected command: ${command}`)
    })

    await tauriBridge.startListening(store)
    expect(store.getState().conversation.state).toBe("listening")

    await tauriBridge.submitTranscriptChunk(
      { text: "wait, not yesterday", isFinal: false },
      store,
    )
    expect(store.getState().conversation.state).toBe("holding_for_more")
    expect(store.getState().conversation.transcript).toBe("wait, not yesterday")

    await tauriBridge.interruptConversation(store)
    expect(store.getState().conversation.state).toBe("interrupted")

    await tauriBridge.pauseExecution(store)
    expect(store.getState().execution.state).toBe("paused")
    expect(store.getState().currentTask.state).toBe("paused")

    expect(invoked).toEqual([
      TAURI_COMMANDS.startListening,
      TAURI_COMMANDS.submitTranscriptChunk,
      TAURI_COMMANDS.interruptConversation,
      TAURI_COMMANDS.pauseExecution,
    ])
    expect(payloads).toEqual([
      {},
      { chunk: { text: "wait, not yesterday", isFinal: false } },
      {},
      {},
    ])
  })
})
