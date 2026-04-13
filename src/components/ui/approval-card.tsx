import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ApprovalCardProps {
  action: string
  riskLevel: "low" | "medium" | "high"
  explanation: string
  willAffect: string[]
  willNotAffect?: string[]
  impactSummary?: string
  command?: string
  onApprove: () => void
  onDeny: () => void
  className?: string
}

// ---------------------------------------------------------------------------
// ApprovalCard
// ---------------------------------------------------------------------------

const RISK_LEVEL_CONFIG = {
  low: {
    label: "Low risk",
    className: "text-teal",
  },
  medium: {
    label: "Medium risk",
    className: "text-brand",
  },
  high: {
    label: "High risk",
    className: "text-error",
  },
} as const

function ApprovalCard({
  action,
  riskLevel,
  explanation,
  willAffect,
  willNotAffect,
  impactSummary,
  command,
  onApprove,
  onDeny,
  className,
}: ApprovalCardProps) {
  const riskConfig = RISK_LEVEL_CONFIG[riskLevel]

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn("panel-noise relative rounded-md bg-surface-deep p-6", className)}
      style={{
        border: "2px solid var(--color-hairline)",
        borderLeft: "3px solid var(--color-brand)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h3 className="type-h3 text-ink">Approval Required</h3>
        <span className={cn("type-label", riskConfig.className)}>{riskConfig.label}</span>
      </div>

      {/* Action description */}
      <p className="type-body text-body-text mt-2">{action}</p>
      <p className="type-body-sm text-subtle mt-3">{explanation}</p>

      {/* Will affect list */}
      <div className="mt-4">
        <span className="type-label text-subtle">This action will</span>
        <ul className="mt-2 flex flex-col gap-1">
          {willAffect.map((item) => (
            <li key={item} className="type-body text-body-text flex items-start gap-2">
              <span className="mt-[7px] block h-1 w-1 shrink-0 rounded-full bg-brand" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Will not affect list */}
      {willNotAffect && willNotAffect.length > 0 && (
        <div className="mt-4">
          <span className="type-label text-subtle">This action will not</span>
          <ul className="mt-2 flex flex-col gap-1">
            {willNotAffect.map((item) => (
              <li key={item} className="type-body text-body-text flex items-start gap-2">
                <span className="mt-[7px] block h-1 w-1 shrink-0 rounded-full bg-subtle" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Impact summary */}
      {impactSummary && (
        <p className="type-body-sm text-subtle mt-4">{impactSummary}</p>
      )}

      {/* Command preview */}
      {command && (
        <div className="mt-4 rounded bg-surface px-4 py-3 border border-hairline">
          <code className="type-code text-body-text">{command}</code>
        </div>
      )}

      {/* Button row */}
      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onDeny}
          className={cn(
            "type-button cursor-pointer rounded-md border-none bg-transparent text-subtle transition-colors duration-150",
            "hover:text-body-text",
            "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          )}
          style={{ padding: "10px 16px" }}
        >
          Deny
        </button>
        <button
          type="button"
          onClick={onApprove}
          className={cn(
            "type-button cursor-pointer rounded-md border border-transparent bg-brand text-white transition-colors duration-150",
            "hover:bg-brand-hover",
            "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          )}
          style={{ padding: "10px 20px" }}
        >
          Approve
        </button>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { ApprovalCard }
export type { ApprovalCardProps }
