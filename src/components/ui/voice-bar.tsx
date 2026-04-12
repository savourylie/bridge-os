import { motion } from "framer-motion"
import { cva, type VariantProps } from "class-variance-authority"
import { Mic, MicOff } from "lucide-react"

import { cn } from "@/lib/utils"
import type { ConversationState } from "@/state"

/* ---------------------------------------------------------------------------
   Turn-state types & configuration
   --------------------------------------------------------------------------- */

interface VoiceBarStateConfig {
  barOpacity: number
  barAnimating: boolean
  barFullWidth: boolean
  label: string
  indicatorColor: string
  placeholder?: string
}

const VOICE_BAR_STATE_CONFIG: Record<ConversationState, VoiceBarStateConfig> = {
  idle: {
    barOpacity: 0.4,
    barAnimating: false,
    barFullWidth: false,
    label: "Idle",
    indicatorColor: "var(--color-brand)",
    placeholder: "Say \u201CComputer\u201D to begin\u2026",
  },
  listening: {
    barOpacity: 1,
    barAnimating: true,
    barFullWidth: false,
    label: "Listening\u2026",
    indicatorColor: "var(--color-brand)",
  },
  holding_for_more: {
    barOpacity: 1,
    barAnimating: true,
    barFullWidth: false,
    label: "Holding for more\u2026",
    indicatorColor: "var(--color-brand)",
    placeholder: "Continue speaking\u2026",
  },
  clarifying: {
    barOpacity: 0.6,
    barAnimating: true,
    barFullWidth: false,
    label: "Clarifying\u2026",
    indicatorColor: "var(--color-brand)",
    placeholder: "Awaiting clarification",
  },
  intent_locked: {
    barOpacity: 0.6,
    barAnimating: false,
    barFullWidth: false,
    label: "Intent locked",
    indicatorColor: "var(--color-brand)",
    placeholder: "Intent locked",
  },
  speaking: {
    barOpacity: 1,
    barAnimating: false,
    barFullWidth: true,
    label: "AI speaking\u2026",
    indicatorColor: "var(--color-brand)",
  },
  interrupted: {
    barOpacity: 1,
    barAnimating: false,
    barFullWidth: true,
    label: "Interrupted",
    indicatorColor: "var(--color-brand)",
    placeholder: "Interrupted",
  },
}

const MUTED_STATE_CONFIG: VoiceBarStateConfig = {
  barOpacity: 0.4,
  barAnimating: false,
  barFullWidth: false,
  label: "Muted",
  indicatorColor: "var(--color-subtle)",
  placeholder: "Microphone muted",
}

function getVoiceBarStateConfig(
  conversationState: ConversationState,
  muted = false,
): VoiceBarStateConfig {
  if (muted) {
    return MUTED_STATE_CONFIG
  }

  return VOICE_BAR_STATE_CONFIG[conversationState]
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
  conversationState: ConversationState
  muted?: boolean
  amplitude?: number
  transcript?: string
  onMuteToggle?: () => void
}

function VoiceBar({
  conversationState,
  muted = false,
  amplitude = 0,
  transcript,
  onMuteToggle,
  className,
  surface: _surface,
  ...props
}: VoiceBarProps) {
  const config = getVoiceBarStateConfig(conversationState, muted)

  // Amplitude drives bar width: 60% base + 40% * amplitude
  const barWidth = config.barAnimating
    ? 60 + amplitude * 40
    : config.barFullWidth
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
            {config.placeholder ?? "\u00A0"}
          </p>
        )}
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-end border-t border-divider px-4 py-2">
        <button
          type="button"
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-2 text-subtle transition-colors hover:text-body-text"
          onClick={onMuteToggle}
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
          <span className="type-caption">
            {muted ? "Unmute" : "Mute"}
          </span>
        </button>
      </div>
    </div>
  )
}

export {
  MUTED_STATE_CONFIG,
  VOICE_BAR_STATE_CONFIG,
  VoiceBar,
  getVoiceBarStateConfig,
  voiceBarVariants,
}
export type { VoiceBarProps }
