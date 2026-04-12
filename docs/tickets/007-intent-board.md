# [TICKET-007] IntentBoard Component

## Status
`blocked`

## Dependencies
- Requires: #004

## Description
Build the IntentBoard — one of BridgeOS's most important differentiators. This structured, pre-execution panel mirrors what the system currently believes the user wants, making intent legible before any action begins. It displays the goal, scope, constraints, exclusions, unresolved questions, and execution status in a clear, labeled format that updates incrementally during conversation.

## Acceptance Criteria
- [ ] IntentBoard renders within the intent corridor (560px max-width) with cool surface `#edf1f4`
- [ ] Panel has 24px padding, 8px border-radius, `1px solid #cdd3da` border
- [ ] GOAL field renders with Label style (Inter 11px weight 600, uppercase, `#7a8494`, letter-spacing 0.06em) and value in Heading 1 style (Inter 24px weight 600, `#1a1d21`)
- [ ] SCOPE, CONSTRAINTS, and EXCLUSIONS fields render with Label + Body typography (14px/400/`#3d4550`)
- [ ] Unresolved questions section shows with amber `#cc7a00` left border (2px) when ambiguity exists
- [ ] EXECUTION STATUS field prominently displays "Not started" in muted text when no execution has begun
- [ ] 16px vertical spacing between label-value pairs
- [ ] Supports incremental updates — fields can transition from empty to populated with a subtle animation
- [ ] Fields can be individually hidden when not applicable

## Design Reference
- **Panel**: DESIGN.md § 4 (Cards & Containers > IntentBoard Panel)
- **Labels**: DESIGN.md § 3 (Typography > Label — 11px/600/uppercase/0.06em)
- **Goal text**: DESIGN.md § 3 (Typography > Heading 1 — 24px/600/1.20/-0.36px)
- **Body text**: DESIGN.md § 3 (Typography > Body — 14px/400/1.55)
- **Amber accent**: DESIGN.md § 2 (Amber Signal `#cc7a00`) for unresolved questions

## Visual Reference
A cool-surfaced panel shows structured data fields. At the top, "GOAL" in small uppercase muted text, followed by "Organize my Downloads folder by file type" in a large, authoritative heading. Below: "SCOPE" with "~/Downloads — screenshots from this week", "CONSTRAINTS" with "Do not touch PDFs or zip files." An amber-bordered section reads "UNCLEAR: Which folder should contain the grouped screenshots?" At the bottom, "EXECUTION" shows "Not started" in muted caption text.

## Implementation Notes
- Create a composable `IntentField` sub-component for label-value pairs
- Use Framer Motion `AnimatePresence` for fields appearing/updating
- The unresolved questions section is conditionally rendered with a 2px left border in `#cc7a00`
- The "Not started" execution status must be prominent — this is a critical trust signal per PRD § 8.5
- Create at route `/components/intent-board` with mock data showing various states (empty, partial, full, with ambiguity)

## Testing
- Navigate to `/components/intent-board`
- Verify panel dimensions, surface color, border, and padding match DESIGN.md
- Verify GOAL renders in Heading 1 typography
- Verify labels render in uppercase Label typography
- Verify unresolved questions section shows amber left border
- Verify "Not started" execution status is visible
- Test incremental field population — fields animate in smoothly
