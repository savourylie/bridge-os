# UX_DESIGN.md

# BridgeOS UX Design Spec

## Overview

BridgeOS is a Star Trek–inspired AI interface for Linux. Its UX must combine two qualities that often conflict:

- a voice interaction style that feels natural, conversational, and human
- an execution interface that remains precise, inspectable, and operationally rigorous

The product should feel like talking to a capable ship computer while retaining the control model of a serious system tool.

Core principle:

**Human conversation. System-grade control.**

---

## UX Goals

BridgeOS should enable users to:

- speak naturally, without needing to phrase requests like shell commands
- continue talking while the system is planning or executing
- correct, interrupt, or refine requests mid-conversation
- clearly see what the system currently understands
- know whether execution has started or not
- inspect what the system is about to do, is doing, and has already done
- approve sensitive actions before they happen
- stay in control at all times

---

## Product Experience Principles

### 1. Natural conversation must not imply uncontrolled execution
Users should be able to speak fluidly, revise themselves, and think out loud. BridgeOS must not begin acting simply because the first executable phrase appeared in the transcript.

### 2. Conversation and execution are separate but synchronized layers
The voice experience can feel human. The execution interface must remain structured and strict.

### 3. Intent should be visible before action begins
Before the system executes anything meaningful, users should be able to see what BridgeOS currently thinks they want.

### 4. Execution state must always be explicit
At any moment, the UI should make it obvious whether the system is:
- not started
- planning
- waiting for confirmation
- executing
- paused
- completed
- failed

### 5. The user must be able to interrupt, redirect, or constrain the system
BridgeOS should behave like a cooperative operator, not a runaway agent.

### 6. The system should feel calm, not theatrical
The UI should be minimal, legible, and serious. The voice persona may be warm and natural, but the interface should never feel gimmicky.

---

## Experience Architecture

BridgeOS should be designed as three synchronized views:

### 1. Voice Presence Layer
This communicates the conversational state of the system.

Purpose:
- show whether the system is listening, speaking, clarifying, or waiting
- make voice interaction feel alive and responsive
- support interruption and barge-in

### 2. Intent Layer
This shows BridgeOS's current understanding before execution.

Purpose:
- mirror the user's evolving intent
- show confirmed constraints and unresolved ambiguity
- reduce accidental execution caused by misunderstanding

### 3. Execution Layer
This displays planning, approval, action trace, changes, and completion state.

Purpose:
- provide rigorous visibility into operations
- support approval for sensitive actions
- support inspection, interruption, and undo

These layers should work in parallel rather than collapse into a single chat feed.

---

## High-Level Layout

```text
Desktop
├─ StatusCapsule
├─ VoiceBar
│  ├─ live transcript
│  ├─ speaking / listening state
│  └─ interrupt / mute / hold controls
└─ TaskPanel
   ├─ IntentBoard
   ├─ DraftPlan
   ├─ Timeline
   ├─ ApprovalCard
   ├─ TechnicalDetailsDrawer
   └─ CompletionSummary
```

---

## UX Model: Two Parallel Modes

### A. Conversation Layer
This is the Star Trek feeling.

It should:
- feel natural and responsive
- allow interruption
- allow users to self-correct
- detect when the user is still speaking
- confirm intent naturally when needed
- avoid prematurely triggering execution

### B. Execution Layer
This is the system-control layer.

It should:
- express status with precision
- summarize intent and plan
- reveal impact and permissions
- provide approval gates
- show progress and results
- maintain a clear audit trail

The conversation layer should feel human.  
The execution layer should feel operational.

---

## Core UI Components

## 1. StatusCapsule

### Purpose
A small persistent desktop capsule that indicates current system state without being intrusive.

### Role in the UX
- makes BridgeOS feel present
- gives lightweight awareness of system state
- provides a fast entry point into the TaskPanel

### States
- idle
- listening
- understanding
- planning
- waiting_approval
- executing
- paused
- completed
- failed

### Typical content
- `Computer · Ready`
- `Listening…`
- `Understanding request…`
- `1 sensitive action needs approval`
- `Running 2 of 5 steps`

### UX guidance
This component must stay compact. It should never become a scrolling log or mini chat window.

---

## 2. VoiceBar

### Purpose
A dedicated live voice interaction strip that supports real-time conversational interaction.

### Why it matters
BridgeOS must support full-duplex interaction:
- the user can continue speaking while work is happening
- the user can interrupt the AI
- the AI can briefly respond without taking over the whole interface

### Responsibilities
- show live transcript
- show who currently holds the conversational turn
- show whether the system is still waiting for the user to finish
- support barge-in and interruption
- surface mute / hold / resume controls

### Key states
- idle
- listening
- user_holding_turn
- ai_speaking
- awaiting_clarification
- barge_in_detected
- muted

### UX requirement
The system must visibly distinguish:
- “I heard something”
- “I think you are still talking”
- “I am ready to respond”
- “I am speaking now”

This distinction is critical to preventing premature execution.

---

## 3. IntentBoard

### Purpose
A structured, pre-execution mirror of what BridgeOS currently believes the user wants.

### Why it matters
This is one of the most important differentiators in BridgeOS.

It reduces risk by making intent legible before action starts.

### It should show
- goal
- likely scope
- constraints
- exclusions
- unresolved questions
- execution status

### Example
```text
Current understanding

Goal
Organize Downloads

Likely scope
Screenshots from this week

Constraints
Do not touch PDFs or zip files

Execution
Not started
```

### When ambiguity exists
IntentBoard should explicitly show uncertainty.

Example:
```text
Unclear
Which folder should contain the grouped screenshots?
```

### UX requirement
IntentBoard must update incrementally during conversation. It should not only appear after the AI has already decided.

---

## 4. DraftPlan

### Purpose
A lightweight plan preview that appears before any meaningful execution starts.

### Why it matters
Users need to know that the system has understood enough to prepare an approach, but has not yet taken action.

### Example
```text
Draft plan
1. Scan ~/Downloads
2. Find screenshots modified in the last 7 days
3. Create a weekly folder
4. Move matching files
5. Show results

Execution: Not started
```

### UX requirement
The phrase **Execution: Not started** or equivalent should be prominent whenever the system is still in the planning phase.

This is important for trust.

---

## 5. TaskPanel

### Purpose
The main execution surface for a task.

### Presentation
A right-side slide-over panel that remains visible alongside the desktop.

### Contents
- TaskHeader
- TaskMetaRow
- ContextStrip
- IntentBoard
- DraftPlan
- Timeline
- ApprovalCard
- TechnicalDetailsDrawer
- CompletionSummary
- RollbackBar

### Why a side panel
Users need to continue working while monitoring the system. A full-screen overlay would be too disruptive.

---

## 6. ContextStrip

### Purpose
A compact display of the context the system is using.

### It may include
- current folder
- active app
- selected files
- recent goal

### Example
- Current folder: `~/projects/memfuse`
- Active app: `VS Code`
- Recent goal: `fix failing build`

### UX requirement
Users must be able to clear context.

Include:
- `Clear context`

This is essential to perceived control.

---

## 7. TaskHeader

### Purpose
A simple header for the current task.

### It should show
- task title
- one-sentence summary
- current task-level state

### Example
**Organize Downloads**  
Preparing to group screenshots by month and remove clutter.

---

## 8. TaskMetaRow

### Purpose
A compact metadata strip that immediately answers three questions:

- what is the status
- how risky is this
- what is the scope

### Typical values
- Status: Waiting for approval
- Risk: Medium
- Scope: Downloads only

### UX requirement
These values should be visible without scrolling.

---

## 9. Timeline

### Purpose
The main action trace view.

### Why timeline, not chat
A chat format obscures execution structure. A timeline presents:
- sequence
- dependency
- status
- control points

### Timeline step states
- pending
- running
- waiting_approval
- completed
- failed
- skipped
- blocked
- reverted

### Each step should display
- title
- human-readable description
- current status
- impact summary
- rationale
- access to technical details
- relevant actions such as approve, skip, retry, or undo

### Example flow
1. Heard request
2. Interpreted intent
3. Scanned target folder
4. Prepared action plan
5. Execute file operations
6. Show summary

---

## 10. ImpactSummary

### Purpose
A concise explanation of what a step may affect.

### It should communicate
- reads
- writes
- deletes
- network activity
- external services
- privilege level

### Example
```text
Reads: ~/Downloads
Writes: ~/Downloads/Screenshots/*
Deletes: None
Network: None
Privilege: User-level only
```

### UX requirement
Impact should always be expressed in user-facing language before technical details.

---

## 11. ApprovalCard

### Purpose
A clear and serious approval gate for sensitive actions.

### Triggers
ApprovalCard should appear for actions such as:
- package installation
- root / sudo operations
- modifying system settings
- mass deletion
- sending messages or email
- network transmission of sensitive content
- high-impact git actions such as push or deploy

### It should explain
- what the system wants to do
- why approval is needed
- what the action will affect
- what it will not affect
- any planned command preview
- whether a password is required

### Example structure
- Install ffmpeg and verify it for this project
- This action will:
  - install a new system package
  - require administrator privileges
  - use network access
- This action will not:
  - modify personal documents
  - send unrelated data elsewhere

### UX requirement
Approval must occur before the underlying system prompt appears. Users should never be surprised by a raw sudo prompt.

---

## 12. TechnicalDetailsDrawer

### Purpose
An expert-mode inspection surface for technical users.

### It may show
- tool name
- command preview
- command list
- file diffs
- stdout / stderr preview
- exit code
- rollback availability
- latency
- mode information

### UX requirement
This drawer must stay hidden by default. BridgeOS should lead with operational meaning, not implementation details.

---

## 13. CompletionSummary

### Purpose
A concise, human-readable result summary after task completion.

### It should include
- task outcome
- files created / modified / moved / deleted
- commands executed
- network activity if relevant
- next possible actions

### Example
- Created: 6 folders
- Moved: 133 files
- Deleted: 0 files
- Network requests: none

### Actions
- Undo
- View changes
- Replay with changes
- Close

---

## 14. RollbackBar

### Purpose
Show whether reversal is still available.

### Example
`This task can be undone for the next 30 minutes.`

### Why it matters
Undo is a major trust mechanism for autonomous systems operating on a personal computer.

---

## Speech Interaction Design

## Conversational goals
BridgeOS should sound:
- calm
- competent
- brief
- responsive
- slightly formal
- never theatrical or overly friendly

The intended feel is not a novelty assistant. It is a reliable ship-computer style presence.

## The AI should support
- interruption
- clarification
- self-correction by the user
- trailing phrases
- turn holding
- mid-task questions such as “what are you doing now?”
- redirection such as “actually, do this instead”

## Example behaviors

### User revises intent mid-sentence
User:
> Computer, clean up my downloads folder, and the screenshots from yesterday... wait, not yesterday, this week.

Desired behavior:
- VoiceBar remains in a user_holding_turn state
- IntentBoard updates from “yesterday” to “this week”
- execution does not begin

### User asks status mid-task
User:
> What are you doing now?

Desired behavior:
- AI answers briefly in voice
- TaskPanel highlights the current step
- Timeline remains the source of truth

### User interrupts
User:
> Stop. Not that folder.

Desired behavior:
- AI speech stops immediately
- execution pauses at the next safe point
- UI updates to `Paused by user`
- IntentBoard and DraftPlan become editable again if appropriate

---

## Conversation Policy: Turn Holding

BridgeOS must avoid acting while the user is still speaking.

Signals that the user likely still holds the turn include:
- short pauses that do not indicate completion
- unfinished syntax or phrasing
- self-repair phrases such as “wait”, “actually”, “no”, “I mean”
- conjunctions such as “and”, “then”, “also”
- unresolved scope in the utterance
- ambiguity in target, exclusions, or constraints

The system should only transition into planning or execution once intent is sufficiently stable.

---

## Intent Confirmation Policy

BridgeOS should not confirm every request in the same way. Confirmation should scale with risk.

### Low-risk actions
Can proceed after internal confidence is high.

Examples:
- open app
- answer question
- search files
- read logs

### Medium-risk actions
Should use a short natural recap before proceeding.

Examples:
- move files
- rename files
- edit project files

### High-risk actions
Require explicit voice and UI confirmation.

Examples:
- install packages
- send messages
- delete many files
- perform root actions
- modify system configuration

---

## Writing Style Rules

## Voice responses
Voice responses should be:
- short
- natural
- calm
- precise
- low on filler

Good examples:
- “I think I understand. You want me to organize Downloads, only for screenshots from this week.”
- “I have a plan ready. I have not started making changes.”
- “This next step changes your file structure, so I need your approval.”

## UI copy
UI copy should be:
- compact
- neutral
- non-personified
- explicit about state and impact

Good examples:
- Current understanding
- Execution not started
- Approval required
- 133 files may be moved
- Root access required

The system should not use the same tone in voice and UI.

---

## Visual Design Direction

BridgeOS should feel:
- calm
- clean
- structured
- serious
- slightly futuristic
- not flashy
- not playful

### Recommended visual language
- minimal surfaces
- low visual noise
- clear spacing hierarchy
- restrained use of color
- subtle motion for active states
- stronger emphasis only for approval, failure, or critical risk

### State color semantics
- Idle: neutral
- Running: cool highlight
- Approval: warm amber
- Failed: soft red
- Completed: restrained green

### Motion guidance
Use motion to signal state changes, not personality.
Examples:
- pulse while listening
- subtle progress movement while executing
- soft state transition when a step completes
- no attention-grabbing animation for approvals

---

## Interaction Controls

BridgeOS should support the following user controls:

### Always available
- open / close task panel
- mute / unmute voice
- interrupt AI speech
- clear context

### During planning
- approve
- edit plan
- cancel

### During execution
- pause
- stop
- hide panel
- ask what it is doing
- request technical details

### After completion
- undo
- view changes
- replay with changes
- close

---

## Required Trust Signals

BridgeOS should consistently communicate these trust-critical facts:

### 1. Has execution started?
Always show one of:
- Execution not started
- Execution paused
- Execution in progress
- Execution completed

### 2. What is the impact?
Always show a compact impact summary before risky steps.

### 3. Why is approval needed?
Never show a generic approval prompt without explanation.

### 4. Can the user still interrupt?
During execution, pause and stop controls must be visible.

### 5. Can changes be undone?
If a task is reversible, show rollback availability clearly.

---

## Recommended State Model

## ConversationState
```ts
type ConversationState =
  | "idle"
  | "listening"
  | "holding_for_more"
  | "clarifying"
  | "intent_locked"
  | "speaking"
  | "interrupted";
```

## ExecutionState
```ts
type ExecutionState =
  | "not_started"
  | "drafting_plan"
  | "waiting_confirmation"
  | "executing"
  | "paused"
  | "completed"
  | "failed";
```

### Important rule
Conversation can continue while execution is paused, planning, or running.  
Execution should not block the conversational layer.

---

## Task State Machine

```text
idle
 └─ user_invokes
    → listening
       └─ transcript_ready
          → understanding
             └─ intent_resolved
                → planning
                   ├─ no_action_needed → completed
                   ├─ approval_required → waiting_approval
                   └─ safe_to_run → executing

waiting_approval
 ├─ approve → executing
 ├─ edit_plan → planning
 └─ cancel → cancelled

executing
 ├─ pause → paused
 ├─ stop → cancelled
 ├─ step_failed → failed
 └─ all_steps_complete → completed

paused
 ├─ resume → executing
 └─ stop → cancelled

completed
 ├─ undo → reverted
 └─ replay → planning

failed
 ├─ retry → planning
 └─ cancel → cancelled

reverted
 └─ replay → planning
```

---

## Step State Machine

```text
pending
 ├─ run → running
 ├─ skip → skipped
 └─ blocked_by_dependency → blocked

running
 ├─ success → completed
 ├─ requires_approval → waiting_approval
 ├─ recoverable_error → failed
 └─ stop → blocked

waiting_approval
 ├─ approve → running
 ├─ deny → skipped
 └─ cancel_task → blocked

completed
 └─ undo → reverted

failed
 ├─ retry → running
 └─ skip → skipped
```

---

## Approval Flow

```text
not_needed
 └─ risky_action_detected → requested

requested
 ├─ user_approves → granted
 ├─ user_edits → editing
 └─ user_cancels → denied

editing
 ├─ resubmit → requested
 └─ cancel → denied

granted
 ├─ requires_password → authorizing
 └─ execute → done

authorizing
 ├─ success → done
 └─ fail → denied

denied
done
```

---

## Primary User Flows

## Flow 1: Organize Downloads
1. User says: “Computer, organize my Downloads.”
2. VoiceBar enters listening.
3. IntentBoard begins showing a draft interpretation.
4. User adds constraints: screenshots only, do not touch PDFs, do not delete anything.
5. IntentBoard updates live.
6. DraftPlan appears with `Execution: Not started`.
7. User approves.
8. Timeline begins execution.
9. CompletionSummary appears with undo.

## Flow 2: Install ffmpeg
1. User says: “Computer, install ffmpeg for this project.”
2. BridgeOS checks whether ffmpeg is installed.
3. DraftPlan appears.
4. ApprovalCard explains that root privileges and network access are required.
5. User approves.
6. Secure authorization prompt appears.
7. Timeline shows install and verification steps.
8. CompletionSummary reports success or failure.

## Flow 3: Mid-task interruption
1. User starts a file organization task.
2. BridgeOS is executing.
3. User says: “Stop. Not that folder.”
4. VoiceBar detects barge-in.
5. AI stops speaking immediately.
6. Execution pauses at the next safe point.
7. TaskPanel updates to `Paused by user`.
8. IntentBoard becomes active again to capture the correction.

---

## MVP Scope

A strong first version should include:

### Must-have
- StatusCapsule
- VoiceBar
- TaskPanel
- IntentBoard
- DraftPlan
- Timeline
- ApprovalCard
- CompletionSummary

### Next phase
- TechnicalDetailsDrawer
- RollbackBar
- ContextStrip
- step-level undo
- replay with changes
- richer expert diagnostics

---

## Final UX Definition

BridgeOS is not a chat UI with tools attached.

It is a **voice-native operating layer** for Linux built around three coordinated experiences:

- natural conversation
- visible intent
- rigorous execution control

The voice interaction should feel human enough to be effortless.  
The system interface should remain precise enough to be trusted.

That is the core BridgeOS UX standard.
