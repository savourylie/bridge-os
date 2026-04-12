import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const corridorVariants = cva(
  "fixed top-0 bottom-0 overflow-y-auto px-4 min-w-[360px]",
  {
    variants: {
      width: {
        conversation: "w-[480px]",
        intent: "w-[560px]",
        completion: "w-[640px]",
      },
      anchor: {
        left: "left-4",
        right: "right-4",
      },
    },
    defaultVariants: {
      width: "conversation",
      anchor: "right",
    },
  }
)

function Corridor({
  className,
  width,
  anchor,
  ...props
}: React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof corridorVariants>) {
  return (
    <div
      className={cn(corridorVariants({ width, anchor, className }))}
      {...props}
    />
  )
}

export { Corridor, corridorVariants }
