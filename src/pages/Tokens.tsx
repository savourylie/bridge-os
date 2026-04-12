import { Link } from "react-router-dom";

/* =========================================================================
   Token Showcase — development-only route at /tokens
   Displays all BridgeOS design tokens for visual verification.
   ========================================================================= */

interface ColorSwatch {
  name: string;
  cssVar: string;
  hex: string;
}

const PRIMARY_COLORS: ColorSwatch[] = [
  { name: "Amber Signal", cssVar: "--color-brand", hex: "#cc7a00" },
  { name: "Operational Teal", cssVar: "--color-accent", hex: "#2a9d8f" },
];

const SURFACE_COLORS: ColorSwatch[] = [
  { name: "Warm Canvas", cssVar: "--bg-page", hex: "#f7f5f2" },
  { name: "Cool Panel", cssVar: "--bg-surface", hex: "#edf1f4" },
  { name: "Warm Panel", cssVar: "--bg-surface-warm", hex: "#f9f3ea" },
  { name: "Deep Panel", cssVar: "--bg-muted", hex: "#dfe4e8" },
];

const NEUTRAL_COLORS: ColorSwatch[] = [
  { name: "Ink", cssVar: "--text-primary", hex: "#1a1d21" },
  { name: "Body", cssVar: "--text-secondary", hex: "#3d4550" },
  { name: "Muted", cssVar: "--text-tertiary", hex: "#7a8494" },
  { name: "Hairline", cssVar: "--border-default", hex: "#cdd3da" },
  { name: "Divider", cssVar: "--border-subtle", hex: "#e4e8ec" },
];

const INTERACTIVE_COLORS: ColorSwatch[] = [
  { name: "Focus Ring", cssVar: "--focus-ring", hex: "rgba(204,122,0,0.35)" },
  { name: "Hover Warm", cssVar: "--brand-hover", hex: "#b36b00" },
  { name: "Hover Cool", cssVar: "--accent-hover", hex: "#228577" },
  { name: "Link Text", cssVar: "--link-color", hex: "#cc7a00" },
];

const SEMANTIC_COLORS: ColorSwatch[] = [
  { name: "Success", cssVar: "--color-success", hex: "#2a9d8f" },
  { name: "Warning", cssVar: "--color-warning", hex: "#cc7a00" },
  { name: "Error", cssVar: "--color-error", hex: "#c44536" },
  { name: "Info", cssVar: "--color-info", hex: "#4a7fb5" },
];

const FILM_COLORS: ColorSwatch[] = [
  { name: "Warm Glow", cssVar: "--glow-warm", hex: "rgba(201,169,110,0.04)" },
  { name: "Cool Cast", cssVar: "--glow-cool", hex: "rgba(58,79,92,0.05)" },
];

const TYPOGRAPHY_SCALE = [
  { role: "Display Hero", className: "type-display-hero", desc: "32px / 600 / -0.48px", sample: "Organize my Downloads folder" },
  { role: "Heading 1", className: "type-h1", desc: "24px / 600 / -0.36px", sample: "Task Execution" },
  { role: "Heading 2", className: "type-h2", desc: "20px / 600 / -0.30px", sample: "Intent Board" },
  { role: "Heading 3", className: "type-h3", desc: "16px / 600 / -0.16px", sample: "Scope & Constraints" },
  { role: "Body Large", className: "type-body-lg", desc: "16px / 400 / normal", sample: "Move all .pdf files to Documents/PDFs and rename with date prefix." },
  { role: "Body", className: "type-body", desc: "14px / 400 / normal", sample: "Scanning folder for matching files based on extension filters." },
  { role: "Body Small", className: "type-body-sm", desc: "13px / 400 / normal", sample: "3 files moved, 12.4 MB total. No errors encountered." },
  { role: "Label", className: "type-label", desc: "11px / 600 / +0.06em / uppercase", sample: "GOAL" },
  { role: "Caption", className: "type-caption", desc: "11px / 400 / +0.04em", sample: "Not started · 2 min ago" },
  { role: "Code", className: "type-code", desc: "13px / 400 / JetBrains Mono", sample: "mv ~/Downloads/*.pdf ~/Documents/PDFs/" },
  { role: "Button", className: "type-button", desc: "14px / 500 / +0.01em", sample: "Approve" },
];

const SPACING_SCALE = [
  { label: "0.5", px: 2 },
  { label: "1", px: 4 },
  { label: "2", px: 8 },
  { label: "3", px: 12 },
  { label: "4", px: 16 },
  { label: "5", px: 20 },
  { label: "6", px: 24 },
  { label: "8", px: 32 },
  { label: "12", px: 48 },
  { label: "16", px: 64 },
];

const RADIUS_SCALE = [
  { label: "sm", px: 4, desc: "Inputs, badges" },
  { label: "md", px: 8, desc: "Panels, cards, buttons" },
  { label: "lg", px: 24, desc: "Capsule" },
  { label: "full", px: 9999, desc: "Dots, pills" },
];

function SwatchGrid({ title, colors }: { title: string; colors: ColorSwatch[] }) {
  return (
    <div className="mb-8">
      <h2 className="type-h2 text-ink mb-4">{title}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {colors.map((c) => (
          <div key={c.cssVar} className="rounded-md border border-hairline bg-white p-3">
            <div
              className="mb-3 h-16 rounded-sm border border-hairline"
              style={{ backgroundColor: c.hex }}
            />
            <p className="type-body font-medium text-ink">{c.name}</p>
            <p className="type-code text-subtle mt-1">{c.cssVar}</p>
            <p className="type-caption text-subtle mt-0.5">{c.hex}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TokensPage() {
  return (
    <div className="min-h-screen bg-page p-6 md:p-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12">
          <Link to="/" className="type-caption text-link hover:underline">
            &larr; Back
          </Link>
          <h1 className="type-h1 text-ink mt-4">BridgeOS Design Tokens</h1>
          <p className="type-body text-body-text mt-2">
            Visual reference for all colors, typography, spacing, and radius values.
            Source: <span className="type-code">docs/design/DESIGN.md</span>
          </p>
        </div>

        {/* Color Palette */}
        <section className="mb-16">
          <h2 className="type-h1 text-ink mb-6 border-b border-hairline pb-3">
            Color Palette
          </h2>
          <SwatchGrid title="Primary" colors={PRIMARY_COLORS} />
          <SwatchGrid title="Surface & Background" colors={SURFACE_COLORS} />
          <SwatchGrid title="Neutrals & Text" colors={NEUTRAL_COLORS} />
          <SwatchGrid title="Interactive" colors={INTERACTIVE_COLORS} />
          <SwatchGrid title="Semantic" colors={SEMANTIC_COLORS} />
          <SwatchGrid title="Film-Specific" colors={FILM_COLORS} />
        </section>

        {/* Typography Scale */}
        <section className="mb-16">
          <h2 className="type-h1 text-ink mb-6 border-b border-hairline pb-3">
            Typography Scale
          </h2>
          <div className="space-y-6">
            {TYPOGRAPHY_SCALE.map((t) => (
              <div
                key={t.role}
                className="rounded-md border border-hairline bg-surface p-5"
              >
                <div className="mb-3 flex items-baseline justify-between gap-4">
                  <span className="type-label text-subtle">{t.role}</span>
                  <span className="type-caption text-subtle">{t.desc}</span>
                </div>
                <p className={`${t.className} text-ink`}>{t.sample}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tabular Numbers Check */}
        <section className="mb-16">
          <h2 className="type-h1 text-ink mb-6 border-b border-hairline pb-3">
            Tabular Numbers
          </h2>
          <p className="type-body text-body-text mb-4">
            OpenType feature <span className="type-code">tnum</span> ensures digits
            align vertically. Each column below should be perfectly aligned.
          </p>
          <div className="rounded-md border border-hairline bg-surface p-5">
            <div className="flex gap-12">
              <div className="type-body text-ink space-y-1 text-right">
                <p>1,234</p>
                <p>56,789</p>
                <p>100</p>
                <p>99,999</p>
              </div>
              <div className="type-body text-ink space-y-1 text-right">
                <p>00:01:23</p>
                <p>12:34:56</p>
                <p>00:00:01</p>
                <p>99:59:59</p>
              </div>
            </div>
          </div>
        </section>

        {/* Spacing Scale */}
        <section className="mb-16">
          <h2 className="type-h1 text-ink mb-6 border-b border-hairline pb-3">
            Spacing Scale
          </h2>
          <p className="type-body text-body-text mb-4">
            Base unit: 8px. Tailwind utilities map to design values (e.g.,{" "}
            <span className="type-code">p-2</span> = 8px,{" "}
            <span className="type-code">p-6</span> = 24px).
          </p>
          <div className="space-y-3">
            {SPACING_SCALE.map((s) => (
              <div key={s.label} className="flex items-center gap-4">
                <span className="type-code w-12 text-right text-subtle">
                  {s.label}
                </span>
                <div
                  className="h-5 rounded-sm bg-brand"
                  style={{ width: `${s.px * 3}px` }}
                />
                <span className="type-caption text-subtle">{s.px}px</span>
              </div>
            ))}
          </div>
        </section>

        {/* Border Radius Scale */}
        <section className="mb-16">
          <h2 className="type-h1 text-ink mb-6 border-b border-hairline pb-3">
            Border Radius Scale
          </h2>
          <div className="flex flex-wrap items-end gap-6">
            {RADIUS_SCALE.map((r) => (
              <div key={r.label} className="flex flex-col items-center gap-2">
                <div
                  className="flex h-20 w-20 items-center justify-center border-2 border-hairline bg-surface"
                  style={{
                    borderRadius: r.px === 9999 ? "9999px" : `${r.px}px`,
                  }}
                >
                  <span className="type-caption text-subtle">{r.px}px</span>
                </div>
                <span className="type-label text-subtle">{r.label}</span>
                <span className="type-caption text-subtle">{r.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Font Feature Verification */}
        <section className="mb-16">
          <h2 className="type-h1 text-ink mb-6 border-b border-hairline pb-3">
            Font Verification
          </h2>
          <div className="space-y-4">
            <div className="rounded-md border border-hairline bg-surface p-5">
              <span className="type-label text-subtle">Inter — Weight 400</span>
              <p className="mt-2 text-base font-normal text-ink">
                The quick brown fox jumps over the lazy dog. 0123456789
              </p>
            </div>
            <div className="rounded-md border border-hairline bg-surface p-5">
              <span className="type-label text-subtle">Inter — Weight 500</span>
              <p className="mt-2 text-base font-medium text-ink">
                The quick brown fox jumps over the lazy dog. 0123456789
              </p>
            </div>
            <div className="rounded-md border border-hairline bg-surface p-5">
              <span className="type-label text-subtle">Inter — Weight 600</span>
              <p className="mt-2 text-base font-semibold text-ink">
                The quick brown fox jumps over the lazy dog. 0123456789
              </p>
            </div>
            <div className="rounded-md border border-hairline bg-surface-warm p-5">
              <span className="type-label text-subtle">
                JetBrains Mono — Weight 400
              </span>
              <p className="mt-2 font-mono text-sm text-ink">
                sudo apt install ffmpeg ~/Downloads/*.pdf /usr/local/bin
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-hairline pt-6">
          <p className="type-caption text-subtle">
            Development-only token showcase — TICKET-002
          </p>
        </footer>
      </div>
    </div>
  );
}
