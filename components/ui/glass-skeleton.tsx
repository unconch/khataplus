import { cn } from "@/lib/utils"

function GlassSkeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-2xl bg-muted/50 dark:bg-white/5",
                "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
                className
            )}
            {...props}
        />
    )
}

export { GlassSkeleton }
