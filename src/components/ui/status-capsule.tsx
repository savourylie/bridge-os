import { motion } from "framer-motion"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/* ---------------------------------------------------------------------------
   State types & configuration
   --------------------------------------------------------------------------- */

type CapsuleState =
  | "idle"
  | "listening"
  | "understanding"
  | "planning"
  | "waiting_approval"
  | "executing"
  | "paused"
  | "completed"
  | "failed"

interface StateConfig {
  dotColor: string
  label: string
  surface: "cool" | "warm"
  breathing: boolean
}

const STATE_CONFIG: Record<CapsuleState, StateConfig> = {
  idle:             { dotColor: "#cc7a00", label: "BridgeOS",          surface: "cool", breathing: true  },
  listening:        { dotColor: "#cc7a00", label: "Listening\u2026",   surface: "warm", breathing: false },
  understanding:    { dotColor: "#cc7a00", label: "Understanding\u2026", surface: "warm", breathing: false },
  planning:         { dotColor: "#2a9d8f", label: "Planning\u2026",    surface: "cool", breathing: false },
  waiting_approval: { dotColor: "#cc7a00", label: "Needs approval",    surface: "cool", breathing: false },
  executing:        { dotColor: "#2a9d8f", label: "Running\u2026",     surface: "cool", breathing: false },
  paused:           { dotColor: "#7a8494", label: "Paused",            surface: "cool", breathing: false },
  completed:        { dotColor: "#2a9d8f", label: "Complete",          surface: "warm", breathing: false },
  failed:           { dotColor: "#c44536", label: "Failed",            surface: "cool", breathing: false },
}

/* ---------------------------------------------------------------------------
   CVA variants
   --------------------------------------------------------------------------- */

const capsuleVariants = cva(
  "inline-flex items-center gap-2 rounded-lg border border-hairline px-3 h-10 min-w-[120px] cursor-pointer select-none",
  {
    variants: {
      surface: {
        cool: "bg-surface",
        warm: "bg-surface-warm",
      },
    },
    defaultVariants: {
      surface: "cool",
    },
  }
)

/* ---------------------------------------------------------------------------
   Component
   --------------------------------------------------------------------------- */

interface StatusCapsuleProps
  extends Omit<React.HTMLAttributes<HTMLButtonElement>, "children">,
    VariantProps<typeof capsuleVariants> {
  state: CapsuleState
  progress?: { current: number; total: number }
}

function StatusCapsule({
  state,
  progress,
  className,
  surface: _surface,
  ...props
}: StatusCapsuleProps) {
  const config = STATE_CONFIG[state]

  const label =
    state === "executing" && progress
      ? `Running ${progress.current} of ${progress.total}`
      : config.label

  return (
    <button
      className={cn(capsuleVariants({ surface: config.surface, className }))}
      style={{ boxShadow: "0 2px 8px rgba(26, 29, 33, 0.08)" }}
      {...props}
    >
      {/* State indicator dot — 8px, breathing animation on idle */}
      <motion.div
        className="h-2 w-2 shrink-0 rounded-full"
        style={{
          backgroundColor: config.dotColor,
          transition: "background-color 200ms ease",
        }}
        animate={
          config.breathing ? { scale: [1, 1.05, 1] } : { scale: 1 }
        }
        transition={
          config.breathing
            ? { duration: 2, ease: "easeInOut", repeat: Infinity }
            : { duration: 0.2 }
        }
      />

      {/* Wordmark / state label — Inter 12px/600 per DESIGN.md */}
      <span
        className="text-body-text"
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "12px",
          fontWeight: 600,
          letterSpacing: "0.02em",
        }}
      >
        {label}
      </span>
    </button>
  )
}

export { StatusCapsule, capsuleVariants, STATE_CONFIG }
export type { CapsuleState, StatusCapsuleProps }
