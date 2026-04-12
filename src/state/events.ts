import type { ApprovalEvent, ApprovalFlow } from "@/state/approval"
import type { ConversationEvent, ConversationState } from "@/state/conversation"
import type { ExecutionEvent, ExecutionState } from "@/state/execution"
import type { StepEvent, StepState } from "@/state/step"
import type { TaskEvent, TaskState } from "@/state/task"

export type RiskLevel = "low" | "medium" | "high"
export type PlanState = "drafting" | "ready" | "approved" | "cancelled"

export interface IntentQuestion {
  id: string
  text: string
}

export interface IntentSnapshot {
  goal?: string
  scope?: string
  constraints?: string
  exclusions?: string
  unresolvedQuestions?: IntentQuestion[]
}

export interface PlanStepSnapshot {
  id: string
  description: string
}

export interface PlanSnapshot {
  title?: string
  steps: PlanStepSnapshot[]
  planState: PlanState
}

export interface CompletionChanges {
  created: number
  modified: number
  moved: number
  deleted: number
  network?: boolean
}

export interface CompletionSnapshot {
  title?: string
  outcome: string
  changes: CompletionChanges
  rollbackAvailable?: boolean
  rollbackTimeRemaining?: string
}

export interface ApprovalRequestSnapshot {
  action: string
  willAffect: string[]
  willNotAffect?: string[]
  impactSummary?: string
  command?: string
}

export interface TimelineStepSnapshot {
  id: string
  description: string
  impact?: string
  status: StepState
}

export interface ConversationSlice {
  state: ConversationState
  transcript: string
}

export interface ExecutionProgress {
  current: number
  total: number
}

export interface ExecutionSlice {
  state: ExecutionState
  progress?: ExecutionProgress
}

export interface CurrentTaskSnapshot {
  id?: string
  title?: string
  summary?: string
  risk?: RiskLevel
  scope?: string
  state: TaskState
  intent: IntentSnapshot
  plan: PlanSnapshot
  completion?: CompletionSnapshot
}

export interface ApprovalSnapshot {
  state: ApprovalFlow
  request?: ApprovalRequestSnapshot
}

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
