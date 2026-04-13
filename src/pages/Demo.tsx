import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"

import { ApprovalCard } from "@/components/ui/approval-card"
import { Button } from "@/components/ui/button"
import { CompletionSummary } from "@/components/ui/completion-summary"
import { DraftPlan } from "@/components/ui/draft-plan"
import { IntentBoard } from "@/components/ui/intent-board"
import { Panel } from "@/components/ui/panel"
import { StatusCapsule } from "@/components/ui/status-capsule"
import {
  TaskPanel,
  type TaskHeaderData,
  type TaskMetaData,
} from "@/components/ui/task-panel"
import { Timeline } from "@/components/ui/timeline"
import { VoiceBar } from "@/components/ui/voice-bar"
import {
  ORGANIZE_DOWNLOADS_APPROVAL_INDEX,
  ORGANIZE_DOWNLOADS_APPROVE_SEQUENCE,
  ORGANIZE_DOWNLOADS_DENY_SEQUENCE,
  ORGANIZE_DOWNLOADS_PRE_APPROVAL_SEQUENCE,
  getOrganizeDownloadsSequence,
  type OrganizeDownloadsBranch,
} from "@/demo/organize-downloads"
import {
  bridgeStore,
  createMockEventDispatcher,
  resetBridgeStore,
  useApproval,
  useConversationState,
  useCurrentTask,
  useEventHistory,
  useExecutionState,
  useTimeline,
  type BridgeStoreApi,
} from "@/state"

type DemoMode = "auto" | "manual"

interface DemoPageProps {
  store?: BridgeStoreApi
}

function getDisplayExecutionState(
  executionState: ReturnType<typeof useExecutionState>["state"],
  taskState: ReturnType<typeof useCurrentTask>["state"],
  approvalState: ReturnType<typeof useApproval>["state"],
) {
  if (taskState === "planning" && approvalState !== "requested") {
    if (executionState === "waiting_confirmation") {
      return "drafting_plan" as const
    }
  }

  return executionState
}

function getVoiceAmplitude(
  conversationState: ReturnType<typeof useConversationState>["state"],
) {
  switch (conversationState) {
    case "listening":
      return 0.82
    case "holding_for_more":
      return 0.74
    case "clarifying":
      return 0.58
    case "speaking":
      return 1
    default:
      return 0
  }
}

export default function DemoPage({
  store = bridgeStore,
}: DemoPageProps) {
  const conversation = useConversationState(store)
  const execution = useExecutionState(store)
  const currentTask = useCurrentTask(store)
  const timeline = useTimeline(store)
  const approval = useApproval(store)
  const eventHistory = useEventHistory(store)

  const dispatcherRef = useRef(createMockEventDispatcher(store))
  const panelVisibilityRef = useRef(false)

  const [mode, setMode] = useState<DemoMode>("auto")
  const [branch, setBranch] = useState<OrganizeDownloadsBranch>("pending")
  const [manualIndex, setManualIndex] = useState(0)
  const [panelOpen, setPanelOpen] = useState(false)
  const [lastAction, setLastAction] = useState(
    "Auto-play will walk through the BridgeOS Downloads workflow.",
  )

  const displayExecutionState = getDisplayExecutionState(
    execution.state,
    currentTask.state,
    approval.state,
  )
  const voiceAmplitude = getVoiceAmplitude(conversation.state)
  const shouldDisplayPanel =
    Boolean(currentTask.title) || currentTask.state !== "idle"
  const awaitingManualDecision =
    mode === "manual" &&
    branch === "pending" &&
    manualIndex >= ORGANIZE_DOWNLOADS_APPROVAL_INDEX &&
    approval.state === "requested"

  const taskHeader: TaskHeaderData = {
    title: currentTask.title ?? "Awaiting request",
    summary:
      currentTask.summary ??
      "BridgeOS is waiting for enough context to build the task panel.",
  }

  const taskMeta: TaskMetaData = {
    status: currentTask.state,
    risk: currentTask.risk ?? "low",
    scope: currentTask.scope ?? "Awaiting scope",
  }
  const intentExecutionLabel =
    currentTask.state === "cancelled" ? "Cancelled" : undefined
  const intentExecutionClassName =
    currentTask.state === "cancelled" ? "type-body text-subtle" : undefined

  useEffect(() => {
    if (shouldDisplayPanel && !panelVisibilityRef.current) {
      setPanelOpen(true)
    }

    panelVisibilityRef.current = shouldDisplayPanel
  }, [shouldDisplayPanel])

  useEffect(() => {
    const dispatcher = dispatcherRef.current

    dispatcher.cancel()
    resetBridgeStore(store)
    setBranch("pending")
    setManualIndex(0)

    if (mode === "auto") {
      setLastAction("Auto-play running. Waiting for the approval checkpoint.")
      dispatcher.play(ORGANIZE_DOWNLOADS_PRE_APPROVAL_SEQUENCE)
    } else {
      setLastAction("Manual mode ready. Use Next step to advance the flow.")
    }

    return () => {
      dispatcher.cancel()
    }
  }, [mode, store])

  function restartDemo() {
    const dispatcher = dispatcherRef.current

    dispatcher.cancel()
    resetBridgeStore(store)
    setBranch("pending")
    setManualIndex(0)
    panelVisibilityRef.current = false

    if (mode === "auto") {
      setLastAction("Auto-play restarted from idle.")
      dispatcher.play(ORGANIZE_DOWNLOADS_PRE_APPROVAL_SEQUENCE)
      return
    }

    setLastAction("Manual mode reset to idle.")
  }

  function replayManualState(
    nextIndex: number,
    nextBranch: OrganizeDownloadsBranch,
  ) {
    const dispatcher = dispatcherRef.current
    const sequence = getOrganizeDownloadsSequence(nextBranch)

    dispatcher.cancel()
    resetBridgeStore(store)

    for (let index = 0; index < nextIndex; index += 1) {
      dispatcher.step(sequence, index)
    }

    setBranch(nextBranch)
    setManualIndex(nextIndex)
  }

  function handleNextStep() {
    const dispatcher = dispatcherRef.current
    const sequence = getOrganizeDownloadsSequence(branch)

    if (awaitingManualDecision || manualIndex >= sequence.length) {
      return
    }

    const nextIndex = dispatcher.step(sequence, manualIndex)

    setManualIndex(nextIndex)
    setLastAction(`Manual step dispatched: ${sequence[manualIndex].event.type}.`)
  }

  function handlePreviousStep() {
    if (manualIndex === 0) {
      return
    }

    const nextIndex = manualIndex - 1
    const nextBranch =
      nextIndex <= ORGANIZE_DOWNLOADS_APPROVAL_INDEX
        ? "pending"
        : branch

    replayManualState(nextIndex, nextBranch)
    setLastAction("Manual flow rewound by one event.")
  }

  function handleApprove() {
    const dispatcher = dispatcherRef.current

    if (mode === "manual") {
      const sequence = getOrganizeDownloadsSequence("approved")
      const nextIndex = dispatcher.step(sequence, ORGANIZE_DOWNLOADS_APPROVAL_INDEX)

      setBranch("approved")
      setManualIndex(nextIndex)
      setLastAction("Approval granted. Continue with Next step to finish the task.")
      return
    }

    setBranch("approved")
    setLastAction("Approval granted. Auto-play resumed.")
    dispatcher.play(ORGANIZE_DOWNLOADS_APPROVE_SEQUENCE)
  }

  function handleDeny() {
    const dispatcher = dispatcherRef.current

    if (mode === "manual") {
      const sequence = getOrganizeDownloadsSequence("denied")
      const nextIndex = dispatcher.step(sequence, ORGANIZE_DOWNLOADS_APPROVAL_INDEX)

      setBranch("denied")
      setManualIndex(nextIndex)
      setLastAction("Approval denied. Continue with Next step to finish the cancel path.")
      return
    }

    setBranch("denied")
    setLastAction("Approval denied. Auto-play is ending on the cancel path.")
    dispatcher.play(ORGANIZE_DOWNLOADS_DENY_SEQUENCE)
  }

  return (
    <div className="min-h-screen bg-page p-6 md:p-12 lg:pr-[600px]">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <div>
          <Link to="/" className="type-caption text-link hover:underline">
            &larr; Back
          </Link>
          <h1 className="type-h1 mt-4 text-ink">BridgeOS Interactive Demo</h1>
          <p className="type-body mt-2 text-body-text">
            Ticket 017 wires the BridgeOS interface to the Zustand store and
            replays the full &ldquo;Organize Downloads&rdquo; flow from transcript
            to completion.
          </p>
        </div>

        <div className="flex items-center justify-center">
          <StatusCapsule
            conversationState={conversation.state}
            executionState={execution.state}
            taskState={currentTask.state}
            progress={execution.progress}
            onClick={() => {
              if (!shouldDisplayPanel) {
                return
              }

              setPanelOpen((isOpen) => !isOpen)
            }}
          />
        </div>

        <div className="flex justify-center">
          <VoiceBar
            conversationState={conversation.state}
            amplitude={voiceAmplitude}
            transcript={conversation.transcript}
            onMuteToggle={() => {
              setLastAction("Mute is not connected in the mock demo.")
            }}
          />
        </div>

        <Panel surface="cool" padding="spacious">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant={mode === "auto" ? "default" : "outline"}
              size="sm"
              className={
                mode === "auto"
                  ? "cursor-pointer bg-brand text-white hover:bg-brand-hover"
                  : "cursor-pointer"
              }
              onClick={() => setMode("auto")}
            >
              Auto mode
            </Button>
            <Button
              variant={mode === "manual" ? "default" : "outline"}
              size="sm"
              className={
                mode === "manual"
                  ? "cursor-pointer bg-brand text-white hover:bg-brand-hover"
                  : "cursor-pointer"
              }
              onClick={() => setMode("manual")}
            >
              Manual mode
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={restartDemo}
            >
              Restart demo
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={handlePreviousStep}
              disabled={mode !== "manual" || manualIndex === 0}
            >
              Previous step
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={handleNextStep}
              disabled={
                mode !== "manual" ||
                awaitingManualDecision ||
                manualIndex >= getOrganizeDownloadsSequence(branch).length
              }
            >
              Next step
            </Button>
          </div>

          <div className="mt-4 grid gap-4 border-t border-divider pt-4 md:grid-cols-2">
            <div>
              <p className="type-label text-subtle">MODE</p>
              <p className="type-body mt-1 text-body-text">
                {mode === "auto"
                  ? "Auto-play pauses at approval and resumes only after user input."
                  : "Manual mode dispatches one event at a time and supports rewind."}
              </p>
            </div>
            <div>
              <p className="type-label text-subtle">TRACE</p>
              <p className="type-body mt-1 text-body-text">
                Branch: {branch} · Manual index: {manualIndex} · Events recorded:{" "}
                {eventHistory.length}
              </p>
            </div>
          </div>

          <div className="mt-4 border-t border-divider pt-4">
            <p className="type-label text-subtle">LAST ACTION</p>
            <p className="type-body mt-1 text-body-text">{lastAction}</p>
          </div>
        </Panel>
      </div>

      <TaskPanel
        isOpen={panelOpen && shouldDisplayPanel}
        onClose={() => setPanelOpen(false)}
        header={taskHeader}
        meta={taskMeta}
        autoScrollToBottom
        autoScrollTrigger={eventHistory.length}
      >
        <div className="flex flex-col gap-4 pb-4">
          <IntentBoard
            data={{
              ...currentTask.intent,
              executionStatus: displayExecutionState,
              executionLabel: intentExecutionLabel,
              executionClassName: intentExecutionClassName,
            }}
          />
          <DraftPlan data={currentTask.plan} />
          {timeline.length > 0 && <Timeline data={{ steps: timeline }} />}
          {approval.state === "requested" && approval.request && (
            <ApprovalCard
              action={approval.request.action}
              riskLevel={approval.request.riskLevel}
              explanation={approval.request.explanation}
              willAffect={approval.request.willAffect}
              willNotAffect={approval.request.willNotAffect}
              impactSummary={approval.request.impactSummary}
              command={approval.request.command}
              onApprove={handleApprove}
              onDeny={handleDeny}
            />
          )}
          {currentTask.completion && (
            <CompletionSummary
              title={currentTask.completion.title}
              outcome={currentTask.completion.outcome}
              changes={currentTask.completion.changes}
              rollbackAvailable={currentTask.completion.rollbackAvailable}
              rollbackTimeRemaining={currentTask.completion.rollbackTimeRemaining}
              onUndo={restartDemo}
              onViewChanges={() =>
                setLastAction(
                  `The event history currently contains ${eventHistory.length} entries.`,
                )
              }
              onClose={() => setPanelOpen(false)}
            />
          )}
        </div>
      </TaskPanel>
    </div>
  )
}
