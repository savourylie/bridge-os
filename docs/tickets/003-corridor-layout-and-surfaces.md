# [TICKET-003] Corridor Layout & Surface System

## Status
`pending`

## Dependencies
- Requires: #002 ✅

## Description
Implement the corridor composition layout system and warm/cool surface treatments that define BridgeOS's visual architecture. The interface uses a narrow vertical corridor (480px → 560px → 640px) that floats over the desktop, with warm surfaces for conversational states and cool surfaces for operational states. This ticket builds the layout primitives that all subsequent UI components nest within.

## Acceptance Criteria
- [ ] A `Corridor` layout component renders at the three defined max-widths (480px, 560px, 640px) controlled by a prop or variant
- [ ] The corridor is positioned fixed relative to the screen edge with 16px margin, not centered in the viewport
- [ ] Warm surface (`#f9f3ea`) and cool surface (`#edf1f4`) panel variants render correctly
- [ ] Deep surface (`#dfe4e8`) variant renders for emphasis panels
- [ ] The noise texture overlay (0.5% opacity SVG pattern) is applied as `::after` on all panel surfaces
- [ ] Panel borders use `1px solid #cdd3da` (hairline) as the primary elevation mechanism
- [ ] The warm ambient glow (radial gradient behind the VoiceBar area) renders subtly
- [ ] The corridor respects the compact (<400px), standard (400-800px), and expanded (>800px) breakpoints

## Design Reference
- **Layout**: DESIGN.md § 5 (Layout Principles) — corridor widths, spacing, grid, whitespace philosophy
- **Surfaces**: DESIGN.md § 2 (Color Palette > Surface & Background)
- **Depth**: DESIGN.md § 6 (Depth & Elevation) — border-and-background elevation, no shadows except StatusCapsule
- **Decorative**: DESIGN.md § 6 (Decorative Depth) — noise texture, warm ambient glow
- **Responsive**: DESIGN.md § 8 (Responsive Behavior) — breakpoints, collapsing strategy

## Visual Reference
A demo page shows three corridor widths side by side (or togglable). Each corridor contains sample panels in warm, cool, and deep surface variants. Panels have crisp 1px borders, no shadows. A faint noise texture is visible on close inspection. The corridors float against the `#f7f5f2` warm canvas background with generous negative space.

## Implementation Notes
- Create a `Corridor` component with `width` prop: `"conversation" | "intent" | "completion"` mapping to 480/560/640px
- Create a `Panel` component with `surface` prop: `"cool" | "warm" | "deep"` mapping to the three surface colors
- Generate the noise texture as an inline SVG data URI or a small repeating pattern file
- The warm ambient glow is a `radial-gradient(rgba(201, 169, 110, 0.04))` positioned behind where the VoiceBar will sit
- Use `position: fixed` for the corridor with a configurable edge anchor
- Corridor horizontal padding: 16px on each side
- Create a `/layout` demo route for visual verification

## Testing
- Run `npm run dev` and navigate to `/layout`
- Verify corridor widths match 480px, 560px, 640px using browser dev tools
- Verify panel backgrounds match the hex values from DESIGN.md
- Verify borders are 1px solid `#cdd3da`
- Verify no box-shadows appear on panels
- Verify noise texture is barely visible at 0.5% opacity
- Resize the window to test compact/standard/expanded breakpoints
