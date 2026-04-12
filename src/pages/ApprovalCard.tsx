import { useState } from "react"
import { Link } from "react-router-dom"

import { ApprovalCard } from "@/components/ui/approval-card"
import { Panel } from "@/components/ui/panel"

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ApprovalCardPage() {
  const [interactiveState, setInteractiveState] = useState<
    "pending" | "approved" | "denied"
  >("pending")

  return (
    <div className="min-h-screen bg-page p-6 md:p-12">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-12">
          <Link to="/" className="type-caption text-link hover:underline">
            &larr; Back
          </Link>
          <h1 className="type-h1 text-ink mt-4">ApprovalCard</h1>
          <p className="type-body text-body-text mt-2">
            A deliberate interruption in the execution flow &mdash; a deeper
            surface, thicker border, and amber accent stripe signal that user
            attention and explicit confirmation are required before proceeding.
          </p>
          <p className="type-caption text-subtle mt-1">
            Source: <span className="type-code">TICKET-012</span>
          </p>
        </div>

        {/* Section 1: Package Installation */}
        <section className="mb-16">
          <h2 className="type-h2 text-ink mb-6">Package Installation</h2>
          <p className="type-body text-body-text mb-6">
            A realistic approval gate for installing a system package via apt.
            Shows command preview, impact list, and requires explicit
            confirmation before sudo elevation.
          </p>

          <ApprovalCard
            action="Install ffmpeg via apt"
            willAffect={[
              "install a new system package",
              "require administrator privileges",
              "use network access",
            ]}
            impactSummary="This will download ~27 MB and install ffmpeg 6.0 system-wide."
            command="sudo apt install ffmpeg"
            onApprove={() => {}}
            onDeny={() => {}}
          />
        </section>

        {/* Section 2: File Operations */}
        <section className="mb-16">
          <h2 className="type-h2 text-ink mb-6">File Operations</h2>
          <p className="type-body text-body-text mb-6">
            An approval for a mass file move with both &ldquo;will&rdquo; and
            &ldquo;will not&rdquo; lists, giving the user a clear picture of
            scope and boundaries.
          </p>

          <ApprovalCard
            action="Move 23 screenshots to ~/Downloads/Screenshots-Week-15"
            willAffect={[
              "move 23 files from current location",
              "create a new directory",
            ]}
            willNotAffect={[
              "delete any files",
              "modify file contents",
              "affect files outside ~/Downloads",
            ]}
            impactSummary="Total size: ~48 MB. All files will retain original names."
            onApprove={() => {}}
            onDeny={() => {}}
          />
        </section>

        {/* Section 3: Without Command Preview */}
        <section className="mb-16">
          <h2 className="type-h2 text-ink mb-6">Without Command Preview</h2>
          <p className="type-body text-body-text mb-6">
            Not all approvals involve a shell command. This variant omits the
            command preview block entirely.
          </p>

          <ApprovalCard
            action="Rename 15 files in ~/Projects/assets using kebab-case convention"
            willAffect={[
              "rename 15 files in place",
              "update filenames to kebab-case",
            ]}
            willNotAffect={[
              "move files to a different directory",
              "change file extensions",
            ]}
            onApprove={() => {}}
            onDeny={() => {}}
          />
        </section>

        {/* Section 4: Interactive Demo */}
        <section className="mb-16">
          <h2 className="type-h2 text-ink mb-6">Interactive Demo</h2>
          <p className="type-body text-body-text mb-6">
            Click Approve or Deny to see the callback response. The card below
            shows live feedback from button interactions.
          </p>

          <ApprovalCard
            action="Delete cached build artifacts from ~/.cache/bridge-os"
            willAffect={[
              "remove 312 cached files",
              "free ~1.2 GB of disk space",
            ]}
            impactSummary="Cache will be rebuilt on next run. No data loss."
            command="rm -rf ~/.cache/bridge-os/build/*"
            onApprove={() => setInteractiveState("approved")}
            onDeny={() => setInteractiveState("denied")}
          />

          <Panel surface="cool" padding="compact" className="mt-4">
            <div className="flex items-center gap-3">
              <span className="type-label text-subtle">Callback result</span>
              {interactiveState === "pending" && (
                <span className="type-body text-subtle">
                  Waiting for user decision&hellip;
                </span>
              )}
              {interactiveState === "approved" && (
                <span className="type-body text-teal">
                  Approved &mdash; proceeding with execution
                </span>
              )}
              {interactiveState === "denied" && (
                <span className="type-body text-error">
                  Denied &mdash; action cancelled
                </span>
              )}
            </div>
          </Panel>
        </section>

        {/* Footer */}
        <footer className="border-t border-hairline pt-6">
          <p className="type-caption text-subtle">
            Development-only component showcase &mdash;{" "}
            <span className="type-code">TICKET-012</span>
          </p>
        </footer>
      </div>
    </div>
  )
}
