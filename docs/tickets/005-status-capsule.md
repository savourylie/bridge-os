# [TICKET-005] StatusCapsule Component

## Status
`done`

## Dependencies
- Requires: #004 ✅

## Description
Build the StatusCapsule — a small, persistent desktop pill that indicates the current BridgeOS system state. This is the always-visible anchor point for the interface. It floats above the desktop as a compact capsule showing a state indicator dot and the system wordmark, and serves as the entry point into the full TaskPanel.

## Acceptance Criteria
- [x] StatusCapsule renders as a pill shape (24px border-radius) at 120-160px width and 40px height
- [x] Contains an 8px state indicator dot (radius 9999px) and "BridgeOS" wordmark (Inter 12px weight 600)
- [x] State dot color changes based on system state: amber `#cc7a00` (idle-ready), teal `#2a9d8f` (background-active), muted `#7a8494` (dormant)
- [x] State dot has a breathing animation (scale 1.0 → 1.05 → 1.0 on a 2s ease-in-out loop) when idle-ready
- [x] StatusCapsule has a subtle box-shadow (`0 2px 8px rgba(26, 29, 33, 0.08)`) — the only shadowed element in the system
- [x] Background shifts from cool `#edf1f4` (idle) to warm `#f9f3ea` (conversational)
- [x] Border is `1px solid #cdd3da`
- [x] Fixed position on the desktop with 16px margin from screen edge
- [x] Capsule is clickable (click target covers full capsule area, minimum 40px height)
- [x] Supports all 9 states from UX spec: idle, listening, understanding, planning, waiting_approval, executing, paused, completed, failed

## Design Reference
- **Component**: DESIGN.md § 4 (Component Stylings > Navigation > StatusCapsule)
- **State dots**: DESIGN.md § 4 (State Indicator Dot)
- **Depth**: DESIGN.md § 6 (Capsule Level 3) — only element with box-shadow
- **Animation**: Breathing dot animation per DESIGN.md § 4

## Visual Reference
A small pill floats in the top-right of the desktop against the `#f7f5f2` canvas. It shows a small amber dot gently pulsing and the word "BridgeOS" in a compact, serious font. The capsule casts the faintest shadow. Hovering reveals no dramatic change — the element is informational, not a loud CTA. A demo page shows the capsule cycling through all 9 states.

## Implementation Notes
- Use Framer Motion for the breathing dot animation (`animate={{ scale: [1, 1.05, 1] }}` with `repeat: Infinity`)
- The StatusCapsule is the ONLY element allowed to use `box-shadow` per the design system
- Implement as a controlled component that accepts a `state` prop
- State-to-display mapping should cover label text (e.g., "Ready", "Listening...", "Running 2 of 5 steps")
- Content text shown alongside wordmark varies by state (see UX_DESIGN.md § 1 StatusCapsule > Typical content)
- Create at route `/components/status-capsule` for isolated development

## Testing
- Navigate to `/components/status-capsule`
- Verify pill shape, dimensions, shadow, and border match DESIGN.md specs
- Cycle through all 9 states and verify dot color changes and label text updates
- Verify breathing animation runs smoothly at idle-ready state
- Verify background shifts from cool to warm surface when entering conversational states
- Check that the capsule click area covers the full pill (not just the text)
