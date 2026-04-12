# [TICKET-011] Timeline & Step Cards

## Status
`pending`

## Dependencies
- Requires: #010 ✅

## Description
Build the Timeline — the main action trace view that replaces a traditional chat format with a structured, sequential display of execution steps. Each step card shows its title, description, status, impact summary, and available actions. Steps are connected by a vertical timeline connector that changes color as steps complete. This is the primary surface for execution visibility in BridgeOS.

## Acceptance Criteria
- [ ] Timeline renders within the intent/execution corridor (560px max-width)
- [ ] Each step card uses cool surface `#edf1f4`, `1px solid #cdd3da` border, 8px radius, 16px 20px padding
- [ ] Step cards have a 10px status dot on the left (radius 9999px) with colors: `#7a8494` pending, `#cc7a00` running/waiting_approval, `#2a9d8f` completed, `#c44536` failed
- [ ] Vertical timeline connector (1px `#cdd3da`) links step card dots, turning `#2a9d8f` (teal) for completed segments
- [ ] 12px vertical gap between step cards
- [ ] Step description uses Body typography (Inter 14px weight 400, `#3d4550`)
- [ ] Impact summary shows on the right in Body Small (Inter 13px weight 400, `#7a8494`)
- [ ] All 8 step states are supported: pending, running, waiting_approval, completed, failed, skipped, blocked, reverted
- [ ] Step status transitions animate smoothly (200ms ease on dot background-color)
- [ ] Step cards are read-only during execution (no hover state per DESIGN.md Do's and Don'ts)

## Design Reference
- **Step cards**: DESIGN.md § 4 (Cards & Containers > Step Card)
- **Timeline connector**: DESIGN.md § 4 (Distinctive Components > Timeline Connector)
- **Status dots**: DESIGN.md § 4 (State Indicator Dot) — 8-10px circle, 200ms transition
- **Typography**: DESIGN.md § 3 (Body for descriptions, Body Small for impact summaries)

## Visual Reference
A vertical sequence of cool-surfaced cards, each showing a status dot on the left, a step description in the center, and an impact summary on the right. A thin vertical line connects the dots. Completed steps show teal dots and teal connector segments. The current running step shows an amber dot. Pending steps show muted dots. The visual rhythm is sequential and clean — a structured audit trail, not a chat log.

## Implementation Notes
- Create a `TimelineStep` component for individual step cards
- Create a `Timeline` component that accepts an array of steps and renders them with connectors
- The connector line should be implemented as a pseudo-element or absolute-positioned div between cards
- Connector color transitions: `#cdd3da` (default) → `#2a9d8f` (completed segment)
- Step cards must NOT have hover states — they are informational during execution (DESIGN.md § 7 Don'ts)
- Impact summary is optional per step — hide the area when no impact data exists
- Create at route `/components/timeline` with mock steps in various states

## Testing
- Navigate to `/components/timeline`
- Verify step cards match DESIGN.md styling (surface, border, padding, radius)
- Verify status dots show correct colors for all 8 states
- Verify connector line renders between cards and turns teal for completed segments
- Verify no hover effect on step cards
- Verify 200ms transition on status dot color change
- Verify impact summaries align correctly on the right side
