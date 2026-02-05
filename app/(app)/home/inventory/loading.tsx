import { InventoryItemSkeleton, MetricCardSkeleton } from "@/components/skeletons"

export default function Loading() {
    return (
        <div className="p-4 space-y-6 pb-24 max-w-7xl mx-auto">
            <div className="flex flex-col gap-1">
                <div className="h-8 w-48 bg-muted rounded animate-pulse" />
                <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <MetricCardSkeleton />
                <MetricCardSkeleton />
                <MetricCardSkeleton />
            </div>

            <div className="p-6 bg-muted/20 rounded-xl space-y-4">
                <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                <InventoryItemSkeleton />
                <InventoryItemSkeleton />
                <InventoryItemSkeleton />
                <InventoryItemSkeleton />
            </div>
        </div>
    )
}
