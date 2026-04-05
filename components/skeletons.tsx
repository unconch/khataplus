import { Skeleton } from "@/components/ui/skeleton"

export function AppShellSkeleton() {
    return (
        <div className="min-h-screen bg-background">
            <div className="flex min-h-screen">
                <aside className="hidden w-[260px] shrink-0 border-r border-border/60 bg-card/40 lg:block">
                    <div className="space-y-6 p-8">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-12 w-12 rounded-2xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-28" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                        </div>
                        <Skeleton className="h-px w-full" />
                        <div className="space-y-3">
                            <Skeleton className="h-12 w-full rounded-2xl" />
                            <Skeleton className="h-12 w-full rounded-2xl" />
                            <Skeleton className="h-12 w-full rounded-2xl" />
                            <Skeleton className="h-12 w-full rounded-2xl" />
                            <Skeleton className="h-12 w-full rounded-2xl" />
                        </div>
                    </div>
                </aside>

                <div className="flex min-h-screen min-w-0 flex-1 flex-col">
                    <header className="border-b border-border/60 bg-card/50 px-4 py-3 sm:px-6 lg:px-10">
                        <div className="flex items-center justify-between gap-4">
                            <Skeleton className="h-12 w-44 rounded-xl" />
                            <div className="flex items-center gap-3">
                                <Skeleton className="hidden h-10 w-28 rounded-xl sm:block" />
                                <Skeleton className="h-10 w-10 rounded-xl" />
                                <Skeleton className="h-10 w-10 rounded-xl" />
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
                        <div className="mx-auto w-full max-w-7xl">
                            <DashboardSkeleton />
                        </div>
                    </main>
                </div>
            </div>
        </div>
    )
}

export function SalesPageSkeleton() {
    return (
        <div className="mx-auto max-w-7xl space-y-6 p-4 pb-24">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                    <Skeleton className="hidden h-10 w-28 rounded-xl sm:block" />
                    <Skeleton className="h-10 w-32 rounded-xl" />
                </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-5 rounded-[2rem] border border-border/60 bg-card/60 p-4 shadow-sm">
                    <div className="grid gap-3 md:grid-cols-3">
                        <Skeleton className="h-12 w-full rounded-xl" />
                        <Skeleton className="h-12 w-full rounded-xl" />
                        <Skeleton className="h-12 w-full rounded-xl" />
                    </div>

                    <div className="flex gap-2 overflow-hidden">
                        <Skeleton className="h-10 w-36 rounded-full" />
                        <Skeleton className="h-10 w-24 rounded-full" />
                        <Skeleton className="h-10 w-24 rounded-full" />
                        <Skeleton className="h-10 w-24 rounded-full" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="rounded-2xl border border-border/50 bg-background/70 p-4">
                                <Skeleton className="h-5 w-10" />
                                <Skeleton className="mt-4 h-5 w-24" />
                                <Skeleton className="mt-2 h-4 w-16" />
                                <Skeleton className="mt-5 h-6 w-20" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-5 rounded-[2rem] border border-border/60 bg-card/60 p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <Skeleton className="h-7 w-36" />
                        <Skeleton className="h-8 w-20 rounded-xl" />
                    </div>

                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="flex items-center justify-between rounded-2xl border border-border/50 p-4">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-28" />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-7 w-7 rounded-md" />
                                    <Skeleton className="h-4 w-4" />
                                    <Skeleton className="h-7 w-7 rounded-md" />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                        <div className="flex justify-between">
                            <Skeleton className="h-4 w-14" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                        <div className="flex justify-between">
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-6 w-28" />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                        <Skeleton className="h-10 w-full rounded-xl" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                    </div>

                    <Skeleton className="h-14 w-full rounded-2xl" />
                </div>
            </div>
        </div>
    )
}

export function SaleRowSkeleton() {
    return (
        <div className="flex items-center justify-between p-4 glass-card">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                </div>
            </div>
            <div className="text-right space-y-2">
                <Skeleton className="h-4 w-16 ml-auto" />
                <Skeleton className="h-3 w-24 ml-auto" />
            </div>
        </div>
    )
}

export function InventoryItemSkeleton() {
    return (
        <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
            </div>
            <div className="w-24 h-8">
                <Skeleton className="h-full w-full rounded-md" />
            </div>
        </div>
    )
}

export function MetricCardSkeleton() {
    return (
        <div className="p-6 glass-card space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-16" />
        </div>
    )
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-8 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCardSkeleton />
                <MetricCardSkeleton />
                <MetricCardSkeleton />
                <MetricCardSkeleton />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Skeleton className="h-8 w-48" />
                    <div className="space-y-4">
                        <SaleRowSkeleton />
                        <SaleRowSkeleton />
                        <SaleRowSkeleton />
                    </div>
                </div>
                <div className="space-y-6">
                    <Skeleton className="h-8 w-32" />
                    <div className="space-y-4">
                        <InventoryItemSkeleton />
                        <InventoryItemSkeleton />
                        <InventoryItemSkeleton />
                    </div>
                </div>
            </div>
        </div>
    )
}
