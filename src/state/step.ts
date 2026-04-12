import { createStateMachineDefinition, type TransitionTable } from "@/state/machine"

export const STEP_STATES = [
  "pending",
  "running",
  "waiting_approval",
  "completed",
  "failed",
  "skipped",
  "blocked",
  "reverted",
] as const

export type StepState = (typeof STEP_STATES)[number]

export type StepEvent =
  | { type: "RUN" }
  | { type: "SKIP" }
  | { type: "BLOCK_BY_DEPENDENCY" }
  | { type: "SUCCESS" }
  | { type: "REQUIRES_APPROVAL" }
  | { type: "RECOVERABLE_ERROR" }
  | { type: "STOP" }
  | { type: "APPROVE" }
  | { type: "DENY" }
  | { type: "CANCEL_TASK" }
  | { type: "UNDO" }
  | { type: "RETRY" }

const transitions = {
  pending: {
    RUN: "running",
    SKIP: "skipped",
    BLOCK_BY_DEPENDENCY: "blocked",
  },
  running: {
    SUCCESS: "completed",
    REQUIRES_APPROVAL: "waiting_approval",
    RECOVERABLE_ERROR: "failed",
    STOP: "blocked",
  },
  waiting_approval: {
    APPROVE: "running",
    DENY: "skipped",
    CANCEL_TASK: "blocked",
  },
  completed: {
    UNDO: "reverted",
  },
  failed: {
    RETRY: "running",
    SKIP: "skipped",
  },
  skipped: {},
  blocked: {},
  reverted: {},
} satisfies TransitionTable<StepState, StepEvent>

export const stepStateMachine = createStateMachineDefinition({
  name: "StepState",
  initialState: "pending" as StepState,
  transitions,
})

export const createStepMachine = (
  initialState: StepState = stepStateMachine.initialState,
) => stepStateMachine.createMachine(initialState)
