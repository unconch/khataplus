import { cn } from "@/lib/utils"
import { LucideIcon, AlertCircle, FileX, CheckCircle2 } from "lucide-react"

interface StateCardProps {
    title: string
    description?: string
    icon?: LucideIcon
    children?: React.ReactNode // For buttons/actions
    variant?: "empty" | "error" | "success"
    className?: string
}

export function StateCard({
    title,
    description,
    icon: Icon,
    children,
    variant = "empty",
    className,
}: StateCardProps) {

    const variants = {
        empty: {
            icon: FileX,
            color: "text-muted-foreground/30",
            bg: "bg-muted/5",
            border: "border-dashed border-muted",
        },
        error: {
            icon: AlertCircle,
            color: "text-red-500/50",
            bg: "bg-red-500/5",
            border: "border-red-500/10",
        },
        success: {
            icon: CheckCircle2,
            color: "text-emerald-500/50",
            bg: "bg-emerald-500/5",
            border: "border-emerald-500/10",
        },
    }

    const style = variants[variant]
    const DisplayIcon = Icon || style.icon

    return (
        <div className={cn(
            "flex flex-col items-center justify-center p-8 text-center rounded-3xl border transition-all",
            style.bg,
            style.border,
            className
        )}>
            <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center mb-4 transition-transform active:scale-95 duration-200", style.color, "bg-background/50 backdrop-blur-sm shadow-sm")}>
                <DisplayIcon className="h-8 w-8 opacity-80" />
            </div>

            <h3 className="text-lg font-black tracking-tight text-foreground/80 mb-1">
                {title}
            </h3>

            {description && (
                <p className="text-sm font-medium text-muted-foreground/60 max-w-xs mx-auto mb-6">
                    {description}
                </p>
            )}

            {children && (
                <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {children}
                </div>
            )}
        </div>
    )
}
