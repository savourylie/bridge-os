import { useStoreWithEqualityFn } from "zustand/traditional"
import { shallow } from "zustand/shallow"

import type {
  ApprovalSnapshot,
  ConversationSlice,
  CurrentTaskSnapshot,
  EventHistoryEntry,
  ExecutionSlice,
  TimelineStepSnapshot,
} from "@/state/events"
import { bridgeStore, type BridgeStoreApi } from "@/state/store"

export function useConversationState(
  store: BridgeStoreApi = bridgeStore,
): ConversationSlice {
  return useStoreWithEqualityFn(store, (state) => state.conversation, shallow)
}

export function useExecutionState(
  store: BridgeStoreApi = bridgeStore,
): ExecutionSlice {
  return useStoreWithEqualityFn(store, (state) => state.execution, shallow)
}

export function useCurrentTask(
  store: BridgeStoreApi = bridgeStore,
): CurrentTaskSnapshot {
  return useStoreWithEqualityFn(store, (state) => state.currentTask, shallow)
}

export function useTimeline(
  store: BridgeStoreApi = bridgeStore,
): TimelineStepSnapshot[] {
  return useStoreWithEqualityFn(store, (state) => state.timeline, shallow)
}

export function useApproval(
  store: BridgeStoreApi = bridgeStore,
): ApprovalSnapshot {
  return useStoreWithEqualityFn(store, (state) => state.approval, shallow)
}

export function useEventHistory(
  store: BridgeStoreApi = bridgeStore,
): EventHistoryEntry[] {
  return useStoreWithEqualityFn(store, (state) => state.eventHistory, shallow)
}
