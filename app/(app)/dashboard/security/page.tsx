import { getOrganization, getUserOrganizations } from "@/lib/data/organizations"
import { getProfile } from "@/lib/data/profiles"
import { getUserSessions } from "@/lib/session-governance"
import { redirect } from "next/navigation"
import { SecuritySettings } from "@/components/security-settings"
import { ChevronLeft, Cpu, Shield, Zap } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { resolvePageOrgContext } from "@/lib/server/org-context"

export default async function SecurityPage() {
    const { getCurrentUser } = await import("@/lib/data/auth")
    const user = await getCurrentUser()

    if (!user) {
        redirect("/auth/login")
        return null
    }

    const { userId, isGuest } = user
    const { orgId, orgSlug } = await resolvePageOrgContext()

    if (isGuest) {
        return (
            <div className="min-h-full space-y-8 pb-20 pt-4">
                <div className="flex flex-col gap-4">
                    <Link href="/dashboard/settings" className="w-fit">
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-zinc-500 hover:text-zinc-950 font-bold">
                            <ChevronLeft size={16} className="mr-1" /> Back to Settings
                        </Button>
                    </Link>

                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-zinc-950 text-white shadow-xl shadow-zinc-200">
                            <Shield size={24} />
                        </div>
                        <div className="space-y-0.5">
                            <h1 className="text-3xl font-black tracking-tighter text-foreground">
                                Security <span className="text-zinc-400">Vault</span>
                            </h1>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                Governance . Verification . Protection
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center p-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-950/20 space-y-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-amber-500 blur-xl opacity-20 motion-safe:animate-pulse" />
                        <div className="relative w-16 h-16 rounded-2xl bg-zinc-950 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-950 shadow-xl">
                            <Cpu size={28} className="motion-safe:animate-bounce md:animate-none lg:motion-safe:animate-bounce" />
                        </div>
                    </div>
                    <div className="text-center space-y-2">
                        <h3 className="text-2xl font-black italic tracking-tighter text-foreground">Sandbox Mode Active</h3>
                        <p className="text-xs text-zinc-400 font-medium max-w-sm mx-auto leading-relaxed">
                            Security controls are <span className="text-amber-600 font-bold uppercase underline">Locked</span> in demonstration.
                        </p>
                    </div>
                    <div className="pt-2">
                        <a href="/auth/sign-up" className="group flex items-center gap-3 px-8 py-3 rounded-xl bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-950 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 dark:hover:bg-emerald-600 hover:text-white transition-all duration-500 md:duration-0 lg:duration-500 shadow-lg">
                            Go Pro
                            <Zap size={10} className="group-hover:motion-safe:animate-ping" />
                        </a>
                    </div>
                </div>
            </div>
        )
    }

    const [org, profile, userOrgs, sessions] = await Promise.all([
        getOrganization(orgId),
        getProfile(userId),
        getUserOrganizations(userId),
        getUserSessions(userId),
    ])

    if (!org || !profile) {
        redirect("/dashboard/settings")
        return null
    }

    const membership = userOrgs.find((o: any) => o.org_id === orgId)
    const orgRole = membership?.role || "staff"
    const isAdmin = orgRole === "owner" || String(profile?.role) === "main admin"
    const slug = org.slug || orgSlug

    return (
        <div className="min-h-full space-y-8 pb-20 pt-4">
            <div className="flex flex-col gap-4">
                <Link href={`/app/${slug}/dashboard/settings`} className="w-fit">
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-zinc-500 hover:text-zinc-950 font-bold">
                        <ChevronLeft size={16} className="mr-1" /> Back to Settings
                    </Button>
                </Link>

                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-zinc-950 text-white shadow-xl shadow-zinc-200">
                        <Shield size={24} />
                    </div>
                    <div className="space-y-0.5">
                        <h1 className="text-3xl font-black tracking-tighter text-foreground">
                            Security <span className="text-zinc-400">Vault</span>
                        </h1>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                            Governance . Verification . Protection
                        </p>
                    </div>
                </div>
            </div>

            <SecuritySettings
                profile={profile}
                isAdmin={isAdmin}
                orgId={orgId}
                initialSessions={sessions}
                initialSettings={{
                    id: org.id,
                    allow_staff_inventory: Boolean(org.settings?.allow_staff_inventory ?? true),
                    allow_staff_sales: Boolean(org.settings?.allow_staff_sales ?? true),
                    allow_staff_reports: Boolean(org.settings?.allow_staff_reports ?? true),
                    allow_staff_reports_entry_only: Boolean(org.settings?.allow_staff_reports_entry_only ?? false),
                    allow_staff_analytics: Boolean(org.settings?.allow_staff_analytics ?? false),
                    allow_staff_add_inventory: Boolean(org.settings?.allow_staff_add_inventory ?? false),
                    gst_enabled: Boolean(org.settings?.gst_enabled ?? true),
                    gst_inclusive: Boolean(org.settings?.gst_inclusive ?? false),
                    show_buy_price_in_sales: Boolean(org.settings?.show_buy_price_in_sales ?? false),
                    updated_at: org.updated_at,
                }}
            />
        </div>
    )
}
