import { Skeleton } from "@/components/ui/skeleton"

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
