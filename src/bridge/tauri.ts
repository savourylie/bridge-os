import { invoke, isTauri } from "@tauri-apps/api/core"
import { listen, type UnlistenFn } from "@tauri-apps/api/event"

import {
  bridgeStore,
  replaceFromSystemState,
  type BridgeStoreApi,
  type SystemState,
} from "@/state"
import type { TranscriptChunkInput } from "@/state/ipc-types"

interface TauriGlobal {
  isTauri?: boolean
  __TAURI_INTERNALS__?: {
    invoke?: unknown
  }
}

export const TAURI_EVENT_CHANNELS = [
  "conversation_state_changed",
  "transcript_updated",
  "intent_updated",
  "plan_updated",
  "execution_state_changed",
  "step_updated",
  "approval_requested",
  "task_completed",
] as const

export type TauriEventChannel = (typeof TAURI_EVENT_CHANNELS)[number]

export const TAURI_COMMANDS = {
  startListening: "start_listening",
  stopListening: "stop_listening",
  submitTranscriptChunk: "submit_transcript_chunk",
  interruptConversation: "interrupt_conversation",
  approveAction: "approve_action",
  denyAction: "deny_action",
  pauseExecution: "pause_execution",
  resumeExecution: "resume_execution",
  stopExecution: "stop_execution",
  getSystemState: "get_system_state",
} as const

async function invokeAndHydrate(
  command: string,
  store: BridgeStoreApi = bridgeStore,
  payload?: Record<string, unknown>,
): Promise<SystemState> {
  const systemState =
    payload === undefined
      ? await invoke<SystemState>(command)
      : await invoke<SystemState>(command, payload)
  replaceFromSystemState(systemState, store)
  return systemState
}

export function createTauriBridge() {
  const getSystemState = () => invoke<SystemState>(TAURI_COMMANDS.getSystemState)
  const isAvailable = () => {
    const tauriGlobal = globalThis as typeof globalThis & TauriGlobal

    return isTauri() || typeof tauriGlobal.__TAURI_INTERNALS__?.invoke === "function"
  }

  return {
    isAvailable,
    getSystemState,
    async hydrate(store: BridgeStoreApi = bridgeStore) {
      const systemState = await getSystemState()
      replaceFromSystemState(systemState, store)
      return systemState
    },
    async subscribe(store: BridgeStoreApi = bridgeStore): Promise<UnlistenFn> {
      const unlisteners = await Promise.all(
        TAURI_EVENT_CHANNELS.map((eventName) =>
          listen<SystemState>(eventName, ({ payload }) => {
            replaceFromSystemState(payload, store)
          }),
        ),
      )

      return () => {
        for (const unlisten of unlisteners) {
          unlisten()
        }
      }
    },
    startListening(store: BridgeStoreApi = bridgeStore) {
      return invokeAndHydrate(TAURI_COMMANDS.startListening, store)
    },
    stopListening(store: BridgeStoreApi = bridgeStore) {
      return invokeAndHydrate(TAURI_COMMANDS.stopListening, store)
    },
    submitTranscriptChunk(
      chunk: TranscriptChunkInput,
      store: BridgeStoreApi = bridgeStore,
    ) {
      return invokeAndHydrate(TAURI_COMMANDS.submitTranscriptChunk, store, { chunk })
    },
    interruptConversation(store: BridgeStoreApi = bridgeStore) {
      return invokeAndHydrate(TAURI_COMMANDS.interruptConversation, store)
    },
    approveAction(store: BridgeStoreApi = bridgeStore) {
      return invokeAndHydrate(TAURI_COMMANDS.approveAction, store)
    },
    denyAction(store: BridgeStoreApi = bridgeStore) {
      return invokeAndHydrate(TAURI_COMMANDS.denyAction, store)
    },
    pauseExecution(store: BridgeStoreApi = bridgeStore) {
      return invokeAndHydrate(TAURI_COMMANDS.pauseExecution, store)
    },
    resumeExecution(store: BridgeStoreApi = bridgeStore) {
      return invokeAndHydrate(TAURI_COMMANDS.resumeExecution, store)
    },
    stopExecution(store: BridgeStoreApi = bridgeStore) {
      return invokeAndHydrate(TAURI_COMMANDS.stopExecution, store)
    },
  }
}

export const tauriBridge = createTauriBridge()

export function useTauriBridge() {
  return tauriBridge
}
