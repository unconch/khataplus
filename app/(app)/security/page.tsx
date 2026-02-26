import { getOrganization, getUserOrganizations } from "@/lib/data/organizations"
import { getProfile } from "@/lib/data/profiles"
import { getUserSessions } from "@/lib/session-governance"
import { redirect } from "next/navigation"
import { SecuritySettings } from "@/components/security-settings"
import { ChevronLeft, Shield } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function SecurityPage() {
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

    const [org, profile, userOrgs, sessions] = await Promise.all([
        getOrganization(orgId),
        getProfile(userId),
        getUserOrganizations(userId),
        getUserSessions(userId)
    ])

    if (!org || !profile) {
        redirect("/dashboard/settings")
        return null
    }

    const membership = userOrgs.find((o: any) => o.org_id === orgId)
    const orgRole = membership?.role || "staff"
    const isAdmin = orgRole === "owner" || String(profile?.role) === "main admin"

    const slug = org.slug

    return (
        <div className="min-h-full space-y-8 pb-20 pt-4">
            <div className="flex flex-col gap-4">
                <Link href={`/${slug}/dashboard/settings`} className="w-fit">
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
                            Governance • Verification • Protection
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
