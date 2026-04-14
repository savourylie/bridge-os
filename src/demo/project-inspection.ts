import type {
  CompletionSnapshot,
  TimedBridgeEvent,
  TimelineStepSnapshot,
} from "@/state"

export const PROJECT_INSPECTION_TASK = Object.freeze({
  id: "demo-inspect-project",
  title: "Inspect ~/Projects/bridge-os",
  summary:
    "BridgeOS will scan ~/Projects/bridge-os, analyze its contents, and produce a concise summary.",
  risk: "low" as const,
  scope: "~/Projects/bridge-os",
})

export const PROJECT_INSPECTION_INTENT = Object.freeze({
  goal: "Inspect ~/Projects/bridge-os",
  scope: "~/Projects/bridge-os",
})

export const PROJECT_INSPECTION_PLAN_STEPS = Object.freeze([
  {
    id: "plan-1",
    description: "Scan ~/Projects/bridge-os",
  },
  {
    id: "plan-2",
    description: "Analyze the directory structure and file mix",
  },
  {
    id: "plan-3",
    description: "Summarize the inspection results",
  },
])

export const PROJECT_INSPECTION_TIMELINE: TimelineStepSnapshot[] = [
  {
    id: "step-1",
    description: "Scan ~/Projects/bridge-os",
    status: "pending",
  },
  {
    id: "step-2",
    description: "Analyze the directory structure and file mix",
    status: "pending",
  },
  {
    id: "step-3",
    description: "Summarize the inspection results",
    status: "pending",
  },
]

export const PROJECT_INSPECTION_COMPLETION: CompletionSnapshot = {
  title: "Inspect ~/Projects/bridge-os",
  outcome:
    "Found 10 files and 0 directories in ~/Projects/bridge-os. The project contains Rust and TypeScript source files, configuration files, and documentation.",
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
  return PROJECT_INSPECTION_PLAN_STEPS.slice(0, count).map((step) => ({ ...step }))
}

function timelineSteps() {
  return PROJECT_INSPECTION_TIMELINE.map((step) => ({ ...step }))
}

// Project inspection has no approval gate — execution runs automatically after intent stabilizes.
export const PROJECT_INSPECTION_FULL_SEQUENCE: TimedBridgeEvent[] = [
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
    payload: { text: "Computer, inspect" },
  }),
  timed(260, {
    type: "TRANSCRIPT_UPDATED",
    payload: { text: "Computer, inspect my bridge-os project." },
  }),
  timed(280, {
    type: "TASK_TRANSITION",
    payload: { event: { type: "TRANSCRIPT_READY" } },
  }),
  timed(0, {
    type: "TASK_METADATA_UPDATED",
    payload: { ...PROJECT_INSPECTION_TASK },
  }),
  timed(320, {
    type: "INTENT_UPDATED",
    payload: { goal: PROJECT_INSPECTION_INTENT.goal },
  }),
  timed(280, {
    type: "INTENT_UPDATED",
    payload: { scope: PROJECT_INSPECTION_INTENT.scope },
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
      planState: "approved",
    },
  }),
  timed(300, {
    type: "TIMELINE_REPLACED",
    payload: { steps: timelineSteps() },
  }),
  timed(200, {
    type: "EXECUTION_TRANSITION",
    payload: { event: { type: "CONFIRM" } },
  }),
  timed(0, {
    type: "TASK_TRANSITION",
    payload: { event: { type: "SAFE_TO_RUN" } },
  }),
  // Execution proceeds immediately — no approval gate for read-only inspection.
  timed(240, {
    type: "STEP_TRANSITION",
    payload: {
      stepId: "step-1",
      event: { type: "RUN" },
      patch: { impact: "Scanning ~/Projects/bridge-os" },
    },
  }),
  timed(420, {
    type: "STEP_TRANSITION",
    payload: {
      stepId: "step-1",
      event: { type: "SUCCESS" },
      patch: { impact: "Scanned 10 entries in ~/Projects/bridge-os." },
    },
  }),
  timed(220, {
    type: "STEP_TRANSITION",
    payload: {
      stepId: "step-2",
      event: { type: "RUN" },
      patch: { impact: "Analyzing file types and structure" },
    },
  }),
  timed(360, {
    type: "STEP_TRANSITION",
    payload: {
      stepId: "step-2",
      event: { type: "SUCCESS" },
      patch: { impact: "Found 10 files and 0 directories." },
    },
  }),
  timed(220, {
    type: "STEP_TRANSITION",
    payload: {
      stepId: "step-3",
      event: { type: "RUN" },
      patch: { impact: "Producing inspection summary" },
    },
  }),
  timed(360, {
    type: "STEP_TRANSITION",
    payload: {
      stepId: "step-3",
      event: { type: "SUCCESS" },
      patch: { impact: "Found 10 files and 0 directories in the selected project." },
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
    payload: { ...PROJECT_INSPECTION_COMPLETION },
  }),
]

export function getProjectInspectionSequence(): TimedBridgeEvent[] {
  return [...PROJECT_INSPECTION_FULL_SEQUENCE]
}
