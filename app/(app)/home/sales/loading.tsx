import { DashboardSkeleton } from "@/components/skeletons"

export default function Loading() {
    return (
        <div className="p-4 space-y-6 pb-24 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="h-8 w-48 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
                </div>
                <div className="h-10 w-32 bg-muted rounded animate-pulse" />
            </div>
            <DashboardSkeleton />
        </div>
    )
}
