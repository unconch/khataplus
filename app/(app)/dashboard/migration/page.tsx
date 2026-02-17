import { Suspense } from "react"
import { Loader2, Database } from "lucide-react"
import { MigrationView } from "../../../../components/migration-view"

export default function MigrationPage() {
    return (
        <div className="relative space-y-8 pb-12">
            {/* Premium Background Orbital Glows */}
            <div className="orbital-glow">
                <div className="orbital-blob orbital-blob-1 opacity-20 dark:opacity-10" />
                <div className="orbital-blob orbital-blob-2 opacity-20 dark:opacity-10" />
            </div>

            <div className="max-w-[1600px] mx-auto w-full space-y-8 relative z-10 px-4 lg:px-8">
                <div className="flex flex-col gap-3 animate-slide-up">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full premium-glass w-fit border-border/10">
                        <Database className="h-3 w-3 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Systems Architecture</span>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                        <div className="space-y-1">
                            <h2 className="text-4xl lg:text-6xl font-black italic tracking-tighter text-foreground leading-none">
                                Data <span className="text-primary">Migration.</span>
                            </h2>
                            <p className="text-sm lg:text-lg font-bold text-muted-foreground max-w-xl">
                                Enterprise-grade import and export tools for seamless business continuity.
                            </p>
                        </div>
                    </div>
                </div>

                <Suspense fallback={
                    <div className="h-[400px] w-full flex items-center justify-center premium-glass rounded-[2.5rem] animate-pulse">
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
