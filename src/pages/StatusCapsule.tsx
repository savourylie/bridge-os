import { useState } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Panel } from "@/components/ui/panel"
import {
  StatusCapsule,
  getStatusCapsuleConfig,
} from "@/components/ui/status-capsule"
import {
  CONVERSATION_STATES,
  EXECUTION_STATES,
  type ConversationState,
  type ExecutionState,
} from "@/state"

const ACTIVE_EXECUTION_STATES = EXECUTION_STATES.filter(
  (state): state is Exclude<ExecutionState, "not_started"> =>
    state !== "not_started",
)

export default function StatusCapsulePage() {
  const [activeConversationState, setActiveConversationState] =
    useState<ConversationState>("idle")
  const [activeExecutionState, setActiveExecutionState] =
    useState<ExecutionState>("not_started")
  const [showFixed, setShowFixed] = useState(false)

  const activeConfig = getStatusCapsuleConfig(
    activeConversationState,
    activeExecutionState,
  )

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
            Conversation and execution are now modeled as parallel tracks, with
            execution taking visual priority once work begins.
          </p>
          <p className="type-caption text-subtle mt-1">
            Source: <span className="type-code">TICKET-005</span>
          </p>
        </div>

        {/* Section 1: Interactive Demo */}
        <section className="mb-16">
          <h2 className="type-h2 text-ink mb-6">Interactive Demo</h2>
          <p className="type-body text-body-text mb-6">
            Adjust conversation and execution independently. The capsule stays
            on conversation state until execution leaves{" "}
            <span className="type-code">not_started</span>.
          </p>

          <Panel surface="cool" padding="spacious">
            <div className="mb-6 flex justify-center">
              <div className="rounded-md bg-page p-8">
                <StatusCapsule
                  conversationState={activeConversationState}
                  executionState={activeExecutionState}
                  progress={
                    activeExecutionState === "executing"
                      ? { current: 2, total: 5 }
                      : undefined
                  }
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-divider pt-4">
              <span className="type-label text-subtle self-center">
                CONVERSATION
              </span>
              {CONVERSATION_STATES.map((state) => (
                <Button
                  key={state}
                  variant={activeConversationState === state ? "default" : "outline"}
                  size="sm"
                  className={
                    activeConversationState === state
                      ? "cursor-pointer bg-brand text-white hover:bg-brand-hover"
                      : "cursor-pointer"
                  }
                  onClick={() => setActiveConversationState(state)}
                >
                  {state.replace(/_/g, " ")}
                </Button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-divider pt-4">
              <span className="type-label text-subtle self-center">
                EXECUTION
              </span>
              {EXECUTION_STATES.map((state) => (
                <Button
                  key={state}
                  variant={activeExecutionState === state ? "default" : "outline"}
                  size="sm"
                  className={
                    activeExecutionState === state
                      ? "cursor-pointer bg-brand text-white hover:bg-brand-hover"
                      : "cursor-pointer"
                  }
                  onClick={() => setActiveExecutionState(state)}
                >
                  {state.replace(/_/g, " ")}
                </Button>
              ))}
            </div>

            <div className="mt-4 border-t border-divider pt-4">
              <p className="type-caption text-subtle">
                Conversation:{" "}
                <span className="type-code">{activeConversationState}</span>{" "}
                &middot; Execution:{" "}
                <span className="type-code">{activeExecutionState}</span>{" "}
                &middot; Dot:{" "}
                <span
                  className="inline-block h-2 w-2 rounded-full align-middle"
                  style={{ backgroundColor: activeConfig.dotColor }}
                />{" "}
                <span className="type-code">{activeConfig.dotColor}</span>{" "}
                &middot; Surface:{" "}
                <span className="type-code">{activeConfig.surface}</span>
                {activeConfig.breathing && <> &middot; Breathing: active</>}
              </p>
            </div>
          </Panel>
        </section>

        {/* Section 2: Canonical States */}
        <section className="mb-16">
          <h2 className="type-h2 text-ink mb-6">Canonical States</h2>
          <p className="type-body text-body-text mb-6">
            Conversation and execution are separate tracks. The rows below show
            how each canonical state renders inside the capsule.
          </p>

          <div className="flex flex-col gap-4">
            <Panel surface="cool" padding="spacious">
              <p className="type-label text-subtle mb-4">CONVERSATION</p>
              <div className="flex flex-col gap-4">
                {CONVERSATION_STATES.map((state) => {
                  const config = getStatusCapsuleConfig(state, "not_started")
                  return (
                    <div key={state} className="flex items-center gap-4">
                      <StatusCapsule conversationState={state} />
                      <div>
                        <span className="type-label text-subtle">{state}</span>
                        <span className="type-caption text-subtle ml-3">
                          {config.dotColor} &middot; {config.surface}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Panel>

            <Panel surface="cool" padding="spacious">
              <p className="type-label text-subtle mb-4">EXECUTION</p>
              <div className="flex flex-col gap-4">
                {ACTIVE_EXECUTION_STATES.map((state) => {
                  const config = getStatusCapsuleConfig("intent_locked", state)
                  return (
                    <div key={state} className="flex items-center gap-4">
                      <StatusCapsule
                        conversationState="intent_locked"
                        executionState={state}
                        progress={
                          state === "executing"
                            ? { current: 3, total: 5 }
                            : undefined
                        }
                      />
                      <div>
                        <span className="type-label text-subtle">{state}</span>
                        <span className="type-caption text-subtle ml-3">
                          {config.dotColor} &middot; {config.surface}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Panel>
          </div>
        </section>

        {/* Section 3: Executing with Progress */}
        <section className="mb-16">
          <h2 className="type-h2 text-ink mb-6">Executing with Progress</h2>
          <p className="type-body text-body-text mb-6">
            The <span className="type-code">executing</span> execution state
            accepts a <span className="type-code">progress</span> prop to show
            step counts.
          </p>

          <Panel surface="cool" padding="spacious">
            <div className="flex flex-col gap-4">
              {[
                { current: 1, total: 5 },
                { current: 3, total: 5 },
                { current: 5, total: 5 },
              ].map((progress) => (
                <div key={progress.current} className="flex items-center gap-4">
                  <StatusCapsule
                    conversationState="intent_locked"
                    executionState="executing"
                    progress={progress}
                  />
                  <span className="type-caption text-subtle">
                    progress:{" "}
                    {`{ current: ${progress.current}, total: ${progress.total} }`}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-4">
                <StatusCapsule
                  conversationState="intent_locked"
                  executionState="executing"
                />
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
          <StatusCapsule
            conversationState={activeConversationState}
            executionState={activeExecutionState}
          />
        </div>
      )}
    </div>
  )
}
