import { createStateMachineDefinition, type TransitionTable } from "@/state/machine"

export const APPROVAL_FLOW_STATES = [
  "not_needed",
  "requested",
  "editing",
  "granted",
  "authorizing",
  "denied",
  "done",
] as const

export type ApprovalFlow = (typeof APPROVAL_FLOW_STATES)[number]

export type ApprovalEvent =
  | { type: "RISKY_ACTION_DETECTED" }
  | { type: "USER_APPROVES" }
  | { type: "USER_EDITS" }
  | { type: "USER_CANCELS" }
  | { type: "RESUBMIT" }
  | { type: "CANCEL" }
  | { type: "REQUIRES_PASSWORD" }
  | { type: "EXECUTE" }
  | { type: "SUCCESS" }
  | { type: "FAIL" }

const transitions = {
  not_needed: {
    RISKY_ACTION_DETECTED: "requested",
  },
  requested: {
    USER_APPROVES: "granted",
    USER_EDITS: "editing",
    USER_CANCELS: "denied",
  },
  editing: {
    RESUBMIT: "requested",
    CANCEL: "denied",
  },
  granted: {
    REQUIRES_PASSWORD: "authorizing",
    EXECUTE: "done",
  },
  authorizing: {
    SUCCESS: "done",
    FAIL: "denied",
  },
  denied: {},
  done: {},
} satisfies TransitionTable<ApprovalFlow, ApprovalEvent>

export const approvalFlowMachine = createStateMachineDefinition({
  name: "ApprovalFlow",
  initialState: "not_needed" as ApprovalFlow,
  transitions,
})

export const createApprovalFlowMachine = (
  initialState: ApprovalFlow = approvalFlowMachine.initialState,
) => approvalFlowMachine.createMachine(initialState)
