import { motion } from "framer-motion"
import { cva, type VariantProps } from "class-variance-authority"
import { Mic, MicOff } from "lucide-react"

import { cn } from "@/lib/utils"

/* ---------------------------------------------------------------------------
   Turn-state types & configuration
   --------------------------------------------------------------------------- */

type TurnState =
  | "idle"
  | "listening"
  | "user_holding_turn"
  | "ai_speaking"
  | "awaiting_clarification"
  | "barge_in_detected"
  | "muted"

interface TurnStateConfig {
  barOpacity: number
  barAnimating: boolean
  label: string
  indicatorColor: string
}

const TURN_STATE_CONFIG: Record<TurnState, TurnStateConfig> = {
  idle:                    { barOpacity: 0.4, barAnimating: false, label: "Idle",                    indicatorColor: "var(--color-brand)" },
  listening:               { barOpacity: 1.0, barAnimating: true,  label: "Listening\u2026",         indicatorColor: "var(--color-brand)" },
  user_holding_turn:       { barOpacity: 1.0, barAnimating: true,  label: "User speaking\u2026",     indicatorColor: "var(--color-brand)" },
  ai_speaking:             { barOpacity: 1.0, barAnimating: false, label: "AI speaking\u2026",       indicatorColor: "var(--color-brand)" },
  awaiting_clarification:  { barOpacity: 0.6, barAnimating: true,  label: "Awaiting clarification",  indicatorColor: "var(--color-brand)" },
  barge_in_detected:       { barOpacity: 1.0, barAnimating: false, label: "Barge-in detected",       indicatorColor: "var(--color-brand)" },
  muted:                   { barOpacity: 0.4, barAnimating: false, label: "Muted",                   indicatorColor: "var(--color-subtle)" },
}

/* ---------------------------------------------------------------------------
   CVA variants
   --------------------------------------------------------------------------- */

const voiceBarVariants = cva(
  "panel-noise glow-warm-ambient relative w-full overflow-hidden rounded-md border border-hairline",
  {
    variants: {
      surface: {
        warm: "bg-surface-warm",
      },
    },
    defaultVariants: {
      surface: "warm",
    },
  }
)

/* ---------------------------------------------------------------------------
   Component
   --------------------------------------------------------------------------- */

interface VoiceBarProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children">,
    VariantProps<typeof voiceBarVariants> {
  turnState: TurnState
  amplitude?: number
  transcript?: string
  onMuteToggle?: () => void
}

function VoiceBar({
  turnState,
  amplitude = 0,
  transcript,
  onMuteToggle,
  className,
  surface: _surface,
  ...props
}: VoiceBarProps) {
  const config = TURN_STATE_CONFIG[turnState]

  // Amplitude drives bar width: 60% base + 40% * amplitude
  const barWidth = config.barAnimating
    ? 60 + amplitude * 40
    : turnState === "ai_speaking" || turnState === "barge_in_detected"
      ? 100
      : 60

  return (
    <div
      className={cn(voiceBarVariants({ surface: "warm", className }))}
      style={{ maxWidth: 480 }}
      {...props}
    >
      {/* Voice activity indicator — 2px amber bar, full corridor width */}
      <div className="flex w-full justify-center px-0">
        <motion.div
          className="h-[2px] rounded-full"
          style={{ backgroundColor: config.indicatorColor }}
          animate={{
            width: `${barWidth}%`,
            opacity: config.barOpacity,
          }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        />
      </div>

      {/* Transcript area */}
      <div className="px-5 pt-4 pb-3" style={{ minHeight: 64 }}>
        {transcript ? (
          <p className="type-body-lg text-body-text">{transcript}</p>
        ) : (
          <p className="type-body-lg text-subtle" style={{ opacity: 0.5 }}>
            {turnState === "muted"
              ? "Microphone muted"
              : turnState === "idle"
                ? "Say \u201CComputer\u201D to begin\u2026"
                : "\u00A0"}
          </p>
        )}
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-end border-t border-divider px-4 py-2">
        <button
          type="button"
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-2 text-subtle transition-colors hover:text-body-text"
          onClick={onMuteToggle}
          aria-label={turnState === "muted" ? "Unmute" : "Mute"}
        >
          {turnState === "muted" ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
          <span className="type-caption">
            {turnState === "muted" ? "Unmute" : "Mute"}
          </span>
        </button>
      </div>
    </div>
  )
}

export { VoiceBar, voiceBarVariants, TURN_STATE_CONFIG }
export type { TurnState, VoiceBarProps }
