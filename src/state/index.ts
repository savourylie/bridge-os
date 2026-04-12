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
  EXECUTION_STATES,
  executionStateMachine,
  createExecutionMachine,
  type ExecutionEvent,
  type ExecutionState,
} from "@/state/execution"
export {
  createStateMachineDefinition,
  type MachineDefinition,
  type MachineEvent,
  type StatefulMachine,
  type TransitionTable,
} from "@/state/machine"
export {
  createStepMachine,
  STEP_STATES,
  stepStateMachine,
  type StepEvent,
  type StepState,
} from "@/state/step"
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
