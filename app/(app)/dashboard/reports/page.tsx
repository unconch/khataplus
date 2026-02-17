import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getOrganizationBySlug } from "@/lib/data/organizations"
import { ReportsView } from "@/components/reports-view"
import { headers } from "next/headers"

export default async function ReportsPage() {
    const headersList = await headers()
    const slug = headersList.get("x-tenant-slug")

    if (!slug) {
        redirect("/setup-organization")
    }

    const org = await getOrganizationBySlug(slug)

    if (!org) {
        redirect("/setup-organization")
    }

    return (
        <Suspense fallback={<ReportsLoadingSkeleton />}>
            <ReportsView orgId={org.id} orgSlug={slug} />
        </Suspense>
    )
}

function ReportsLoadingSkeleton() {
    return (
        <div className="p-6 space-y-6 animate-pulse">
            <div className="h-8 bg-zinc-200 rounded w-48" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-zinc-200 rounded-xl" />
                ))}
            </div>
            <div className="h-96 bg-zinc-200 rounded-xl" />
        </div>
    )
}
