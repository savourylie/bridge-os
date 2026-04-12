# [TICKET-014] TEST: Checkpoint 2 — Execution UI

## Status
`blocked`

## Dependencies
- Requires: #011, #012, #013

## Description
This checkpoint verifies that the execution and completion UI components are visually correct and integrate coherently within the TaskPanel. Phase 3 components (Timeline, ApprovalCard, CompletionSummary) must work alongside Phase 2 components (IntentBoard, DraftPlan) inside the TaskPanel shell, creating the full execution surface described in the UX spec.

This is a gate for Phase 4 (State Management). State management will wire these components together with real data flow, so the visual composition must be correct first.

## Acceptance Criteria
- [ ] Timeline renders step cards with correct status dots, connectors, and impact summaries
- [ ] Timeline connector turns teal for completed step segments
- [ ] ApprovalCard visually interrupts the timeline flow with deeper surface and amber accent
- [ ] ApprovalCard Approve/Deny buttons have correct styles and focus rings
- [ ] CompletionSummary uses warm surface, contrasting with preceding cool panels
- [ ] CompletionSummary rollback indicator shows/hides correctly
- [ ] Full composition test: TaskPanel containing IntentBoard → DraftPlan → Timeline → ApprovalCard → CompletionSummary renders without layout conflicts
- [ ] Scrolling works within TaskPanel when content exceeds viewport
- [ ] The visual register shift (cool operational → warm completion) is perceptible
- [ ] No component uses hardcoded colors — all reference CSS custom properties
- [ ] All buttons across components follow the three-tier system (Primary/Secondary/Ghost)

## Implementation Notes
This is a manual test execution ticket — no code changes unless bugs are found during testing.

Common failure modes:
- Timeline connector misalignment when cards have variable heights
- ApprovalCard amber left border conflicting with panel border-radius
- Scrolling issues when the full component stack exceeds viewport height
- Warm/cool surface contrast insufficient on certain displays (check contrast ratios)
- Button focus ring not visible against panel backgrounds

## Testing
Create a demo page that composes all execution UI components inside a TaskPanel:
1. TaskHeader + TaskMetaRow at the top
2. IntentBoard showing a mock file organization intent
3. DraftPlan showing 5 mock steps
4. Timeline showing a mix of completed, running, and pending steps
5. ApprovalCard at a mid-point in the timeline
6. CompletionSummary at the bottom

Verify the full stack scrolls correctly, the visual hierarchy is clear, and the register temperature shift from cool to warm is noticeable at the CompletionSummary.
