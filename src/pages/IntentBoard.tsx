import { useState, useEffect, useRef, useCallback } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Panel } from "@/components/ui/panel"
import {
  IntentBoard,
  EXECUTION_STATUS_CONFIG,
  type IntentData,
  type ExecutionStatus,
} from "@/components/ui/intent-board"

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_EMPTY: IntentData = {
  executionStatus: "not_started",
}

const MOCK_GOAL_ONLY: IntentData = {
  goal: "Organize my Downloads folder by file type",
  executionStatus: "not_started",
}

const MOCK_FULL: IntentData = {
  goal: "Organize my Downloads folder by file type",
  scope: "~/Downloads \u2014 screenshots from this week",
  constraints: "Do not touch PDFs or zip files",
  exclusions: "Ignore hidden files and system files",
  executionStatus: "not_started",
}

const MOCK_WITH_AMBIGUITY: IntentData = {
  ...MOCK_FULL,
  unresolvedQuestions: [
    { id: "q1", text: "Which folder should contain the grouped screenshots?" },
    { id: "q2", text: "Should duplicate filenames be renamed or skipped?" },
  ],
}

const ALL_STATUSES: ExecutionStatus[] = [
  "not_started",
  "planning",
  "waiting_approval",
  "executing",
  "paused",
  "completed",
  "failed",
]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function IntentBoardPage() {
  // --- Interactive Demo state ---
  const [showGoal, setShowGoal] = useState(true)
  const [showScope, setShowScope] = useState(true)
  const [showConstraints, setShowConstraints] = useState(true)
  const [showExclusions, setShowExclusions] = useState(true)
  const [showQuestions, setShowQuestions] = useState(false)
  const [activeStatus, setActiveStatus] = useState<ExecutionStatus>("not_started")

  const interactiveData: IntentData = {
    goal: showGoal ? MOCK_FULL.goal : undefined,
    scope: showScope ? MOCK_FULL.scope : undefined,
    constraints: showConstraints ? MOCK_FULL.constraints : undefined,
    exclusions: showExclusions ? MOCK_FULL.exclusions : undefined,
    unresolvedQuestions: showQuestions
      ? MOCK_WITH_AMBIGUITY.unresolvedQuestions
      : undefined,
    executionStatus: activeStatus,
  }

  // --- Incremental simulation state ---
  const [simData, setSimData] = useState<IntentData>(MOCK_EMPTY)
  const [isSimulating, setIsSimulating] = useState(false)
  const simTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startSimulation = useCallback(() => {
    setSimData(MOCK_EMPTY)
    setIsSimulating(true)

    const steps: Array<() => void> = [
      () =>
        setSimData({
          goal: "Organize my Downloads folder by file type",
          executionStatus: "not_started",
        }),
      () =>
        setSimData((prev) => ({
          ...prev,
          scope: "~/Downloads \u2014 screenshots from this week",
        })),
      () =>
        setSimData((prev) => ({
          ...prev,
          constraints: "Do not touch PDFs or zip files",
        })),
      () =>
        setSimData((prev) => ({
          ...prev,
          unresolvedQuestions: [
            {
              id: "q1",
              text: "Which folder should contain the grouped screenshots?",
            },
          ],
        })),
      () =>
        setSimData((prev) => ({
          ...prev,
          unresolvedQuestions: undefined,
          exclusions: "Ignore hidden files and system files",
        })),
      () =>
        setSimData((prev) => ({ ...prev, executionStatus: "planning" as const })),
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

  // --- Execution Status cycle state ---
  const [statusIdx, setStatusIdx] = useState(0)
  const statusCycleData: IntentData = {
    ...MOCK_FULL,
    executionStatus: ALL_STATUSES[statusIdx],
  }

  return (
    <div className="min-h-screen bg-page p-6 md:p-12">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-12">
          <Link to="/" className="type-caption text-link hover:underline">
            &larr; Back
          </Link>
          <h1 className="type-h1 text-ink mt-4">IntentBoard</h1>
          <p className="type-body text-body-text mt-2">
            Structured pre-execution panel that mirrors the system&rsquo;s
            understanding of user intent before any action begins.
          </p>
          <p className="type-caption text-subtle mt-1">
            Source: <span className="type-code">TICKET-007</span>
          </p>
        </div>

        {/* Section 1: Interactive Demo */}
        <section className="mb-16">
          <h2 className="type-h2 text-ink mb-6">Interactive Demo</h2>
          <p className="type-body text-body-text mb-6">
            Toggle individual fields on or off and cycle through execution
            statuses. Fields animate in and out with Framer Motion.
          </p>

          <Panel surface="cool" padding="spacious">
            <div className="mb-6">
              <IntentBoard data={interactiveData} />
            </div>

            {/* Field toggles */}
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["Goal", showGoal, setShowGoal],
                  ["Scope", showScope, setShowScope],
                  ["Constraints", showConstraints, setShowConstraints],
                  ["Exclusions", showExclusions, setShowExclusions],
                  ["Questions", showQuestions, setShowQuestions],
                ] as const
              ).map(([label, active, setter]) => (
                <Button
                  key={label}
                  variant={active ? "default" : "outline"}
                  size="sm"
                  className={
                    active
                      ? "cursor-pointer bg-brand text-white hover:bg-brand-hover"
                      : "cursor-pointer"
                  }
                  onClick={() =>
                    (setter as React.Dispatch<React.SetStateAction<boolean>>)(
                      !active
                    )
                  }
                >
                  {label}
                </Button>
              ))}
            </div>

            {/* Status buttons */}
            <div className="mt-4 flex flex-wrap gap-2 border-t border-divider pt-4">
              <span className="type-label text-subtle self-center">
                STATUS
              </span>
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
                  {s.replace(/_/g, " ")}
                </Button>
              ))}
            </div>

            {/* Metadata */}
            <div className="mt-3 border-t border-divider pt-3">
              <p className="type-caption text-subtle">
                Fields:{" "}
                <span className="type-code">
                  {[
                    showGoal && "goal",
                    showScope && "scope",
                    showConstraints && "constraints",
                    showExclusions && "exclusions",
                    showQuestions && "questions",
                  ]
                    .filter(Boolean)
                    .join(", ") || "none"}
                </span>
                {" "}&middot; Status:{" "}
                <span className="type-code">{activeStatus}</span>
              </p>
            </div>
          </Panel>
        </section>

        {/* Section 2: All States */}
        <section className="mb-16">
          <h2 className="type-h2 text-ink mb-6">All States</h2>
          <p className="type-body text-body-text mb-6">
            Four IntentBoard instances showing progressively richer data: empty,
            goal-only, full, and full with unresolved questions.
          </p>

          <div className="flex flex-col gap-4">
            {(
              [
                ["Empty", MOCK_EMPTY],
                ["Goal Only", MOCK_GOAL_ONLY],
                ["Full", MOCK_FULL],
                ["With Ambiguity", MOCK_WITH_AMBIGUITY],
              ] as const
            ).map(([label, data]) => (
              <Panel key={label} surface="cool" padding="compact">
                <p className="type-label text-subtle mb-3">
                  {label.toUpperCase()}
                </p>
                <IntentBoard data={data as IntentData} />
              </Panel>
            ))}
          </div>
        </section>

        {/* Section 3: Incremental Population */}
        <section className="mb-16">
          <h2 className="type-h2 text-ink mb-6">Incremental Population</h2>
          <p className="type-body text-body-text mb-6">
            Simulates a conversation where fields appear progressively as the
            system builds understanding. Unresolved questions appear then resolve
            before execution status changes.
          </p>

          <Panel surface="cool" padding="spacious">
            <div className="mb-4">
              <IntentBoard data={simData} />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={startSimulation}
                disabled={isSimulating}
              >
                {isSimulating ? "Simulating\u2026" : "Simulate Conversation"}
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

        {/* Section 4: Execution Status States */}
        <section className="mb-16">
          <h2 className="type-h2 text-ink mb-6">Execution Status States</h2>
          <p className="type-body text-body-text mb-6">
            Cycle through all 7 execution statuses. Each status uses distinct
            typography and color to communicate state.
          </p>

          <Panel surface="cool" padding="spacious">
            <div className="mb-4">
              <IntentBoard data={statusCycleData} />
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_STATUSES.map((s, i) => (
                <Button
                  key={s}
                  variant={statusIdx === i ? "default" : "outline"}
                  size="sm"
                  className={
                    statusIdx === i
                      ? "cursor-pointer bg-brand text-white hover:bg-brand-hover"
                      : "cursor-pointer"
                  }
                  onClick={() => setStatusIdx(i)}
                >
                  {EXECUTION_STATUS_CONFIG[s].label}
                </Button>
              ))}
            </div>
          </Panel>
        </section>

        {/* Footer */}
        <footer className="border-t border-hairline pt-6">
          <p className="type-caption text-subtle">
            Development-only component showcase &mdash;{" "}
            <span className="type-code">TICKET-007</span>
          </p>
        </footer>
      </div>
    </div>
  )
}
