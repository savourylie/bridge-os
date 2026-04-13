import type { ApprovalEvent } from "@/state/approval"
import type { ConversationEvent } from "@/state/conversation"
import type { ExecutionEvent } from "@/state/execution"
import type {
  ApprovalRequest as IpcApprovalRequest,
  ApprovalSnapshot as IpcApprovalSnapshot,
  CompletionChanges as IpcCompletionChanges,
  CompletionSummary as IpcCompletionSummary,
  ConversationSlice as IpcConversationSlice,
  ExecutionProgress as IpcExecutionProgress,
  ExecutionSlice as IpcExecutionSlice,
  Intent as IpcIntent,
  IntentQuestion as IpcIntentQuestion,
  Plan as IpcPlan,
  PlanState as IpcPlanState,
  PlanStep as IpcPlanStep,
  RiskLevel as IpcRiskLevel,
  SystemState as IpcSystemState,
  TaskSnapshot as IpcTaskSnapshot,
  TimelineStep as IpcTimelineStep,
} from "@/state/ipc-types"
import type { StepEvent } from "@/state/step"
import type { TaskEvent } from "@/state/task"

export type RiskLevel = IpcRiskLevel
export type PlanState = IpcPlanState
export type IntentQuestion = IpcIntentQuestion
export type IntentSnapshot = IpcIntent
export type PlanStepSnapshot = IpcPlanStep
export type PlanSnapshot = IpcPlan
export type CompletionChanges = IpcCompletionChanges
export type CompletionSnapshot = IpcCompletionSummary
export type ApprovalRequestSnapshot = IpcApprovalRequest
export type TimelineStepSnapshot = IpcTimelineStep
export type ConversationSlice = IpcConversationSlice
export type ExecutionProgress = IpcExecutionProgress
export type ExecutionSlice = IpcExecutionSlice
export type CurrentTaskSnapshot = IpcTaskSnapshot
export type ApprovalSnapshot = IpcApprovalSnapshot
export type SystemState = IpcSystemState

export interface EventHistoryEntry<E extends BridgeEvent = BridgeEvent> {
  id: number
  timestamp: string
  event: E
}

export interface TimedBridgeEvent {
  delayMs: number
  event: BridgeEvent
}

export interface TranscriptUpdatedEvent {
  type: "TRANSCRIPT_UPDATED"
  payload: {
    text: string
  }
}

export interface IntentUpdatedEvent {
  type: "INTENT_UPDATED"
  payload: Partial<IntentSnapshot>
}

export interface TaskMetadataUpdatedEvent {
  type: "TASK_METADATA_UPDATED"
  payload: Partial<Pick<CurrentTaskSnapshot, "id" | "title" | "summary" | "risk" | "scope">>
}

export interface PlanUpdatedEvent {
  type: "PLAN_UPDATED"
  payload: Partial<PlanSnapshot>
}

export interface TimelineReplacedEvent {
  type: "TIMELINE_REPLACED"
  payload: {
    steps: TimelineStepSnapshot[]
  }
}

export interface CompletionRecordedEvent {
  type: "COMPLETION_RECORDED"
  payload: CompletionSnapshot
}

export interface StoreResetEvent {
  type: "STORE_RESET"
}

export interface ConversationTransitionEvent {
  type: "CONVERSATION_TRANSITION"
  payload: {
    event: ConversationEvent
  }
}

export interface ExecutionTransitionEvent {
  type: "EXECUTION_TRANSITION"
  payload: {
    event: ExecutionEvent
  }
}

export interface TaskTransitionEvent {
  type: "TASK_TRANSITION"
  payload: {
    event: TaskEvent
  }
}

export interface ApprovalTransitionEvent {
  type: "APPROVAL_TRANSITION"
  payload: {
    event: ApprovalEvent
    request?: ApprovalRequestSnapshot
  }
}

export interface StepTransitionEvent {
  type: "STEP_TRANSITION"
  payload: {
    stepId: string
    event: StepEvent
    patch?: Partial<Omit<TimelineStepSnapshot, "id" | "status">>
  }
}

export type BridgeEvent =
  | TranscriptUpdatedEvent
  | IntentUpdatedEvent
  | TaskMetadataUpdatedEvent
  | PlanUpdatedEvent
  | TimelineReplacedEvent
  | CompletionRecordedEvent
  | StoreResetEvent
  | ConversationTransitionEvent
  | ExecutionTransitionEvent
  | TaskTransitionEvent
  | ApprovalTransitionEvent
  | StepTransitionEvent
