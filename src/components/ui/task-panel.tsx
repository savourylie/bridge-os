import { useEffect, useLayoutEffect, useRef } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"

import { Panel } from "@/components/ui/panel"
import { cn } from "@/lib/utils"
import type { TaskState } from "@/state"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RiskLevel = "low" | "medium" | "high"

interface TaskHeaderData {
  title: string
  summary: string
}

interface TaskMetaData {
  status: TaskState
  risk: RiskLevel
  scope: string
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

interface TaskStatusConfig {
  label: string
  dotColor: string
  className: string
}

const TASK_STATUS_CONFIG: Record<TaskState, TaskStatusConfig> = {
  idle: {
    label: "Not started",
    dotColor: "var(--color-subtle)",
    className: "type-body-sm text-subtle",
  },
  listening: {
    label: "Listening\u2026",
    dotColor: "var(--color-brand)",
    className: "type-body-sm text-brand",
  },
  understanding: {
    label: "Understanding\u2026",
    dotColor: "var(--color-brand)",
    className: "type-body-sm text-brand",
  },
  planning: {
    label: "Planning\u2026",
    dotColor: "var(--color-brand)",
    className: "type-body-sm text-brand",
  },
  waiting_approval: {
    label: "Needs approval",
    dotColor: "var(--color-brand)",
    className: "type-body-sm text-brand",
  },
  executing: {
    label: "In progress",
    dotColor: "var(--color-teal)",
    className: "type-body-sm text-teal",
  },
  paused: {
    label: "Paused",
    dotColor: "var(--color-subtle)",
    className: "type-body-sm text-subtle",
  },
  completed: {
    label: "Completed",
    dotColor: "var(--color-teal)",
    className: "type-body-sm text-teal",
  },
  cancelled: {
    label: "Cancelled",
    dotColor: "var(--color-subtle)",
    className: "type-body-sm text-subtle",
  },
  reverted: {
    label: "Reverted",
    dotColor: "var(--color-error)",
    className: "type-body-sm text-error",
  },
  failed: {
    label: "Failed",
    dotColor: "var(--color-error)",
    className: "type-body-sm text-error",
  },
}

interface RiskLevelConfig {
  label: string
  className: string
}

const RISK_LEVEL_CONFIG: Record<RiskLevel, RiskLevelConfig> = {
  low: { label: "Low", className: "type-body-sm text-teal" },
  medium: { label: "Medium", className: "type-body-sm text-brand" },
  high: { label: "High", className: "type-body-sm text-error" },
}

// ---------------------------------------------------------------------------
// CVA Variants
// ---------------------------------------------------------------------------

const taskPanelVariants = cva(
  "fixed top-0 right-0 bottom-0 z-40 flex flex-col",
  {
    variants: {
      width: {
        intent: "w-[560px] max-w-full",
      },
    },
    defaultVariants: {
      width: "intent",
    },
  }
)

// ---------------------------------------------------------------------------
// TaskHeader (internal sub-component)
// ---------------------------------------------------------------------------

interface TaskHeaderProps {
  data: TaskHeaderData
}

function TaskHeader({ data }: TaskHeaderProps) {
  return (
    <div>
      <h1 className="type-h1 text-ink">{data.title}</h1>
      <p className="type-body text-body-text mt-1">{data.summary}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// TaskMetaRow (internal sub-component)
// ---------------------------------------------------------------------------

interface TaskMetaRowProps {
  data: TaskMetaData
}

function TaskMetaRow({ data }: TaskMetaRowProps) {
  const statusConfig = TASK_STATUS_CONFIG[data.status]
  const riskConfig = RISK_LEVEL_CONFIG[data.risk]

  return (
    <div className="flex items-center gap-4 border-t border-divider pt-3 mt-4">
      {/* Status */}
      <div className="flex items-center gap-2">
        <span className="type-label text-subtle">STATUS</span>
        <div
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: statusConfig.dotColor }}
        />
        <span className={statusConfig.className}>{statusConfig.label}</span>
      </div>

      {/* Separator */}
      <div className="h-4 w-px bg-divider" />

      {/* Risk */}
      <div className="flex items-center gap-2">
        <span className="type-label text-subtle">RISK</span>
        <span className={riskConfig.className}>{riskConfig.label}</span>
      </div>

      {/* Separator */}
      <div className="h-4 w-px bg-divider" />

      {/* Scope */}
      <div className="flex items-center gap-2">
        <span className="type-label text-subtle">SCOPE</span>
        <span className="type-body-sm text-body-text">{data.scope}</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// TaskPanel
// ---------------------------------------------------------------------------

interface TaskPanelProps extends VariantProps<typeof taskPanelVariants> {
  isOpen: boolean
  onClose: () => void
  header: TaskHeaderData
  meta: TaskMetaData
  children?: React.ReactNode
  className?: string
  autoScrollToBottom?: boolean
  autoScrollTrigger?: number | string
  autoScrollBehavior?: ScrollBehavior
}

function TaskPanel({
  isOpen,
  onClose,
  header,
  meta,
  children,
  width,
  className,
  autoScrollToBottom = false,
  autoScrollTrigger,
}: TaskPanelProps) {
  const scrollRegionRef = useRef<HTMLDivElement>(null)

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  // Snap scroll region to bottom after each content change.
  // useLayoutEffect fires synchronously after the DOM commit so the scroll position
  // is applied before the browser paints, preventing a flash of wrong position.
  // Direct scrollTop assignment is used instead of scrollTo({behavior:"smooth"}) to
  // avoid smooth-scroll animations conflicting with Framer Motion's slide-in transition.
  useLayoutEffect(() => {
    if (!isOpen || !autoScrollToBottom) return
    const scrollRegion = scrollRegionRef.current
    if (scrollRegion === null) return
    scrollRegion.scrollTop = scrollRegion.scrollHeight
  }, [isOpen, autoScrollToBottom, autoScrollTrigger])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="task-panel"
          className={cn(taskPanelVariants({ width, className }))}
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <Panel
            surface="cool"
            padding="spacious"
            className="flex h-full flex-col overflow-hidden"
          >
            {/* Fixed header zone */}
            <div className="shrink-0">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-md text-subtle hover:text-ink hover:bg-surface-deep transition-colors cursor-pointer"
                aria-label="Close panel"
              >
                <X className="h-4 w-4" />
              </button>

              <TaskHeader data={header} />
              <TaskMetaRow data={meta} />

              <div className="border-t border-divider mt-4" />
            </div>

            {/* Scrollable children zone */}
            <div ref={scrollRegionRef} className="flex-1 min-h-0 overflow-y-auto pt-4">
              {children}
            </div>
          </Panel>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { TaskPanel, taskPanelVariants, TASK_STATUS_CONFIG, RISK_LEVEL_CONFIG }
export type {
  TaskState,
  RiskLevel,
  TaskHeaderData,
  TaskMetaData,
  TaskPanelProps,
}
