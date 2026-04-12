import { useState } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Panel } from "@/components/ui/panel"
import {
  StatusCapsule,
  STATE_CONFIG,
  type CapsuleState,
} from "@/components/ui/status-capsule"

const ALL_STATES: CapsuleState[] = [
  "idle",
  "listening",
  "understanding",
  "planning",
  "waiting_approval",
  "executing",
  "paused",
  "completed",
  "failed",
]

export default function StatusCapsulePage() {
  const [activeState, setActiveState] = useState<CapsuleState>("idle")
  const [showFixed, setShowFixed] = useState(false)

  return (
    <div className="min-h-screen bg-page p-6 md:p-12">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-12">
          <Link to="/" className="type-caption text-link hover:underline">
            &larr; Back
          </Link>
          <h1 className="type-h1 text-ink mt-4">StatusCapsule</h1>
          <p className="type-body text-body-text mt-2">
            Persistent desktop pill indicating current BridgeOS system state.
            The only element with{" "}
            <span className="type-code">box-shadow</span> in the design system.
          </p>
          <p className="type-caption text-subtle mt-1">
            Source: <span className="type-code">TICKET-005</span>
          </p>
        </div>

        {/* Section 1: Interactive Demo */}
        <section className="mb-16">
          <h2 className="type-h2 text-ink mb-6">Interactive Demo</h2>
          <p className="type-body text-body-text mb-6">
            Click a state button to change the capsule. The dot color, label,
            and background surface update to match.
          </p>

          <Panel surface="cool" padding="spacious">
            <div className="mb-6 flex justify-center">
              <div className="rounded-md bg-page p-8">
                <StatusCapsule
                  state={activeState}
                  progress={
                    activeState === "executing"
                      ? { current: 2, total: 5 }
                      : undefined
                  }
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {ALL_STATES.map((s) => (
                <Button
                  key={s}
                  variant={activeState === s ? "default" : "outline"}
                  size="sm"
                  className={
                    activeState === s
                      ? "cursor-pointer bg-brand text-white hover:bg-brand-hover"
                      : "cursor-pointer"
                  }
                  onClick={() => setActiveState(s)}
                >
                  {s.replace("_", " ")}
                </Button>
              ))}
            </div>

            <div className="mt-4 border-t border-divider pt-4">
              <p className="type-caption text-subtle">
                Current state:{" "}
                <span className="type-code">{activeState}</span> &middot; Dot:{" "}
                <span
                  className="inline-block h-2 w-2 rounded-full align-middle"
                  style={{
                    backgroundColor: STATE_CONFIG[activeState].dotColor,
                  }}
                />{" "}
                <span className="type-code">
                  {STATE_CONFIG[activeState].dotColor}
                </span>{" "}
                &middot; Surface:{" "}
                <span className="type-code">
                  {STATE_CONFIG[activeState].surface}
                </span>
                {STATE_CONFIG[activeState].breathing && (
                  <> &middot; Breathing: active</>
                )}
              </p>
            </div>
          </Panel>
        </section>

        {/* Section 2: All 9 States */}
        <section className="mb-16">
          <h2 className="type-h2 text-ink mb-6">All States</h2>
          <p className="type-body text-body-text mb-6">
            All 9 capsule states rendered simultaneously. Only{" "}
            <span className="type-code">idle</span> has the breathing dot
            animation.
          </p>

          <div className="flex flex-col gap-4">
            {ALL_STATES.map((s) => (
              <Panel key={s} surface="cool" padding="compact">
                <div className="flex items-center gap-4">
                  <StatusCapsule
                    state={s}
                    progress={
                      s === "executing"
                        ? { current: 3, total: 5 }
                        : undefined
                    }
                  />
                  <div>
                    <span className="type-label text-subtle">{s}</span>
                    <span className="type-caption text-subtle ml-3">
                      {STATE_CONFIG[s].dotColor} &middot;{" "}
                      {STATE_CONFIG[s].surface}
                    </span>
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        </section>

        {/* Section 3: Executing with Progress */}
        <section className="mb-16">
          <h2 className="type-h2 text-ink mb-6">Executing with Progress</h2>
          <p className="type-body text-body-text mb-6">
            The <span className="type-code">executing</span> state accepts a{" "}
            <span className="type-code">progress</span> prop to show step
            counts.
          </p>

          <Panel surface="cool" padding="spacious">
            <div className="flex flex-col gap-4">
              {[
                { current: 1, total: 5 },
                { current: 3, total: 5 },
                { current: 5, total: 5 },
              ].map((p) => (
                <div key={p.current} className="flex items-center gap-4">
                  <StatusCapsule state="executing" progress={p} />
                  <span className="type-caption text-subtle">
                    progress: {`{ current: ${p.current}, total: ${p.total} }`}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-4">
                <StatusCapsule state="executing" />
                <span className="type-caption text-subtle">
                  No progress prop (fallback label)
                </span>
              </div>
            </div>
          </Panel>
        </section>

        {/* Section 4: Fixed Position Preview */}
        <section className="mb-16">
          <h2 className="type-h2 text-ink mb-6">Fixed Position Preview</h2>
          <p className="type-body text-body-text mb-6">
            Toggle to show the capsule in its intended fixed position — 16px
            from the bottom-right screen edge, floating above the desktop.
          </p>

          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={() => setShowFixed(!showFixed)}
          >
            {showFixed ? "Hide Fixed Capsule" : "Show Fixed Capsule"}
          </Button>
        </section>

        {/* Footer */}
        <footer className="border-t border-hairline pt-6">
          <p className="type-caption text-subtle">
            Development-only component showcase &mdash;{" "}
            <span className="type-code">TICKET-005</span>
          </p>
        </footer>
      </div>

      {/* Fixed position capsule overlay */}
      {showFixed && (
        <div className="fixed bottom-4 right-4 z-50">
          <StatusCapsule state={activeState} />
        </div>
      )}
    </div>
  )
}
