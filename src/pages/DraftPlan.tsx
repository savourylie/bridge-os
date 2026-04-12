import { useState, useEffect, useRef, useCallback } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Panel } from "@/components/ui/panel"
import {
  DraftPlan,
  PLAN_STATE_CONFIG,
  type DraftPlanData,
  type PlanState,
} from "@/components/ui/draft-plan"

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_EMPTY: DraftPlanData = {
  steps: [],
  planState: "drafting",
}

const MOCK_FULL: DraftPlanData = {
  title: "Draft plan",
  steps: [
    { id: "s1", description: "Scan ~/Downloads for all files" },
    { id: "s2", description: "Find screenshots modified in the last 7 days" },
    {
      id: "s3",
      description: "Create a weekly folder ~/Downloads/Screenshots-Week-15",
    },
    { id: "s4", description: "Move matching files into the new folder" },
    { id: "s5", description: "Show results and confirm completion" },
  ],
  planState: "ready",
}

const MOCK_MANY_STEPS: DraftPlanData = {
  title: "Draft plan",
  steps: [
    { id: "n1", description: "Scan ~/Projects for package.json files" },
    { id: "n2", description: "Read dependency versions from each" },
    { id: "n3", description: "Check npm registry for latest versions" },
    { id: "n4", description: "Compare installed vs latest" },
    { id: "n5", description: "Filter by major version bumps" },
    { id: "n6", description: "Generate upgrade plan" },
    { id: "n7", description: "Back up existing lock files" },
    { id: "n8", description: "Run npm update for minor bumps" },
    { id: "n9", description: "Run npm install for major bumps individually" },
    { id: "n10", description: "Run test suite after each upgrade" },
    { id: "n11", description: "Revert any failing upgrades" },
    { id: "n12", description: "Generate summary report" },
  ],
  planState: "ready",
}

const ALL_PLAN_STATES: PlanState[] = [
  "drafting",
  "ready",
  "approved",
  "cancelled",
]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DraftPlanPage() {
  // --- Interactive Demo state ---
  const [showTitle, setShowTitle] = useState(true)
  const [activeState, setActiveState] = useState<PlanState>("ready")

  const interactiveData: DraftPlanData = {
    title: showTitle ? "Draft plan" : undefined,
    steps: MOCK_FULL.steps,
    planState: activeState,
  }

  // --- Incremental simulation state ---
  const [simData, setSimData] = useState<DraftPlanData>(MOCK_EMPTY)
  const [isSimulating, setIsSimulating] = useState(false)
  const simTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startSimulation = useCallback(() => {
    setSimData(MOCK_EMPTY)
    setIsSimulating(true)

    const steps: Array<() => void> = [
      () =>
        setSimData({
          title: "Draft plan",
          steps: [],
          planState: "drafting",
        }),
      () =>
        setSimData((prev) => ({
          ...prev,
          steps: [
            ...prev.steps,
            { id: "s1", description: "Scan ~/Downloads for all files" },
          ],
        })),
      () =>
        setSimData((prev) => ({
          ...prev,
          steps: [
            ...prev.steps,
            {
              id: "s2",
              description: "Find screenshots modified in the last 7 days",
            },
          ],
        })),
      () =>
        setSimData((prev) => ({
          ...prev,
          steps: [
            ...prev.steps,
            {
              id: "s3",
              description:
                "Create a weekly folder ~/Downloads/Screenshots-Week-15",
            },
          ],
        })),
      () =>
        setSimData((prev) => ({
          ...prev,
          steps: [
            ...prev.steps,
            {
              id: "s4",
              description: "Move matching files into the new folder",
            },
          ],
        })),
      () =>
        setSimData((prev) => ({
          ...prev,
          steps: [
            ...prev.steps,
            {
              id: "s5",
              description: "Show results and confirm completion",
            },
          ],
        })),
      () =>
        setSimData((prev) => ({
          ...prev,
          planState: "ready" as const,
        })),
    ]

    let idx = 0
    const advance = () => {
      steps[idx]()
      idx++
      if (idx < steps.length) {
        simTimerRef.current = setTimeout(advance, 800)
      } else {
        simTimerRef.current = setTimeout(() => setIsSimulating(false), 400)
      }
    }
    simTimerRef.current = setTimeout(advance, 500)
  }, [])

  const resetSimulation = useCallback(() => {
    if (simTimerRef.current) clearTimeout(simTimerRef.current)
    setSimData(MOCK_EMPTY)
    setIsSimulating(false)
  }, [])

  useEffect(() => {
    return () => {
      if (simTimerRef.current) clearTimeout(simTimerRef.current)
    }
  }, [])

  // --- Plan State cycle state ---
  const [stateIdx, setStateIdx] = useState(1)
  const stateCycleData: DraftPlanData = {
    ...MOCK_FULL,
    planState: ALL_PLAN_STATES[stateIdx],
  }

  return (
    <div className="min-h-screen bg-page p-6 md:p-12">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-12">
          <Link to="/" className="type-caption text-link hover:underline">
            &larr; Back
          </Link>
          <h1 className="type-h1 text-ink mt-4">DraftPlan</h1>
          <p className="type-body text-body-text mt-2">
            Lightweight plan preview that appears before meaningful execution
            starts. Shows numbered steps and a prominent &ldquo;Execution: Not
            started&rdquo; indicator.
          </p>
          <p className="type-caption text-subtle mt-1">
            Source: <span className="type-code">TICKET-008</span>
          </p>
        </div>

        {/* Section 1: Interactive Demo */}
        <section className="mb-16">
          <h2 className="type-h2 text-ink mb-6">Interactive Demo</h2>
          <p className="type-body text-body-text mb-6">
            Toggle the title and cycle through plan states. The execution status
            indicator updates to reflect each state.
          </p>

          <Panel surface="cool" padding="spacious">
            <div className="mb-6">
              <DraftPlan data={interactiveData} />
            </div>

            {/* Title toggle */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={showTitle ? "default" : "outline"}
                size="sm"
                className={
                  showTitle
                    ? "cursor-pointer bg-brand text-white hover:bg-brand-hover"
                    : "cursor-pointer"
                }
                onClick={() => setShowTitle(!showTitle)}
              >
                Title
              </Button>
            </div>

            {/* State buttons */}
            <div className="mt-4 flex flex-wrap gap-2 border-t border-divider pt-4">
              <span className="type-label text-subtle self-center">STATE</span>
              {ALL_PLAN_STATES.map((s) => (
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
                  {s}
                </Button>
              ))}
            </div>

            {/* Metadata */}
            <div className="mt-3 border-t border-divider pt-3">
              <p className="type-caption text-subtle">
                Title:{" "}
                <span className="type-code">
                  {showTitle ? "visible" : "hidden"}
                </span>{" "}
                &middot; State:{" "}
                <span className="type-code">{activeState}</span> &middot;
                Steps: <span className="type-code">{MOCK_FULL.steps.length}</span>
              </p>
            </div>
          </Panel>
        </section>

        {/* Section 2: All States */}
        <section className="mb-16">
          <h2 className="type-h2 text-ink mb-6">All States</h2>
          <p className="type-body text-body-text mb-6">
            Four DraftPlan instances showing each plan state: drafting, ready,
            approved, and cancelled.
          </p>

          <div className="flex flex-col gap-4">
            {ALL_PLAN_STATES.map((state) => (
              <Panel key={state} surface="cool" padding="compact">
                <p className="type-label text-subtle mb-3">
                  {state.toUpperCase()}
                </p>
                <DraftPlan data={{ ...MOCK_FULL, planState: state }} />
              </Panel>
            ))}
          </div>
        </section>

        {/* Section 3: Incremental Population */}
        <section className="mb-16">
          <h2 className="type-h2 text-ink mb-6">Incremental Population</h2>
          <p className="type-body text-body-text mb-6">
            Simulates the system building a plan step-by-step as it analyzes the
            user&rsquo;s request. Steps animate in with staggered timing, then
            the state transitions from drafting to ready.
          </p>

          <Panel surface="cool" padding="spacious">
            <div className="mb-4">
              <DraftPlan data={simData} />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={startSimulation}
                disabled={isSimulating}
              >
                {isSimulating ? "Simulating\u2026" : "Simulate Plan Building"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="cursor-pointer"
                onClick={resetSimulation}
              >
                Reset
              </Button>
            </div>
          </Panel>
        </section>

        {/* Section 4: Plan State Cycle */}
        <section className="mb-16">
          <h2 className="type-h2 text-ink mb-6">Plan State Cycle</h2>
          <p className="type-body text-body-text mb-6">
            Cycle through all 4 plan states. Each state uses a distinct dot
            color and label to communicate plan readiness.
          </p>

          <Panel surface="cool" padding="spacious">
            <div className="mb-4">
              <DraftPlan data={stateCycleData} />
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_PLAN_STATES.map((s, i) => (
                <Button
                  key={s}
                  variant={stateIdx === i ? "default" : "outline"}
                  size="sm"
                  className={
                    stateIdx === i
                      ? "cursor-pointer bg-brand text-white hover:bg-brand-hover"
                      : "cursor-pointer"
                  }
                  onClick={() => setStateIdx(i)}
                >
                  {PLAN_STATE_CONFIG[s].label}
                </Button>
              ))}
            </div>
          </Panel>
        </section>

        {/* Section 5: Number Alignment */}
        <section className="mb-16">
          <h2 className="type-h2 text-ink mb-6">Number Alignment</h2>
          <p className="type-body text-body-text mb-6">
            A plan with 12 steps to verify that tabular numbers keep single-digit
            and double-digit step numbers vertically aligned.
          </p>

          <Panel surface="cool" padding="spacious">
            <DraftPlan data={MOCK_MANY_STEPS} />
          </Panel>
        </section>

        {/* Footer */}
        <footer className="border-t border-hairline pt-6">
          <p className="type-caption text-subtle">
            Development-only component showcase &mdash;{" "}
            <span className="type-code">TICKET-008</span>
          </p>
        </footer>
      </div>
    </div>
  )
}
