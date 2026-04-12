# Design System Inspiration of Star Trek: Insurrection

## 1. Visual Theme & Atmosphere

This interface operates in two emotional registers — warm and cool — through a single unified design language. The warm register (conversational states) uses golden amber tones, generous spacing, and breathing rhythm to communicate presence and attentiveness. The cool register (operational states) uses blue-grey panels, crisp borders, and sequential density to communicate precision and accountability. The transition between them is gradual: color temperature shifts, not layout changes.

The design philosophy is **corridor composition** — a narrow vertical channel that expands and contracts with the user's focus. The interface is a passage, not a dashboard. Every element exists to move the user forward through a sequence: awareness → conversation → understanding → execution → resolution. Negative space (the desktop itself) frames the corridor, giving the interface confident isolation rather than sprawl.

Typography carries authority through weight variation, not scale inflation. A humanist sans-serif serves both registers — warm enough for conversational transcript, structured enough for labeled data fields. Monospace is reserved exclusively for technical content (commands, file paths, package names). The type earns respect through consistent spacing and disciplined hierarchy, never through decorative treatments.

Color is functional, not decorative. Amber signals action and warmth (CTAs, voice activity, conversational register). Teal signals operational state and completion. The neutral foundation is warm-tinted, not sterile white. Borders are precise 1px lines — machined, not soft. Shadows are minimal; depth comes from panel background contrast and the register temperature shift.

**Key Characteristics:**
- Primary font: `Inter` at weight 400 (body), 500 (labels), 600 (headings) — no weight below 400 or above 600
- Monospace: `JetBrains Mono` at 14px for commands and paths only
- Corridor width: 480px (conversation) → 560px (intent/execution) → 640px (completion summary)
- Base spacing unit: 8px with strict multiples (4, 8, 12, 16, 24, 32, 48, 64)
- Border radius: 8px (panels, buttons) / 4px (inputs, badges) / 9999px (state indicator dots)
- CTA color: `#cc7a00` (amber) — reserved for action buttons and voice-activity indicators
- Operational accent: `#2a9d8f` (teal) — reserved for completion states and operational indicators
- Background: `#f7f5f2` (warm neutral, never pure white)
- Panel cool surface: `#edf1f4` (blue-grey tinted)
- No glassmorphism, no heavy shadows, no gradient backgrounds — depth from temperature and border only
- Noise texture overlay at 0.5% opacity across all panels for analog warmth

## 2. Color Palette & Roles

### Primary

- **Amber Signal** (`#cc7a00`): `--color-brand`. Primary brand color. CTA backgrounds, approve buttons, voice-activity indicator, conversational accent. The action color — it means "something is happening or can happen."
- **Operational Teal** (`#2a9d8f`): `--color-accent`. Secondary accent. Completion indicators, active status dots, operational success states. It means "something has been accomplished."

### Surface & Background

- **Warm Canvas** (`#f7f5f2`): `--bg-page`. Default page/desktop-facing background. Warm-neutral, never sterile.
- **Cool Panel** (`#edf1f4`): `--bg-surface`. Operational panels (IntentBoard, step cards, TaskPanel containers). The cool register surface.
- **Warm Panel** (`#f9f3ea`): `--bg-surface-warm`. Conversational surfaces (VoiceBar background, CompletionSummary). The warm register surface.
- **Deep Panel** (`#dfe4e8`): `--bg-muted`. Approval gate backgrounds, emphasis panels. Slightly darker cool tone for monolith interrupts.

### Neutrals & Text

- **Ink** (`#1a1d21`): `--text-primary`. Headings, high-emphasis labels, goal statement text.
- **Body** (`#3d4550`): `--text-secondary`. Default paragraph text, step descriptions, field values.
- **Muted** (`#7a8494`): `--text-tertiary`. Timestamps, metadata, caption text, "Not started" badges.
- **Hairline** (`#cdd3da`): `--border-default`. Panel borders, step card borders, input borders. Always 1px solid.
- **Divider** (`#e4e8ec`): `--border-subtle`. Section dividers within panels, threshold lines.

### Interactive

- **Focus Ring** (`rgba(204, 122, 0, 0.35)`): `--focus-ring`. 3px outline offset 2px. Used on all focusable elements.
- **Hover Warm** (`#b36b00`): `--brand-hover`. Amber darkened for button hover state.
- **Hover Cool** (`#228577`): `--accent-hover`. Teal darkened for secondary action hover.
- **Link Text** (`#cc7a00`): `--link-color`. Inline links. Same as brand color — action means amber.

### Semantic

- **Success** (`#2a9d8f`): `--color-success`. Same as Operational Teal. Completed steps, passed validations.
- **Warning** (`#cc7a00`): `--color-warning`. Same as Amber Signal. Pending approvals, unresolved questions.
- **Error** (`#c44536`): `--color-error`. Failed steps, validation errors, destructive action warnings.
- **Info** (`#4a7fb5`): `--color-info`. Informational callouts, neutral status indicators.

### Film-Specific: Register Temperature

- **Warm Glow** (`rgba(201, 169, 110, 0.04)`): `--glow-warm`. Radial gradient behind VoiceBar. Barely visible golden ambient.
- **Cool Cast** (`rgba(58, 79, 92, 0.05)`): `--glow-cool`. Subtle cool wash on operational panel backgrounds.
- **Noise Texture** (`0.5% opacity`): `--texture-noise`. Applied as a repeating SVG pattern overlay. Adds analog warmth to all surfaces.

## 3. Typography Rules

### Font Family

- **Primary**: `Inter`, with fallbacks: `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- **Monospace**: `JetBrains Mono`, with fallbacks: `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace`
- **OpenType Features**: `"cv01"`, `"cv02"`, `"ss01"`, `"tnum"` enabled globally (Inter's alternate forms and tabular numbers)

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|---|---|---|---|---|---|---|
| Display Hero | Inter | 32px (2.00rem) | 600 | 1.15 | -0.48px | Goal statement in IntentBoard |
| Heading 1 | Inter | 24px (1.50rem) | 600 | 1.20 | -0.36px | View titles, task names |
| Heading 2 | Inter | 20px (1.25rem) | 600 | 1.25 | -0.30px | Panel section headings |
| Heading 3 | Inter | 16px (1.00rem) | 600 | 1.30 | -0.16px | Sub-headings within panels |
| Body Large | Inter | 16px (1.00rem) | 400 | 1.60 | normal | Transcript text, conversation |
| Body | Inter | 14px (0.88rem) | 400 | 1.55 | normal | Step descriptions, field values |
| Body Small | Inter | 13px (0.81rem) | 400 | 1.50 | normal | Impact summaries, secondary copy |
| Label | Inter | 11px (0.69rem) | 600 | 1.20 | 0.06em | Field labels (GOAL, SCOPE, CONSTRAINTS), status badges |
| Caption | Inter | 11px (0.69rem) | 400 | 1.35 | 0.04em | Timestamps, metadata, "Not started" text |
| Code | JetBrains Mono | 13px (0.81rem) | 400 | 1.55 | normal | Commands, file paths, package names |
| Button | Inter | 14px (0.88rem) | 500 | 1.00 | 0.01em | All button labels |

### Principles

- **Weight is the primary hierarchy tool.** 600 for headings, 500 for interactive labels, 400 for everything else. No weight below 400 (too thin for UI legibility) or above 600 (too heavy for this aesthetic).
- **Letter-spacing tightens with size.** Negative tracking at heading sizes (-0.48px at 32px, -0.36px at 24px). Normal at body sizes. Positive tracking (0.06em) at label/caption sizes for small-caps readability.
- **Monospace is strictly functional.** `JetBrains Mono` appears only for commands, file paths, and package names — never for decorative effect, never for headings, never for body text.
- **Size variation is minimal.** The entire scale spans 11px to 32px — a 3:1 ratio. Authority comes from weight and spacing, not from 72px display type. This is an operational interface, not a poster.
- **Tabular numbers always.** OpenType `"tnum"` is enabled globally so that status counters, step numbers, and timestamps align vertically in the timeline.

## 4. Component Stylings

### Buttons

**Primary (Approve / Proceed)**
- Background: `#cc7a00`
- Text: `#ffffff`
- Padding: 10px 20px
- Radius: 8px
- Border: `1px solid transparent`
- Font: Inter, 14px, weight 500, letter-spacing 0.01em
- Hover: background shifts to `#b36b00`, no transform, no shadow — the color deepens, nothing lifts
- Active: background `#9a5c00`, slight inset feel (no shadow, slightly darker)
- Focus: `0 0 0 3px rgba(204, 122, 0, 0.35)` outline
- Disabled: opacity 0.45, cursor not-allowed
- Use: Approve actions, proceed gates, primary CTAs

**Secondary (Adjust / View Details)**
- Background: `transparent`
- Text: `#cc7a00`
- Border: `1px solid #cc7a00`
- Padding: 10px 20px
- Radius: 8px
- Hover: background `rgba(204, 122, 0, 0.06)`, border darkens to `#b36b00`
- Use: Secondary actions adjacent to primary CTAs

**Tertiary / Ghost (Cancel / Deny / Dismiss)**
- Background: `transparent`
- Text: `#7a8494`
- Border: none
- Padding: 10px 16px
- Hover: text darkens to `#3d4550`, no other change
- Use: Cancel, deny, dismiss, back — low-emphasis actions

### Cards & Containers

**Step Card (Timeline)**
- Background: `#edf1f4` (cool panel)
- Border: `1px solid #cdd3da`
- Radius: 8px
- Padding: 16px 20px
- Shadow: none — depth from background contrast only
- Hover state: none — step cards are informational, not clickable during execution

**Approval Gate (Monolith)**
- Background: `#dfe4e8` (deep panel)
- Border: `2px solid #cdd3da`
- Radius: 8px
- Padding: 24px
- Shadow: none
- Accent: left border 3px `#cc7a00` (amber attention stripe)
- Note: Visually breaks the regular step card rhythm — thicker border, deeper background, amber accent

**IntentBoard Panel**
- Background: `#edf1f4` (cool panel)
- Border: `1px solid #cdd3da`
- Radius: 8px
- Padding: 24px
- Internal field spacing: 16px between label-value pairs

**CompletionSummary Panel**
- Background: `#f9f3ea` (warm panel)
- Border: `1px solid #e4e8ec`
- Radius: 8px
- Padding: 24px
- Note: The warm surface signals resolution — register shift back from cool operational to warm closure

### Inputs & Forms

- Background: `#ffffff`
- Border: `1px solid #cdd3da`
- Radius: 4px
- Padding: 10px 14px
- Font: Inter, 14px, weight 400
- Placeholder color: `#7a8494`
- Label: above input, Inter 11px weight 600, letter-spacing 0.06em, color `#7a8494`, text-transform uppercase
- Focus state: border `#cc7a00`, ring `0 0 0 3px rgba(204, 122, 0, 0.15)`
- Error state: border `#c44536`, helper text `#c44536` at 13px

### Navigation

BridgeOS has no traditional navigation bar. The StatusCapsule is the persistent anchor:

**StatusCapsule**
- Background: `#edf1f4` (cool panel) when idle, shifts to `#f9f3ea` (warm) when transitioning to conversation
- Border: `1px solid #cdd3da`
- Radius: 24px (pill shape)
- Height: 40px
- Width: 120–160px (auto based on content)
- State dot: 8px circle, radius 9999px, fill shifts with system state (`#cc7a00` idle-ready, `#2a9d8f` background-active, `#7a8494` dormant)
- System wordmark: Inter 12px weight 600, letter-spacing 0.02em, color `#3d4550`
- Desktop anchor: fixed position, 16px margin from edge

**State Indicator Dot (shared across views)**
- Size: 8–10px circle
- Radius: 9999px
- Colors: `#cc7a00` (pending/active), `#2a9d8f` (completed), `#c44536` (failed), `#7a8494` (not started)
- Transition: 200ms ease on background-color

### Distinctive Components

**Voice Activity Indicator**
- Shape: horizontal bar, 2px height, full corridor width
- Color: `#cc7a00` (amber)
- Animation: width pulses 60–100% based on audio amplitude, 150ms transitions
- Resting: dims to 40% opacity when no audio detected
- Source: Custom — voice-amplitude-driven UI, no library equivalent

**Timeline Connector**
- Shape: vertical 1px line connecting step card left edges
- Color: `#cdd3da` (hairline)
- Behavior: segments between completed steps shift to `#2a9d8f` (teal) as steps complete

## 5. Layout Principles

### Spacing System

- **Base unit**: 8px
- **Scale**: 2px, 4px, 8px, 12px, 16px, 20px, 24px, 32px, 48px, 64px
- **Section padding**: 24px vertical between major components within a view
- **Component padding**: 16px (step cards), 20px (panels), 24px (monolith gates, summary panels)
- **Corridor horizontal padding**: 16px on each side (content sits within the corridor's width minus 32px)

### Grid & Container

- **StatusCapsule**: 120–160px × 40px, floating, no grid
- **Conversation corridor**: max-width 480px, single column
- **Intent/Execution corridor**: max-width 560px, single column
- **CompletionSummary**: max-width 640px, single column
- **Gutter**: N/A — single-column corridor, no multi-column layouts
- **Desktop anchor**: corridor is positioned fixed or absolute relative to screen edge, not centered in viewport

### Whitespace Philosophy

The corridor composition means whitespace is *structural*, not decorative. The desktop itself is the primary negative space — the interface floats within it, claiming only the width it needs. Inside the corridor, whitespace separates functional groups: 24px between major components, 16px between related items (fields within a panel, steps within a timeline), 8px between tightly coupled elements (label and value, icon and text).

Density increases with commitment: the Idle view is almost entirely negative space. Conversation adds a narrow text column. Intent introduces structured panels. Execution fills the corridor with sequential steps. This progression — from sparse to dense — mirrors the user's engagement arc. The return to warmth at CompletionSummary re-introduces generous spacing, signaling that the operational density has resolved.

### Border Radius Scale

- **0px** (sharp): never used — even the smallest elements have slight rounding
- **4px** (subtle): inputs, small badges, status labels, code blocks
- **8px** (default): panels, cards, buttons, IntentBoard, step cards, approval gates
- **24px** (capsule): StatusCapsule pill shape
- **9999px** (circle): state indicator dots, voice-activity bar caps

## 6. Depth & Elevation

| Level | Treatment | Use |
|---|---|---|
| Flat (Level 0) | No shadow, background contrast only | Step cards, panels, corridor body |
| Ring (Level 1) | `1px solid #cdd3da` border | All panels, cards, inputs — border IS the elevation |
| Emphasis (Level 2) | `2px solid #cdd3da` border + deeper background (`#dfe4e8`) | Approval gates (monolith interrupts) |
| Capsule (Level 3) | `0 2px 8px rgba(26, 29, 33, 0.08)` shadow | StatusCapsule only — it floats above the desktop |

**Shadow Philosophy:**

This interface rejects shadow-based elevation in favor of **border-and-background elevation**. Depth is communicated through panel background temperature (warm vs. cool) and border weight (1px standard vs. 2px emphasis), not through box-shadows that simulate physical lift. The only element that casts a shadow is the StatusCapsule, because it literally floats above the desktop — its shadow is physical truth, not metaphor.

This approach comes from the source material's production design: structured instrument panels where displays are backlit, not raised. Depth on the bridge comes from illumination contrast (bright display against darker surround), not from physical protrusion. The interface follows the same logic: panels are "lit" by their background color against the corridor's darker or lighter surround. The cool-warm register shift itself IS the depth system — cool panels recede into operational focus, warm panels come forward with conversational presence.

### Decorative Depth

- **Noise texture**: repeating SVG pattern at 0.5% opacity, applied as `::after` pseudo-element on all panel backgrounds. Prevents surfaces from feeling digitally sterile. Source: Custom — analog film grain, barely perceptible.
- **Warm ambient glow**: radial gradient `rgba(201, 169, 110, 0.04)` centered behind the VoiceBar voice-activity indicator. Simulates natural light spilling into the conversation corridor. 200px radius, feathered edge.
- **Temperature gradient threshold**: at the boundary between IntentBoard and DraftPlan, a 2px-height gradient strip transitioning from warm-panel to cool-panel background. Marks the understanding→action boundary.

## 7. Do's and Don'ts

### Do

- Use `#cc7a00` (amber) exclusively for CTAs and voice-activity — it is the action signal, not decoration
- Use `#2a9d8f` (teal) exclusively for completion/success states — it is the resolution signal
- Apply the warm/cool register shift through background color, not through changing fonts or layout
- Use 1px solid borders as the primary elevation mechanism — they are crisp, machined, precise
- Use weight 600 for all headings and weight 400 for all body — no other weights in production
- Apply `"tnum"` (tabular numbers) to all numeric content — step numbers, timestamps, counters must align
- Keep the corridor at its defined max-widths (480/560/640px) — never stretch to fill the screen
- Use uppercase + letter-spacing 0.06em for field labels (GOAL, SCOPE, STATUS) — they are structured data labels, not sentences
- Let state transitions flow directionally: downward for conversation, outward for corridor expansion, sequential for steps
- Apply the noise texture to every panel surface — it is the shared material that unifies both registers

### Don't

- Don't use box-shadows for elevation (except StatusCapsule) — depth is border + background, not shadow
- Don't use gradient backgrounds on any panel — color is flat within each register
- Don't scatter amber or teal across the interface for decoration — they are strictly semantic
- Don't use pure white (`#ffffff`) for any background except input fields — the canvas is `#f7f5f2`
- Don't use pure black (`#000000`) for text — the darkest text is `#1a1d21`
- Don't apply hover animations to read-only elements (transcript, intent fields, step cards during execution)
- Don't use `translateY + fade` as a universal entrance — each view has a specific entrance map
- Don't add chat bubbles, avatar icons, or typing indicators — this is a corridor, not a messenger
- Don't use the monospace font for anything except commands, file paths, and package names
- Don't let the corridor exceed its max-width on any screen size — negative space IS the composition
- Don't add confetti, animated checkmarks, or celebration effects on completion — the warm-shift IS the celebration
- Don't use radius values outside the defined scale (4/8/24/9999) — no 16px, no 12px radius

## 8. Responsive Behavior

### Breakpoints

BridgeOS is a desktop application (Tauri 2) targeting Linux. These breakpoints describe **window/panel sizing**, not mobile viewports.

| Name | Width | Key Changes |
|---|---|---|
| Compact | < 400px | Corridor at minimum 360px. Step cards show single-line descriptions. Label text truncates with ellipsis. |
| Standard | 400px – 800px | Full design. Corridor at defined max-widths (480/560/640px). All content visible. |
| Expanded | > 800px | Corridor centered in available space. Extra negative space reinforces corridor composition. No content reflow. |

### Touch Targets

- Minimum interactive element size: 36 × 36px (desktop app, not mobile)
- Spacing between adjacent interactive elements: at least 8px
- Approve/Deny buttons: minimum 40px height, minimum 100px width
- StatusCapsule click target: 40px height × full capsule width

### Collapsing Strategy

- **Corridor**: Does not collapse — maintains minimum 360px. On very small windows, horizontal scrolling is acceptable for the corridor body.
- **Intent fields**: In compact mode, long field values truncate with "Show more" expansion.
- **Timeline steps**: In compact mode, impact summaries hide. Step descriptions truncate to 2 lines.
- **Approval gates**: Never collapse — they must always show action label, explanation, and buttons at full legibility.

## 9. Agent Prompt Guide

### Quick Color Reference

```
Page canvas:      #f7f5f2  (warm neutral background)
Cool panel:       #edf1f4  (operational surfaces)
Warm panel:       #f9f3ea  (conversational surfaces)
Deep panel:       #dfe4e8  (approval gates)
Brand / CTA:      #cc7a00  (amber — action signal)
Accent:           #2a9d8f  (teal — completion signal)
Error:            #c44536  (failed / destructive)
Text primary:     #1a1d21  (headings)
Text secondary:   #3d4550  (body)
Text tertiary:    #7a8494  (metadata)
Border:           #cdd3da  (1px solid hairlines)
```

### Example Component Prompts

- "Create a StatusCapsule on `#f7f5f2` desktop background. Pill shape: 40px height, 140px width, `#edf1f4` background, `1px solid #cdd3da` border, radius 24px. Inside: 8px amber dot (`#cc7a00`, radius 9999px) left-aligned with 12px margin, then 'BridgeOS' in Inter 12px weight 600 color `#3d4550` letter-spacing 0.02em. Shadow: `0 2px 8px rgba(26, 29, 33, 0.08)`. Dot breathes: scale 1.0 → 1.05 → 1.0 on a 2s ease-in-out loop."

- "Build an IntentBoard panel on `#edf1f4` background. 560px max-width, 24px padding, 8px radius, `1px solid #cdd3da` border. Goal field: label 'GOAL' in Inter 11px weight 600 `#7a8494` uppercase letter-spacing 0.06em, value 'Organize my Downloads folder by file type' in Inter 24px weight 600 `#1a1d21` line-height 1.20 letter-spacing -0.36px. Below: Scope and Constraints fields at 14px weight 400 `#3d4550`. Unresolved questions section with amber `#cc7a00` left border 2px. 16px vertical gap between fields."

- "Create an ApprovalCard monolith. 560px max-width, `#dfe4e8` background, `2px solid #cdd3da` border, 8px radius, 24px padding, 3px left border in `#cc7a00`. Header: 'Approval Required' in Inter 14px weight 600 `#1a1d21`. Explanation: 'Install ffmpeg via apt' in Inter 14px weight 400 `#3d4550`. Impact: 'Requires sudo elevation' in Inter 13px weight 400 `#7a8494`. Buttons: Primary 'Approve' in `#cc7a00` bg / white text / 8px radius / 14px weight 500 / 10px 20px padding. Ghost 'Deny' in `#7a8494` text / no border / 10px 16px padding."

- "Build a Timeline step card. `#edf1f4` background, `1px solid #cdd3da` border, 8px radius, 16px 20px padding. Left: 10px status dot (radius 9999px, `#2a9d8f` for completed, `#7a8494` for pending). Center: step description in Inter 14px weight 400 `#3d4550`. Right: impact summary in Inter 13px weight 400 `#7a8494`. Between cards: 12px vertical gap. Connecting line: 1px `#cdd3da` vertical from dot to dot."

### Iteration Guide

1. Set the corridor container to max-width 560px, background `#f7f5f2`, and load Inter + JetBrains Mono
2. Apply the 8px spacing scale globally — every margin and padding must be a scale value (4, 8, 12, 16, 20, 24, 32, 48, 64)
3. Set all borders to `1px solid #cdd3da` — border IS the elevation system, not shadow
4. Apply the warm/cool surface colors: `#edf1f4` for operational panels, `#f9f3ea` for conversational/completion panels
5. Use the Label style (11px weight 600 uppercase +0.06em) for all field labels and status badges
6. Reserve `#cc7a00` for interactive/action elements only (buttons, links, voice indicator) — never for decoration
7. Reserve `#2a9d8f` for completion/success states only — never for interactive elements
8. Apply the noise texture (0.5% opacity SVG pattern) as `::after` on all panel backgrounds
9. Build state transitions as CSS transitions (300–500ms ease) on background-color and border-color — the register shift is a color temperature change, not a layout change
10. Test the corridor at 480px, 560px, and 640px widths — each should feel complete, not cramped or stretched
