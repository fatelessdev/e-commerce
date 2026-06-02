import { formatBargainDiscountLabel } from "@/lib/bargain/discount"
import { cn } from "@/lib/utils"

interface BargainDiscountStripProps {
  maxBargainDiscount?: string | number | null
  className?: string
}

export function BargainDiscountStrip({ maxBargainDiscount, className }: BargainDiscountStripProps) {
  const label = formatBargainDiscountLabel(maxBargainDiscount)

  if (!label) {
    return null
  }

  return <span className={cn("bargain-discount-strip", className)}>{label}</span>
}
