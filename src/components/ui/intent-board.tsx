import { cva, type VariantProps } from "class-variance-authority"
import { AnimatePresence, motion } from "framer-motion"

import { Panel } from "@/components/ui/panel"
import { cn } from "@/lib/utils"
import type { ExecutionState } from "@/state"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UnresolvedQuestion {
  id: string
  text: string
}

interface IntentData {
  goal?: string
  scope?: string
  constraints?: string
  exclusions?: string
  unresolvedQuestions?: UnresolvedQuestion[]
  executionStatus: ExecutionState
  executionLabel?: string
  executionClassName?: string
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

interface ExecutionStatusConfig {
  label: string
  className: string
}

const EXECUTION_STATUS_CONFIG: Record<ExecutionState, ExecutionStatusConfig> = {
  not_started: { label: "Not started", className: "type-body text-subtle" },
  drafting_plan: { label: "Planning\u2026", className: "type-body text-body-text" },
  waiting_confirmation: {
    label: "Needs approval",
    className: "type-body text-brand",
  },
  executing: { label: "Running\u2026", className: "type-body text-body-text" },
  paused: { label: "Paused", className: "type-body text-subtle" },
  completed: { label: "Complete", className: "type-body text-teal" },
  failed: { label: "Failed", className: "type-body text-error" },
}

// ---------------------------------------------------------------------------
// CVA Variants
// ---------------------------------------------------------------------------

const intentBoardVariants = cva("flex flex-col", {
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
// IntentField (internal sub-component)
// ---------------------------------------------------------------------------

interface IntentFieldProps {
  label: string
  visible: boolean
  children: React.ReactNode
  className?: string
}

function IntentField({ label, visible, children, className }: IntentFieldProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={className}
        >
          <p className="type-label text-subtle mb-1">{label}</p>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ---------------------------------------------------------------------------
// IntentBoard
// ---------------------------------------------------------------------------

interface IntentBoardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children">,
    VariantProps<typeof intentBoardVariants> {
  data: IntentData
}

function IntentBoard({
  data,
  density,
  className,
  ...props
}: IntentBoardProps) {
  const statusConfig = EXECUTION_STATUS_CONFIG[data.executionStatus]
  const executionLabel = data.executionLabel ?? statusConfig.label
  const executionClassName = data.executionClassName ?? statusConfig.className
  const hasQuestions =
    data.unresolvedQuestions !== undefined &&
    data.unresolvedQuestions.length > 0

  return (
    <Panel surface="cool" padding="spacious" className={className} {...props}>
      <div className={cn(intentBoardVariants({ density }))}>
        {/* GOAL */}
        <IntentField label="GOAL" visible={data.goal !== undefined}>
          <p className="type-h1 text-ink">{data.goal}</p>
        </IntentField>

        {/* SCOPE */}
        <IntentField label="SCOPE" visible={data.scope !== undefined}>
          <p className="type-body text-body-text">{data.scope}</p>
        </IntentField>

        {/* CONSTRAINTS */}
        <IntentField label="CONSTRAINTS" visible={data.constraints !== undefined}>
          <p className="type-body text-body-text">{data.constraints}</p>
        </IntentField>

        {/* EXCLUSIONS */}
        <IntentField label="EXCLUSIONS" visible={data.exclusions !== undefined}>
          <p className="type-body text-body-text">{data.exclusions}</p>
        </IntentField>

        {/* UNRESOLVED QUESTIONS */}
        <AnimatePresence>
          {hasQuestions && (
            <motion.div
              key="unresolved"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="border-l-2 border-brand pl-3"
            >
              <p className="type-label text-brand mb-1">UNRESOLVED</p>
              <div className="flex flex-col gap-2">
                <AnimatePresence>
                  {data.unresolvedQuestions!.map((q) => (
                    <motion.p
                      key={q.id}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="type-body text-body-text"
                    >
                      {q.text}
                    </motion.p>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* EXECUTION STATUS — always visible */}
        <IntentField label="EXECUTION" visible>
          <p className={executionClassName}>{executionLabel}</p>
        </IntentField>
      </div>
    </Panel>
  )
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { IntentBoard, intentBoardVariants, EXECUTION_STATUS_CONFIG }
export type {
  IntentData,
  ExecutionState,
  UnresolvedQuestion,
  IntentBoardProps,
}
