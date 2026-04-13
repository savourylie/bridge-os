import { createStore, type StoreApi } from "zustand/vanilla"

import { approvalFlowMachine } from "@/state/approval"
import { conversationStateMachine } from "@/state/conversation"
import { executionStateMachine } from "@/state/execution"
import {
  type ApprovalRequestSnapshot,
  type ApprovalSnapshot,
  type BridgeEvent,
  type ConversationSlice,
  type CompletionSnapshot,
  type CurrentTaskSnapshot,
  type EventHistoryEntry,
  type ExecutionProgress,
  type ExecutionSlice,
  type IntentSnapshot,
  type PlanSnapshot,
  type SystemState,
  type TimelineStepSnapshot,
} from "@/state/events"
import { stepStateMachine } from "@/state/step"
import { taskStateMachine } from "@/state/task"

const DEFAULT_MAX_HISTORY = 100

export interface BridgeStoreData {
  conversation: ConversationSlice
  execution: ExecutionSlice
  currentTask: CurrentTaskSnapshot
  approval: ApprovalSnapshot
  timeline: TimelineStepSnapshot[]
  eventHistory: EventHistoryEntry[]
}

export interface BridgeStoreState extends BridgeStoreData {
  dispatch: (event: BridgeEvent) => void
  replaceFromSystemState: (systemState: SystemState) => void
  reset: () => void
}

export type BridgeStoreApi = StoreApi<BridgeStoreState>

export interface CreateBridgeStoreOptions {
  maxHistory?: number
  getTimestamp?: () => string
}

function cloneApprovalRequest(
  request: ApprovalRequestSnapshot,
): ApprovalRequestSnapshot {
  return {
    ...request,
    willAffect: [...request.willAffect],
    willNotAffect: request.willNotAffect ? [...request.willNotAffect] : [],
  }
}

function cloneTimelineStep(step: TimelineStepSnapshot): TimelineStepSnapshot {
  return { ...step }
}

function cloneCompletion(
  completion: CompletionSnapshot | undefined,
): CompletionSnapshot | undefined {
  if (completion === undefined) {
    return undefined
  }

  return {
    ...completion,
    changes: { ...completion.changes },
  }
}

export function deriveExecutionProgress(
  steps: TimelineStepSnapshot[],
): ExecutionProgress | undefined {
  if (steps.length === 0) {
    return undefined
  }

  const activeStepIndex = steps.findIndex(
    (step) => step.status === "running" || step.status === "waiting_approval",
  )

  if (activeStepIndex >= 0) {
    return {
      current: activeStepIndex + 1,
      total: steps.length,
    }
  }

  const touchedSteps = steps.filter((step) => step.status !== "pending").length

  if (touchedSteps > 0) {
    return {
      current: Math.min(touchedSteps, steps.length),
      total: steps.length,
    }
  }

  return {
    current: 0,
    total: steps.length,
  }
}

function createInitialData(): BridgeStoreData {
  return {
    conversation: {
      state: conversationStateMachine.initialState,
      transcript: "",
    },
    execution: {
      state: executionStateMachine.initialState,
      progress: undefined,
    },
    currentTask: {
      state: taskStateMachine.initialState,
      intent: {
        unresolvedQuestions: [],
      },
      plan: {
        steps: [],
        planState: "drafting",
      },
    },
    approval: {
      state: approvalFlowMachine.initialState,
    },
    timeline: [],
    eventHistory: [],
  }
}

function appendHistory(
  history: EventHistoryEntry[],
  entry: EventHistoryEntry,
  maxHistory: number,
): EventHistoryEntry[] {
  const nextHistory = [...history, entry]

  if (nextHistory.length <= maxHistory) {
    return nextHistory
  }

  return nextHistory.slice(nextHistory.length - maxHistory)
}

function mergeIntent(
  previousIntent: IntentSnapshot,
  payload: Partial<IntentSnapshot>,
): IntentSnapshot {
  const hasQuestionsUpdate = Object.prototype.hasOwnProperty.call(
    payload,
    "unresolvedQuestions",
  )

  return {
    ...previousIntent,
    ...payload,
    unresolvedQuestions:
      hasQuestionsUpdate
        ? payload.unresolvedQuestions?.map((question) => ({ ...question })) ?? []
        : (previousIntent.unresolvedQuestions ?? []).map((question) => ({ ...question })),
  }
}

function mergePlan(
  previousPlan: PlanSnapshot,
  payload: Partial<PlanSnapshot>,
): PlanSnapshot {
  const hasStepsUpdate = Object.prototype.hasOwnProperty.call(payload, "steps")

  return {
    ...previousPlan,
    ...payload,
    steps:
      hasStepsUpdate
        ? payload.steps?.map((step) => ({ ...step })) ?? []
        : previousPlan.steps.map((step) => ({ ...step })),
  }
}

function cloneIntent(intent: IntentSnapshot): IntentSnapshot {
  return {
    ...intent,
    unresolvedQuestions: (intent.unresolvedQuestions ?? []).map((question) => ({
      ...question,
    })),
  }
}

function clonePlan(plan: PlanSnapshot): PlanSnapshot {
  return {
    ...plan,
    steps: plan.steps.map((step) => ({ ...step })),
  }
}

function cloneCurrentTask(task: CurrentTaskSnapshot): CurrentTaskSnapshot {
  return {
    ...task,
    intent: cloneIntent(task.intent),
    plan: clonePlan(task.plan),
    completion: cloneCompletion(task.completion),
  }
}

function cloneConversation(conversation: ConversationSlice): ConversationSlice {
  return { ...conversation }
}

function cloneExecution(execution: ExecutionSlice): ExecutionSlice {
  return {
    ...execution,
    progress:
      execution.progress === undefined
        ? undefined
        : { ...execution.progress },
  }
}

function cloneApproval(approval: ApprovalSnapshot): ApprovalSnapshot {
  return {
    ...approval,
    request:
      approval.request === undefined
        ? undefined
        : cloneApprovalRequest(approval.request),
  }
}

export function hydrateSystemState(systemState: SystemState): BridgeStoreData {
  const timeline = systemState.timeline.map(cloneTimelineStep)
  const execution = cloneExecution(systemState.execution)

  return {
    conversation: cloneConversation(systemState.conversation),
    execution: {
      ...execution,
      progress: execution.progress ?? deriveExecutionProgress(timeline),
    },
    currentTask: cloneCurrentTask(systemState.currentTask),
    approval: cloneApproval(systemState.approval),
    timeline,
    eventHistory: [],
  }
}

function applyBridgeEvent(
  state: BridgeStoreData,
  event: BridgeEvent,
): BridgeStoreData {
  switch (event.type) {
    case "TRANSCRIPT_UPDATED":
      return {
        ...state,
        conversation: {
          ...state.conversation,
          transcript: event.payload.text,
        },
      }

    case "INTENT_UPDATED":
      return {
        ...state,
        currentTask: {
          ...state.currentTask,
          intent: mergeIntent(state.currentTask.intent, event.payload),
        },
      }

    case "TASK_METADATA_UPDATED":
      return {
        ...state,
        currentTask: {
          ...state.currentTask,
          ...event.payload,
        },
      }

    case "PLAN_UPDATED":
      return {
        ...state,
        currentTask: {
          ...state.currentTask,
          plan: mergePlan(state.currentTask.plan, event.payload),
        },
      }

    case "TIMELINE_REPLACED": {
      const timeline = event.payload.steps.map(cloneTimelineStep)

      return {
        ...state,
        timeline,
        execution: {
          ...state.execution,
          progress: deriveExecutionProgress(timeline),
        },
      }
    }

    case "COMPLETION_RECORDED":
      return {
        ...state,
        currentTask: {
          ...state.currentTask,
          completion: {
            ...event.payload,
            changes: { ...event.payload.changes },
          },
        },
      }

    case "STORE_RESET":
      return {
        ...createInitialData(),
        eventHistory: state.eventHistory,
      }

    case "CONVERSATION_TRANSITION":
      return {
        ...state,
        conversation: {
          ...state.conversation,
          state: conversationStateMachine.transition(
            state.conversation.state,
            event.payload.event,
          ),
        },
      }

    case "EXECUTION_TRANSITION":
      return {
        ...state,
        execution: {
          state: executionStateMachine.transition(
            state.execution.state,
            event.payload.event,
          ),
          progress: deriveExecutionProgress(state.timeline),
        },
      }

    case "TASK_TRANSITION":
      return {
        ...state,
        currentTask: {
          ...state.currentTask,
          state: taskStateMachine.transition(
            state.currentTask.state,
            event.payload.event,
          ),
        },
      }

    case "APPROVAL_TRANSITION":
      return {
        ...state,
        approval: {
          state: approvalFlowMachine.transition(
            state.approval.state,
            event.payload.event,
          ),
          request:
            event.payload.request !== undefined
              ? cloneApprovalRequest(event.payload.request)
              : state.approval.request
                ? cloneApprovalRequest(state.approval.request)
                : undefined,
        },
      }

    case "STEP_TRANSITION": {
      const stepIndex = state.timeline.findIndex(
        (step) => step.id === event.payload.stepId,
      )

      if (stepIndex === -1) {
        throw new Error(`Unknown timeline step: ${event.payload.stepId}`)
      }

      const timeline = state.timeline.map((step, index) => {
        if (index !== stepIndex) {
          return cloneTimelineStep(step)
        }

        return {
          ...step,
          ...event.payload.patch,
          status: stepStateMachine.transition(step.status, event.payload.event),
        }
      })

      return {
        ...state,
        timeline,
        execution: {
          ...state.execution,
          progress: deriveExecutionProgress(timeline),
        },
      }
    }
  }
}

export function createBridgeStore(
  options: CreateBridgeStoreOptions = {},
): BridgeStoreApi {
  const maxHistory = options.maxHistory ?? DEFAULT_MAX_HISTORY
  const getTimestamp = options.getTimestamp ?? (() => new Date().toISOString())
  let historyId = 0

  return createStore<BridgeStoreState>()((set, get) => ({
    ...createInitialData(),
    dispatch: (event) => {
      set((currentState) => {
        const nextData = applyBridgeEvent(currentState, event)
        const historyEntry: EventHistoryEntry = {
          id: ++historyId,
          timestamp: getTimestamp(),
          event,
        }

        return {
          ...nextData,
          eventHistory: appendHistory(
            nextData.eventHistory,
            historyEntry,
            maxHistory,
          ),
        }
      })
    },
    replaceFromSystemState: (systemState) => {
      set((currentState) => {
        const nextData = hydrateSystemState(systemState)

        return {
          ...currentState,
          ...nextData,
          eventHistory: currentState.eventHistory,
        }
      })
    },
    reset: () => {
      get().dispatch({ type: "STORE_RESET" })
    },
  }))
}

export const bridgeStore = createBridgeStore()

export function dispatchBridgeEvent(
  event: BridgeEvent,
  store: BridgeStoreApi = bridgeStore,
) {
  store.getState().dispatch(event)
}

export function resetBridgeStore(store: BridgeStoreApi = bridgeStore) {
  store.getState().reset()
}

export function replaceFromSystemState(
  systemState: SystemState,
  store: BridgeStoreApi = bridgeStore,
) {
  store.getState().replaceFromSystemState(systemState)
}

export type { EventHistoryEntry }
