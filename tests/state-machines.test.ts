import { describe, expect, it } from "vitest"

import {
  APPROVAL_CHECKPOINT_STATES,
  APPROVAL_FLOW_STATES,
  CONVERSATION_STATES,
  EXECUTION_STATES,
  STEP_STATES,
  TASK_STATES,
  approvalFlowMachine,
  conversationStateMachine,
  createApprovalFlowMachine,
  createConversationMachine,
  createExecutionMachine,
  createStepMachine,
  createTaskMachine,
  executionStateMachine,
  stepStateMachine,
  taskStateMachine,
} from "../src/state"

describe("conversationStateMachine", () => {
  it("supports the conservative conversation lifecycle and interrupt path", () => {
    const machine = createConversationMachine()

    expect(machine.currentState).toBe("idle")
    expect(machine.canTransition({ type: "START_LISTENING" })).toBe(true)

    machine.transition({ type: "START_LISTENING" })
    machine.transition({ type: "HOLD_FOR_MORE" })
    machine.transition({ type: "LOCK_INTENT" })
    machine.transition({ type: "START_SPEAKING" })
    machine.transition({ type: "INTERRUPT" })

    expect(machine.currentState).toBe("interrupted")
  })

  it("allows speaking to transition back to listening when TTS finishes", () => {
    expect(
      conversationStateMachine.transition("speaking", { type: "START_LISTENING" }),
    ).toBe("listening")
  })

  it("throws on invalid conversation transitions", () => {
    expect(() =>
      conversationStateMachine.transition("idle", { type: "INTERRUPT" }),
    ).toThrow("Invalid ConversationState transition: idle -> INTERRUPT")
  })

  it("allows reset back to idle from active states", () => {
    expect(
      conversationStateMachine.transition("clarifying", { type: "RESET" }),
    ).toBe("idle")
    expect(conversationStateMachine.canTransition("speaking", { type: "RESET" })).toBe(
      true,
    )
  })
})

describe("executionStateMachine", () => {
  it("supports planning, confirmation, pause, resume, and completion", () => {
    const machine = createExecutionMachine()

    machine.transition({ type: "START_PLANNING" })
    machine.transition({ type: "PLAN_READY_FOR_CONFIRMATION" })
    machine.transition({ type: "CONFIRM" })
    machine.transition({ type: "PAUSE" })
    machine.transition({ type: "RESUME" })
    machine.transition({ type: "COMPLETE" })

    expect(machine.currentState).toBe("completed")
  })

  it("throws on invalid execution transitions", () => {
    expect(() =>
      executionStateMachine.transition("not_started", { type: "CONFIRM" }),
    ).toThrow("Invalid ExecutionState transition: not_started -> CONFIRM")
  })

  it("supports failure recovery back into planning", () => {
    expect(
      executionStateMachine.transition("failed", { type: "RETRY" }),
    ).toBe("drafting_plan")
    expect(
      executionStateMachine.transition("completed", { type: "RESET" }),
    ).toBe("not_started")
  })
})

describe("taskStateMachine", () => {
  it("supports the full approval-gated task lifecycle", () => {
    const machine = createTaskMachine()

    machine.transition({ type: "USER_INVOKES" })
    machine.transition({ type: "TRANSCRIPT_READY" })
    machine.transition({ type: "INTENT_RESOLVED" })
    machine.transition({ type: "APPROVAL_REQUIRED" })
    machine.transition({ type: "APPROVE" })
    machine.transition({ type: "ALL_STEPS_COMPLETE" })

    expect(machine.currentState).toBe("completed")
  })

  it("throws on invalid task transitions", () => {
    expect(() =>
      taskStateMachine.transition("idle", { type: "APPROVE" }),
    ).toThrow("Invalid TaskState transition: idle -> APPROVE")
  })

  it("treats cancelled and reverted as terminal states", () => {
    expect(taskStateMachine.canTransition("cancelled", { type: "RETRY" })).toBe(
      false,
    )
    expect(() =>
      taskStateMachine.transition("reverted", { type: "REPLAY" }),
    ).toThrow("Invalid TaskState transition: reverted -> REPLAY")
  })
})

describe("stepStateMachine", () => {
  it("supports approval-gated execution and undo", () => {
    const machine = createStepMachine()

    machine.transition({ type: "RUN" })
    machine.transition({ type: "REQUIRES_APPROVAL" })
    machine.transition({ type: "APPROVE" })
    machine.transition({ type: "SUCCESS" })
    machine.transition({ type: "UNDO" })

    expect(machine.currentState).toBe("reverted")
  })

  it("throws on invalid step transitions", () => {
    expect(() =>
      stepStateMachine.transition("pending", { type: "APPROVE" }),
    ).toThrow("Invalid StepState transition: pending -> APPROVE")
  })

  it("treats blocked as terminal", () => {
    expect(stepStateMachine.canTransition("blocked", { type: "RETRY" })).toBe(
      false,
    )
    expect(() =>
      stepStateMachine.transition("blocked", { type: "SUCCESS" }),
    ).toThrow("Invalid StepState transition: blocked -> SUCCESS")
  })
})

describe("approvalFlowMachine", () => {
  it("supports password-gated approvals through completion", () => {
    const machine = createApprovalFlowMachine()

    machine.transition({ type: "RISKY_ACTION_DETECTED" })
    machine.transition({ type: "USER_APPROVES" })
    machine.transition({ type: "REQUIRES_PASSWORD" })
    machine.transition({ type: "SUCCESS" })

    expect(machine.currentState).toBe("done")
  })

  it("supports edit and deny flows", () => {
    expect(
      approvalFlowMachine.transition("requested", { type: "USER_EDITS" }),
    ).toBe("editing")
    expect(
      approvalFlowMachine.transition("editing", { type: "CANCEL" }),
    ).toBe("denied")
  })

  it("treats denied and done as terminal", () => {
    expect(approvalFlowMachine.canTransition("denied", { type: "EXECUTE" })).toBe(
      false,
    )
    expect(() =>
      approvalFlowMachine.transition("done", { type: "FAIL" }),
    ).toThrow("Invalid ApprovalFlow transition: done -> FAIL")
  })
})

describe("cross-machine invariants", () => {
  it("documents the aligned approval checkpoint states", () => {
    expect(APPROVAL_CHECKPOINT_STATES).toEqual({
      task: "waiting_approval",
      execution: "waiting_confirmation",
      approval: "requested",
    })
  })

  it("keeps conversation and execution fully independent", () => {
    for (const conversationState of CONVERSATION_STATES) {
      for (const executionState of EXECUTION_STATES) {
        const conversationMachine = createConversationMachine(conversationState)
        const executionMachine = createExecutionMachine(executionState)

        expect(conversationMachine.currentState).toBe(conversationState)
        expect(executionMachine.currentState).toBe(executionState)
      }
    }
  })

  it("exports the full canonical state sets", () => {
    expect(CONVERSATION_STATES).toHaveLength(7)
    expect(EXECUTION_STATES).toHaveLength(7)
    expect(TASK_STATES).toHaveLength(11)
    expect(STEP_STATES).toHaveLength(8)
    expect(APPROVAL_FLOW_STATES).toHaveLength(7)
  })
})
