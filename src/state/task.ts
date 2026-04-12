import { createStateMachineDefinition, type TransitionTable } from "@/state/machine"

export const TASK_STATES = [
  "idle",
  "listening",
  "understanding",
  "planning",
  "waiting_approval",
  "executing",
  "paused",
  "completed",
  "cancelled",
  "reverted",
  "failed",
] as const

export type TaskState = (typeof TASK_STATES)[number]

export type TaskEvent =
  | { type: "USER_INVOKES" }
  | { type: "TRANSCRIPT_READY" }
  | { type: "INTENT_RESOLVED" }
  | { type: "NO_ACTION_NEEDED" }
  | { type: "APPROVAL_REQUIRED" }
  | { type: "SAFE_TO_RUN" }
  | { type: "APPROVE" }
  | { type: "EDIT_PLAN" }
  | { type: "CANCEL" }
  | { type: "PAUSE" }
  | { type: "STOP" }
  | { type: "STEP_FAILED" }
  | { type: "ALL_STEPS_COMPLETE" }
  | { type: "RESUME" }
  | { type: "UNDO" }
  | { type: "REPLAY" }
  | { type: "RETRY" }

const transitions = {
  idle: {
    USER_INVOKES: "listening",
  },
  listening: {
    TRANSCRIPT_READY: "understanding",
  },
  understanding: {
    INTENT_RESOLVED: "planning",
  },
  planning: {
    NO_ACTION_NEEDED: "completed",
    APPROVAL_REQUIRED: "waiting_approval",
    SAFE_TO_RUN: "executing",
  },
  waiting_approval: {
    APPROVE: "executing",
    EDIT_PLAN: "planning",
    CANCEL: "cancelled",
  },
  executing: {
    PAUSE: "paused",
    STOP: "cancelled",
    STEP_FAILED: "failed",
    ALL_STEPS_COMPLETE: "completed",
  },
  paused: {
    RESUME: "executing",
    STOP: "cancelled",
  },
  completed: {
    UNDO: "reverted",
    REPLAY: "planning",
  },
  cancelled: {},
  reverted: {},
  failed: {
    RETRY: "planning",
    CANCEL: "cancelled",
  },
} satisfies TransitionTable<TaskState, TaskEvent>

export const taskStateMachine = createStateMachineDefinition({
  name: "TaskState",
  initialState: "idle" as TaskState,
  transitions,
})

export const createTaskMachine = (
  initialState: TaskState = taskStateMachine.initialState,
) => taskStateMachine.createMachine(initialState)
