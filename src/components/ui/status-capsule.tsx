import { motion } from "framer-motion"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import type { ConversationState, ExecutionState, TaskState } from "@/state"

/* ---------------------------------------------------------------------------
   State types & configuration
   --------------------------------------------------------------------------- */

interface StateConfig {
  dotColor: string
  label: string
  surface: "cool" | "warm"
  breathing: boolean
}

const CONVERSATION_STATE_CONFIG: Record<ConversationState, StateConfig> = {
  idle: { dotColor: "var(--color-brand)", label: "BridgeOS", surface: "cool", breathing: true },
  listening: { dotColor: "var(--color-brand)", label: "Listening\u2026", surface: "warm", breathing: false },
  holding_for_more: {
    dotColor: "var(--color-brand)",
    label: "Holding for more\u2026",
    surface: "warm",
    breathing: false,
  },
  clarifying: { dotColor: "var(--color-brand)", label: "Clarifying\u2026", surface: "warm", breathing: false },
  intent_locked: {
    dotColor: "var(--color-brand)",
    label: "Intent locked",
    surface: "warm",
    breathing: false,
  },
  speaking: { dotColor: "var(--color-brand)", label: "Speaking\u2026", surface: "warm", breathing: false },
  interrupted: { dotColor: "var(--color-brand)", label: "Interrupted", surface: "warm", breathing: false },
}

const EXECUTION_STATE_CONFIG: Record<ExecutionState, StateConfig> = {
  not_started: { dotColor: "var(--color-brand)", label: "BridgeOS", surface: "cool", breathing: true },
  drafting_plan: { dotColor: "var(--color-teal)", label: "Planning\u2026", surface: "cool", breathing: false },
  waiting_confirmation: {
    dotColor: "var(--color-brand)",
    label: "Needs approval",
    surface: "cool",
    breathing: false,
  },
  executing: { dotColor: "var(--color-teal)", label: "Running\u2026", surface: "cool", breathing: false },
  paused: { dotColor: "var(--color-subtle)", label: "Paused", surface: "cool", breathing: false },
  completed: { dotColor: "var(--color-teal)", label: "Complete", surface: "warm", breathing: false },
  failed: { dotColor: "var(--color-error)", label: "Failed", surface: "cool", breathing: false },
}

const TASK_STATE_CONFIG: Partial<Record<TaskState, StateConfig>> = {
  listening: {
    dotColor: "var(--color-brand)",
    label: "Listening\u2026",
    surface: "warm",
    breathing: false,
  },
  understanding: {
    dotColor: "var(--color-brand)",
    label: "Understanding\u2026",
    surface: "warm",
    breathing: false,
  },
  planning: {
    dotColor: "var(--color-teal)",
    label: "Planning\u2026",
    surface: "cool",
    breathing: false,
  },
  waiting_approval: {
    dotColor: "var(--color-brand)",
    label: "Needs approval",
    surface: "cool",
    breathing: false,
  },
  executing: {
    dotColor: "var(--color-teal)",
    label: "Running\u2026",
    surface: "cool",
    breathing: false,
  },
  paused: {
    dotColor: "var(--color-subtle)",
    label: "Paused",
    surface: "cool",
    breathing: false,
  },
  completed: {
    dotColor: "var(--color-teal)",
    label: "Complete",
    surface: "warm",
    breathing: false,
  },
  cancelled: {
    dotColor: "var(--color-subtle)",
    label: "Cancelled",
    surface: "cool",
    breathing: false,
  },
  reverted: {
    dotColor: "var(--color-error)",
    label: "Reverted",
    surface: "cool",
    breathing: false,
  },
  failed: {
    dotColor: "var(--color-error)",
    label: "Failed",
    surface: "cool",
    breathing: false,
  },
}

function getStatusCapsuleConfig(
  conversationState: ConversationState,
  executionState: ExecutionState = "not_started",
  taskState?: TaskState,
): StateConfig {
  const taskPlanning = taskState === "planning"

  switch (taskState) {
    case "understanding":
    case "planning":
    case "cancelled":
    case "reverted":
      return TASK_STATE_CONFIG[taskState] ?? EXECUTION_STATE_CONFIG.not_started
    default:
      break
  }

  if (
    executionState !== "not_started" &&
    !(executionState === "waiting_confirmation" && taskPlanning)
  ) {
    return EXECUTION_STATE_CONFIG[executionState]
  }

  if (taskState !== undefined && TASK_STATE_CONFIG[taskState] !== undefined) {
    return TASK_STATE_CONFIG[taskState] ?? EXECUTION_STATE_CONFIG.not_started
  }

  return CONVERSATION_STATE_CONFIG[conversationState]
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
  conversationState: ConversationState
  executionState?: ExecutionState
  taskState?: TaskState
  progress?: { current: number; total: number }
}

function StatusCapsule({
  conversationState,
  executionState = "not_started",
  taskState,
  progress,
  className,
  surface: _surface,
  ...props
}: StatusCapsuleProps) {
  const config = getStatusCapsuleConfig(
    conversationState,
    executionState,
    taskState,
  )

  const label =
    executionState === "executing" && progress
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

export {
  CONVERSATION_STATE_CONFIG,
  EXECUTION_STATE_CONFIG,
  StatusCapsule,
  capsuleVariants,
  getStatusCapsuleConfig,
}
export type { StatusCapsuleProps }
