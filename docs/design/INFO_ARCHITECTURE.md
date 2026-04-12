# Information Architecture — Star Trek: Insurrection

<!--
Phase 2 output, written in parallel with UX_DESIGN.md. Captures the structural
skeleton: view list, roles, navigation hierarchy, and per-view narrative beat
sequences. This is the "where things live" companion to UX_DESIGN.md's "what
things feel like."

In BridgeOS, "pages" are UI views/states, not traditional web pages. Navigation
is state-driven, not menu-driven.
-->

## Site Map

<!--
BridgeOS is a state-driven interface, not a page-based website. The "site map"
is the state flow — views the user moves through during an interaction session.
-->

```
[Idle / StatusCapsule]
└── [Conversation / VoiceBar]
    └── [Intent + Plan Review]
        └── [Execution / TaskPanel]
            └── [Completion → returns to Idle]
```

**State transitions are sequential and directional:**
- Idle → Conversation: user activates (click or wake word)
- Conversation → Intent: system locks understanding
- Intent → Execution: user approves plan
- Execution → Completion → Idle: task finishes, interface settles

**Reverse/interrupt paths:**
- Any active state → Idle: user cancels or says "stop"
- Execution → Paused: user says "pause" or "wait"
- Intent → Conversation: user says "actually..." or "change the..."
- Execution → Intent: user redirects mid-task

## Page Roles

### Idle / StatusCapsule

- **Role**: Ambient presence — the system exists and is ready, without demanding attention
- **Primary audience**: The user going about their work. BridgeOS is background until needed.
- **Success criterion**: User knows the system is available without being distracted by it. State is legible at a glance (idle, background-active, dormant).
- **Narrative beat sequence**:
  1. B2 Establishing Shot — capsule is present on desktop
  2. B19 Quiet Moment — resting state, gentle breathing animation
- **Cinematic grammar notes**: Ultra-sparse. Single element against desktop negative space. No corridor visible — the corridor emerges only when conversation begins.

### Conversation / VoiceBar

- **Role**: Intimate encounter — the user speaks naturally and the system listens with visible attention
- **Primary audience**: A user initiating a task through natural speech — thinking out loud, describing intent, asking questions
- **Success criterion**: User feels heard. Transcript accurately reflects speech. System responses feel natural, not robotic. The user can speak at their own pace without the system cutting them off or acting prematurely.
- **Narrative beat sequence**:
  1. B3 The Promise — VoiceBar activates, "I'm listening"
  2. B7 The Encounter — user speaks, transcript flows, connection established
  3. B19 Quiet Moment — natural pauses are held, not filled
  4. B20 The Invitation — system responds or clarifies gently
- **Cinematic grammar notes**: Warm register dominant. Narrow corridor (max 480px). No structured data — only flowing text. The VoiceBar grows from the StatusCapsule position.

### Intent + Plan Review

- **Role**: Bridge viewscreen — crystallized understanding and proposed execution plan, awaiting approval
- **Primary audience**: A user who has expressed intent and needs to verify that the system understood correctly before anything happens
- **Success criterion**: User can verify: (1) the system's understanding matches their intent, (2) the proposed plan is correct, (3) any gaps or ambiguities are flagged. User approves or adjusts with confidence.
- **Narrative beat sequence**:
  1. B10 Deep Dive — IntentBoard shows parsed understanding
  2. B11 The Tutorial — DraftPlan shows proposed steps
  3. B16 The Authority — structured display proves competence
  4. B20 The Invitation — approval gate: proceed or adjust
- **Cinematic grammar notes**: Cool register emerging. Corridor widens slightly (max 560px). Structured panels replace flowing text. Push-in framing effect (Frakes technique 2) on the crystallization moment.

### Execution / TaskPanel

- **Role**: Operations deck — transparent, accountable execution with approval gates for sensitive actions
- **Primary audience**: A user monitoring an approved task, potentially needing to approve sensitive sub-actions, pause, or redirect
- **Success criterion**: User always knows: what step is executing, what has completed, what's next, whether an approval is needed, and whether changes can be undone. Interruption (pause, stop, redirect) works reliably.
- **Narrative beat sequence**:
  1. B8 Evidence Wall — timeline shows all steps with status
  2. B11 The Tutorial — active step detail visible
  3. B14 The Pivot — ApprovalCard interrupts for sensitive actions
  4. B16 The Authority — execution continues after approval
  5. B19 Quiet Moment — all steps complete, pause before summary
  6. B22 The Farewell — CompletionSummary with warm-shift, closure
- **Cinematic grammar notes**: Cool register dominant. Corridor at max width (560px). Dense information. Sequential timeline composition. Monolith interrupts for approval gates. CompletionSummary shifts back to warm — resolution.

## Navigation Hierarchy

### Primary navigation

BridgeOS has no traditional nav bar. Navigation is state-driven:

- **StatusCapsule** (always visible on desktop) → Click or wake word to enter Conversation
- **State transitions** → Forward flow through the interaction sequence
- **Voice commands** → "Stop," "Pause," "Go back," "Cancel" to navigate states
- **Keyboard shortcuts** → Escape to cancel, Enter to approve (when approval gate is active)

### Secondary navigation

- **Footer**: None — this is a desktop app, not a website
- **In-page anchors**: None — views are compact enough to fit without scrolling in most cases. The Execution view may scroll vertically for long task timelines.
- **Breadcrumbs**: None — the state indicator dot on the corridor shell shows current state through color temperature (warm = conversation, cool = operational, warm-return = completed)

### Navigation posture

State-driven, not menu-driven. The StatusCapsule is the persistent anchor — it transforms into the corridor when activated and returns to capsule form when the session ends. The user never "navigates" in the traditional sense — they progress through an interaction that unfolds from conversation to execution. Backward navigation is regression (undo intent, pause execution, redirect), not a browser back button.

## Content Types

### Conversation transcript

- **Structure**: Speaker (user/system), utterance text, timestamp, confidence indicator (optional)
- **Appears on**: Conversation / VoiceBar view
- **Narrative role**: The raw material of the encounter — what was said, in order

### Intent fields

- **Structure**: Label (Goal, Scope, Constraints, Unresolved Questions), value text, status (resolved/unresolved)
- **Appears on**: Intent + Plan Review view
- **Narrative role**: Crystallized understanding — what the system parsed from conversation

### Execution steps

- **Structure**: Step number, description, status (pending/active/completed/failed), impact summary, command detail (optional, monospace), undo availability
- **Appears on**: Execution / TaskPanel view
- **Narrative role**: The operational record — what happened, in order, with accountability

### Approval requests

- **Structure**: Action label, explanation (what will happen), impact (what changes), risk level, approve/deny actions
- **Appears on**: Execution / TaskPanel view (as monolith interrupts)
- **Narrative role**: The dramatic pivot — the trust boundary where the system asks permission

### Completion summary

- **Structure**: Outcome (completed/failed), changes list (files modified, commands run), undo availability, elapsed time
- **Appears on**: Execution / TaskPanel view (at bottom)
- **Narrative role**: The farewell — closure with accountability

## Cross-page Beat Map

| View | Beat 1 | Beat 2 | Beat 3 | Beat 4 | Beat 5 | Beat 6 |
|---|---|---|---|---|---|---|
| Idle / StatusCapsule | B2 Establishing | B19 Quiet Moment | — | — | — | — |
| Conversation / VoiceBar | B3 Promise | B7 Encounter | B19 Quiet Moment | B20 Invitation | — | — |
| Intent + Plan Review | B10 Deep Dive | B11 Tutorial | B16 Authority | B20 Invitation | — | — |
| Execution / TaskPanel | B8 Evidence Wall | B11 Tutorial | B14 Pivot | B16 Authority | B19 Quiet Moment | B22 Farewell |

**Convergence analysis:**
- B19 Quiet Moment appears 3× — but in three different roles: resting state (Idle), held silence during conversation (Conversation), and pause before summary (Execution). Each instance manifests differently. Acceptable — the beat is universal, the expression is unique.
- B20 The Invitation appears 2× — as conversational response (Conversation) and approval gate (Intent). Different expressions: one is spoken, one is a button. Acceptable.
- B11 The Tutorial appears 2× — as plan preview (Intent) and step detail (Execution). Different contexts: one is proposed, one is active. Acceptable.
- No other beat appears more than once.

## Anti-Convergence Report

- **Most-repeated archetype**: All Custom archetypes — no library archetype id repeats. Each view has a unique structural pattern (floating sentinel, vertical reading corridor, stacked viewscreen, sequential timeline with monolith interrupts). **OK — 0 repeats.**
- **Homepage vs interior shell similarity**: **Low.** Idle (no shell, just a capsule) is fundamentally different from the corridor views (Conversation, Intent, Execution). Even within the corridor views, each has a distinct composition family variant.
- **Pages structurally distinct from default marketing layouts**: **4/4 pass.** None of the views resemble marketing page patterns. No Hero → Features → Stats → CTA. No card grids. No split-hero layouts. Every view is a purpose-built operational interface pattern.

## Responsive Structure Notes

<!-- BridgeOS is a desktop app (Tauri 2) targeting Linux. Responsive behavior
     is about window/panel sizing, not mobile breakpoints. -->

- **Desktop (primary)**: Full experience. StatusCapsule floats on desktop. Corridor expands from capsule. All views at full design width.
- **Compact mode**: When the BridgeOS corridor is sized smaller (e.g., on a smaller monitor or user preference), the corridor narrows to minimum (360px). Step cards in Execution view show fewer detail columns. IntentBoard fields may truncate with expand-on-click. Typography scales down one size step.
- **Expanded mode**: On ultra-wide monitors, the corridor maintains its max-width (560–640px) and centers within the available space. Additional negative space on either side reinforces the corridor composition. The interface does not stretch to fill — the corridor's constraint is the design.
