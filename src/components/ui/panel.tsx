import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const panelVariants = cva(
  "panel-noise relative rounded-md border border-hairline",
  {
    variants: {
      surface: {
        cool: "bg-surface",
        warm: "bg-surface-warm",
        deep: "bg-surface-deep",
      },
      padding: {
        default: "p-5",
        compact: "p-4",
        spacious: "p-6",
      },
    },
    defaultVariants: {
      surface: "cool",
      padding: "default",
    },
  }
)

function Panel({
  className,
  surface,
  padding,
  ...props
}: React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof panelVariants>) {
  return (
    <div
      className={cn(panelVariants({ surface, padding, className }))}
      {...props}
    />
  )
}

export { Panel, panelVariants }
