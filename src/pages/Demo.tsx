import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"

import { useTauriSpeechSynthesis } from "@/bridge/tauri-speech-synthesis"
import { useTauriSpeechRecognition } from "@/bridge/tauri-speech-recognition"
import { tauriBridge } from "@/bridge/tauri"
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
  PROJECT_INSPECTION_FULL_SEQUENCE,
  getProjectInspectionSequence,
} from "@/demo/project-inspection"
import {
  GUARDED_COMMAND_APPROVAL_INDEX,
  GUARDED_COMMAND_APPROVE_SEQUENCE,
  GUARDED_COMMAND_DENY_SEQUENCE,
  GUARDED_COMMAND_PRE_APPROVAL_SEQUENCE,
  getGuardedCommandSequence,
} from "@/demo/guarded-command"
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
import type { TimedBridgeEvent } from "@/state/events"

type DemoMode = "auto" | "manual"
type DemoFlowType = "organizeDownloads" | "projectInspection" | "guardedCommand"

const FLOW_LABELS: Record<DemoFlowType, string> = {
  organizeDownloads: "Organize Downloads",
  projectInspection: "Inspect Project",
  guardedCommand: "Run Command",
}

const FLOW_TAURI_PROMPTS: Record<DemoFlowType, string> = {
  organizeDownloads: "Organize my Downloads folder by file type",
  projectInspection: "Inspect my bridge-os project",
  guardedCommand: "Run git status in my bridge-os project",
}

function getFlowPreApprovalSequence(flow: DemoFlowType): TimedBridgeEvent[] {
  switch (flow) {
    case "organizeDownloads":
      return ORGANIZE_DOWNLOADS_PRE_APPROVAL_SEQUENCE
    case "projectInspection":
      return PROJECT_INSPECTION_FULL_SEQUENCE
    case "guardedCommand":
      return GUARDED_COMMAND_PRE_APPROVAL_SEQUENCE
  }
}

function getFlowApprovalIndex(flow: DemoFlowType): number {
  switch (flow) {
    case "organizeDownloads":
      return ORGANIZE_DOWNLOADS_APPROVAL_INDEX
    case "projectInspection":
      return Infinity
    case "guardedCommand":
      return GUARDED_COMMAND_APPROVAL_INDEX
  }
}

function getFlowApproveSequence(flow: DemoFlowType): TimedBridgeEvent[] {
  switch (flow) {
    case "organizeDownloads":
      return ORGANIZE_DOWNLOADS_APPROVE_SEQUENCE
    case "projectInspection":
      return []
    case "guardedCommand":
      return GUARDED_COMMAND_APPROVE_SEQUENCE
  }
}

function getFlowDenySequence(flow: DemoFlowType): TimedBridgeEvent[] {
  switch (flow) {
    case "organizeDownloads":
      return ORGANIZE_DOWNLOADS_DENY_SEQUENCE
    case "projectInspection":
      return []
    case "guardedCommand":
      return GUARDED_COMMAND_DENY_SEQUENCE
  }
}

function getActiveFlowSequence(
  flow: DemoFlowType,
  branch: OrganizeDownloadsBranch,
): TimedBridgeEvent[] {
  switch (flow) {
    case "organizeDownloads":
      return getOrganizeDownloadsSequence(branch)
    case "projectInspection":
      return getProjectInspectionSequence()
    case "guardedCommand":
      return getGuardedCommandSequence(branch)
  }
}

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
  const isTauriMode = tauriBridge.isAvailable()

  const [mode, setMode] = useState<DemoMode>("auto")
  const [selectedFlow, setSelectedFlow] = useState<DemoFlowType>("organizeDownloads")
  const [branch, setBranch] = useState<OrganizeDownloadsBranch>("pending")
  const [manualIndex, setManualIndex] = useState(0)
  const [panelOpen, setPanelOpen] = useState(false)
  const [lastAction, setLastAction] = useState(
    "Auto-play will walk through the BridgeOS Downloads workflow.",
  )
  useTauriSpeechRecognition({
    enabled: isTauriMode,
    conversation,
    onStatusChange: setLastAction,
    store,
  })
  useTauriSpeechSynthesis({
    approval,
    conversation,
    currentTask,
    enabled: isTauriMode,
    execution,
    onStatusChange: setLastAction,
    store,
  })

  const displayExecutionState = getDisplayExecutionState(
    execution.state,
    currentTask.state,
    approval.state,
  )
  const voiceAmplitude = getVoiceAmplitude(conversation.state)
  const shouldDisplayPanel =
    Boolean(currentTask.title) || currentTask.state !== "idle"

  const flowApprovalIndex = getFlowApprovalIndex(selectedFlow)
  const awaitingManualDecision =
    !isTauriMode &&
    mode === "manual" &&
    branch === "pending" &&
    manualIndex >= flowApprovalIndex &&
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

  // Subscribe to Tauri backend events so the store stays in sync with runtime state.
  useEffect(() => {
    if (!isTauriMode) return
    let unlisten: VoidFunction | undefined
    let didCancel = false
    void (async () => {
      unlisten = await tauriBridge.subscribe(store)
      if (didCancel) { unlisten(); return }
    })()
    return () => {
      didCancel = true
      unlisten?.()
    }
  }, [isTauriMode, store])

  useEffect(() => {
    const dispatcher = dispatcherRef.current

    dispatcher.cancel()
    resetBridgeStore(store)
    setBranch("pending")
    setManualIndex(0)

    if (isTauriMode) {
      setLastAction(
        `Microphone live. Say a request like "${FLOW_TAURI_PROMPTS[selectedFlow]}".`,
      )
      void (async () => {
        await tauriBridge.startListening(store)
      })()
      return
    }

    if (mode === "auto") {
      setLastAction(`Auto-play running — ${FLOW_LABELS[selectedFlow]}.`)
      dispatcher.play(getFlowPreApprovalSequence(selectedFlow))
    } else {
      setLastAction("Manual mode ready. Use Next step to advance the flow.")
    }

    return () => {
      dispatcher.cancel()
    }
  }, [isTauriMode, mode, store, selectedFlow])

  function handleUndo() {
    const dispatcher = dispatcherRef.current

    dispatcher.cancel()
    resetBridgeStore(store)
    setBranch("pending")
    setManualIndex(0)
    panelVisibilityRef.current = false

    if (isTauriMode) {
      setLastAction("Undoing — reversing file operations.")
      void (async () => {
        if (selectedFlow === "organizeDownloads") {
          try { await tauriBridge.undoFolderOrganization() } catch { /* no ops to undo */ }
        }
        await tauriBridge.stopListening(store)
        resetBridgeStore(store)
        await tauriBridge.startListening(store)
        setLastAction(
          `Undo complete. Say another request like "${FLOW_TAURI_PROMPTS[selectedFlow]}".`,
        )
      })()
      return
    }

    setLastAction("Undo complete — files restored to ~/Downloads.")
  }

  function restartDemo() {
    const dispatcher = dispatcherRef.current

    dispatcher.cancel()
    resetBridgeStore(store)
    setBranch("pending")
    setManualIndex(0)
    panelVisibilityRef.current = false

    if (isTauriMode) {
      setLastAction(`Restarting microphone listening for ${FLOW_LABELS[selectedFlow]}.`)
      void (async () => {
        await tauriBridge.stopListening(store)
        resetBridgeStore(store)
        await tauriBridge.startListening(store)
        setLastAction(
          `Microphone live. Say a request like "${FLOW_TAURI_PROMPTS[selectedFlow]}".`,
        )
      })()
      return
    }

    if (mode === "auto") {
      setLastAction(`Auto-play restarted — ${FLOW_LABELS[selectedFlow]}.`)
      dispatcher.play(getFlowPreApprovalSequence(selectedFlow))
      return
    }

    setLastAction("Manual mode reset to idle.")
  }

  function replayManualState(
    nextIndex: number,
    nextBranch: OrganizeDownloadsBranch,
  ) {
    const dispatcher = dispatcherRef.current
    const sequence = getActiveFlowSequence(selectedFlow, nextBranch)

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
    const sequence = getActiveFlowSequence(selectedFlow, branch)

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
      nextIndex <= flowApprovalIndex
        ? "pending"
        : branch

    replayManualState(nextIndex, nextBranch)
    setLastAction("Manual flow rewound by one event.")
  }

  function handleApprove() {
    const dispatcher = dispatcherRef.current

    if (isTauriMode) {
      setBranch("approved")
      setLastAction(
        `Approval granted. Backend is executing ${currentTask.title ?? "the current task"}.`,
      )
      void tauriBridge.approveAction(store)
      return
    }

    if (mode === "manual") {
      const sequence = getActiveFlowSequence(selectedFlow, "approved")
      const nextIndex = dispatcher.step(sequence, flowApprovalIndex)

      setBranch("approved")
      setManualIndex(nextIndex)
      setLastAction("Approval granted. Continue with Next step to finish the task.")
      return
    }

    setBranch("approved")
    setLastAction("Approval granted. Auto-play resumed.")
    dispatcher.play(getFlowApproveSequence(selectedFlow))
  }

  function handleDeny() {
    const dispatcher = dispatcherRef.current

    if (isTauriMode) {
      setBranch("denied")
      setLastAction(
        `Approval denied. ${currentTask.title ?? "The current task"} was cancelled.`,
      )
      void tauriBridge.denyAction(store)
      return
    }

    if (mode === "manual") {
      const sequence = getActiveFlowSequence(selectedFlow, "denied")
      const nextIndex = dispatcher.step(sequence, flowApprovalIndex)

      setBranch("denied")
      setManualIndex(nextIndex)
      setLastAction("Approval denied. Continue with Next step to finish the cancel path.")
      return
    }

    setBranch("denied")
    setLastAction("Approval denied. Auto-play is ending on the cancel path.")
    dispatcher.play(getFlowDenySequence(selectedFlow))
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
            muted={conversation.muted}
            transcript={conversation.transcript}
            onMuteToggle={() => {
              if (!isTauriMode) {
                setLastAction("Mute is not connected in the mock demo.")
                return
              }

              const nextMuted = !conversation.muted
              setLastAction(nextMuted ? "Microphone muted." : "Microphone unmuted.")
              void tauriBridge.setMicrophoneMuted(nextMuted, store)
            }}
          />
        </div>

        <Panel surface="cool" padding="spacious">
          <div className="flex flex-wrap items-center gap-3">
            <span className="type-label text-subtle">FLOW</span>
            {(["organizeDownloads", "projectInspection", "guardedCommand"] as DemoFlowType[]).map(
              (flow) => (
                <Button
                  key={flow}
                  variant={selectedFlow === flow ? "default" : "outline"}
                  size="sm"
                  className={
                    selectedFlow === flow
                      ? "cursor-pointer bg-brand text-white hover:bg-brand-hover"
                      : "cursor-pointer"
                  }
                  onClick={() => setSelectedFlow(flow)}
                >
                  {FLOW_LABELS[flow]}
                </Button>
              ),
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-divider pt-3">
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
              disabled={isTauriMode}
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
              disabled={isTauriMode || mode !== "manual" || manualIndex === 0}
            >
              Previous step
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={handleNextStep}
              disabled={
                isTauriMode ||
                mode !== "manual" ||
                awaitingManualDecision ||
                manualIndex >= getActiveFlowSequence(selectedFlow, branch).length
              }
            >
              Next step
            </Button>
          </div>

          <div className="mt-4 grid gap-4 border-t border-divider pt-4 md:grid-cols-2">
            <div>
              <p className="type-label text-subtle">MODE</p>
              <p className="type-body mt-1 text-body-text">
                {isTauriMode
                  ? `Backend mode — ${FLOW_LABELS[selectedFlow]}. The orchestration runtime drives execution end-to-end.`
                  : mode === "auto"
                    ? "Auto-play pauses at approval and resumes only after user input."
                    : "Manual mode dispatches one event at a time and supports rewind."}
              </p>
            </div>
            <div>
              <p className="type-label text-subtle">TRACE</p>
              <p className="type-body mt-1 text-body-text">
                Flow: {FLOW_LABELS[selectedFlow]} · Branch: {branch} · Manual index: {manualIndex} · Events recorded:{" "}
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
              onUndo={handleUndo}
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
