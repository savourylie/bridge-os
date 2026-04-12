# [TICKET-010] TEST: Checkpoint 1 — Core UI Components

## Status
`done`

## Dependencies
- Requires: #005 ✅, #006 ✅, #007 ✅, #008 ✅, #009 ✅

## Description
This checkpoint verifies that all core UI components from Phase 2 render correctly in isolation and follow the design system established in Phase 1. Each component must match its DESIGN.md specifications for colors, typography, spacing, and behavior.

This is a gate for Phase 3 (Execution & Completion UI). Components built in Phase 3 will be composed alongside these components inside the TaskPanel, so visual consistency and correct token usage must be confirmed now.

## Acceptance Criteria
- [x] StatusCapsule renders as a pill with correct dimensions (120-160px × 40px), shadow, and border
- [x] StatusCapsule state dot animates (breathing) in idle-ready state and changes color across all 9 states
- [x] StatusCapsule background shifts from cool to warm in conversational states
- [x] VoiceBar renders with pulsing amber voice activity bar and mock transcript text
- [x] VoiceBar turn states are visually distinguishable (test all 7 states)
- [x] VoiceBar uses warm surface and ambient glow
- [x] IntentBoard renders structured fields with correct Label + value typography
- [x] IntentBoard unresolved questions section shows amber left border
- [x] IntentBoard "Execution: Not started" is prominently visible
- [x] DraftPlan renders numbered steps with tabular number alignment
- [x] DraftPlan "Execution: Not started" status is prominent
- [x] TaskPanel slides in/out smoothly from the right side
- [x] TaskHeader and TaskMetaRow display correctly within the TaskPanel
- [x] All components use design tokens (CSS variables) — no hardcoded hex values in component code
- [x] All typography matches DESIGN.md specifications (verify with browser dev tools)
- [x] No box-shadows on any component except StatusCapsule

## Implementation Notes
This is a manual test execution ticket — no code changes unless bugs are found during testing.

Common failure modes:
- Components using hardcoded colors instead of CSS variables
- Typography weight or size mismatches (verify with computed styles)
- Animation jank from Framer Motion misconfiguration
- Panel positioning conflicts between fixed corridor and slide-over panel
- Warm/cool surface confusion (wrong background on wrong component)

## Testing
Visit each component demo route (`/components/status-capsule`, `/components/voice-bar`, `/components/intent-board`, `/components/draft-plan`, `/components/task-panel`). For each component, verify visual appearance matches the design spec, inspect computed styles for token usage, and test interactive states. Record any inconsistencies. Fix and re-verify before proceeding to Phase 3.
