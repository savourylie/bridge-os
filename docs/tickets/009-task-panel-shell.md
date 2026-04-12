# [TICKET-009] TaskPanel Shell

## Status
`pending`

## Dependencies
- Requires: #004 ✅

## Description
Build the TaskPanel — the main execution surface container that houses all task-related UI components. It renders as a right-side slide-over panel that remains visible alongside the desktop, allowing users to continue working while monitoring the system. This ticket builds the panel shell, including the TaskHeader and TaskMetaRow sub-components, with slot areas for child components (IntentBoard, DraftPlan, Timeline, etc.).

## Acceptance Criteria
- [ ] TaskPanel renders as a right-side slide-over panel with smooth open/close animation
- [ ] Panel slides in from the right edge using Framer Motion (300-500ms ease transition)
- [ ] TaskHeader displays task title (Heading 1) and one-sentence summary (Body)
- [ ] TaskMetaRow displays Status, Risk level, and Scope as a compact horizontal strip
- [ ] Status values use the correct state colors (amber for pending, teal for completed, red for failed, muted for not started)
- [ ] Risk level displays as Low/Medium/High with appropriate color coding
- [ ] TaskMetaRow values are visible without scrolling
- [ ] Panel body is scrollable when content exceeds viewport height
- [ ] Open/close can be triggered programmatically and via the StatusCapsule click
- [ ] Panel width accommodates the corridor widths (560px for intent/execution content)

## Design Reference
- **Panel structure**: UX_DESIGN.md § 5 (TaskPanel) — contents list, side panel rationale
- **Header**: UX_DESIGN.md § 7 (TaskHeader) — title, summary, state
- **Meta row**: UX_DESIGN.md § 8 (TaskMetaRow) — status, risk, scope
- **Typography**: DESIGN.md § 3 (Heading 1 for title, Body for summary, Label for meta labels)

## Visual Reference
A panel slides in from the right side of the screen. At the top: "Organize Downloads" in large heading text, with "Preparing to group screenshots by month and remove clutter." below in body text. A compact meta row shows three labeled values: "Status: Waiting for approval" (amber), "Risk: Medium", "Scope: Downloads only." Below the meta row, a scrollable area holds placeholder blocks representing where IntentBoard, DraftPlan, Timeline, etc. will render.

## Implementation Notes
- Use Framer Motion `AnimatePresence` for the slide-in/slide-out animation
- The panel should not block the entire desktop — it's a side panel, not a modal
- TaskHeader is a simple sub-component: title + summary + current state
- TaskMetaRow uses the Label typography for field names and Body Small for values
- Provide `children` slot for composing IntentBoard, DraftPlan, Timeline, etc. inside
- The panel should have a consistent internal padding (24px) matching the corridor system
- Create at route `/components/task-panel` with mock header/meta data and placeholder children

## Testing
- Navigate to `/components/task-panel`
- Verify panel slides in from the right with smooth animation
- Verify TaskHeader displays title and summary correctly
- Verify TaskMetaRow shows status, risk, and scope in a compact row
- Verify panel is scrollable with overflowing content
- Toggle open/close and verify animation both directions
