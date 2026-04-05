import { Suspense } from "react"
import { redirect } from "next/navigation"
import { ReportsView } from "@/components/reports-view"
import { requirePlanFeature, PlanFeatureError } from "@/lib/plan-feature-guard"
import { resolvePageOrgContext } from "@/lib/server/org-context"

export default async function ReportsPage() {
    const { getCurrentUser } = await import("@/lib/data/auth")
    const { getOrganization } = await import("@/lib/data/organizations")

    const user = await getCurrentUser()
    if (!user) {
        redirect("/auth/login")
    }

    const { orgId } = await resolvePageOrgContext()

    try {
        await requirePlanFeature(orgId, "reports")
    } catch (e: any) {
        if (e instanceof PlanFeatureError) {
            redirect("/pricing")
        }
        throw e
    }

    const org = await getOrganization(orgId)
    const orgSlug = org?.slug || ""

    return (
        <div className="min-h-full space-y-10 pb-20">
            <Suspense fallback={<ReportsLoadingSkeleton />}>
                <ReportsView orgId={orgId} orgSlug={orgSlug} />
            </Suspense>
        </div>
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
