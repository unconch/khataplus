import { getDailyReports } from "@/lib/data/reports"
import { getSystemSettings } from "@/lib/data/organizations"
import { getProfile } from "@/lib/data/profiles"
import { ReportsClient } from "@/components/reports-client"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"


export default function ReportsPage() {
    return (
        <div className="p-4 space-y-6 pb-24">
            <div className="flex flex-col gap-1.5 animate-slide-up">
                <h1 className="text-3xl font-black tracking-tight bg-linear-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">
                    Daily Reports
                </h1>
                <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                    <span className="w-8 h-[1px] bg-primary/30" />
                    Reports & Business History
                </p>
            </div>

            <Suspense fallback={
                <div className="flex flex-col items-center justify-center p-24 gap-4 animate-pulse bg-muted/20 rounded-xl">
                    <Loader2 className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Loading records...</p>
                </div>
            }>
                <ReportsContent />
            </Suspense>
        </div>
    )
}

async function ReportsContent() {
    const { getCurrentUser, getCurrentOrgId } = await import("@/lib/data/auth")
    const user = await getCurrentUser()

    if (!user) {
        redirect("/auth/login")
        return null
    }
    const { userId, isGuest } = user

    let orgId: string | null = null
    if (isGuest) {
        orgId = "demo-org"
    } else {
        orgId = await getCurrentOrgId(userId)
    }

    if (!orgId) {
        redirect("/setup-organization")
        return null
    }

    // Fetch core data in parallel on the server
    const [reports, settings, profile] = await Promise.all([
        getDailyReports(orgId),
        getSystemSettings(orgId),
        getProfile(userId)
    ])

    return (
        <ReportsClient
            initialReports={reports}
            settings={settings}
            profile={profile}
            userId={userId}
        />
    )
}
