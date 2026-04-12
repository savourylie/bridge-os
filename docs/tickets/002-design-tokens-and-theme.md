# [TICKET-002] Design Tokens & Theme System

## Status
`pending`

## Dependencies
- Requires: #001 ✅

## Description
Implement the BridgeOS design token system as CSS custom properties and Tailwind configuration, translating the full color palette, typography scale, spacing system, and border radius scale from DESIGN.md into reusable, consistent tokens. This ticket establishes the visual foundation that every UI component will reference.

## Acceptance Criteria
- [ ] All color tokens from DESIGN.md are defined as CSS custom properties (e.g., `--color-brand: #cc7a00`, `--bg-page: #f7f5f2`, etc.)
- [ ] Tailwind config extends the theme to reference these CSS variables for colors, spacing, and typography
- [ ] Inter font (weights 400, 500, 600) and JetBrains Mono (weight 400) are loaded and available
- [ ] OpenType features `cv01`, `cv02`, `ss01`, `tnum` are enabled globally for Inter
- [ ] The full typography scale (Display Hero through Caption) is defined as reusable utility classes or components
- [ ] The 8px spacing scale (2, 4, 8, 12, 16, 20, 24, 32, 48, 64) is configured in Tailwind
- [ ] Border radius scale (4px, 8px, 24px, 9999px) is configured in Tailwind
- [ ] A token showcase page at `/tokens` displays all colors, type styles, and spacing values for visual verification

## Design Reference
- **Tokens**: DESIGN.md § 2 (Color Palette & Roles) — all primary, surface, neutral, interactive, semantic, and film-specific tokens
- **Typography**: DESIGN.md § 3 (Typography Rules) — full hierarchy table, font families, OpenType features
- **Spacing**: DESIGN.md § 5 (Layout Principles > Spacing System)
- **Radius**: DESIGN.md § 5 (Layout Principles > Border Radius Scale)

## Visual Reference
Navigate to `/tokens` — the page displays a grid of color swatches with hex values and CSS variable names, the typography scale with each role rendered at its specified size/weight/spacing, the spacing scale as visual bars, and the radius scale as sample boxes. Background is `#f7f5f2`. All text uses Inter. Code samples use JetBrains Mono.

## Implementation Notes
- Define CSS custom properties in a global stylesheet (e.g., `globals.css` or `tokens.css`)
- Extend Tailwind config to map semantic names to CSS variables: `brand: 'var(--color-brand)'`, etc.
- Load fonts via `@font-face` or a font service — Inter and JetBrains Mono
- Apply OpenType features globally: `font-feature-settings: "cv01", "cv02", "ss01", "tnum"`
- The token showcase page is a development-only route, not a production page

## Testing
- Run `npm run dev` and navigate to `/tokens`
- Verify all color swatches match DESIGN.md hex values
- Verify Inter renders at weights 400, 500, 600
- Verify JetBrains Mono renders for code samples
- Verify tabular numbers align vertically (e.g., "1234" and "5678" in a column)
- Inspect computed styles to confirm CSS variables resolve correctly
