# [TICKET-008] DraftPlan Component

## Status
`blocked`

## Dependencies
- Requires: #004

## Description
Build the DraftPlan — a lightweight plan preview that appears before any meaningful execution starts. This component shows users that the system has understood enough to prepare an approach but has not yet taken action. The prominent "Execution: Not started" indicator is a critical trust mechanism that prevents users from worrying about premature execution.

## Acceptance Criteria
- [ ] DraftPlan renders within the intent corridor (560px max-width) with cool surface `#edf1f4`
- [ ] Panel has 24px padding, 8px border-radius, `1px solid #cdd3da` border
- [ ] Displays a numbered step list (1, 2, 3...) with each step as a brief description
- [ ] Step numbers use tabular numbers (`tnum`) for vertical alignment
- [ ] Step descriptions use Body typography (Inter 14px weight 400, `#3d4550`)
- [ ] "Execution: Not started" status is prominently displayed at the bottom in a distinct visual treatment
- [ ] Supports plan states: drafting, ready, approved, cancelled
- [ ] Steps can be added incrementally (animation for new steps appearing)
- [ ] Header uses Heading 2 style (Inter 20px weight 600)

## Design Reference
- **Panel**: DESIGN.md § 4 (Cards & Containers > IntentBoard Panel) — same panel style
- **Typography**: DESIGN.md § 3 (Heading 2 for header, Body for steps, Caption for status)
- **Numbers**: DESIGN.md § 3 (Principles > Tabular numbers always)

## Visual Reference
A cool-surfaced panel titled "Draft plan" shows a numbered list: "1. Scan ~/Downloads", "2. Find screenshots modified in the last 7 days", "3. Create a weekly folder", "4. Move matching files", "5. Show results." Below the list, prominently: "Execution: Not started" in muted text with a pending state dot. The numbers align cleanly in a column thanks to tabular figures.

## Implementation Notes
- Create a `PlanStep` sub-component for individual plan steps
- Step numbers should be styled with `font-variant-numeric: tabular-nums` to ensure alignment
- The "Execution: Not started" indicator should use a state dot (8px, `#7a8494`) + Caption text
- Use Framer Motion for step appearance animations (staggered fade-in)
- DraftPlan sits below IntentBoard in the corridor — a 2px gradient strip at the boundary marks the understanding→action transition (per DESIGN.md § 6 Decorative Depth)
- Create at route `/components/draft-plan` with mock plan data

## Testing
- Navigate to `/components/draft-plan`
- Verify panel styling matches DESIGN.md specs
- Verify numbered steps align vertically (tabular numbers)
- Verify "Execution: Not started" is prominent and uses correct typography
- Verify state dot renders next to execution status
- Test incremental step addition — steps animate in with stagger
