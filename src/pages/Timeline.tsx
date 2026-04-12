import { useState } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Panel } from "@/components/ui/panel"
import {
  Timeline,
  STEP_STATUS_CONFIG,
  type TimelineData,
  type StepStatus,
} from "@/components/ui/timeline"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALL_STEP_STATUSES: StepStatus[] = [
  "pending",
  "running",
  "waiting_approval",
  "completed",
  "failed",
  "skipped",
  "blocked",
  "reverted",
]

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_INTERACTIVE: TimelineData = {
  steps: [
    { id: "i1", description: "Scan ~/Downloads for all files", impact: "152 files found", status: "completed" },
    { id: "i2", description: "Identify screenshots by file type", impact: "23 screenshots", status: "completed" },
    { id: "i3", description: "Create folder ~/Downloads/Screenshots-Week-15", status: "running" },
    { id: "i4", description: "Move matching files into the new folder", impact: "~2 MB total", status: "pending" },
    { id: "i5", description: "Verify file integrity after move", status: "pending" },
  ],
}

const MOCK_ALL_STATES: TimelineData = {
  steps: [
    { id: "a1", description: "Step in pending state", status: "pending" },
    { id: "a2", description: "Step currently running", impact: "In progress", status: "running" },
    { id: "a3", description: "Step waiting for approval", impact: "Needs sudo", status: "waiting_approval" },
    { id: "a4", description: "Step that completed successfully", impact: "Done", status: "completed" },
    { id: "a5", description: "Step that failed", impact: "Error: ENOENT", status: "failed" },
    { id: "a6", description: "Step that was skipped", status: "skipped" },
    { id: "a7", description: "Step that is blocked", impact: "Waiting on step 5", status: "blocked" },
    { id: "a8", description: "Step that was reverted", impact: "Rolled back", status: "reverted" },
  ],
}

const MOCK_EXECUTION: TimelineData = {
  steps: [
    { id: "e1", description: "Scan ~/Projects for package.json files", impact: "8 projects found", status: "completed" },
    { id: "e2", description: "Read dependency versions from each", impact: "42 dependencies", status: "completed" },
    { id: "e3", description: "Check npm registry for latest versions", status: "running" },
    { id: "e4", description: "Compare installed vs latest", status: "pending" },
    { id: "e5", description: "Generate upgrade plan", status: "pending" },
  ],
}

const MOCK_COMPLETED: TimelineData = {
  steps: [
    { id: "c1", description: "Scan ~/Downloads for all files", impact: "152 files", status: "completed" },
    { id: "c2", description: "Identify screenshots by file type", impact: "23 screenshots", status: "completed" },
    { id: "c3", description: "Create folder ~/Downloads/Screenshots-Week-15", impact: "Created", status: "completed" },
    { id: "c4", description: "Move matching files into the new folder", impact: "23 files moved", status: "completed" },
    { id: "c5", description: "Verify file integrity after move", impact: "All verified", status: "completed" },
  ],
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TimelinePage() {
  // --- Interactive Demo state ---
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>(
    MOCK_INTERACTIVE.steps.map((s) => s.status)
  )

  const interactiveData: TimelineData = {
    steps: MOCK_INTERACTIVE.steps.map((step, i) => ({
      ...step,
      status: stepStatuses[i],
    })),
  }

  const cycleStatus = (index: number) => {
    setStepStatuses((prev) => {
      const next = [...prev]
      const currentIdx = ALL_STEP_STATUSES.indexOf(next[index])
      next[index] = ALL_STEP_STATUSES[(currentIdx + 1) % ALL_STEP_STATUSES.length]
      return next
    })
  }

  return (
    <div className="min-h-screen bg-page p-6 md:p-12">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-12">
          <Link to="/" className="type-caption text-link hover:underline">
            &larr; Back
          </Link>
          <h1 className="type-h1 text-ink mt-4">Timeline</h1>
          <p className="type-body text-body-text mt-2">
            The main action trace view &mdash; a structured, sequential display
            of execution steps. Each step card shows status, description, and
            optional impact summary, connected by a vertical timeline connector.
          </p>
          <p className="type-caption text-subtle mt-1">
            Source: <span className="type-code">TICKET-011</span>
          </p>
        </div>

        {/* Section 1: Interactive Demo */}
        <section className="mb-16">
          <h2 className="type-h2 text-ink mb-6">Interactive Demo</h2>
          <p className="type-body text-body-text mb-6">
            Click the status buttons to cycle each step through all 8 states.
            The status dot color, connector line color, and status label update
            with a 200ms transition.
          </p>

          <div className="mb-6">
            <Timeline data={interactiveData} />
          </div>

          <Panel surface="cool" padding="compact">
            <div className="flex flex-col gap-3">
              {MOCK_INTERACTIVE.steps.map((step, i) => (
                <div key={step.id} className="flex items-center gap-3">
                  <span className="type-caption text-subtle w-16 shrink-0">
                    Step {i + 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => cycleStatus(i)}
                  >
                    {stepStatuses[i]}
                  </Button>
                  <div
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{
                      backgroundColor:
                        STEP_STATUS_CONFIG[stepStatuses[i]].dotColor,
                    }}
                  />
                </div>
              ))}
            </div>
          </Panel>
        </section>

        {/* Section 2: All States */}
        <section className="mb-16">
          <h2 className="type-h2 text-ink mb-6">All States</h2>
          <p className="type-body text-body-text mb-6">
            Eight step cards showing every supported status: pending, running,
            waiting_approval, completed, failed, skipped, blocked, and reverted.
          </p>

          <Timeline data={MOCK_ALL_STATES} />
        </section>

        {/* Section 3: Execution Progress */}
        <section className="mb-16">
          <h2 className="type-h2 text-ink mb-6">Execution Progress</h2>
          <p className="type-body text-body-text mb-6">
            A realistic mid-execution snapshot. Completed steps show teal dots
            and teal connector segments. The running step shows an amber dot.
            Pending steps show muted dots with hairline connectors.
          </p>

          <Timeline data={MOCK_EXECUTION} />
        </section>

        {/* Section 4: Fully Completed */}
        <section className="mb-16">
          <h2 className="type-h2 text-ink mb-6">Fully Completed</h2>
          <p className="type-body text-body-text mb-6">
            All steps completed &mdash; the entire connector line turns teal,
            signaling resolution.
          </p>

          <Timeline data={MOCK_COMPLETED} />
        </section>

        {/* Section 5: Status Dot Reference */}
        <section className="mb-16">
          <h2 className="type-h2 text-ink mb-6">Status Dot Reference</h2>
          <p className="type-body text-body-text mb-6">
            All 8 status dots with their labels and semantic colors.
          </p>

          <Panel surface="cool" padding="spacious">
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {ALL_STEP_STATUSES.map((status) => {
                const config = STEP_STATUS_CONFIG[status]
                return (
                  <div key={status} className="flex items-center gap-3">
                    <div
                      className="h-[10px] w-[10px] shrink-0 rounded-full"
                      style={{ backgroundColor: config.dotColor }}
                    />
                    <span className="type-body text-body-text">{status}</span>
                    <span className="type-caption text-subtle ml-auto">
                      {config.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </Panel>
        </section>

        {/* Footer */}
        <footer className="border-t border-hairline pt-6">
          <p className="type-caption text-subtle">
            Development-only component showcase &mdash;{" "}
            <span className="type-code">TICKET-011</span>
          </p>
        </footer>
      </div>
    </div>
  )
}
