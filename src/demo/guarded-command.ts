import type {
  ApprovalRequestSnapshot,
  CompletionSnapshot,
  TimedBridgeEvent,
  TimelineStepSnapshot,
} from "@/state"

export type GuardedCommandBranch = "pending" | "approved" | "denied"

export const GUARDED_COMMAND_TASK = Object.freeze({
  id: "demo-guarded-command",
  title: "Run Guarded Command",
  summary:
    "BridgeOS will validate and run `git status` inside the guarded scope, then report the output.",
  risk: "medium" as const,
  scope: "~/Projects/bridge-os",
})

export const GUARDED_COMMAND_INTENT = Object.freeze({
  goal: "Run guarded command git status inside the guarded workspace",
  scope: "~/Projects/bridge-os",
})

export const GUARDED_COMMAND_PLAN_STEPS = Object.freeze([
  {
    id: "plan-1",
    description: "Prepare the guarded command and scope",
  },
  {
    id: "plan-2",
    description: "Run `git status`",
  },
  {
    id: "plan-3",
    description: "Summarize stdout and stderr",
  },
])

export const GUARDED_COMMAND_TIMELINE: TimelineStepSnapshot[] = [
  {
    id: "step-1",
    description: "Prepare the guarded command and scope",
    status: "pending",
  },
  {
    id: "step-2",
    description: "Run `git status`",
    status: "pending",
  },
  {
    id: "step-3",
    description: "Summarize stdout and stderr",
    status: "pending",
  },
]

export const GUARDED_COMMAND_APPROVAL: ApprovalRequestSnapshot = {
  action: "Run `git status` inside the guarded workspace",
  riskLevel: "medium",
  explanation:
    "This command is on the guarded allowlist, but it still needs a recap before it runs.",
  willAffect: ["run `git status` inside the guarded workspace"],
  willNotAffect: ["install packages", "write outside the guarded workspace"],
  impactSummary: "Primary scope: ~/Projects/bridge-os",
  command: "git status",
}

export const GUARDED_COMMAND_COMPLETION: CompletionSnapshot = {
  title: "Run Guarded Command",
  outcome:
    "Command `git status` completed successfully. On branch main, nothing to commit, working tree clean.",
  changes: {
    created: 0,
    modified: 0,
    moved: 0,
    deleted: 0,
    network: false,
  },
}

function timed(delayMs: number, event: TimedBridgeEvent["event"]): TimedBridgeEvent {
  return { delayMs, event }
}

function planSteps(count: number) {
  return GUARDED_COMMAND_PLAN_STEPS.slice(0, count).map((step) => ({ ...step }))
}

function timelineSteps() {
  return GUARDED_COMMAND_TIMELINE.map((step) => ({ ...step }))
}

export const GUARDED_COMMAND_PRE_APPROVAL_SEQUENCE: TimedBridgeEvent[] = [
  timed(200, {
    type: "TASK_TRANSITION",
    payload: { event: { type: "USER_INVOKES" } },
  }),
  timed(0, {
    type: "CONVERSATION_TRANSITION",
    payload: { event: { type: "START_LISTENING" } },
  }),
  timed(260, {
    type: "TRANSCRIPT_UPDATED",
    payload: { text: "Computer," },
  }),
  timed(260, {
    type: "TRANSCRIPT_UPDATED",
    payload: { text: "Computer, run" },
  }),
  timed(260, {
    type: "TRANSCRIPT_UPDATED",
    payload: { text: "Computer, run git status in my bridge-os project." },
  }),
  timed(280, {
    type: "TASK_TRANSITION",
    payload: { event: { type: "TRANSCRIPT_READY" } },
  }),
  timed(0, {
    type: "TASK_METADATA_UPDATED",
    payload: { ...GUARDED_COMMAND_TASK },
  }),
  timed(320, {
    type: "INTENT_UPDATED",
    payload: { goal: GUARDED_COMMAND_INTENT.goal },
  }),
  timed(280, {
    type: "INTENT_UPDATED",
    payload: { scope: GUARDED_COMMAND_INTENT.scope },
  }),
  timed(260, {
    type: "TASK_TRANSITION",
    payload: { event: { type: "INTENT_RESOLVED" } },
  }),
  timed(0, {
    type: "CONVERSATION_TRANSITION",
    payload: { event: { type: "LOCK_INTENT" } },
  }),
  timed(0, {
    type: "EXECUTION_TRANSITION",
    payload: { event: { type: "START_PLANNING" } },
  }),
  timed(240, {
    type: "PLAN_UPDATED",
    payload: {
      title: "Draft plan",
      steps: planSteps(1),
      planState: "drafting",
    },
  }),
  timed(220, {
    type: "PLAN_UPDATED",
    payload: {
      steps: planSteps(2),
      planState: "drafting",
    },
  }),
  timed(220, {
    type: "PLAN_UPDATED",
    payload: {
      steps: planSteps(3),
      planState: "ready",
    },
  }),
  timed(300, {
    type: "TIMELINE_REPLACED",
    payload: { steps: timelineSteps() },
  }),
  timed(200, {
    type: "EXECUTION_TRANSITION",
    payload: { event: { type: "PLAN_READY_FOR_CONFIRMATION" } },
  }),
  timed(0, {
    type: "TASK_TRANSITION",
    payload: { event: { type: "SAFE_TO_RUN" } },
  }),
  timed(0, {
    type: "EXECUTION_TRANSITION",
    payload: { event: { type: "CONFIRM" } },
  }),
  // Step 1 (Prepare) runs without approval.
  timed(240, {
    type: "STEP_TRANSITION",
    payload: {
      stepId: "step-1",
      event: { type: "RUN" },
      patch: { impact: "Preparing `git status` in ~/Projects/bridge-os" },
    },
  }),
  timed(360, {
    type: "STEP_TRANSITION",
    payload: {
      stepId: "step-1",
      event: { type: "SUCCESS" },
      patch: { impact: "Prepared `git status` in ~/Projects/bridge-os." },
    },
  }),
  // Step 2 (RunCommand) requires approval.
  timed(220, {
    type: "STEP_TRANSITION",
    payload: {
      stepId: "step-2",
      event: { type: "REQUIRES_APPROVAL" },
      patch: { impact: "Waiting for approval to run `git status`" },
    },
  }),
  timed(0, {
    type: "APPROVAL_TRANSITION",
    payload: {
      event: { type: "RISKY_ACTION_DETECTED" },
      request: GUARDED_COMMAND_APPROVAL,
    },
  }),
]

export const GUARDED_COMMAND_APPROVE_SEQUENCE: TimedBridgeEvent[] = [
  timed(0, {
    type: "APPROVAL_TRANSITION",
    payload: { event: { type: "USER_APPROVES" } },
  }),
  timed(0, {
    type: "PLAN_UPDATED",
    payload: { planState: "approved" },
  }),
  timed(220, {
    type: "STEP_TRANSITION",
    payload: {
      stepId: "step-2",
      event: { type: "APPROVE" },
      patch: { impact: "Approval granted" },
    },
  }),
  timed(480, {
    type: "STEP_TRANSITION",
    payload: {
      stepId: "step-2",
      event: { type: "SUCCESS" },
      patch: {
        impact:
          "`git status`: On branch main nothing to commit, working tree clean",
      },
    },
  }),
  timed(0, {
    type: "APPROVAL_TRANSITION",
    payload: { event: { type: "EXECUTE" } },
  }),
  timed(220, {
    type: "STEP_TRANSITION",
    payload: {
      stepId: "step-3",
      event: { type: "RUN" },
      patch: { impact: "Summarizing command output" },
    },
  }),
  timed(300, {
    type: "STEP_TRANSITION",
    payload: {
      stepId: "step-3",
      event: { type: "SUCCESS" },
      patch: { impact: "Command completed without errors." },
    },
  }),
  timed(180, {
    type: "TASK_TRANSITION",
    payload: { event: { type: "ALL_STEPS_COMPLETE" } },
  }),
  timed(0, {
    type: "EXECUTION_TRANSITION",
    payload: { event: { type: "COMPLETE" } },
  }),
  timed(220, {
    type: "COMPLETION_RECORDED",
    payload: { ...GUARDED_COMMAND_COMPLETION },
  }),
]

export const GUARDED_COMMAND_DENY_SEQUENCE: TimedBridgeEvent[] = [
  timed(0, {
    type: "APPROVAL_TRANSITION",
    payload: { event: { type: "USER_CANCELS" } },
  }),
  timed(0, {
    type: "PLAN_UPDATED",
    payload: { planState: "cancelled" },
  }),
  timed(220, {
    type: "STEP_TRANSITION",
    payload: {
      stepId: "step-2",
      event: { type: "DENY" },
      patch: { impact: "Command run cancelled by user" },
    },
  }),
  timed(0, {
    type: "TASK_TRANSITION",
    payload: { event: { type: "STOP" } },
  }),
  timed(0, {
    type: "EXECUTION_TRANSITION",
    payload: { event: { type: "CANCEL" } },
  }),
  timed(0, {
    type: "CONVERSATION_TRANSITION",
    payload: { event: { type: "RESET" } },
  }),
]

export const GUARDED_COMMAND_APPROVAL_INDEX =
  GUARDED_COMMAND_PRE_APPROVAL_SEQUENCE.length

export function getGuardedCommandSequence(
  branch: GuardedCommandBranch,
): TimedBridgeEvent[] {
  if (branch === "approved") {
    return [
      ...GUARDED_COMMAND_PRE_APPROVAL_SEQUENCE,
      ...GUARDED_COMMAND_APPROVE_SEQUENCE,
    ]
  }

  if (branch === "denied") {
    return [
      ...GUARDED_COMMAND_PRE_APPROVAL_SEQUENCE,
      ...GUARDED_COMMAND_DENY_SEQUENCE,
    ]
  }

  return [...GUARDED_COMMAND_PRE_APPROVAL_SEQUENCE]
}
