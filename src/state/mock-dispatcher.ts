import type { TimedBridgeEvent } from "@/state/events"
import {
  bridgeStore,
  dispatchBridgeEvent,
  type BridgeStoreApi,
} from "@/state/store"

export interface MockEventDispatcher {
  play: (sequence: TimedBridgeEvent[]) => void
  step: (sequence: TimedBridgeEvent[], index: number) => number
  cancel: () => void
}

export function createMockEventDispatcher(
  store: BridgeStoreApi = bridgeStore,
): MockEventDispatcher {
  const timers = new Set<ReturnType<typeof setTimeout>>()

  const cancel = () => {
    for (const timer of timers) {
      clearTimeout(timer)
    }

    timers.clear()
  }

  return {
    play(sequence) {
      cancel()

      let elapsedMs = 0

      for (const timedEvent of sequence) {
        elapsedMs += timedEvent.delayMs

        const timer = setTimeout(() => {
          dispatchBridgeEvent(timedEvent.event, store)
          timers.delete(timer)
        }, elapsedMs)

        timers.add(timer)
      }
    },
    step(sequence, index) {
      const timedEvent = sequence[index]

      if (timedEvent === undefined) {
        throw new Error(`Sequence index out of range: ${index}`)
      }

      dispatchBridgeEvent(timedEvent.event, store)

      return index + 1
    },
    cancel,
  }
}

export const mockEventDispatcher = createMockEventDispatcher()

export const play = mockEventDispatcher.play
export const step = mockEventDispatcher.step
export const cancel = mockEventDispatcher.cancel
