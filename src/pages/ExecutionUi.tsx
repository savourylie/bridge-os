import { useState } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ApprovalCard } from "@/components/ui/approval-card"
import { CompletionSummary } from "@/components/ui/completion-summary"
import { DraftPlan, type DraftPlanData } from "@/components/ui/draft-plan"
import { IntentBoard, type IntentData } from "@/components/ui/intent-board"
import { Panel } from "@/components/ui/panel"
import {
  TaskPanel,
  type TaskHeaderData,
  type TaskMetaData,
} from "@/components/ui/task-panel"
import { Timeline, type TimelineData } from "@/components/ui/timeline"

const MOCK_HEADER: TaskHeaderData = {
  title: "Organize Downloads",
  summary:
    "Sorting screenshots into month folders, preserving excluded files, and waiting for confirmation before file writes.",
}

const MOCK_META: TaskMetaData = {
  status: "in_progress",
  risk: "medium",
  scope: "Downloads only",
}

const MOCK_INTENT: IntentData = {
  goal: "Organize screenshots in ~/Downloads by month",
  scope: "~/Downloads only",
  constraints: "Keep original filenames and preserve rollback metadata",
  exclusions: "Ignore PDFs, zip files, hidden files, and installers",
  executionStatus: "waiting_approval",
}

const MOCK_PLAN: DraftPlanData = {
  title: "Approved plan",
  steps: [
    { id: "p1", description: "Scan ~/Downloads for screenshots and excluded file types" },
    { id: "p2", description: "Group screenshots by month and prepare destination folders" },
    { id: "p3", description: "Record rollback metadata for every planned move" },
    { id: "p4", description: "Pause for confirmation before writing changes" },
    { id: "p5", description: "Move approved files and present a completion summary" },
  ],
  planState: "approved",
}

const MOCK_TIMELINE: TimelineData = {
  steps: [
    {
      id: "t1",
      description: "Scan ~/Downloads for candidate screenshots",
      impact: "152 files read",
      status: "completed",
    },
    {
      id: "t2",
      description: "Filter out PDFs, zip files, hidden files, and installers",
      impact: "19 files excluded",
      status: "completed",
    },
    {
      id: "t3",
      description: "Prepare month folders and rollback metadata",
      impact: "6 folders staged",
      status: "completed",
    },
    {
      id: "t4",
      description: "Preview 133 screenshot moves by destination month",
      impact: "133 writes planned",
      status: "running",
    },
    {
      id: "t5",
      description: "Await confirmation before moving files inside ~/Downloads",
      impact: "Rollback ready",
      status: "waiting_approval",
    },
    {
      id: "t6",
      description: "Move approved screenshots into month folders",
      impact: "~1.8 GB moved",
      status: "pending",
    },
  ],
}

export default function ExecutionUiPage() {
  const [panelOpen, setPanelOpen] = useState(true)
  const [rollbackAvailable, setRollbackAvailable] = useState(true)
  const [lastAction, setLastAction] = useState("No interaction recorded yet.")

  return (
    <div className="min-h-screen bg-page p-6 md:p-12 lg:pr-[600px]">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12">
          <Link to="/" className="type-caption text-link hover:underline">
            &larr; Back
          </Link>
          <h1 className="type-h1 text-ink mt-4">Execution UI Checkpoint</h1>
          <p className="type-body text-body-text mt-2">
            Full execution-surface composition for TICKET-014. This route keeps
            the TaskPanel open by default so the stacked IntentBoard, DraftPlan,
            Timeline, ApprovalCard, and CompletionSummary can be verified
            together under real scroll pressure.
          </p>
          <p className="type-caption text-subtle mt-1">
            Source: <span className="type-code">TICKET-014</span>
          </p>
        </div>

        <section className="mb-8">
          <Panel surface="cool" padding="spacious">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant={panelOpen ? "default" : "outline"}
                size="sm"
                className={
                  panelOpen
                    ? "cursor-pointer bg-brand text-white hover:bg-brand-hover"
                    : "cursor-pointer"
                }
                onClick={() => setPanelOpen((open) => !open)}
              >
                {panelOpen ? "Close panel" : "Open panel"}
              </Button>

              <Button
                variant={rollbackAvailable ? "default" : "outline"}
                size="sm"
                className={
                  rollbackAvailable
                    ? "cursor-pointer bg-brand text-white hover:bg-brand-hover"
                    : "cursor-pointer"
                }
                onClick={() => setRollbackAvailable((available) => !available)}
              >
                {rollbackAvailable ? "Hide rollback" : "Show rollback"}
              </Button>
            </div>

            <div className="mt-4 border-t border-divider pt-4">
              <p className="type-body-sm text-body-text">
                Use this page to verify pinned TaskPanel chrome, execution-step
                connector colors, approval interruption styling, and the cool to
                warm register shift at completion.
              </p>
              <p className="type-caption text-subtle mt-2">
                Panel: <span className="type-code">{panelOpen ? "open" : "closed"}</span>
                {" "} | Rollback:{" "}
                <span className="type-code">
                  {rollbackAvailable ? "available" : "hidden"}
                </span>
              </p>
            </div>
          </Panel>
        </section>

        <section className="mb-8">
          <Panel surface="warm" padding="spacious">
            <p className="type-label text-subtle">Interaction Log</p>
            <p className="type-body text-body-text mt-2">{lastAction}</p>
          </Panel>
        </section>
      </div>

      <TaskPanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        header={MOCK_HEADER}
        meta={MOCK_META}
      >
        <div className="flex flex-col gap-4 pb-4">
          <IntentBoard data={MOCK_INTENT} />
          <DraftPlan data={MOCK_PLAN} />
          <Timeline data={MOCK_TIMELINE} />
          <ApprovalCard
            action="Move 133 screenshots into month folders inside ~/Downloads"
            willAffect={[
              "create 6 month folders inside ~/Downloads",
              "move 133 screenshots without changing filenames",
              "save rollback metadata for the next 30 minutes",
            ]}
            willNotAffect={[
              "delete files",
              "touch PDFs or zip files",
              "write outside ~/Downloads",
            ]}
            impactSummary="Writes stay inside ~/Downloads. No network or elevated access is required, but the file move is still gated for confirmation."
            command="bridgeos file-organize --target ~/Downloads --group-by month --exclude pdf,zip,hidden,installer"
            onApprove={() =>
              setLastAction("Approve clicked - file move would proceed after this checkpoint.")
            }
            onDeny={() =>
              setLastAction("Deny clicked - the move would remain paused for revision.")
            }
          />
          <CompletionSummary
            title="Completion Preview"
            outcome="Screenshots are grouped into 6 month folders in ~/Downloads. PDFs, zip files, hidden files, and installers remain untouched."
            changes={{
              created: 6,
              modified: 0,
              moved: 133,
              deleted: 0,
              network: false,
            }}
            rollbackAvailable={rollbackAvailable}
            rollbackTimeRemaining="30 minutes"
            onUndo={() =>
              setLastAction("Undo clicked - rollback would restore the original folder layout.")
            }
            onViewChanges={() =>
              setLastAction("View changes clicked - diff and rollback metadata would open next.")
            }
            onClose={() =>
              setLastAction("Close clicked - completion preview would be dismissed in a real flow.")
            }
          />
        </div>
      </TaskPanel>
    </div>
  )
}
