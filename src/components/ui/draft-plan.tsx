import { cva, type VariantProps } from "class-variance-authority"
import { AnimatePresence, motion } from "framer-motion"

import { Panel } from "@/components/ui/panel"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PlanState = "drafting" | "ready" | "approved" | "cancelled"

interface PlanStep {
  id: string
  description: string
}

interface DraftPlanData {
  title?: string
  steps: PlanStep[]
  planState: PlanState
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

interface PlanStateConfig {
  label: string
  dotColor: string
  className: string
}

const PLAN_STATE_CONFIG: Record<PlanState, PlanStateConfig> = {
  drafting: {
    label: "Drafting\u2026",
    dotColor: "var(--color-subtle)",
    className: "type-caption text-subtle",
  },
  ready: {
    label: "Not started",
    dotColor: "var(--color-subtle)",
    className: "type-caption text-subtle",
  },
  approved: {
    label: "Approved",
    dotColor: "var(--color-teal)",
    className: "type-caption text-teal",
  },
  cancelled: {
    label: "Cancelled",
    dotColor: "var(--color-error)",
    className: "type-caption text-error",
  },
}

// ---------------------------------------------------------------------------
// CVA Variants
// ---------------------------------------------------------------------------

const draftPlanVariants = cva("flex flex-col", {
  variants: {
    density: {
      default: "gap-4",
    },
  },
  defaultVariants: {
    density: "default",
  },
})

// ---------------------------------------------------------------------------
// PlanStepItem (internal sub-component)
// ---------------------------------------------------------------------------

interface PlanStepItemProps {
  step: PlanStep
  index: number
}

function PlanStepItem({ step, index }: PlanStepItemProps) {
  return (
    <motion.li
      key={step.id}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.3,
        ease: "easeOut",
        delay: index * 0.08,
      }}
      className="flex gap-3"
    >
      <span
        className="type-body text-subtle shrink-0"
        style={{ fontVariantNumeric: "tabular-nums", minWidth: "2ch" }}
      >
        {index + 1}.
      </span>
      <span className="type-body text-body-text">{step.description}</span>
    </motion.li>
  )
}

// ---------------------------------------------------------------------------
// DraftPlan
// ---------------------------------------------------------------------------

interface DraftPlanProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children">,
    VariantProps<typeof draftPlanVariants> {
  data: DraftPlanData
}

function DraftPlan({ data, density, className, ...props }: DraftPlanProps) {
  const stateConfig = PLAN_STATE_CONFIG[data.planState]

  return (
    <Panel surface="cool" padding="spacious" className={className} {...props}>
      {/* Gradient strip — 2px understanding→action boundary (DESIGN.md § 6) */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-md"
        style={{
          background: "linear-gradient(to right, var(--color-surface-warm), var(--color-surface))",
        }}
      />

      <div className={cn(draftPlanVariants({ density }))}>
        {/* Header */}
        <AnimatePresence>
          {data.title !== undefined && (
            <motion.div
              key="title"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <h2 className="type-h2 text-ink">{data.title}</h2>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Numbered step list */}
        {data.steps.length > 0 && (
          <ol className="m-0 flex list-none flex-col gap-2 p-0">
            <AnimatePresence>
              {data.steps.map((step, i) => (
                <PlanStepItem key={step.id} step={step} index={i} />
              ))}
            </AnimatePresence>
          </ol>
        )}

        {/* Execution status — always visible */}
        <div className="flex items-center gap-2 border-t border-divider pt-2">
          <div
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: stateConfig.dotColor }}
          />
          <span className="type-label text-subtle mr-1">EXECUTION</span>
          <span className={stateConfig.className}>{stateConfig.label}</span>
        </div>
      </div>
    </Panel>
  )
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { DraftPlan, draftPlanVariants, PLAN_STATE_CONFIG }
export type { DraftPlanData, PlanState, PlanStep, DraftPlanProps }
