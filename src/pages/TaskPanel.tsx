import { useState } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Panel } from "@/components/ui/panel"
import {
  TaskPanel,
  TASK_STATUS_CONFIG,
  RISK_LEVEL_CONFIG,
  type TaskHeaderData,
  type TaskMetaData,
  type TaskStatus,
  type RiskLevel,
} from "@/components/ui/task-panel"
import { StatusCapsule } from "@/components/ui/status-capsule"
import {
  IntentBoard,
  type IntentData,
} from "@/components/ui/intent-board"
import {
  DraftPlan,
  type DraftPlanData,
} from "@/components/ui/draft-plan"

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_HEADER: TaskHeaderData = {
  title: "Organize Downloads",
  summary: "Preparing to group screenshots by month and remove clutter.",
}

const MOCK_META: TaskMetaData = {
  status: "pending",
  risk: "medium",
  scope: "Downloads only",
}

const MOCK_INTENT: IntentData = {
  goal: "Organize screenshot files",
  scope: "~/Downloads folder only",
  constraints: "Do not delete any files",
  exclusions: "Ignore .dmg and .pkg files",
  executionStatus: "not_started",
}

const MOCK_PLAN: DraftPlanData = {
  title: "Draft plan",
  steps: [
    { id: "s1", description: "Scan ~/Downloads for all files" },
    { id: "s2", description: "Find screenshots modified in the last 7 days" },
    { id: "s3", description: "Create a weekly folder ~/Downloads/Screenshots-Week-15" },
    { id: "s4", description: "Move matching files into the new folder" },
    { id: "s5", description: "Show results and confirm completion" },
  ],
  planState: "ready",
}

const ALL_STATUSES: TaskStatus[] = [
  "not_started",
  "pending",
  "in_progress",
  "completed",
  "failed",
]

const ALL_RISKS: RiskLevel[] = ["low", "medium", "high"]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TaskPanelPage() {
  // --- Section 1: Interactive Demo ---
  const [interactiveOpen, setInteractiveOpen] = useState(false)
  const [activeStatus, setActiveStatus] = useState<TaskStatus>("pending")
  const [activeRisk, setActiveRisk] = useState<RiskLevel>("medium")

  const interactiveMeta: TaskMetaData = {
    status: activeStatus,
    risk: activeRisk,
    scope: "Downloads only",
  }

  // --- Section 4: StatusCapsule integration ---
  const [capsuleOpen, setCapsuleOpen] = useState(false)

  // --- Section 5: Overflow test ---
  const [overflowOpen, setOverflowOpen] = useState(false)

  return (
    <div className="min-h-screen bg-page p-6 md:p-12">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-12">
          <Link to="/" className="type-caption text-link hover:underline">
            &larr; Back
          </Link>
          <h1 className="type-h1 text-ink mt-4">TaskPanel</h1>
          <p className="type-body text-body-text mt-2">
            Right-side slide-over panel that serves as the main execution
            surface. Houses TaskHeader, TaskMetaRow, and child components
            like IntentBoard, DraftPlan, and Timeline.
          </p>
          <p className="type-caption text-subtle mt-1">
            Source: <span className="type-code">TICKET-009</span>
          </p>
        </div>

        {/* Section 1: Interactive Demo */}
        <section className="mb-16">
          <h2 className="type-h2 text-ink mb-6">Interactive Demo</h2>
          <p className="type-body text-body-text mb-6">
            Open the TaskPanel and cycle through status and risk values.
            The panel slides in from the right with smooth animation.
          </p>

          <Panel surface="cool" padding="spacious">
            <div className="mb-6">
              <Button
                variant={interactiveOpen ? "default" : "outline"}
                size="sm"
                className={
                  interactiveOpen
                    ? "cursor-pointer bg-brand text-white hover:bg-brand-hover"
                    : "cursor-pointer"
                }
                onClick={() => setInteractiveOpen(!interactiveOpen)}
              >
                {interactiveOpen ? "Close Panel" : "Open Panel"}
              </Button>
            </div>

            {/* Status buttons */}
            <div className="flex flex-wrap gap-2 border-t border-divider pt-4">
              <span className="type-label text-subtle self-center">STATUS</span>
              {ALL_STATUSES.map((s) => (
                <Button
                  key={s}
                  variant={activeStatus === s ? "default" : "outline"}
                  size="sm"
                  className={
                    activeStatus === s
                      ? "cursor-pointer bg-brand text-white hover:bg-brand-hover"
                      : "cursor-pointer"
                  }
                  onClick={() => setActiveStatus(s)}
                >
                  {TASK_STATUS_CONFIG[s].label}
                </Button>
              ))}
            </div>

            {/* Risk buttons */}
            <div className="mt-4 flex flex-wrap gap-2 border-t border-divider pt-4">
              <span className="type-label text-subtle self-center">RISK</span>
              {ALL_RISKS.map((r) => (
                <Button
                  key={r}
                  variant={activeRisk === r ? "default" : "outline"}
                  size="sm"
                  className={
                    activeRisk === r
                      ? "cursor-pointer bg-brand text-white hover:bg-brand-hover"
                      : "cursor-pointer"
                  }
                  onClick={() => setActiveRisk(r)}
                >
                  {RISK_LEVEL_CONFIG[r].label}
                </Button>
              ))}
            </div>

            {/* Metadata */}
            <div className="mt-3 border-t border-divider pt-3">
              <p className="type-caption text-subtle">
                Panel:{" "}
                <span className="type-code">
                  {interactiveOpen ? "open" : "closed"}
                </span>{" "}
                &middot; Status:{" "}
                <span className="type-code">{activeStatus}</span> &middot;
                Risk: <span className="type-code">{activeRisk}</span>
              </p>
            </div>
          </Panel>

          <TaskPanel
            isOpen={interactiveOpen}
            onClose={() => setInteractiveOpen(false)}
            header={MOCK_HEADER}
            meta={interactiveMeta}
          >
            <div className="flex flex-col gap-4">
              <Panel surface="deep" padding="compact">
                <p className="type-caption text-subtle">
                  Placeholder: IntentBoard will render here
                </p>
              </Panel>
              <Panel surface="deep" padding="compact">
                <p className="type-caption text-subtle">
                  Placeholder: DraftPlan will render here
                </p>
              </Panel>
              <Panel surface="deep" padding="compact">
                <p className="type-caption text-subtle">
                  Placeholder: Timeline will render here
                </p>
              </Panel>
            </div>
          </TaskPanel>
        </section>

        {/* Section 2: TaskHeader Variations */}
        <section className="mb-16">
          <h2 className="type-h2 text-ink mb-6">TaskHeader Variations</h2>
          <p className="type-body text-body-text mb-6">
            The TaskHeader displays a title in Heading 1 and a one-sentence
            summary in Body text. Shown in isolation below.
          </p>

          <div className="flex flex-col gap-4">
            <Panel surface="cool" padding="spacious">
              <p className="type-label text-subtle mb-3">SHORT TITLE</p>
              <h1 className="type-h1 text-ink">Organize Downloads</h1>
              <p className="type-body text-body-text mt-1">
                Preparing to group screenshots by month and remove clutter.
              </p>
            </Panel>

            <Panel surface="cool" padding="spacious">
              <p className="type-label text-subtle mb-3">LONG TITLE</p>
              <h1 className="type-h1 text-ink">
                Scan Project Dependencies and Check for Security Vulnerabilities
              </h1>
              <p className="type-body text-body-text mt-1">
                Reading package.json files across all workspaces, querying the
                npm advisory database, and preparing a risk-prioritized upgrade
                plan.
              </p>
            </Panel>
          </div>
        </section>

        {/* Section 3: TaskMetaRow All States */}
        <section className="mb-16">
          <h2 className="type-h2 text-ink mb-6">TaskMetaRow All States</h2>
          <p className="type-body text-body-text mb-6">
            All five task statuses and three risk levels. Status values use
            state-specific colors with a dot indicator.
          </p>

          <div className="flex flex-col gap-4">
            {/* All statuses */}
            <Panel surface="cool" padding="spacious">
              <p className="type-label text-subtle mb-4">ALL STATUSES</p>
              <div className="flex flex-col gap-3">
                {ALL_STATUSES.map((status) => {
                  const config = TASK_STATUS_CONFIG[status]
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <div
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: config.dotColor }}
                      />
                      <span className="type-label text-subtle w-24">
                        {status.toUpperCase().replace("_", " ")}
                      </span>
                      <span className={config.className}>{config.label}</span>
                    </div>
                  )
                })}
              </div>
            </Panel>

            {/* All risk levels */}
            <Panel surface="cool" padding="spacious">
              <p className="type-label text-subtle mb-4">ALL RISK LEVELS</p>
              <div className="flex items-center gap-6">
                {ALL_RISKS.map((risk) => {
                  const config = RISK_LEVEL_CONFIG[risk]
                  return (
                    <div key={risk} className="flex items-center gap-2">
                      <span className="type-label text-subtle">
                        {risk.toUpperCase()}
                      </span>
                      <span className={config.className}>{config.label}</span>
                    </div>
                  )
                })}
              </div>
            </Panel>
          </div>
        </section>

        {/* Section 4: StatusCapsule Integration */}
        <section className="mb-16">
          <h2 className="type-h2 text-ink mb-6">
            Slide Animation with StatusCapsule
          </h2>
          <p className="type-body text-body-text mb-6">
            Click the StatusCapsule to toggle the TaskPanel. The panel
            contains IntentBoard and DraftPlan as children, demonstrating
            component composition.
          </p>

          <Panel surface="cool" padding="spacious">
            <div className="flex items-center gap-4">
              <span className="type-label text-subtle">CLICK TO TOGGLE</span>
              <StatusCapsule
                state="planning"
                onClick={() => setCapsuleOpen(!capsuleOpen)}
              />
            </div>

            <div className="mt-3 border-t border-divider pt-3">
              <p className="type-caption text-subtle">
                Panel:{" "}
                <span className="type-code">
                  {capsuleOpen ? "open" : "closed"}
                </span>
              </p>
            </div>
          </Panel>

          <TaskPanel
            isOpen={capsuleOpen}
            onClose={() => setCapsuleOpen(false)}
            header={MOCK_HEADER}
            meta={MOCK_META}
          >
            <div className="flex flex-col gap-4">
              <IntentBoard data={MOCK_INTENT} />
              <DraftPlan data={MOCK_PLAN} />
            </div>
          </TaskPanel>
        </section>

        {/* Section 5: Overflow Scroll Test */}
        <section className="mb-16">
          <h2 className="type-h2 text-ink mb-6">Overflow Scroll Test</h2>
          <p className="type-body text-body-text mb-6">
            Opens a TaskPanel with enough content to exceed the viewport.
            The TaskHeader and TaskMetaRow remain pinned while the body
            scrolls.
          </p>

          <Panel surface="cool" padding="spacious">
            <Button
              variant={overflowOpen ? "default" : "outline"}
              size="sm"
              className={
                overflowOpen
                  ? "cursor-pointer bg-brand text-white hover:bg-brand-hover"
                  : "cursor-pointer"
              }
              onClick={() => setOverflowOpen(!overflowOpen)}
            >
              {overflowOpen ? "Close Panel" : "Open Overflow Panel"}
            </Button>
          </Panel>

          <TaskPanel
            isOpen={overflowOpen}
            onClose={() => setOverflowOpen(false)}
            header={{
              title: "Large Task with Many Steps",
              summary:
                "Testing scroll behavior with content that exceeds viewport height.",
            }}
            meta={{ status: "in_progress", risk: "low", scope: "Test only" }}
          >
            <div className="flex flex-col gap-4">
              {Array.from({ length: 15 }, (_, i) => (
                <Panel key={i} surface="deep" padding="compact">
                  <p className="type-label text-subtle mb-1">
                    BLOCK {i + 1}
                  </p>
                  <p className="type-body-sm text-body-text">
                    Placeholder content block to test scrolling behavior.
                    The header and meta row above should remain fixed while
                    this area scrolls.
                  </p>
                </Panel>
              ))}
            </div>
          </TaskPanel>
        </section>

        {/* Footer */}
        <footer className="border-t border-hairline pt-6">
          <p className="type-caption text-subtle">
            Development-only component showcase &mdash;{" "}
            <span className="type-code">TICKET-009</span>
          </p>
        </footer>
      </div>
    </div>
  )
}
