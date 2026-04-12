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
  idle:             { dotColor: "var(--color-brand)", label: "BridgeOS",          surface: "cool", breathing: true  },
  listening:        { dotColor: "var(--color-brand)", label: "Listening\u2026",   surface: "warm", breathing: false },
  understanding:    { dotColor: "var(--color-brand)", label: "Understanding\u2026", surface: "warm", breathing: false },
  planning:         { dotColor: "var(--color-teal)",  label: "Planning\u2026",    surface: "cool", breathing: false },
  waiting_approval: { dotColor: "var(--color-brand)", label: "Needs approval",    surface: "cool", breathing: false },
  executing:        { dotColor: "var(--color-teal)",  label: "Running\u2026",     surface: "cool", breathing: false },
  paused:           { dotColor: "var(--color-subtle)", label: "Paused",            surface: "cool", breathing: false },
  completed:        { dotColor: "var(--color-teal)",  label: "Complete",          surface: "warm", breathing: false },
  failed:           { dotColor: "var(--color-error)", label: "Failed",            surface: "cool", breathing: false },
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
      style={{ boxShadow: "var(--shadow-capsule)" }}
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
