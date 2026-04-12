# [TICKET-004] TEST: Checkpoint 0 — Foundation Scaffold

## Status
`pending`

## Dependencies
- Requires: #003 ✅

## Description
This checkpoint verifies that the BridgeOS foundation is solid before building UI components on top of it. It tests that the project builds, the design token system is complete and accurate, and the corridor layout system works as specified.

This is a gate for Phase 2 (Core UI Components). All Phase 2 tickets depend on this checkpoint passing. If the foundation has issues — wrong colors, broken fonts, misaligned corridors — they must be fixed here before component work begins.

## Acceptance Criteria
- [ ] `npm run dev` starts the Tauri application without errors
- [ ] `npm run build` completes without errors or warnings
- [ ] The Tauri window opens and renders the React frontend
- [ ] All CSS custom properties from DESIGN.md § 2 resolve to correct hex values (spot-check at least 10 tokens)
- [ ] Inter font renders at weights 400, 500, 600 with correct OpenType features
- [ ] JetBrains Mono renders for code content
- [ ] Tabular numbers align vertically in a test column
- [ ] Token showcase page (`/tokens`) displays all colors, typography, and spacing correctly
- [ ] Corridor renders at 480px, 560px, and 640px max-widths
- [ ] Corridor is anchored to screen edge with 16px margin
- [ ] Warm panel (`#f9f3ea`), cool panel (`#edf1f4`), and deep panel (`#dfe4e8`) surfaces render with correct colors
- [ ] Panel borders are 1px solid `#cdd3da` — no box-shadows
- [ ] Noise texture overlay is present on panel surfaces (inspect `::after` pseudo-element)
- [ ] Page background is `#f7f5f2` (warm neutral, not pure white)

## Implementation Notes
This is a manual test execution ticket — no code changes unless bugs are found during testing.

Common failure modes:
- Font loading failures (check network tab for 404s on font files)
- CSS variable scoping issues (variables defined in wrong scope)
- Tailwind purging token-related classes
- Noise texture SVG not rendering (check `::after` z-index and pointer-events)
- Corridor positioning issues with `position: fixed` on different screen sizes

## Testing
Run `npm run dev`. Walk through each acceptance criterion visually and with browser dev tools. Use the Elements panel to inspect computed styles for color values, font properties, and layout measurements. Test at multiple window sizes to verify responsive behavior. Record any failures and fix before proceeding to Phase 2.
