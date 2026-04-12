import { useState } from "react"
import { Link } from "react-router-dom"
import { Corridor } from "@/components/ui/corridor"
import { Panel } from "@/components/ui/panel"
import { Button } from "@/components/ui/button"

type CorridorWidth = "conversation" | "intent" | "completion"
type AnchorSide = "left" | "right"

const widthLabels: Record<CorridorWidth, string> = {
  conversation: "Conversation (480px)",
  intent: "Intent / Execution (560px)",
  completion: "Completion (640px)",
}

const widthPx: Record<CorridorWidth, number> = {
  conversation: 480,
  intent: 560,
  completion: 640,
}

export default function LayoutPage() {
  const [livePreview, setLivePreview] = useState(false)
  const [activeWidth, setActiveWidth] = useState<CorridorWidth>("intent")
  const [activeAnchor, setActiveAnchor] = useState<AnchorSide>("right")

  return (
    <div className="min-h-screen bg-page p-8">
      {/* Header */}
      <div className="mb-12 max-w-3xl">
        <Link to="/" className="type-caption text-link hover:underline">
          &larr; Back
        </Link>
        <h1 className="type-h1 text-ink mt-4">Corridor & Surface System</h1>
        <p className="type-body text-body-text mt-2">
          Visual reference for the corridor layout and panel surface treatments.
          Source: <span className="type-code">TICKET-003</span>
        </p>
      </div>

      {/* Section 1: Corridor Widths */}
      <section className="mb-16 max-w-3xl">
        <h2 className="type-h2 text-ink mb-6">Corridor Widths</h2>
        <p className="type-body text-body-text mb-6">
          The corridor narrows or widens based on the current interaction phase.
          Each width is shown below with sample panels.
        </p>

        <div className="flex flex-col gap-12">
          {(["conversation", "intent", "completion"] as CorridorWidth[]).map(
            (w) => (
              <div key={w}>
                <span className="type-label text-subtle mb-3 block">
                  {widthLabels[w]}
                </span>
                {/* Inline corridor (relative, not fixed) for side-by-side viewing */}
                <Corridor
                  width={w}
                  className="relative border border-dashed border-hairline bg-page py-6"
                >
                  <div className="flex flex-col gap-4">
                    <Panel surface="cool">
                      <span className="type-label text-subtle">Cool Surface</span>
                      <p className="type-body text-body-text mt-2">
                        Operational panel at {widthPx[w]}px corridor width
                      </p>
                    </Panel>
                    <Panel surface="warm">
                      <span className="type-label text-subtle">Warm Surface</span>
                      <p className="type-body text-body-text mt-2">
                        Conversational panel at {widthPx[w]}px corridor width
                      </p>
                    </Panel>
                  </div>
                </Corridor>
              </div>
            )
          )}
        </div>
      </section>

      {/* Section 2: Panel Surfaces */}
      <section className="mb-16 max-w-3xl">
        <h2 className="type-h2 text-ink mb-6">Panel Surface Variants</h2>
        <p className="type-body text-body-text mb-6">
          Three surface treatments for different interaction registers.
          1px solid borders, no box-shadows. Noise texture at 0.5% opacity.
        </p>

        <div className="flex flex-col gap-4">
          <Panel surface="cool" padding="spacious">
            <span className="type-label text-subtle">Cool Surface</span>
            <p className="type-body-sm text-subtle mt-1">
              <span className="type-code">#edf1f4</span> — Operational panels
              (IntentBoard, step cards, TaskPanel)
            </p>
            <p className="type-body text-body-text mt-3">
              The cool register communicates precision and accountability.
              Blue-grey tinted background recedes into operational focus.
            </p>
          </Panel>

          <Panel surface="warm" padding="spacious">
            <span className="type-label text-subtle">Warm Surface</span>
            <p className="type-body-sm text-subtle mt-1">
              <span className="type-code">#f9f3ea</span> — Conversational
              surfaces (VoiceBar, CompletionSummary)
            </p>
            <p className="type-body text-body-text mt-3">
              The warm register communicates presence and attentiveness.
              Golden-tinted background comes forward with conversational warmth.
            </p>
          </Panel>

          <Panel surface="deep" padding="spacious">
            <span className="type-label text-subtle">Deep Surface</span>
            <p className="type-body-sm text-subtle mt-1">
              <span className="type-code">#dfe4e8</span> — Emphasis panels
              (approval gates, monolith interrupts)
            </p>
            <p className="type-body text-body-text mt-3">
              Deeper cool tone that breaks regular step card rhythm.
              Used with 2px borders and amber accent stripe for approval gates.
            </p>
          </Panel>
        </div>
      </section>

      {/* Section 3: Panel Padding Variants */}
      <section className="mb-16 max-w-3xl">
        <h2 className="type-h2 text-ink mb-6">Panel Padding</h2>
        <p className="type-body text-body-text mb-6">
          Three padding tiers matching component density levels.
        </p>

        <div className="flex flex-col gap-4">
          <Panel surface="cool" padding="compact">
            <span className="type-label text-subtle">Compact (16px)</span>
            <p className="type-body text-body-text mt-2">
              Step cards, timeline items — dense operational content.
            </p>
          </Panel>

          <Panel surface="cool" padding="default">
            <span className="type-label text-subtle">Default (20px)</span>
            <p className="type-body text-body-text mt-2">
              Standard panels — balanced content density.
            </p>
          </Panel>

          <Panel surface="cool" padding="spacious">
            <span className="type-label text-subtle">Spacious (24px)</span>
            <p className="type-body text-body-text mt-2">
              Approval gates, summary panels — generous breathing room.
            </p>
          </Panel>
        </div>
      </section>

      {/* Section 4: Warm Ambient Glow */}
      <section className="mb-16 max-w-3xl">
        <h2 className="type-h2 text-ink mb-6">Warm Ambient Glow</h2>
        <p className="type-body text-body-text mb-6">
          Radial gradient <span className="type-code">rgba(201, 169, 110, 0.04)</span>{" "}
          positioned behind where the VoiceBar sits. Simulates natural light
          spilling into the conversation corridor.
        </p>

        <div className="glow-warm-ambient rounded-md border border-hairline bg-page p-8">
          <Panel surface="warm" padding="spacious">
            <span className="type-label text-subtle">VoiceBar Placeholder</span>
            <p className="type-body text-body-text mt-2">
              The warm glow radiates behind this area. It should be barely
              perceptible — a golden ambient wash, not a visible gradient.
            </p>
          </Panel>
        </div>
      </section>

      {/* Section 5: Noise Texture Verification */}
      <section className="mb-16 max-w-3xl">
        <h2 className="type-h2 text-ink mb-6">Noise Texture</h2>
        <p className="type-body text-body-text mb-6">
          All panels share a 0.5% opacity SVG noise overlay via{" "}
          <span className="type-code">::after</span>. Inspect closely —
          the texture prevents surfaces from feeling digitally sterile.
        </p>

        <div className="flex gap-4">
          <Panel surface="cool" padding="spacious" className="flex-1">
            <span className="type-label text-subtle">Cool + Noise</span>
            <div className="mt-4 h-24" />
          </Panel>
          <Panel surface="warm" padding="spacious" className="flex-1">
            <span className="type-label text-subtle">Warm + Noise</span>
            <div className="mt-4 h-24" />
          </Panel>
          <Panel surface="deep" padding="spacious" className="flex-1">
            <span className="type-label text-subtle">Deep + Noise</span>
            <div className="mt-4 h-24" />
          </Panel>
        </div>
      </section>

      {/* Section 6: Live Corridor Preview */}
      <section className="mb-16 max-w-3xl">
        <h2 className="type-h2 text-ink mb-6">Live Corridor Preview</h2>
        <p className="type-body text-body-text mb-6">
          Toggle to see a real fixed-position corridor anchored to the screen
          edge with 16px margin.
        </p>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Button
            variant={livePreview ? "outline" : "default"}
            className={
              livePreview
                ? "cursor-pointer border-brand text-brand hover:bg-brand/5"
                : "cursor-pointer bg-brand text-white hover:bg-brand-hover"
            }
            onClick={() => setLivePreview(!livePreview)}
          >
            {livePreview ? "Hide Preview" : "Show Live Preview"}
          </Button>

          {livePreview && (
            <>
              <div className="flex gap-1">
                {(
                  ["conversation", "intent", "completion"] as CorridorWidth[]
                ).map((w) => (
                  <Button
                    key={w}
                    variant="ghost"
                    className={`cursor-pointer ${activeWidth === w ? "text-ink" : "text-subtle"}`}
                    onClick={() => setActiveWidth(w)}
                  >
                    {w}
                  </Button>
                ))}
              </div>

              <div className="flex gap-1">
                {(["left", "right"] as AnchorSide[]).map((a) => (
                  <Button
                    key={a}
                    variant="ghost"
                    className={`cursor-pointer ${activeAnchor === a ? "text-ink" : "text-subtle"}`}
                    onClick={() => setActiveAnchor(a)}
                  >
                    {a}
                  </Button>
                ))}
              </div>
            </>
          )}
        </div>

        {livePreview && (
          <Corridor width={activeWidth} anchor={activeAnchor} className="z-50 py-6">
            <div className="glow-warm-ambient">
              <div className="flex flex-col gap-4">
                <Panel surface="warm">
                  <span className="type-label text-subtle">VoiceBar Area</span>
                  <p className="type-body text-body-text mt-2">
                    Warm surface with ambient glow behind
                  </p>
                </Panel>

                <Panel surface="cool">
                  <span className="type-label text-subtle">IntentBoard</span>
                  <p className="type-body text-body-text mt-2">
                    Cool surface for operational content
                  </p>
                </Panel>

                <Panel surface="cool" padding="compact">
                  <span className="type-label text-subtle">Step Card</span>
                  <p className="type-body text-body-text mt-2">
                    Compact padding for timeline items
                  </p>
                </Panel>

                <Panel surface="deep" padding="spacious">
                  <span className="type-label text-subtle">Approval Gate</span>
                  <p className="type-body text-body-text mt-2">
                    Deep surface with spacious padding
                  </p>
                </Panel>

                <Button
                  variant="ghost"
                  className="cursor-pointer text-subtle"
                  onClick={() => setLivePreview(false)}
                >
                  Close Preview
                </Button>
              </div>
            </div>
          </Corridor>
        )}
      </section>

      {/* Footer */}
      <footer className="max-w-3xl border-t border-hairline pt-6">
        <p className="type-caption text-subtle">
          Development-only layout showcase — TICKET-003
        </p>
      </footer>
    </div>
  )
}
