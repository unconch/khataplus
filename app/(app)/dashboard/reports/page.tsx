import { Suspense } from "react"
import { redirect } from "next/navigation"
import { ReportsView } from "@/components/reports-view"

export default async function ReportsPage() {
    const { getCurrentUser, getCurrentOrgId } = await import("@/lib/data/auth")
    const { getOrganization } = await import("@/lib/data/organizations")

    const user = await getCurrentUser()
    if (!user) {
        redirect("/auth/login")
    }

    const { userId, isGuest } = user
    const orgId = isGuest ? "demo-org" : await getCurrentOrgId(userId)

    if (!orgId) {
        redirect("/setup-organization")
    }

    const org = await getOrganization(orgId)
    const orgSlug = isGuest ? "demo" : (org?.slug || "")

    return (
        <Suspense fallback={<ReportsLoadingSkeleton />}>
            <ReportsView orgId={orgId} orgSlug={orgSlug} />
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
