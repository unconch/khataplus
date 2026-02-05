import { cn } from "@/lib/utils"

interface PriceDisplayProps {
    amount: number
    currency?: string
    className?: string
    size?: "sm" | "md" | "lg" | "xl" | "2xl"
    showDecimals?: boolean
}

export function PriceDisplay({
    amount,
    currency = "₹",
    className,
    size = "md",
    showDecimals = false
}: PriceDisplayProps) {

    const formatted = amount.toFixed(2)
    const [intPart, decPart] = formatted.split(".")

    const sizeClasses = {
        sm: { symbol: "text-[10px]", int: "text-sm", dec: "text-[10px]" },
        md: { symbol: "text-xs", int: "text-lg", dec: "text-xs" },
        lg: { symbol: "text-sm", int: "text-2xl", dec: "text-sm" },
        xl: { symbol: "text-base", int: "text-3xl", dec: "text-base" },
        "2xl": { symbol: "text-lg", int: "text-4xl", dec: "text-lg" },
    }

    const s = sizeClasses[size]

    return (
        <span className={cn("font-mono font-black tracking-tight inline-flex items-baseline", className)}>
            <span className={cn("text-muted-foreground mr-0.5 opacity-70", s.symbol)}>
                {currency}
            </span>
            <span className={cn("text-foreground", s.int)}>
                {Number(intPart).toLocaleString("en-IN")}
            </span>
            {showDecimals && Number(decPart) > 0 && (
                <span className={cn("text-muted-foreground ml-0.5 opacity-70", s.dec)}>
                    .{decPart}
                </span>
            )}
        </span>
    )
}
