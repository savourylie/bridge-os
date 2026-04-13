// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ORGANIZE_DOWNLOADS_PRE_APPROVAL_SEQUENCE } from "../src/demo/organize-downloads"
import {
  createBridgeStore,
  createMockEventDispatcher,
  useApproval,
  useConversationState,
  useCurrentTask,
  useEventHistory,
  useExecutionState,
  useTimeline,
} from "../src/state"
import type {
  ApprovalRequestSnapshot,
  BridgeEvent,
  TimedBridgeEvent,
  TimelineStepSnapshot,
} from "../src/state"

function createStoreForTests() {
  let tick = 0

  return createBridgeStore({
    maxHistory: 100,
    getTimestamp: () => `2026-04-12T00:00:00.${String(++tick).padStart(3, "0")}Z`,
  })
}

const BASE_TIMELINE: TimelineStepSnapshot[] = [
  {
    id: "step-1",
    description: "Scan ~/Downloads for screenshots",
    status: "pending",
  },
  {
    id: "step-2",
    description: "Prepare month folders",
    status: "pending",
  },
]

const APPROVAL_REQUEST: ApprovalRequestSnapshot = {
  action: "Move screenshots into month folders inside ~/Downloads",
  willAffect: [
    "create 6 month folders inside ~/Downloads",
    "move 133 screenshots without changing filenames",
  ],
  willNotAffect: [
    "delete files",
    "write outside ~/Downloads",
  ],
  impactSummary: "Writes stay inside ~/Downloads only.",
  command:
    "bridgeos file-organize --target ~/Downloads --group-by month --exclude pdf,zip",
}

function replaySequence(
  store: ReturnType<typeof createStoreForTests>,
  sequence: TimedBridgeEvent[],
) {
  act(() => {
    for (const timedEvent of sequence) {
      store.getState().dispatch(timedEvent.event)
    }
  })
}

describe("bridge store", () => {
  it("exposes the expected initial state", () => {
    const store = createStoreForTests()
    const state = store.getState()

    expect(state.conversation).toEqual({
      state: "idle",
      transcript: "",
    })
    expect(state.execution).toEqual({
      state: "not_started",
      progress: undefined,
    })
    expect(state.currentTask).toEqual({
      state: "idle",
      intent: {
        unresolvedQuestions: [],
      },
      plan: {
        steps: [],
        planState: "drafting",
      },
    })
    expect(state.approval).toEqual({
      state: "not_needed",
    })
    expect(state.timeline).toEqual([])
    expect(state.eventHistory).toEqual([])
  })

  it("validates machine-driven transitions across every tracked slice", () => {
    const store = createStoreForTests()

    act(() => {
      store.getState().dispatch({ type: "CONVERSATION_TRANSITION", payload: { event: { type: "START_LISTENING" } } })
      store.getState().dispatch({ type: "EXECUTION_TRANSITION", payload: { event: { type: "START_PLANNING" } } })
      store.getState().dispatch({ type: "TASK_TRANSITION", payload: { event: { type: "USER_INVOKES" } } })
      store.getState().dispatch({
        type: "APPROVAL_TRANSITION",
        payload: {
          event: { type: "RISKY_ACTION_DETECTED" },
          request: APPROVAL_REQUEST,
        },
      })
      store.getState().dispatch({
        type: "TIMELINE_REPLACED",
        payload: {
          steps: BASE_TIMELINE,
        },
      })
      store.getState().dispatch({
        type: "STEP_TRANSITION",
        payload: {
          stepId: "step-1",
          event: { type: "RUN" },
        },
      })
    })

    const state = store.getState()

    expect(state.conversation.state).toBe("listening")
    expect(state.execution.state).toBe("drafting_plan")
    expect(state.currentTask.state).toBe("listening")
    expect(state.approval).toEqual({
      state: "requested",
      request: APPROVAL_REQUEST,
    })
    expect(state.timeline[0]?.status).toBe("running")
    expect(state.execution.progress).toEqual({
      current: 1,
      total: 2,
    })
  })

  it("rejects invalid machine transitions and unknown step identifiers", () => {
    const store = createStoreForTests()

    expect(() =>
      store.getState().dispatch({
        type: "EXECUTION_TRANSITION",
        payload: { event: { type: "CONFIRM" } },
      }),
    ).toThrow("Invalid ExecutionState transition: not_started -> CONFIRM")

    expect(() =>
      store.getState().dispatch({
        type: "STEP_TRANSITION",
        payload: {
          stepId: "missing-step",
          event: { type: "RUN" },
        },
      }),
    ).toThrow("Unknown timeline step: missing-step")
  })

  it("merges partial intent and plan updates without dropping prior fields", () => {
    const store = createStoreForTests()

    act(() => {
      store.getState().dispatch({
        type: "INTENT_UPDATED",
        payload: {
          goal: "Organize screenshots in ~/Downloads by month",
          scope: "~/Downloads only",
        },
      })
      store.getState().dispatch({
        type: "INTENT_UPDATED",
        payload: {
          constraints: "Preserve original filenames",
        },
      })
      store.getState().dispatch({
        type: "PLAN_UPDATED",
        payload: {
          title: "Draft plan",
          steps: [
            { id: "plan-1", description: "Scan the folder" },
          ],
          planState: "ready",
        },
      })
      store.getState().dispatch({
        type: "PLAN_UPDATED",
        payload: {
          planState: "approved",
        },
      })
    })

    expect(store.getState().currentTask.intent).toEqual({
      goal: "Organize screenshots in ~/Downloads by month",
      scope: "~/Downloads only",
      constraints: "Preserve original filenames",
      unresolvedQuestions: [],
    })
    expect(store.getState().currentTask.plan).toEqual({
      title: "Draft plan",
      steps: [{ id: "plan-1", description: "Scan the folder" }],
      planState: "approved",
    })
  })

  it("replaces the timeline and updates per-step state in place", () => {
    const store = createStoreForTests()

    act(() => {
      store.getState().dispatch({
        type: "TIMELINE_REPLACED",
        payload: {
          steps: BASE_TIMELINE,
        },
      })
      store.getState().dispatch({
        type: "STEP_TRANSITION",
        payload: {
          stepId: "step-1",
          event: { type: "RUN" },
          patch: {
            impact: "152 files scanned",
          },
        },
      })
      store.getState().dispatch({
        type: "STEP_TRANSITION",
        payload: {
          stepId: "step-1",
          event: { type: "SUCCESS" },
          patch: {
            impact: "133 screenshots identified",
          },
        },
      })
    })

    expect(store.getState().timeline).toEqual([
      {
        id: "step-1",
        description: "Scan ~/Downloads for screenshots",
        impact: "133 screenshots identified",
        status: "completed",
      },
      {
        id: "step-2",
        description: "Prepare month folders",
        status: "pending",
      },
    ])
    expect(store.getState().execution.progress).toEqual({
      current: 1,
      total: 2,
    })
  })

  it("records event history and truncates it to the configured maximum length", () => {
    let tick = 0
    const store = createBridgeStore({
      maxHistory: 3,
      getTimestamp: () => `history-${++tick}`,
    })

    const events: BridgeEvent[] = [
      { type: "TRANSCRIPT_UPDATED", payload: { text: "Computer" } },
      { type: "TRANSCRIPT_UPDATED", payload: { text: "Computer, organize" } },
      { type: "TASK_TRANSITION", payload: { event: { type: "USER_INVOKES" } } },
      { type: "EXECUTION_TRANSITION", payload: { event: { type: "START_PLANNING" } } },
    ]

    act(() => {
      for (const event of events) {
        store.getState().dispatch(event)
      }
    })

    expect(store.getState().eventHistory).toEqual([
      {
        id: 2,
        timestamp: "history-2",
        event: events[1],
      },
      {
        id: 3,
        timestamp: "history-3",
        event: events[2],
      },
      {
        id: 4,
        timestamp: "history-4",
        event: events[3],
      },
    ])
  })

  it("replays the organize downloads checkpoint up to the approval boundary in order", () => {
    const store = createStoreForTests()

    replaySequence(store, ORGANIZE_DOWNLOADS_PRE_APPROVAL_SEQUENCE)

    const state = store.getState()

    expect(state.currentTask.state).toBe("executing")
    expect(state.execution.state).toBe("executing")
    expect(state.approval.state).toBe("requested")
    expect(state.currentTask.plan.planState).toBe("ready")
    expect(state.execution.progress).toEqual({
      current: 4,
      total: 5,
    })
    expect(state.timeline.map((step) => step.status)).toEqual([
      "completed",
      "completed",
      "completed",
      "waiting_approval",
      "pending",
    ])
    expect(state.eventHistory.map((entry) => entry.event.type)).toEqual(
      ORGANIZE_DOWNLOADS_PRE_APPROVAL_SEQUENCE.map((entry) => entry.event.type),
    )
  })

  it("supports a full task lifecycle through completion", () => {
    const store = createStoreForTests()

    act(() => {
      store.getState().dispatch({ type: "TASK_TRANSITION", payload: { event: { type: "USER_INVOKES" } } })
      store.getState().dispatch({ type: "CONVERSATION_TRANSITION", payload: { event: { type: "START_LISTENING" } } })
      store.getState().dispatch({ type: "TRANSCRIPT_UPDATED", payload: { text: "Computer, organize my Downloads." } })
      store.getState().dispatch({ type: "TASK_TRANSITION", payload: { event: { type: "TRANSCRIPT_READY" } } })
      store.getState().dispatch({
        type: "INTENT_UPDATED",
        payload: {
          goal: "Organize screenshots in ~/Downloads by month",
          scope: "~/Downloads only",
          constraints: "Do not touch PDFs or zip files",
        },
      })
      store.getState().dispatch({ type: "TASK_TRANSITION", payload: { event: { type: "INTENT_RESOLVED" } } })
      store.getState().dispatch({ type: "EXECUTION_TRANSITION", payload: { event: { type: "START_PLANNING" } } })
      store.getState().dispatch({
        type: "PLAN_UPDATED",
        payload: {
          title: "Draft plan",
          planState: "ready",
          steps: [
            { id: "plan-1", description: "Scan screenshots" },
            { id: "plan-2", description: "Create month folders" },
          ],
        },
      })
      store.getState().dispatch({ type: "TASK_TRANSITION", payload: { event: { type: "APPROVAL_REQUIRED" } } })
      store.getState().dispatch({
        type: "APPROVAL_TRANSITION",
        payload: {
          event: { type: "RISKY_ACTION_DETECTED" },
          request: APPROVAL_REQUEST,
        },
      })
      store.getState().dispatch({ type: "EXECUTION_TRANSITION", payload: { event: { type: "PLAN_READY_FOR_CONFIRMATION" } } })
      store.getState().dispatch({
        type: "TIMELINE_REPLACED",
        payload: {
          steps: BASE_TIMELINE,
        },
      })
      store.getState().dispatch({ type: "APPROVAL_TRANSITION", payload: { event: { type: "USER_APPROVES" } } })
      store.getState().dispatch({ type: "TASK_TRANSITION", payload: { event: { type: "APPROVE" } } })
      store.getState().dispatch({ type: "EXECUTION_TRANSITION", payload: { event: { type: "CONFIRM" } } })
      store.getState().dispatch({
        type: "PLAN_UPDATED",
        payload: {
          planState: "approved",
        },
      })
      store.getState().dispatch({
        type: "STEP_TRANSITION",
        payload: {
          stepId: "step-1",
          event: { type: "RUN" },
        },
      })
      store.getState().dispatch({
        type: "STEP_TRANSITION",
        payload: {
          stepId: "step-1",
          event: { type: "SUCCESS" },
        },
      })
      store.getState().dispatch({
        type: "STEP_TRANSITION",
        payload: {
          stepId: "step-2",
          event: { type: "RUN" },
        },
      })
      store.getState().dispatch({
        type: "STEP_TRANSITION",
        payload: {
          stepId: "step-2",
          event: { type: "SUCCESS" },
        },
      })
      store.getState().dispatch({ type: "TASK_TRANSITION", payload: { event: { type: "ALL_STEPS_COMPLETE" } } })
      store.getState().dispatch({ type: "EXECUTION_TRANSITION", payload: { event: { type: "COMPLETE" } } })
      store.getState().dispatch({
        type: "COMPLETION_RECORDED",
        payload: {
          outcome: "Moved screenshots into 6 month folders.",
          changes: {
            created: 6,
            modified: 0,
            moved: 133,
            deleted: 0,
            network: false,
          },
          rollbackAvailable: true,
          rollbackTimeRemaining: "30 minutes",
        },
      })
    })

    const state = store.getState()

    expect(state.currentTask.state).toBe("completed")
    expect(state.execution.state).toBe("completed")
    expect(state.currentTask.plan.planState).toBe("approved")
    expect(state.timeline.every((step) => step.status === "completed")).toBe(true)
    expect(state.currentTask.completion?.changes.moved).toBe(133)
  })

  it("resets runtime slices while preserving the audit history", () => {
    const store = createStoreForTests()

    act(() => {
      store.getState().dispatch({ type: "TRANSCRIPT_UPDATED", payload: { text: "Computer, organize my Downloads." } })
      store.getState().dispatch({ type: "TASK_TRANSITION", payload: { event: { type: "USER_INVOKES" } } })
      store.getState().dispatch({
        type: "TIMELINE_REPLACED",
        payload: {
          steps: BASE_TIMELINE,
        },
      })
      store.getState().dispatch({
        type: "COMPLETION_RECORDED",
        payload: {
          outcome: "Completed",
          changes: {
            created: 1,
            modified: 0,
            moved: 2,
            deleted: 0,
          },
        },
      })
      store.getState().reset()
    })

    const state = store.getState()

    expect(state.conversation).toEqual({
      state: "idle",
      transcript: "",
    })
    expect(state.execution).toEqual({
      state: "not_started",
      progress: undefined,
    })
    expect(state.currentTask).toEqual({
      state: "idle",
      intent: {
        unresolvedQuestions: [],
      },
      plan: {
        steps: [],
        planState: "drafting",
      },
    })
    expect(state.approval).toEqual({
      state: "not_needed",
    })
    expect(state.timeline).toEqual([])
    expect(state.eventHistory.at(-1)?.event.type).toBe("STORE_RESET")
  })
})

describe("selector hooks", () => {
  let store = createStoreForTests()

  beforeEach(() => {
    store = createStoreForTests()
  })

  it("returns the correct state slices", () => {
    act(() => {
      store.getState().dispatch({ type: "TRANSCRIPT_UPDATED", payload: { text: "Computer" } })
      store.getState().dispatch({ type: "CONVERSATION_TRANSITION", payload: { event: { type: "START_LISTENING" } } })
      store.getState().dispatch({ type: "TASK_METADATA_UPDATED", payload: { title: "Organize Downloads", risk: "medium", scope: "Downloads only" } })
      store.getState().dispatch({
        type: "APPROVAL_TRANSITION",
        payload: {
          event: { type: "RISKY_ACTION_DETECTED" },
          request: APPROVAL_REQUEST,
        },
      })
      store.getState().dispatch({
        type: "TIMELINE_REPLACED",
        payload: {
          steps: BASE_TIMELINE,
        },
      })
    })

    const { result: conversation } = renderHook(() => useConversationState(store))
    const { result: currentTask } = renderHook(() => useCurrentTask(store))
    const { result: approval } = renderHook(() => useApproval(store))
    const { result: timeline } = renderHook(() => useTimeline(store))
    const { result: history } = renderHook(() => useEventHistory(store))

    expect(conversation.current).toEqual({
      state: "listening",
      transcript: "Computer",
    })
    expect(currentTask.current.title).toBe("Organize Downloads")
    expect(currentTask.current.risk).toBe("medium")
    expect(approval.current.request?.action).toBe(APPROVAL_REQUEST.action)
    expect(timeline.current).toHaveLength(2)
    expect(history.current).toHaveLength(5)
  })

  it("avoids rerendering a hook when unrelated slices change", () => {
    let conversationRenderCount = 0
    let executionRenderCount = 0

    renderHook(() => {
      conversationRenderCount++
      return useConversationState(store)
    })
    renderHook(() => {
      executionRenderCount++
      return useExecutionState(store)
    })

    expect(conversationRenderCount).toBe(1)
    expect(executionRenderCount).toBe(1)

    act(() => {
      store.getState().dispatch({
        type: "PLAN_UPDATED",
        payload: {
          title: "Draft plan",
          steps: [{ id: "plan-1", description: "Scan screenshots" }],
          planState: "ready",
        },
      })
    })

    expect(conversationRenderCount).toBe(1)
    expect(executionRenderCount).toBe(1)

    act(() => {
      store.getState().dispatch({
        type: "EXECUTION_TRANSITION",
        payload: {
          event: { type: "START_PLANNING" },
        },
      })
    })

    expect(conversationRenderCount).toBe(1)
    expect(executionRenderCount).toBe(2)

    act(() => {
      store.getState().dispatch({
        type: "TRANSCRIPT_UPDATED",
        payload: {
          text: "Computer, organize my Downloads.",
        },
      })
    })

    expect(conversationRenderCount).toBe(2)
    expect(executionRenderCount).toBe(2)
  })
})

describe("mock event dispatcher", () => {
  it("plays timed sequences, supports manual stepping, and cancels pending events", () => {
    vi.useFakeTimers()

    const store = createStoreForTests()
    const dispatcher = createMockEventDispatcher(store)

    act(() => {
      dispatcher.play([
        {
          delayMs: 150,
          event: {
            type: "TRANSCRIPT_UPDATED",
            payload: { text: "Computer" },
          },
        },
        {
          delayMs: 350,
          event: {
            type: "TASK_TRANSITION",
            payload: { event: { type: "USER_INVOKES" } },
          },
        },
      ])
    })

    expect(store.getState().conversation.transcript).toBe("")

    act(() => {
      vi.advanceTimersByTime(150)
    })

    expect(store.getState().conversation.transcript).toBe("Computer")

    act(() => {
      dispatcher.cancel()
      vi.advanceTimersByTime(1000)
    })

    expect(store.getState().currentTask.state).toBe("idle")

    let nextIndex = 0

    act(() => {
      nextIndex = dispatcher.step(
        [
          {
            delayMs: 0,
            event: {
              type: "TASK_TRANSITION",
              payload: { event: { type: "USER_INVOKES" } },
            },
          },
        ],
        0,
      )
    })

    expect(nextIndex).toBe(1)
    expect(store.getState().currentTask.state).toBe("listening")

    vi.useRealTimers()
  })
})
