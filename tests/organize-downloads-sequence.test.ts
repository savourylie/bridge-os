// @vitest-environment jsdom

import { act } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { getOrganizeDownloadsSequence } from "../src/demo/organize-downloads"
import { createBridgeStore } from "../src/state"
import type { BridgeStoreApi, TimedBridgeEvent } from "../src/state"

function createStoreForSequenceTests() {
  let tick = 0

  return createBridgeStore({
    maxHistory: 200,
    getTimestamp: () => `2026-04-13T00:00:00.${String(++tick).padStart(3, "0")}Z`,
  })
}

function replaySequence(store: BridgeStoreApi, sequence: TimedBridgeEvent[]) {
  act(() => {
    for (const timedEvent of sequence) {
      store.getState().dispatch(timedEvent.event)
    }
  })
}

describe("organize downloads demo sequences", () => {
  it("replays the approve branch end-to-end with the expected event history", () => {
    const store = createStoreForSequenceTests()
    const sequence = getOrganizeDownloadsSequence("approved")

    expect(() => replaySequence(store, sequence)).not.toThrow()

    const state = store.getState()
    const stepFourEvents = state.eventHistory
      .filter(
        (entry) =>
          entry.event.type === "STEP_TRANSITION" &&
          entry.event.payload.stepId === "step-4",
      )
      .map((entry) => entry.event.payload.event.type)

    expect(state.currentTask.state).toBe("completed")
    expect(state.execution.state).toBe("completed")
    expect(state.approval.state).toBe("done")
    expect(state.currentTask.plan.planState).toBe("approved")
    expect(state.currentTask.completion?.title).toBe("Downloads Organized")
    expect(state.timeline.every((step) => step.status === "completed")).toBe(true)
    expect(state.eventHistory.map((entry) => entry.event.type)).toEqual(
      sequence.map((entry) => entry.event.type),
    )
    expect(stepFourEvents).toEqual([
      "RUN",
      "REQUIRES_APPROVAL",
      "APPROVE",
      "SUCCESS",
    ])
  })

  it("replays the deny branch end-to-end with the expected cancellation outcome", () => {
    const store = createStoreForSequenceTests()
    const sequence = getOrganizeDownloadsSequence("denied")

    expect(() => replaySequence(store, sequence)).not.toThrow()

    const state = store.getState()
    const stepFourEvents = state.eventHistory
      .filter(
        (entry) =>
          entry.event.type === "STEP_TRANSITION" &&
          entry.event.payload.stepId === "step-4",
      )
      .map((entry) => entry.event.payload.event.type)

    expect(state.currentTask.state).toBe("cancelled")
    expect(state.execution.state).toBe("not_started")
    expect(state.approval.state).toBe("denied")
    expect(state.conversation.state).toBe("idle")
    expect(state.currentTask.plan.planState).toBe("cancelled")
    expect(state.currentTask.completion).toBeUndefined()
    expect(state.timeline.map((step) => step.status)).toEqual([
      "completed",
      "completed",
      "completed",
      "skipped",
      "pending",
    ])
    expect(state.eventHistory.map((entry) => entry.event.type)).toEqual(
      sequence.map((entry) => entry.event.type),
    )
    expect(stepFourEvents).toEqual([
      "RUN",
      "REQUIRES_APPROVAL",
      "DENY",
    ])
  })
})
