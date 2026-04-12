# UX Design — Star Trek: Insurrection

<!--
Phase 2 output. The film's STRUCTURE lands here — narrative arcs, scene rhythm,
signature compositions, hero dominance, framing logic. The film's SURFACE
(palette, type, material tokens) lives in DESIGN.md (Phase 3).

ORDERING RULE: Site grammar → per-view scene thesis → per-view signature
composition → shared system back-derived in Phase 3 only.

Director name, film title, and workflow jargon stay in this file and RESEARCH.md.
-->

## Director Brief

- **One-sentence visual thesis**: A desktop AI interface that moves between warm conversational presence and cool operational precision through a single connected visual corridor — like two scenes in the same film where lighting temperature, not layout, signals the register shift.
- **Signature technique 1** (the heavy move): **Dual-register lighting** — the warm/cool color-temperature shift is the primary design mechanism. Conversational states use warm golden ambient tones (Ba'ku register). Operational states use cool blue-grey structured tones (Enterprise register). The shift is gradual and continuous, never a hard cut. → *Web translation*: CSS custom properties for `--register-warmth` that smoothly interpolate between warm and cool palettes as the user moves from conversation to execution. Background hues, text accent colors, and border tones all respond to this single register variable.
- **Signature technique 2** (echo): **Emotional push-in framing** — at the moment of commitment (intent locked, approval granted), the interface subtly "leans in" — a focal emphasis shift that commits attention forward. → *Web translation*: scale(1.01–1.02) plus subtle depth-of-field blur on surrounding elements during the "intent locked" transition. The active panel gains contrast while periphery desaturates slightly.
- **Signature technique 3** (echo): **Connected visual rhythm** — views flow into each other through shared elements and directional movement. No teleportation between states. → *Web translation*: shared layout elements (the corridor shell, the status indicator) persist across view transitions. New content enters from a consistent direction (bottom-up for conversation, right-to-left for execution panels). Exit animations mirror entry.
- **Which technique is the dominant move**: Technique 1 — dual-register lighting. Only one register shift per view transition; the other two techniques echo it.
- **Motion rules**: Transitions flow forward (conversation flows downward; execution flows right-to-left or expands outward). No snap cuts between views — always a connected 300–500ms reveal. Max 1 heavy animation per view. `fadeUp` / `opacity+translateY` at most 2× per view. StatusCapsule breathes gently (2s cycle). VoiceBar pulses on voice activity (subtle scale oscillation). Execution steps enter sequentially with 80ms stagger, not all at once.
- **Typography direction**: Primary display face is a clean humanist sans-serif — warm enough for conversation, structured enough for data display (e.g. Inter, Source Sans). Monospace used only for technical detail: command names, file paths, package names. Weight variation over size variation: semibold for state labels and headings, regular for body text, light for timestamps and metadata. No decorative type treatments. Type earns authority through spacing and weight, not scale.

## Site Cinematic Grammar

- **Page-shell logic**: **Corridor** — the interface occupies a narrow vertical channel anchored to the desktop edge, expanding laterally when activated and contracting when at rest. The desktop itself is the negative space — wide margins on both sides frame the corridor. The interface is a passage between states, not a room to inhabit.
- **Navigation posture**: **State-driven, not menu-driven.** No traditional nav bar. The StatusCapsule is the persistent anchor; views emerge from it in sequence as the interaction progresses. State transitions (idle → listening → intent → executing) replace navigation clicks. The user never "goes to a page" — they flow through states. Back-navigation is handled by state regression (pause, redirect, cancel), not by a nav history.
- **Framing rules**: All UI panels honor 2.35:1 anamorphic spirit — generous horizontal padding within components, content never packed edge-to-edge. Interior text blocks sit at ~60ch reading width. Cards and panels have consistent border-radius conveying machined precision (Enterprise composite panels, not Ba'ku organic curves). Visual elements are offset, not centered — following Frakes' anamorphic width usage.
- **Density cadence**: Idle is ultra-sparse (just the capsule). Conversation is moderate (transcript and voice indicator in a narrow column). Intent is moderate-dense (structured fields, plan preview). Execution is dense (timeline steps, approval gates, impact summaries). Density increases as commitment increases — matching the film's rhythm from Ba'ku outdoor breathing to bridge tactical tightening.
- **Recurring material/atmospheric layers**: Warm ambient glow on conversational elements (soft golden radial gradient at 3–5% opacity behind the VoiceBar, like natural light through a window). Cool structured illumination on operational elements (subtle blue-grey panel backgrounds with crisp 1px borders, like LCARS backlight). Shared: a very faint noise texture layer (0.5–1% opacity) across all panels — analog warmth that prevents the interface from feeling sterile. No heavy blur, no glassmorphism, no grain that competes with content.
- **Composition families allowed**: **Corridor** (primary — the narrow vertical channel), **cutaway monolith** (secondary — for approval gates and summary panels that break the corridor's flow to demand attention)
- **What varies between views**: Signature composition, color temperature register (warm ↔ cool), information density, hero element, pace of motion
- **What repeats across views**: Corridor shell proportions, typography system, the state indicator dot (warm amber → cool teal continuum), transition direction logic, ambient noise texture, border-radius language

## Premium Calibration Gate (12 required outputs)

- [x] Site cinematic grammar *(above)*
- [x] One big idea per page *(per-view sections below)*
- [x] Page scene thesis *(per-view)*
- [x] Hero dominance statement *(per-view)*
- [x] Restraint statement — "what we will NOT do" *(per-view)*
- [x] Material thesis *(site-wide: warm ambient glow for conversation, cool structured panels for operations, shared noise texture)*
- [x] Typography thesis *(director brief: humanist sans primary, monospace for technical detail only, weight over size)*
- [x] Page-role scene *(per-view)*
- [x] Signature composition *(per-view)*
- [x] Grid fallback test *(per-view)*
- [x] Shared system holdback *(noted per-view and below)*
- [x] Uniqueness guardrail *(from RESEARCH.md shell-ban list: no chat-bubble feed, no dashboard grid, no sidebar+content CMS, no terminal aesthetic, no centered gradient hero, no glassmorphism)*

---

## View: Idle / StatusCapsule

### Scene thesis

The idle state is the title card before the film begins — a single luminous presence on the desktop that says "I'm here, I'm ready, I'm not demanding your attention." This is the Enterprise orbiting peacefully in the opening shot: vast negative space, one small confident object, no drama. The StatusCapsule exists to be noticed only when looked for, and to communicate system state through color temperature alone — warm amber for idle-ready, cool teal for background activity, neutral for dormant.

### One big idea

**Ambient sentinel** — a single, small element that communicates through color temperature and subtle breathing motion, not through text or icons. The capsule IS the state.

### Hero dominance statement

The capsule dominates through radical restraint — it is the only designed element on screen, floating against the user's own desktop. Its authority comes from confident solitude, not from visual weight. Like the Enterprise in wide establishing shots: small against vast space, unmistakably present.

### Restraint statement

No text labels in idle state. No tooltip on hover. No glow effects. No shadow spread beyond 4px. No animation faster than 2s cycle. No interaction beyond click-to-activate. The capsule does not try to be interesting — it tries to be trustworthy.

### Material thesis

The capsule surface is a solid fill with a 1px border — machined, precise, like an Enterprise instrument panel indicator. The warm-amber idle color comes from within (fill), not from a glow effect projected outward. The desktop's existing wallpaper/background is the only context — no overlay, no backdrop modification.

### Page-role scene

**Opening title card** — the audience settles in. The screen is mostly empty. One small element establishes that this is a directed experience, not a desktop widget. Presence without narrative.

### Signature composition

- **Description**: **Floating sentinel** — a compact capsule (40–48px height, 120–160px width) anchored to a desktop edge with 16px margin, containing only a state-color dot (8px) and a system wordmark. The capsule's position is fixed but its color temperature shifts continuously with system state. No surrounding UI. The desktop IS the composition.
- **Source id**: `Custom` — no library composition applies to a single floating desktop element. The composition is defined by the relationship between the capsule and the negative space of the desktop, not by internal layout.
- **Grid fallback test**: If reduced to a grid, the entire concept breaks — this is a single element in vast negative space. The composition is the ratio of object to void, not the arrangement of objects.

### Narrative arc

1. B2 Establishing Shot — the capsule appears (or is already present). No fanfare.
2. B19 Quiet Moment — the capsule breathes. The desktop is calm. The user works.

### Entrance map

- Component 1 (Capsule appear): `fadeIn` — 400ms opacity from 0 to 1, no position shift
- Component 2 (State color): `color-temperature-shift` — 800ms CSS transition on fill and border color

### Motion budget

- **Heavy interaction** (max 1): None. The idle state earns no heavy interaction — it must be invisible until needed.
- **Attention-seeking reveals** (max 2): None. The capsule does not seek attention.
- **Baseline motion**: 2s breathing cycle — subtle scale oscillation (1.0 → 1.02 → 1.0) on the state dot only. Imperceptible unless watched.

### Library source citations

- **Camera / reveal behavior**: `Custom` — ambient fade-in, no cinematic entrance needed
- **Interaction behavior**: `Custom` — click-to-activate only, no hover state beyond cursor change
- **Composition**: `Custom` — single element in desktop negative space
- **Typography treatment**: System wordmark in primary sans at 12px semibold, letter-spacing +0.02em
- **Atmospheric/background technique**: None — desktop is the background

### Scene breakdown

#### Component 1 — StatusCapsule

- **Beat**: B2 Establishing Shot
- **Function**: Status indicator (Custom — not in section-functions library)
- **Archetype**: Custom — floating desktop element with state-color fill
- **Composition ref**: Custom (single element, no layout)
- **Camera ref**: Simple fade-in
- **Interaction ref**: Click to activate → transitions to Conversation view
- **Visual elements**: State-color dot (8px), system wordmark, 1px border, capsule shape
- **Why it exists in the arc**: The film starts with silence and presence. Before any conversation or action, the user must feel the system exists and is ready.

### Shared system holdback

- Button styles — holdback (no buttons in this view)
- Card padding — holdback
- Panel background — holdback (desktop is background)
- State transition timing — holdback until all views define their entrance speeds

### Image placeholders

- **Desktop context**: A clean, minimal desktop environment with the StatusCapsule floating in the lower-right area. The desktop wallpaper is muted and warm — a defocused natural landscape (mountains, golden light) at low saturation. The capsule glows amber against this context. Mood: calm readiness. No clutter. The capsule is the only designed element visible.

---

## View: Conversation / VoiceBar

### Scene thesis

The conversation view is a Ba'ku village scene — intimate, warm, unhurried. The user speaks naturally and the interface listens with visible attention. The VoiceBar is not a chat window — it is a corridor of exchange where words flow downward like a calm stream. The warm register dominates: golden ambient tones, breathing rhythm, generous line spacing. This scene says "you are being heard by something present and attentive." The camera stays close, connected — Frakes' continuous visual rhythm where each utterance flows into the next without fragmentation.

### One big idea

**Intimate corridor** — a narrow vertical strip of flowing transcript text with a warm pulse indicator, creating a focused channel of exchange that feels like speaking to someone who is fully present. The narrowness is deliberate — it constrains attention to the conversation itself.

### Hero dominance statement

The VoiceBar dominates through intimacy, not scale. A live transcript in warm type flowing at reading speed, with a pulsing voice-activity indicator that breathes with the speaker's cadence. It feels commanding because it is the only thing happening — the narrow corridor width eliminates peripheral distraction. Like Frakes' close-up push-ins: the frame narrows to the moment of connection.

### Restraint statement

No chat bubbles. No avatar icons. No message timestamps per-utterance. No typing indicators with bouncing dots. No send button — voice is continuous, not message-based. No horizontal layout — the corridor is strictly vertical. No decorative UI chrome around the transcript.

### Material thesis

Warm ambient glow behind the VoiceBar (soft golden radial gradient at 3–5% opacity, positioned top-center). Transcript text on a near-transparent background — the corridor feels open, not boxed. Voice-activity indicator uses the warm amber from the StatusCapsule's idle state, pulsing with audio amplitude. All surfaces are minimal — the warmth comes from color temperature and spacing, not from material effects.

### Page-role scene

**The Ba'ku encounter** — first contact between human and presence. The audience leans in. The world narrows to two voices in conversation. Warm light, natural rhythm, no urgency.

### Signature composition

- **Description**: **Vertical reading corridor** — a narrow column (max 480px width) centered or anchored to one edge, with transcript text flowing downward in real-time. The voice-activity indicator sits at the top (a horizontal warm-amber bar that pulses with audio input). Below it, transcript text appears line by line with a subtle entrance. The corridor's narrow width is the compositional statement — it forces intimate reading distance and eliminates the sprawl of a full-width chat interface.
- **Source id**: Adapted from compositions #27 "Narrow column reading width" — single column, full content, but applied to a live-streaming interface rather than static text.
- **Grid fallback test**: If widened to a multi-column grid, the intimacy of the corridor is destroyed. The composition is defined by its constraint — the narrow width IS the design. A wider layout becomes a dashboard; this must remain a passage.

### Narrative arc

1. B3 The Promise — VoiceBar activates. The warm ambient glow appears. The interface promises: "I'm listening."
2. B7 The Encounter — user speaks, transcript flows. The connection is established. Words appear in real-time.
3. B19 Quiet Moment — natural pause in speech. The interface holds space. The pulsing indicator dims but doesn't disappear. Silence is allowed.
4. B20 The Invitation — the system responds or asks a clarifying question. Gentle, not commanding. "Did you mean..." or a spoken summary appears in the transcript.

### Entrance map

- Component 1 (VoiceBar activation): `expand-from-capsule` — the corridor grows outward/upward from the StatusCapsule position, 400ms ease-out
- Component 2 (Voice indicator): `warm-pulse-in` — amber bar fades in and begins pulsing, 300ms
- Component 3 (Transcript text): `line-reveal` — each new line fades in from 80% opacity, sliding up 8px, 200ms per line
- Component 4 (System response): `gentle-appear` — system text enters with a slight delay (200ms) and a cool-shift on the text color to distinguish system from user

### Motion budget

- **Heavy interaction** (max 1): The `expand-from-capsule` corridor reveal — the VoiceBar growing from the StatusCapsule is the cinematic moment. It earns the slot because it's the transition from silence to conversation, the most important state change in the interface. Source: Custom (expansion animation, not in interaction-effects library).
- **Attention-seeking reveals** (max 2): (1) Voice-activity pulse — amber bar oscillation on audio input. (2) Real-time transcript line entrance — each line's subtle slide-up.
- **Baseline motion**: System response text enters with a slight temperature shift (warm → slightly cooler for system voice). All other elements are static once entered.

### Library source citations

- **Camera / reveal behavior**: Custom — corridor expansion from anchor point
- **Interaction behavior**: Custom — voice-activity-driven pulse (no click/hover interaction during conversation)
- **Composition**: Adapted from compositions #27 (narrow column reading width)
- **Typography treatment**: Transcript in primary sans at 16px/1.6 regular weight. System responses in same face, slightly cooler color. User speech in warmer color.
- **Atmospheric/background technique**: Warm radial gradient ambient glow (3–5% opacity, positioned behind voice indicator)

### Scene breakdown

#### Component 1 — Voice Activity Indicator

- **Beat**: B3 The Promise
- **Function**: Status indicator (Custom — live audio feedback)
- **Archetype**: Custom — horizontal bar with amplitude-driven pulse
- **Composition ref**: Full-width within corridor (max 480px)
- **Camera ref**: Warm fade-in
- **Interaction ref**: Audio-driven — pulses with voice amplitude, dims on silence
- **Visual elements**: Warm amber bar (2px height), pulse animation, rounded caps
- **Why it exists in the arc**: Before words appear, the user needs to see that the system is actively listening. The promise of attention.

#### Component 2 — Live Transcript

- **Beat**: B7 The Encounter
- **Function**: Long-form Body (#4) adapted for streaming text
- **Archetype**: Custom — real-time text stream in narrow corridor
- **Composition ref**: compositions #27 (narrow column)
- **Camera ref**: Line-by-line reveal (each line slides up 8px and fades in)
- **Interaction ref**: `none` — text is read-only during conversation. No hover states on transcript.
- **Visual elements**: User text (warm color), system text (cooler color), natural paragraph breaks
- **Why it exists in the arc**: The encounter — human and system exchanging words. The transcript is the artifact of connection.

#### Component 3 — Clarification / Response Area

- **Beat**: B20 The Invitation
- **Function**: Featured Article (#2) adapted — system's spoken response or clarifying question
- **Archetype**: Custom — distinguished text block at corridor bottom
- **Composition ref**: Within corridor width, visually separated by a subtle divider or temperature shift
- **Camera ref**: Gentle appear with 200ms delay
- **Interaction ref**: `none` — response is spoken, not clicked
- **Visual elements**: Slightly indented or temperature-shifted text, optional "still listening" indicator
- **Why it exists in the arc**: The system's response completes the encounter and gently invites the user to continue or confirm.

### Shared system holdback

- Card layout — holdback (no cards in this view)
- Button styles — holdback (no buttons during conversation)
- Panel border treatment — holdback until Intent view defines structured panels
- Approval card design — holdback

### Image placeholders

- **Conversation context**: The VoiceBar corridor open on a warm desktop. The narrow column of transcript text flows downward with clearly legible text. The voice-activity bar at the top pulses amber. The surrounding desktop is visible but softly defocused. The overall mood is warm, attentive, intimate — like a conversation in golden-hour light. No chat bubbles. No avatars. Just flowing text in a focused channel.

---

## View: Intent + Plan Review

### Scene thesis

The intent view is the bridge viewscreen scene — the moment the captain reviews what's understood before committing to action. The register shifts from warm conversation to cool structured clarity. Information crystallizes from the fluid transcript into labeled fields: goal, scope, constraints, unresolved questions. This is Frakes' push-in moment — the camera commits forward, the interface narrows its focus from open-ended conversation to specific, structured understanding. The DraftPlan preview appears below the intent, showing proposed execution steps in "not started" state. The user sees exactly what the system understands and exactly what it plans to do, before anything happens.

### One big idea

**Crystallizing viewscreen** — fluid conversational understanding solidifies into structured, labeled intelligence. Two visual layers: the IntentBoard (what is understood) above the DraftPlan (what will be done). The crystallization — from warm fluid to cool structured — IS the visual event.

### Hero dominance statement

The IntentBoard dominates through structured clarity against the corridor's previous warmth. It feels authoritative because every field is labeled, every constraint is explicit, every gap is flagged. Like the Enterprise viewscreen: large, centered in the bridge's attention, presenting parsed intelligence rather than raw data. The dominance is informational, not decorative.

### Restraint statement

No progress indicators (nothing has started). No animations on the intent fields — they appear structured and still, as crystallized data should. No decorative icons next to field labels. No collapsible accordion on the intent fields — everything is visible at once. No gradient backgrounds on the plan preview. No "AI thinking" spinner.

### Material thesis

The IntentBoard surface is a cool-toned panel with a subtle 1px border — LCARS-inspired structured display. Fields are separated by whitespace, not divider lines. The DraftPlan preview uses the same cool panel treatment but at lower opacity (60–70%), suggesting it's a preview, not a commitment. The transition from warm (conversation) to cool (intent) happens in the panel backgrounds, not in a dramatic color change.

### Page-role scene

**Bridge viewscreen briefing** — the crew gathers around the display. The data is clear. The plan is proposed. The captain decides. This is the operational pause between understanding and action — the most critical trust moment in the interface.

### Signature composition

- **Description**: **Stacked viewscreen** — the IntentBoard occupies the upper 60% of the corridor as a structured panel (labeled fields: Goal, Scope, Constraints, Unresolved Questions). Below it, the DraftPlan preview occupies the lower 40% as a lower-opacity panel showing numbered execution steps with "Not started" badges. Between them, a visual threshold — a thin horizontal divider or a temperature gradient — marks the boundary between understanding and proposed action. The corridor width expands slightly here (max 560px) to accommodate structured data.
- **Source id**: Adapted from compositions #43 "Sticky image with scrolling text" — the IntentBoard is the "sticky" layer (persistent at top), the DraftPlan is the "scrolling" layer below.
- **Grid fallback test**: If flattened to a side-by-side grid, the critical hierarchy (understanding above, plan below) is destroyed. The vertical stacking IS the meaning — you read what's understood, then look down to see what will be done. Horizontal layout implies parallel importance; this demands sequential importance.

### Narrative arc

1. B10 Deep Dive — IntentBoard appears with parsed fields. The system shows what it understood. The user reads.
2. B11 The Tutorial — DraftPlan preview appears below. The system shows what it proposes to do. Step by step.
3. B16 The Authority — the structured display conveys confidence. Labeled fields, explicit constraints, flagged gaps. The system proves it understood.
4. B20 The Invitation — approval area at bottom. "Proceed" or "Adjust" — a gentle gate, not a command.

### Entrance map

- Component 1 (IntentBoard): `crystallize-in` — fields appear top-to-bottom with 120ms stagger, each sliding in from slight left offset (8px), conveying the transition from fluid conversation to fixed structure
- Component 2 (DraftPlan): `fade-up-delayed` — appears 400ms after IntentBoard completes, sliding up 12px with opacity transition
- Component 3 (Approval area): `settled-appear` — fades in after plan, no movement, suggesting stability and readiness
- Component 4 (Unresolved questions callout): `warm-pulse` — if there are unresolved items, they pulse once in warm amber to draw attention back to the conversational register

### Motion budget

- **Heavy interaction** (max 1): The `crystallize-in` stagger on IntentBoard fields — this is the push-in moment, the Frakes signature. The interface commits forward as understanding solidifies. Earns the slot because the intent→action boundary is the highest-trust moment.
- **Attention-seeking reveals** (max 2): (1) DraftPlan delayed entrance — the plan appearing after intent is confirmed is a reveal. (2) Unresolved questions warm-pulse — flags gaps that need conversation.
- **Baseline motion**: Approval area fades in quietly. No hover animations on intent fields (they are read-only data, not interactive elements).

### Library source citations

- **Camera / reveal behavior**: Custom — crystallize-in stagger (top-to-bottom structured reveal)
- **Interaction behavior**: Approval buttons at bottom are the only interactive elements; standard button interaction
- **Composition**: Adapted compositions #43 (sticky with scrolling content)
- **Typography treatment**: Intent field labels in 11px semibold caps (letter-spacing +0.06em). Field values in 15px regular. DraftPlan steps in 14px regular with step numbers in semibold. Goal statement in 18px semibold.
- **Atmospheric/background technique**: Cool panel backgrounds (blue-grey at 5–8% opacity). Temperature gradient at the threshold between IntentBoard and DraftPlan.

### Scene breakdown

#### Component 1 — IntentBoard Header (Goal)

- **Beat**: B10 Deep Dive
- **Function**: Data Dashboard (#11) adapted — structured intent display
- **Archetype**: Custom — labeled-field panel
- **Composition ref**: Full corridor width, horizontal padding 24px
- **Camera ref**: First element in crystallize-in stagger
- **Interaction ref**: `none` — read-only display
- **Visual elements**: Goal label (caps, 11px), goal value (18px semibold), cool panel background, 1px border
- **Why it exists in the arc**: The first thing the user needs to see is what the system thinks the goal is. Largest text. Highest position.

#### Component 2 — IntentBoard Body (Scope, Constraints, Questions)

- **Beat**: B10 Deep Dive (continued)
- **Function**: Data Dashboard (#11) adapted — multi-field structured display
- **Archetype**: Custom — vertical field stack within panel
- **Composition ref**: Stacked fields with 16px vertical gap
- **Camera ref**: Continues crystallize-in stagger (120ms per field)
- **Interaction ref**: `none` — read-only
- **Visual elements**: Field labels (Scope, Constraints, Unresolved Questions), field values, optional amber highlight on unresolved items
- **Why it exists in the arc**: After the goal, the user needs to verify scope and constraints. Unresolved questions flag what still needs conversation.

#### Component 3 — DraftPlan Preview

- **Beat**: B11 The Tutorial
- **Function**: Process/Steps (#8) adapted — proposed execution steps
- **Archetype**: Custom — numbered step list at reduced opacity
- **Composition ref**: Below IntentBoard, within corridor, at 60–70% opacity
- **Camera ref**: Fade-up-delayed (400ms after IntentBoard)
- **Interaction ref**: `none` — preview only, not interactive until approved
- **Visual elements**: Step numbers (semibold), step descriptions, "Not started" badges (neutral grey), thin left border line connecting steps
- **Why it exists in the arc**: The tutorial — "here's what I'll do." The user sees the plan before committing.

#### Component 4 — Approval / Adjust Area

- **Beat**: B20 The Invitation
- **Function**: Lead Magnet (#33) adapted — approval gate
- **Archetype**: Custom — binary action area (proceed / adjust)
- **Composition ref**: Bottom of corridor, full width, visually separated
- **Camera ref**: Settled-appear (no movement, stability)
- **Interaction ref**: Button click (proceed or adjust)
- **Visual elements**: Proceed button (brand/CTA color), Adjust link (text-only, warm color), brief description of what "proceed" means
- **Why it exists in the arc**: The invitation to commit. Gentle, not urgent. The user decides.

### Shared system holdback

- Button hover/active states — define proceed/adjust buttons here, but holdback shared button system until Execution view also defines its buttons
- Card design — holdback (DraftPlan steps are list items, not cards)
- Timeline design — holdback until Execution view defines the authoritative timeline

### Image placeholders

- **Intent crystallization**: The IntentBoard panel visible in the corridor, showing structured fields (Goal, Scope, Constraints) with clear labels and values. Below it, the DraftPlan preview at reduced opacity showing numbered steps. The overall tone is cool and structured — blue-grey panel backgrounds, crisp borders, clear hierarchy. The warm amber of conversation has faded to the edges. One "Unresolved Questions" field glows slightly warm, pulling attention. Mood: clear-eyed confidence. The system knows what you want.

---

## View: Execution / TaskPanel

### Scene thesis

The execution view is the operations deck — the bridge crew working in coordinated precision. The cool register is fully active: structured panels, sequential timeline, status indicators with explicit state. This is Frakes directing a tactical sequence: efficient, connected, each shot serving the next. The Timeline moves vertically downward — each step is a discrete moment with status, description, and impact. ApprovalCards interrupt the timeline as full-width monolith gates when sensitive actions require permission. The CompletionSummary at the bottom shifts temperature back toward warm — resolution, like the quiet aftermath scene in the film. Every element is accountable: what happened, what changed, what can be undone.

### One big idea

**Operational corridor** — a vertical sequence of discrete, accountable steps moving downward through the corridor. Each step has explicit status. Approval gates interrupt the flow as monolith panels. Completion brings warmth back. The corridor's directionality — top to bottom, start to finish — is the composition.

### Hero dominance statement

The Timeline dominates through sequential authority — each step is numbered, labeled, and status-tagged. The hero is not a single large element but the relentless forward motion of the sequence itself. Like Frakes' connected camera movement through bridge operations: you feel the sequence's momentum through its structure. The timeline earns dominance by being the only way to understand what's happening.

### Restraint statement

No progress percentage bars (completion is discrete steps, not a gradient). No confetti on completion. No animated success checkmarks. No color-coding beyond the warm/cool register and status states (green/amber/red for pass/pending/fail only). No expandable detail drawers — each step shows what matters at its current state. No decorative dividers between steps — whitespace separates.

### Material thesis

Timeline steps are cool-toned cards with 1px borders — each a discrete panel on the LCARS-style operational display. Active step has a slightly brighter background (contrast emphasis, Frakes' push-in echo). ApprovalCards are cutaway monolith panels — they break the corridor's rhythm with a distinct, authoritative presence: slightly darker background, thicker border (2px), a warm amber accent on the approval action. CompletionSummary shifts the panel background back toward warm — golden-grey rather than blue-grey — signaling resolution.

### Page-role scene

**Operations deck sequence** — the crew executes. Each step is a beat in the tactical sequence. Approval gates are the dramatic pauses — "Captain, shall we proceed?" The completion is the quiet bridge after the mission: warm, resolved, accountable.

### Signature composition

- **Description**: **Sequential timeline corridor with monolith interrupts** — a vertical stack of step cards within the corridor (max 560px width), each card containing: status indicator (left), step description (center), impact summary (right). Between certain steps, ApprovalCard monoliths span the full corridor width with distinct visual treatment — breaking the regular card rhythm to demand attention. At the bottom, the CompletionSummary is a wider panel (expanding to max 640px) with a warm-shift background — the corridor exhales.
- **Source id**: Custom — no single library composition covers a timeline with interrupt gates. The closest reference is compositions #63 "Progressive sticky stack" for the sequential reveal behavior, but the monolith interrupt pattern is unique to this use case.
- **Grid fallback test**: If rearranged into a grid (steps as equal-weight cards in a 2×2 matrix), the sequential narrative is destroyed. Steps happen in order — their position IS their meaning. The approval gate monoliths would become indistinguishable from regular steps. The composition is fundamentally sequential and directional.

### Narrative arc

1. B8 Evidence Wall — Timeline appears with all steps visible, each with initial status. The quantity of steps IS the message: "here's everything that will happen."
2. B11 The Tutorial — as execution progresses, the active step expands slightly to show current action detail. The user follows along.
3. B14 The Pivot — ApprovalCard appears. Tonal shift: the regular step rhythm breaks. This is the dramatic pause. Different visual treatment demands a different response (approve / deny).
4. B16 The Authority — execution continues after approval. Steps complete. Status indicators update. The system proves its competence through visible progress.
5. B19 Quiet Moment — all steps complete. A brief pause before the summary.
6. B22 The Farewell — CompletionSummary appears with warm-shift background. What happened. What changed. What can be undone. Closure.

### Entrance map

- Component 1 (Timeline header): `settle-in` — task name and overall status appear, 300ms fade-in
- Component 2 (Step cards): `stagger-reveal` — steps enter sequentially with 80ms stagger, each sliding in 6px from left
- Component 3 (ApprovalCard): `monolith-expand` — expands from center outward (height grows from 0), 400ms ease-out. The only heavy animation.
- Component 4 (Step completion): `status-shift` — status indicator transitions color over 200ms
- Component 5 (CompletionSummary): `warm-fade-in` — appears with a simultaneous warm color-temperature shift on the panel background, 500ms

### Motion budget

- **Heavy interaction** (max 1): `monolith-expand` on the ApprovalCard — the approval gate expanding into view is the dramatic moment. It earns the slot because the approval boundary is the highest-stakes moment in execution: the system is asking for permission to do something consequential.
- **Attention-seeking reveals** (max 2): (1) Step stagger-reveal — the sequential entrance of timeline steps. (2) Warm-shift on CompletionSummary — the return to warmth signals resolution.
- **Baseline motion**: Status indicator color transitions (200ms). Active step slight contrast increase. All subordinate to the timeline's sequential clarity.

### Library source citations

- **Camera / reveal behavior**: Custom — stagger-reveal for steps, monolith-expand for approval gates
- **Interaction behavior**: ApprovalCard buttons (approve/deny). Step cards may be clickable for detail in future phases.
- **Composition**: Custom, adapted from compositions #63 (progressive sticky stack) for sequential behavior
- **Typography treatment**: Task name in 18px semibold. Step descriptions in 14px regular. Status labels in 11px semibold caps. Impact summaries in 13px regular, slightly muted color. Approval text in 15px regular with action buttons in semibold.
- **Atmospheric/background technique**: Cool panel backgrounds on step cards. Monolith ApprovalCards at slightly darker cool tone with 2px border. CompletionSummary at warm-shift background (golden-grey).

### Scene breakdown

#### Component 1 — Task Header

- **Beat**: B8 Evidence Wall (opening)
- **Function**: Announcement Bar (#50) adapted — task identification and overall status
- **Archetype**: Custom — single-line header with task name and status badge
- **Composition ref**: Full corridor width, minimal height
- **Camera ref**: Settle-in (300ms fade)
- **Interaction ref**: `none` — informational only
- **Visual elements**: Task name (18px semibold), overall status badge (Executing / Paused / Completed), elapsed time indicator
- **Why it exists in the arc**: Establishes what operation is underway before showing individual steps.

#### Component 2 — Timeline Steps

- **Beat**: B8 Evidence Wall → B11 Tutorial (as execution progresses)
- **Function**: Timeline (#7) adapted — execution step sequence
- **Archetype**: Custom — vertical card stack with status indicators
- **Composition ref**: Stacked cards within corridor, 12px gap between cards
- **Camera ref**: Stagger-reveal (80ms per step)
- **Interaction ref**: Status indicator color transitions on completion. Future: click to expand detail.
- **Visual elements**: Status dot (left, 10px), step number, step description, impact summary line, thin connecting line between steps (1px, cool grey)
- **Why it exists in the arc**: The evidence wall of execution — every step visible, every step accountable.

#### Component 3 — ApprovalCard

- **Beat**: B14 The Pivot
- **Function**: Lead Magnet (#33) adapted — approval gate for sensitive actions
- **Archetype**: Custom — **cutaway monolith** — full corridor width, distinct visual treatment
- **Composition ref**: Breaks the step card rhythm. Darker cool background, 2px border, warm amber accent on action buttons.
- **Camera ref**: Monolith-expand (400ms ease-out, grows from center)
- **Interaction ref**: Approve / Deny buttons. Approve button in warm amber (CTA). Deny in text-only.
- **Visual elements**: Action label ("Approval Required"), explanation text (what will happen and why), impact statement (what changes), Approve button, Deny link, risk level indicator
- **Why it exists in the arc**: The dramatic pivot. The system pauses its own momentum to ask permission. This is the trust mechanism — the most important UI element in BridgeOS.

#### Component 4 — Active Step Detail

- **Beat**: B11 Tutorial (continued)
- **Function**: Featured Article (#2) adapted — expanded view of currently executing step
- **Archetype**: Custom — step card with additional detail rows
- **Composition ref**: Same card dimensions as other steps, but with 2–3 additional lines visible
- **Camera ref**: Contrast increase on active step (background brightens slightly)
- **Interaction ref**: `none` during execution — informational expansion
- **Visual elements**: Command being run (monospace), file/resource being acted on, real-time output preview (if applicable)
- **Why it exists in the arc**: The user follows along as the tutorial unfolds — seeing exactly what's happening at each moment.

#### Component 5 — CompletionSummary

- **Beat**: B22 The Farewell
- **Function**: About/Mission (#47) adapted — task outcome summary
- **Archetype**: Custom — wider panel with warm-shift background
- **Composition ref**: Expands to max 640px width, warm-grey panel background
- **Camera ref**: Warm-fade-in (500ms, simultaneous temperature shift)
- **Interaction ref**: Undo button (if applicable), "View details" link
- **Visual elements**: Outcome label (Completed / Failed), changes summary (files modified, commands run), undo availability indicator, warm-shift background panel
- **Why it exists in the arc**: The farewell — the mission is over. Warm tone returns. The user sees what happened, what changed, and whether it can be undone. Closure with accountability.

### Shared system holdback

- Shared button styles — can now define: Proceed/Approve button (warm amber fill, white text, 8px radius). Deny/Cancel link (text-only, cool grey). Adjust link (text-only, warm amber).
- Shared card padding — holdback until Phase 3 derives from all views
- Shared status color system — holdback until Phase 3 extracts the warm/cool/status color matrix

### Image placeholders

- **Execution in progress**: The TaskPanel corridor showing a vertical timeline of step cards, each with a status dot on the left. Three steps are completed (cool teal dots), one is active (slightly brighter background), two are pending (neutral grey dots). An ApprovalCard monolith interrupts the sequence — darker background, 2px border, warm amber "Approve" button prominent. The overall tone is cool and structured. Mood: focused competence. The system is working transparently.

- **Completion state**: The same corridor, but all steps show completed status. At the bottom, the CompletionSummary panel has a warm-shifted background (golden-grey), showing "Task Completed" with a summary of changes. The return to warmth is visible — the cool operational tone has softened. Mood: resolved, trustworthy, calm.

---

## Anti-Convergence Cross-Check

- [x] Same archetype id appears at most 2× across the whole site — **Pass**: All four views use Custom archetypes unique to their function. No archetype id repeats.
- [x] Same function type prefers different archetype on different pages — **Pass**: The only shared function type is status indication, and it manifests differently in each view (capsule dot, voice-activity bar, step status dots, completion badge).
- [x] Homepage and interior pages do not reuse the same shell with only superficial changes — **Pass**: Idle (single floating element) and Conversation (narrow corridor) and Intent (structured panels) and Execution (timeline with monolith interrupts) are structurally distinct. They share the corridor shell proportions but differ in every other dimension.
- [x] At least 2 sections per page structurally different from default marketing layouts — **Pass**: None of these views resemble marketing layouts. Every view is a purpose-built operational interface with no analogue in standard web page templates.
- [x] Beat sequences match the director's template, not a generic marketing flow — **Pass**: No Hero → Features → Stats → CTA pattern anywhere. Beats follow Frakes' character-centric, connected-rhythm logic: presence → encounter → understanding → action → resolution.
- [x] Every section has a camera ref and an interaction ref, or an intentional `none` — **Pass**: All components have camera refs. Interaction refs are explicitly `none` where components are read-only (transcript, intent fields, step cards during execution), and defined where interaction exists (capsule click, approval buttons, completion undo).

## Phase 2 Completion Gate

- [x] Director brief complete
- [x] Site cinematic grammar complete
- [x] Premium calibration 12 outputs all marked
- [x] Every major view has: scene thesis, one big idea, hero dominance, restraint, material, page-role, signature composition, grid fallback, arc, entrance map, motion budget, library citations, scene breakdown
- [x] Anti-convergence cross-check passed
- [ ] User approval received *(pending)*
- [x] `INFO_ARCHITECTURE.md` written in parallel

**DESIGN.md (Phase 3) is BLOCKED until all boxes above are checked.**
