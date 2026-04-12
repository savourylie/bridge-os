import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CompletionSummaryChanges {
  created: number
  modified: number
  moved: number
  deleted: number
  network?: boolean
}

interface CompletionSummaryProps {
  title?: string
  outcome: string
  changes: CompletionSummaryChanges
  rollbackAvailable?: boolean
  rollbackTimeRemaining?: string
  onUndo?: () => void
  onViewChanges?: () => void
  onClose?: () => void
  className?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCount(label: string, count: number): string {
  const unit = count === 1 ? "file" : "files"
  return `${label}: ${count} ${unit}.`
}

// ---------------------------------------------------------------------------
// CompletionSummary
// ---------------------------------------------------------------------------

function CompletionSummary({
  title = "Task Complete",
  outcome,
  changes,
  rollbackAvailable,
  rollbackTimeRemaining,
  onUndo,
  onViewChanges,
  onClose,
  className,
}: CompletionSummaryProps) {
  const changeCounts = [
    formatCount("Created", changes.created),
    formatCount("Modified", changes.modified),
    formatCount("Moved", changes.moved),
    formatCount("Deleted", changes.deleted),
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn("panel-noise relative rounded-md bg-surface-warm p-6", className)}
      style={{ border: "1px solid var(--color-divider)" }}
    >
      {/* Header */}
      <h2 className="type-h2 text-ink">{title}</h2>

      {/* Outcome */}
      <p className="type-body text-body-text mt-2">{outcome}</p>

      {/* Changes summary */}
      <div className="mt-4" style={{ fontVariantNumeric: "tabular-nums" }}>
        <p className="type-body-sm text-body-text">
          {changeCounts.join(" ")}
        </p>
        {changes.network !== undefined && (
          <p className="type-body-sm text-body-text mt-1">
            Network requests: {changes.network ? "yes" : "none"}.
          </p>
        )}
      </div>

      {/* Rollback indicator */}
      {rollbackAvailable && rollbackTimeRemaining && (
        <p className="type-caption text-subtle mt-4">
          This task can be undone for the next {rollbackTimeRemaining}.
        </p>
      )}

      {/* Button row */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onUndo && rollbackAvailable && (
            <button
              type="button"
              onClick={onUndo}
              className={cn(
                "type-button cursor-pointer rounded-md border border-brand bg-transparent text-brand transition-colors duration-150",
                "hover:border-brand-hover hover:bg-brand/5 hover:text-brand-hover",
                "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring",
              )}
              style={{ padding: "10px 20px" }}
            >
              Undo
            </button>
          )}
          {onViewChanges && (
            <button
              type="button"
              onClick={onViewChanges}
              className={cn(
                "type-button cursor-pointer rounded-md border border-brand bg-transparent text-brand transition-colors duration-150",
                "hover:border-brand-hover hover:bg-brand/5 hover:text-brand-hover",
                "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring",
              )}
              style={{ padding: "10px 20px" }}
            >
              View changes
            </button>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "type-button cursor-pointer rounded-md border-none bg-transparent text-subtle transition-colors duration-150",
              "hover:text-body-text",
              "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring",
            )}
            style={{ padding: "10px 16px" }}
          >
            Close
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { CompletionSummary }
export type { CompletionSummaryProps, CompletionSummaryChanges }
