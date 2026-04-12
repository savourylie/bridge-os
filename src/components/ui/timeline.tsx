import { cva, type VariantProps } from "class-variance-authority"
import { AnimatePresence, motion } from "framer-motion"

import { Panel } from "@/components/ui/panel"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StepStatus =
  | "pending"
  | "running"
  | "waiting_approval"
  | "completed"
  | "failed"
  | "skipped"
  | "blocked"
  | "reverted"

interface TimelineStepData {
  id: string
  description: string
  impact?: string
  status: StepStatus
}

interface TimelineData {
  steps: TimelineStepData[]
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

interface StepStatusConfig {
  label: string
  dotColor: string
  className: string
}

const STEP_STATUS_CONFIG: Record<StepStatus, StepStatusConfig> = {
  pending: {
    label: "Pending",
    dotColor: "var(--color-subtle)",
    className: "type-caption text-subtle",
  },
  running: {
    label: "Running",
    dotColor: "var(--color-brand)",
    className: "type-caption text-brand",
  },
  waiting_approval: {
    label: "Waiting for approval",
    dotColor: "var(--color-brand)",
    className: "type-caption text-brand",
  },
  completed: {
    label: "Completed",
    dotColor: "var(--color-teal)",
    className: "type-caption text-teal",
  },
  failed: {
    label: "Failed",
    dotColor: "var(--color-error)",
    className: "type-caption text-error",
  },
  skipped: {
    label: "Skipped",
    dotColor: "var(--color-subtle)",
    className: "type-caption text-subtle",
  },
  blocked: {
    label: "Blocked",
    dotColor: "var(--color-subtle)",
    className: "type-caption text-subtle",
  },
  reverted: {
    label: "Reverted",
    dotColor: "var(--color-error)",
    className: "type-caption text-error",
  },
}

// ---------------------------------------------------------------------------
// CVA Variants
// ---------------------------------------------------------------------------

const timelineVariants = cva("flex flex-col", {
  variants: {
    density: {
      default: "",
    },
  },
  defaultVariants: {
    density: "default",
  },
})

// ---------------------------------------------------------------------------
// TimelineStep (internal sub-component)
// ---------------------------------------------------------------------------

interface TimelineStepProps {
  step: TimelineStepData
  index: number
  isLast: boolean
}

function TimelineStep({ step, index, isLast }: TimelineStepProps) {
  const config = STEP_STATUS_CONFIG[step.status]
  const connectorColor =
    step.status === "completed"
      ? "var(--color-teal)"
      : "var(--color-hairline)"

  return (
    <motion.div
      key={step.id}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.3,
        ease: "easeOut",
        delay: index * 0.08,
      }}
      className={cn("flex gap-3", !isLast && "pb-3")}
    >
      {/* Gutter: dot + connector line */}
      <div className="flex flex-col items-center" style={{ width: 10 }}>
        <div
          className="h-[10px] w-[10px] shrink-0 rounded-full"
          style={{
            backgroundColor: config.dotColor,
            transition: "background-color 200ms ease",
          }}
        />
        {!isLast && (
          <div
            className="w-px flex-1"
            style={{
              backgroundColor: connectorColor,
              transition: "background-color 200ms ease",
              minHeight: 12,
            }}
          />
        )}
      </div>

      {/* Card */}
      <div className="flex-1 rounded-md border border-hairline bg-surface py-4 px-5">
        <div className="flex items-start justify-between gap-4">
          <span className="type-body text-body-text">{step.description}</span>
          {step.impact && (
            <span className="type-body-sm text-subtle shrink-0">
              {step.impact}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

interface TimelineProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children">,
    VariantProps<typeof timelineVariants> {
  data: TimelineData
}

function Timeline({ data, density, className, ...props }: TimelineProps) {
  return (
    <Panel surface="cool" padding="spacious" className={className} {...props}>
      <div className={cn(timelineVariants({ density }))}>
        <AnimatePresence>
          {data.steps.map((step, i) => (
            <TimelineStep
              key={step.id}
              step={step}
              index={i}
              isLast={i === data.steps.length - 1}
            />
          ))}
        </AnimatePresence>
      </div>
    </Panel>
  )
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { Timeline, timelineVariants, STEP_STATUS_CONFIG }
export type { TimelineData, TimelineStepData, StepStatus, TimelineProps }
