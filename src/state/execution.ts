import { createStateMachineDefinition, type TransitionTable } from "@/state/machine"

export const EXECUTION_STATES = [
  "not_started",
  "drafting_plan",
  "waiting_confirmation",
  "executing",
  "paused",
  "completed",
  "failed",
] as const

export type ExecutionState = (typeof EXECUTION_STATES)[number]

export type ExecutionEvent =
  | { type: "START_PLANNING" }
  | { type: "PLAN_READY_FOR_CONFIRMATION" }
  | { type: "CONFIRM" }
  | { type: "EDIT_PLAN" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "COMPLETE" }
  | { type: "FAIL" }
  | { type: "RETRY" }
  | { type: "REPLAY" }
  | { type: "CANCEL" }
  | { type: "RESET" }

const transitions = {
  not_started: {
    START_PLANNING: "drafting_plan",
  },
  drafting_plan: {
    PLAN_READY_FOR_CONFIRMATION: "waiting_confirmation",
    COMPLETE: "completed",
    FAIL: "failed",
    CANCEL: "not_started",
  },
  waiting_confirmation: {
    CONFIRM: "executing",
    EDIT_PLAN: "drafting_plan",
    FAIL: "failed",
    CANCEL: "not_started",
  },
  executing: {
    PAUSE: "paused",
    COMPLETE: "completed",
    FAIL: "failed",
    CANCEL: "not_started",
  },
  paused: {
    RESUME: "executing",
    CANCEL: "not_started",
  },
  completed: {
    REPLAY: "drafting_plan",
    RESET: "not_started",
  },
  failed: {
    EDIT_PLAN: "drafting_plan",
    RETRY: "drafting_plan",
    CANCEL: "not_started",
    RESET: "not_started",
  },
} satisfies TransitionTable<ExecutionState, ExecutionEvent>

export const executionStateMachine = createStateMachineDefinition({
  name: "ExecutionState",
  initialState: "not_started" as ExecutionState,
  transitions,
})

export const createExecutionMachine = (
  initialState: ExecutionState = executionStateMachine.initialState,
) => executionStateMachine.createMachine(initialState)
