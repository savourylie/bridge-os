export {
  APPROVAL_FLOW_STATES,
  approvalFlowMachine,
  createApprovalFlowMachine,
  type ApprovalEvent,
  type ApprovalFlow,
} from "@/state/approval"
export {
  CONVERSATION_STATES,
  conversationStateMachine,
  createConversationMachine,
  type ConversationEvent,
  type ConversationState,
} from "@/state/conversation"
export {
  useApproval,
  useConversationState,
  useCurrentTask,
  useEventHistory,
  useExecutionState,
  useTimeline,
} from "@/state/hooks"
export {
  EXECUTION_STATES,
  executionStateMachine,
  createExecutionMachine,
  type ExecutionEvent,
  type ExecutionState,
} from "@/state/execution"
export type {
  ApprovalRequestSnapshot,
  ApprovalSnapshot,
  BridgeEvent,
  CompletionChanges,
  CompletionSnapshot,
  ConversationSlice,
  CurrentTaskSnapshot,
  EventHistoryEntry,
  ExecutionProgress,
  ExecutionSlice,
  IntentQuestion,
  IntentSnapshot,
  PlanSnapshot,
  PlanState,
  PlanStepSnapshot,
  RiskLevel,
  SystemState,
  TimedBridgeEvent,
  TimelineStepSnapshot,
} from "@/state/events"
export {
  createStateMachineDefinition,
  type MachineDefinition,
  type MachineEvent,
  type StatefulMachine,
  type TransitionTable,
} from "@/state/machine"
export {
  cancel,
  createMockEventDispatcher,
  mockEventDispatcher,
  play,
  step,
  type MockEventDispatcher,
} from "@/state/mock-dispatcher"
export {
  createStepMachine,
  STEP_STATES,
  stepStateMachine,
  type StepEvent,
  type StepState,
} from "@/state/step"
export {
  bridgeStore,
  createBridgeStore,
  deriveExecutionProgress,
  dispatchBridgeEvent,
  hydrateSystemState,
  resetBridgeStore,
  replaceFromSystemState,
  type BridgeStoreApi,
  type BridgeStoreData,
  type BridgeStoreState,
  type CreateBridgeStoreOptions,
} from "@/state/store"
export {
  createTaskMachine,
  TASK_STATES,
  taskStateMachine,
  type TaskEvent,
  type TaskState,
} from "@/state/task"

// These paired states represent the same approval checkpoint across domains.
export const APPROVAL_CHECKPOINT_STATES = Object.freeze({
  task: "waiting_approval",
  execution: "waiting_confirmation",
  approval: "requested",
} as const)
