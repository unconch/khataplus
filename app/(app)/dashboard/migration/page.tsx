import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { MigrationView } from "../../../../components/migration-view"

export default function MigrationPage() {
    return (
        <div className="relative pb-4">
            {/* Premium Background Orbital Glows */}
            <div className="orbital-glow">
                <div className="orbital-blob orbital-blob-1 opacity-20 dark:opacity-10" />
                <div className="orbital-blob orbital-blob-2 opacity-20 dark:opacity-10" />
            </div>

            <div className="max-w-[1280px] mx-auto w-full relative z-10 px-2 lg:px-4 py-1.5 space-y-2">
                <div className="flex flex-col gap-1.5 animate-slide-up shrink-0">

                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                        <div className="space-y-1">
                            <h2 className="text-3xl lg:text-5xl font-black italic tracking-tighter text-foreground leading-none">
                                Data <span className="text-primary">Migration.</span>
                            </h2>
                            <p className="text-xs lg:text-sm font-semibold text-muted-foreground max-w-xl">
                                Move your data in minutes with guided, reliable import flows.
                            </p>
                        </div>
                    </div>
                </div>

                <Suspense fallback={
                    <div className="h-[320px] w-full flex items-center justify-center premium-glass rounded-[2.5rem] animate-pulse">
                        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                    </div>
                }>
                    <MigrationContent />
                </Suspense>
            </div>
        </div>
    )
}

async function MigrationContent() {
    const { getCurrentUser, getCurrentOrgId } = await import("@/lib/data/auth")
    const { getSystemSettings } = await import("@/lib/data/organizations")
    const { getProfile } = await import("@/lib/data/profiles")

    const user = await getCurrentUser()
    if (!user) return null

    const { userId, isGuest } = user
    let orgId = isGuest ? "demo-org" : await getCurrentOrgId(userId)
    if (!orgId) return null

    const [settings, profile] = await Promise.all([
        getSystemSettings(orgId),
        userId ? getProfile(userId) : null
    ])

    return (
        <MigrationView
            orgId={orgId}
            role={profile?.role || "staff"}
            settings={settings}
        />
    )
}
