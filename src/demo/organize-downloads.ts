import type {
  ApprovalRequestSnapshot,
  CompletionSnapshot,
  TimedBridgeEvent,
  TimelineStepSnapshot,
} from "@/state"

export type OrganizeDownloadsBranch = "pending" | "approved" | "denied"

export const ORGANIZE_DOWNLOADS_TASK = Object.freeze({
  id: "demo-organize-downloads",
  title: "Organize Downloads",
  summary:
    "Sorting screenshots into month folders, preserving excluded files, and waiting for confirmation before file writes.",
  risk: "medium" as const,
  scope: "Downloads only",
})

export const ORGANIZE_DOWNLOADS_INTENT = Object.freeze({
  goal: "Organize screenshots in ~/Downloads by month",
  scope: "~/Downloads only",
  constraints: "Keep original filenames and preserve rollback metadata",
  exclusions: "Ignore PDFs, zip files, hidden files, and installers",
})

export const ORGANIZE_DOWNLOADS_PLAN_STEPS = Object.freeze([
  {
    id: "plan-1",
    description: "Scan ~/Downloads for screenshots and excluded file types",
  },
  {
    id: "plan-2",
    description: "Group screenshots by month and prepare destination folders",
  },
  {
    id: "plan-3",
    description: "Record rollback metadata for every planned move",
  },
  {
    id: "plan-4",
    description: "Move approved screenshots into month folders",
  },
  {
    id: "plan-5",
    description: "Verify the new layout and present a completion summary",
  },
])

export const ORGANIZE_DOWNLOADS_TIMELINE: TimelineStepSnapshot[] = [
  {
    id: "step-1",
    description: "Scan ~/Downloads for candidate screenshots",
    status: "pending",
  },
  {
    id: "step-2",
    description: "Filter out PDFs, zip files, hidden files, and installers",
    status: "pending",
  },
  {
    id: "step-3",
    description: "Prepare month folders and rollback metadata",
    status: "pending",
  },
  {
    id: "step-4",
    description: "Move approved screenshots into month folders",
    status: "pending",
  },
  {
    id: "step-5",
    description: "Verify results and present the completion summary",
    status: "pending",
  },
]

export const ORGANIZE_DOWNLOADS_APPROVAL: ApprovalRequestSnapshot = {
  action: "Move 133 screenshots into month folders inside ~/Downloads",
  willAffect: [
    "create 6 month folders inside ~/Downloads",
    "move 133 screenshots without changing filenames",
    "save rollback metadata for the next 30 minutes",
  ],
  willNotAffect: [
    "delete files",
    "touch PDFs or zip files",
    "write outside ~/Downloads",
  ],
  impactSummary:
    "Writes stay inside ~/Downloads. No network or elevated access is required, but the file move is still gated for confirmation.",
  command:
    "bridgeos file-organize --target ~/Downloads --group-by month --exclude pdf,zip,hidden,installer",
}

export const ORGANIZE_DOWNLOADS_COMPLETION: CompletionSnapshot = {
  title: "Downloads Organized",
  outcome:
    "BridgeOS grouped 133 screenshots into 6 month folders in ~/Downloads. PDFs, zip files, hidden files, and installers were left untouched.",
  changes: {
    created: 6,
    modified: 0,
    moved: 133,
    deleted: 0,
    network: false,
  },
  rollbackAvailable: true,
  rollbackTimeRemaining: "30 minutes",
}

function timed(delayMs: number, event: TimedBridgeEvent["event"]): TimedBridgeEvent {
  return { delayMs, event }
}

function planSteps(count: number) {
  return ORGANIZE_DOWNLOADS_PLAN_STEPS.slice(0, count).map((step) => ({ ...step }))
}

function timelineSteps() {
  return ORGANIZE_DOWNLOADS_TIMELINE.map((step) => ({ ...step }))
}

export const ORGANIZE_DOWNLOADS_PRE_APPROVAL_SEQUENCE: TimedBridgeEvent[] = [
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
    payload: { text: "Computer, organize" },
  }),
  timed(260, {
    type: "TRANSCRIPT_UPDATED",
    payload: { text: "Computer, organize my Downloads." },
  }),
  timed(260, {
    type: "TRANSCRIPT_UPDATED",
    payload: { text: "Computer, organize my Downloads. Screenshots only." },
  }),
  timed(260, {
    type: "TRANSCRIPT_UPDATED",
    payload: {
      text: "Computer, organize my Downloads. Screenshots only. Don't touch PDFs or zip files.",
    },
  }),
  timed(280, {
    type: "TASK_TRANSITION",
    payload: { event: { type: "TRANSCRIPT_READY" } },
  }),
  timed(0, {
    type: "TASK_METADATA_UPDATED",
    payload: { ...ORGANIZE_DOWNLOADS_TASK },
  }),
  timed(320, {
    type: "INTENT_UPDATED",
    payload: { goal: ORGANIZE_DOWNLOADS_INTENT.goal },
  }),
  timed(280, {
    type: "INTENT_UPDATED",
    payload: { scope: ORGANIZE_DOWNLOADS_INTENT.scope },
  }),
  timed(280, {
    type: "INTENT_UPDATED",
    payload: { constraints: ORGANIZE_DOWNLOADS_INTENT.constraints },
  }),
  timed(280, {
    type: "INTENT_UPDATED",
    payload: { exclusions: ORGANIZE_DOWNLOADS_INTENT.exclusions },
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
      planState: "drafting",
    },
  }),
  timed(220, {
    type: "PLAN_UPDATED",
    payload: {
      steps: planSteps(4),
      planState: "drafting",
    },
  }),
  timed(220, {
    type: "PLAN_UPDATED",
    payload: {
      steps: planSteps(5),
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
  timed(240, {
    type: "STEP_TRANSITION",
    payload: {
      stepId: "step-1",
      event: { type: "RUN" },
      patch: { impact: "Scanning 152 files" },
    },
  }),
  timed(420, {
    type: "STEP_TRANSITION",
    payload: {
      stepId: "step-1",
      event: { type: "SUCCESS" },
      patch: { impact: "133 screenshots identified" },
    },
  }),
  timed(220, {
    type: "STEP_TRANSITION",
    payload: {
      stepId: "step-2",
      event: { type: "RUN" },
      patch: { impact: "Filtering excluded file types" },
    },
  }),
  timed(360, {
    type: "STEP_TRANSITION",
    payload: {
      stepId: "step-2",
      event: { type: "SUCCESS" },
      patch: { impact: "19 files excluded" },
    },
  }),
  timed(220, {
    type: "STEP_TRANSITION",
    payload: {
      stepId: "step-3",
      event: { type: "RUN" },
      patch: { impact: "Preparing month folders" },
    },
  }),
  timed(360, {
    type: "STEP_TRANSITION",
    payload: {
      stepId: "step-3",
      event: { type: "SUCCESS" },
      patch: { impact: "6 folders staged, rollback ready" },
    },
  }),
  timed(220, {
    type: "STEP_TRANSITION",
    payload: {
      stepId: "step-4",
      event: { type: "RUN" },
      patch: { impact: "Previewing 133 moves" },
    },
  }),
  timed(320, {
    type: "STEP_TRANSITION",
    payload: {
      stepId: "step-4",
      event: { type: "REQUIRES_APPROVAL" },
      patch: { impact: "133 writes waiting for approval" },
    },
  }),
  timed(0, {
    type: "APPROVAL_TRANSITION",
    payload: {
      event: { type: "RISKY_ACTION_DETECTED" },
      request: ORGANIZE_DOWNLOADS_APPROVAL,
    },
  }),
]

export const ORGANIZE_DOWNLOADS_APPROVE_SEQUENCE: TimedBridgeEvent[] = [
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
      stepId: "step-4",
      event: { type: "APPROVE" },
      patch: { impact: "Approval granted" },
    },
  }),
  timed(380, {
    type: "STEP_TRANSITION",
    payload: {
      stepId: "step-4",
      event: { type: "SUCCESS" },
      patch: { impact: "133 screenshots moved" },
    },
  }),
  timed(0, {
    type: "APPROVAL_TRANSITION",
    payload: { event: { type: "EXECUTE" } },
  }),
  timed(220, {
    type: "STEP_TRANSITION",
    payload: {
      stepId: "step-5",
      event: { type: "RUN" },
      patch: { impact: "Verifying the new folder layout" },
    },
  }),
  timed(360, {
    type: "STEP_TRANSITION",
    payload: {
      stepId: "step-5",
      event: { type: "SUCCESS" },
      patch: { impact: "6 folders organized successfully" },
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
    payload: { ...ORGANIZE_DOWNLOADS_COMPLETION },
  }),
]

export const ORGANIZE_DOWNLOADS_DENY_SEQUENCE: TimedBridgeEvent[] = [
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
      stepId: "step-4",
      event: { type: "DENY" },
      patch: { impact: "Move cancelled by user" },
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

export const ORGANIZE_DOWNLOADS_APPROVAL_INDEX =
  ORGANIZE_DOWNLOADS_PRE_APPROVAL_SEQUENCE.length

export function getOrganizeDownloadsSequence(
  branch: OrganizeDownloadsBranch,
): TimedBridgeEvent[] {
  if (branch === "approved") {
    return [
      ...ORGANIZE_DOWNLOADS_PRE_APPROVAL_SEQUENCE,
      ...ORGANIZE_DOWNLOADS_APPROVE_SEQUENCE,
    ]
  }

  if (branch === "denied") {
    return [
      ...ORGANIZE_DOWNLOADS_PRE_APPROVAL_SEQUENCE,
      ...ORGANIZE_DOWNLOADS_DENY_SEQUENCE,
    ]
  }

  return [...ORGANIZE_DOWNLOADS_PRE_APPROVAL_SEQUENCE]
}
