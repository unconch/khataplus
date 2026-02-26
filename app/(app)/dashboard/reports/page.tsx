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
        <div className="min-h-full space-y-10 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pt-4">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
                        Performance <span className="text-blue-600">Reports</span>
                    </h1>
                    <p className="text-sm font-medium text-muted-foreground">Historical records and detailed financial statements</p>
                </div>
            </div>

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
