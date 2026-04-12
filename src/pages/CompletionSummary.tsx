import { useState } from "react"
import { Link } from "react-router-dom"

import { CompletionSummary } from "@/components/ui/completion-summary"
import { Panel } from "@/components/ui/panel"

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CompletionSummaryPage() {
  const [interactiveAction, setInteractiveAction] = useState<
    "idle" | "undo" | "view" | "close"
  >("idle")

  return (
    <div className="min-h-screen bg-page p-6 md:p-12">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-12">
          <Link to="/" className="type-caption text-link hover:underline">
            &larr; Back
          </Link>
          <h1 className="type-h1 text-ink mt-4">CompletionSummary</h1>
          <p className="type-body text-body-text mt-2">
            A warm-surfaced resolution panel that signals task completion by
            shifting from the cool operational register back to the warm
            conversational register. The surface shift itself is the
            celebration &mdash; no confetti, no animated checkmarks.
          </p>
          <p className="type-caption text-subtle mt-1">
            Source: <span className="type-code">TICKET-013</span>
          </p>
        </div>

        {/* Section 1: Folder Organization Complete */}
        <section className="mb-16">
          <h2 className="type-h2 text-ink mb-6">Folder Organization Complete</h2>
          <p className="type-body text-body-text mb-6">
            A full completion summary after organizing a downloads folder.
            Shows all change counts, network activity, and a 30-minute
            rollback window with Undo available.
          </p>

          <CompletionSummary
            outcome="Organized ~/Downloads into 6 category folders. All files sorted by type and date."
            changes={{
              created: 6,
              modified: 0,
              moved: 133,
              deleted: 0,
              network: false,
            }}
            rollbackAvailable
            rollbackTimeRemaining="30 minutes"
            onUndo={() => {}}
            onViewChanges={() => {}}
            onClose={() => {}}
          />
        </section>

        {/* Section 2: Project Inspection Complete */}
        <section className="mb-16">
          <h2 className="type-h2 text-ink mb-6">Project Inspection Complete</h2>
          <p className="type-body text-body-text mb-6">
            A read-only inspection with no file changes and no rollback.
            The summary focuses on what was analyzed rather than what was
            changed.
          </p>

          <CompletionSummary
            title="Inspection Complete"
            outcome="Scanned ~/Projects/api-server. Found 3 lint warnings, 0 errors, and 2 outdated dependencies."
            changes={{
              created: 0,
              modified: 0,
              moved: 0,
              deleted: 0,
            }}
            onViewChanges={() => {}}
            onClose={() => {}}
          />
        </section>

        {/* Section 3: Package Installation Complete */}
        <section className="mb-16">
          <h2 className="type-h2 text-ink mb-6">Package Installation Complete</h2>
          <p className="type-body text-body-text mb-6">
            A completion summary after installing a system package. Shows
            network activity and a shorter rollback window.
          </p>

          <CompletionSummary
            outcome="Installed ffmpeg 6.0 system-wide via apt. All dependencies resolved."
            changes={{
              created: 14,
              modified: 2,
              moved: 0,
              deleted: 0,
              network: true,
            }}
            rollbackAvailable
            rollbackTimeRemaining="15 minutes"
            onUndo={() => {}}
            onViewChanges={() => {}}
            onClose={() => {}}
          />
        </section>

        {/* Section 4: Without Rollback */}
        <section className="mb-16">
          <h2 className="type-h2 text-ink mb-6">Without Rollback</h2>
          <p className="type-body text-body-text mb-6">
            When rollback is not available, the indicator is hidden and the
            Undo button does not appear. Only View changes and Close remain.
          </p>

          <CompletionSummary
            outcome="Renamed 15 files in ~/Projects/assets using kebab-case convention."
            changes={{
              created: 0,
              modified: 15,
              moved: 0,
              deleted: 0,
            }}
            rollbackAvailable={false}
            onViewChanges={() => {}}
            onClose={() => {}}
          />
        </section>

        {/* Section 5: Interactive Demo */}
        <section className="mb-16">
          <h2 className="type-h2 text-ink mb-6">Interactive Demo</h2>
          <p className="type-body text-body-text mb-6">
            Click any button to see the callback response. The panel below
            shows live feedback from button interactions.
          </p>

          <CompletionSummary
            outcome="Moved 23 screenshots to ~/Downloads/Screenshots-Week-15."
            changes={{
              created: 1,
              modified: 0,
              moved: 23,
              deleted: 0,
              network: false,
            }}
            rollbackAvailable
            rollbackTimeRemaining="30 minutes"
            onUndo={() => setInteractiveAction("undo")}
            onViewChanges={() => setInteractiveAction("view")}
            onClose={() => setInteractiveAction("close")}
          />

          <Panel surface="cool" padding="compact" className="mt-4">
            <div className="flex items-center gap-3">
              <span className="type-label text-subtle">Callback result</span>
              {interactiveAction === "idle" && (
                <span className="type-body text-subtle">
                  Waiting for user action&hellip;
                </span>
              )}
              {interactiveAction === "undo" && (
                <span className="type-body text-brand">
                  Undo &mdash; rolling back changes
                </span>
              )}
              {interactiveAction === "view" && (
                <span className="type-body text-teal">
                  View changes &mdash; opening diff view
                </span>
              )}
              {interactiveAction === "close" && (
                <span className="type-body text-subtle">
                  Close &mdash; dismissing summary
                </span>
              )}
            </div>
          </Panel>
        </section>

        {/* Footer */}
        <footer className="border-t border-hairline pt-6">
          <p className="type-caption text-subtle">
            Development-only component showcase &mdash;{" "}
            <span className="type-code">TICKET-013</span>
          </p>
        </footer>
      </div>
    </div>
  )
}
