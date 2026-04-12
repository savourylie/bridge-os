# [TICKET-013] CompletionSummary & Rollback Indicator

## Status
`done`

## Dependencies
- Requires: #010 ✅

## Description
Build the CompletionSummary — a warm-surfaced panel that appears after task completion, summarizing the outcome in human-readable language. This component signals resolution by shifting back from the cool operational register to the warm conversational register. It includes a concise results summary, a list of changes made, and action buttons (Undo, View changes, Close). A simple rollback availability indicator shows whether and for how long the task can be undone.

## Acceptance Criteria
- [x] CompletionSummary uses warm surface `#f9f3ea`, `1px solid #e4e8ec` border, 8px radius, 24px padding
- [x] Header uses Heading 2 (Inter 20px weight 600, `#1a1d21`)
- [x] Outcome text uses Body typography (Inter 14px weight 400, `#3d4550`)
- [x] Changes summary shows counts: files created, modified, moved, deleted — using Body Small
- [x] Network activity line shown when relevant
- [x] "Undo" action button uses Secondary button style (amber outline)
- [x] "View changes" uses Secondary button style
- [x] "Close" uses Ghost button style
- [x] Rollback indicator shows availability message (e.g., "This task can be undone for the next 30 minutes.") in Caption style
- [x] Rollback indicator is hidden when undo is not available
- [x] The warm surface signals visual resolution — the register shift from cool back to warm IS the celebration (no confetti, no animated checkmarks per DESIGN.md § 7 Don'ts)

## Design Reference
- **Panel**: DESIGN.md § 4 (Cards & Containers > CompletionSummary Panel)
- **Secondary Button**: DESIGN.md § 4 (Buttons > Secondary)
- **Ghost Button**: DESIGN.md § 4 (Buttons > Tertiary/Ghost)
- **Surface note**: DESIGN.md § 4 — "warm surface signals resolution"

## Visual Reference
After the timeline of cool step cards, a warm-toned panel appears. "Task Complete" heading. Below: "Created: 6 folders. Moved: 133 files. Deleted: 0 files. Network requests: none." A subtle line reads "This task can be undone for the next 30 minutes." Three buttons: "Undo" and "View changes" in amber-outlined style, "Close" in ghost style. The warmth of the panel contrasts with the preceding cool operational panels — the visual shift itself communicates completion.

## Implementation Notes
- The warm surface is the CompletionSummary's key visual signal — don't add extra decorative celebration
- Rollback indicator is a simple conditional text line, not a full RollbackBar component (deferred per UX_DESIGN.md MVP scope)
- Changes summary should accept a structured object: `{ created: number, modified: number, moved: number, deleted: number, network: boolean }`
- Button group layout: Undo and View changes on the left, Close on the right
- Create at route `/components/completion-summary` with mock completion data

## Testing
- Navigate to `/components/completion-summary`
- Verify warm surface background `#f9f3ea` and border `#e4e8ec`
- Verify changes summary counts render correctly
- Verify rollback indicator shows when undo is available, hides when not
- Verify button styles match DESIGN.md (Secondary for Undo/View, Ghost for Close)
- Verify no celebratory animations or decorative effects
