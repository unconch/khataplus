import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { OnboardingWizard } from "@/components/onboarding-wizard"
import { getProfile } from "@/lib/data"
import { getOrganization } from "@/lib/data/organizations"
import { getUserOrganizationsResolved } from "@/lib/data/auth"

export const dynamic = "force-dynamic"

export default async function OnboardingPage() {
    const sessionRes = await getSession()
    const userId = sessionRes?.userId

    if (!userId) {
        redirect("/auth/login")
    }

    const [userOrgs, profile] = await Promise.all([getUserOrganizationsResolved(userId), getProfile(userId)])

    if (userOrgs.length > 0) {
        const directSlug = userOrgs[0]?.organization?.slug
        const fallbackOrgId = userOrgs[0]?.org_id
        const fallbackOrg = !directSlug && fallbackOrgId ? await getOrganization(fallbackOrgId) : null
        const slug = directSlug || fallbackOrg?.slug
        if (slug) {
            redirect(`/app/${slug}/dashboard`)
        }
        redirect("/app/dashboard")
    }

    if (profile?.organization_id) {
        const org = await getOrganization(profile.organization_id)
        if (org?.slug) {
            redirect(`/app/${org.slug}/dashboard`)
        }
        if (org) {
            redirect("/app/dashboard")
        }
    }

    return (
        <div className="h-svh flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-3 sm:p-4 relative overflow-hidden">
            {/* Background Aesthetics */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_12%,rgba(16,185,129,0.36),transparent_36%),radial-gradient(circle_at_88%_10%,rgba(59,130,246,0.30),transparent_34%),radial-gradient(circle_at_80%_82%,rgba(99,102,241,0.24),transparent_34%),radial-gradient(circle_at_28%_84%,rgba(236,72,153,0.26),transparent_36%),linear-gradient(135deg,#f8fafc_0%,#f3f4f6_40%,#eef2ff_100%)]" />
                <div className="absolute top-[-8%] -left-[6%] w-96 h-96 bg-emerald-400/30 rounded-full blur-3xl opacity-80" />
                <div className="absolute bottom-[-10%] -right-[4%] w-96 h-96 bg-blue-500/28 rounded-full blur-3xl opacity-80" />
                <div className="absolute top-[50%] left-[40%] w-80 h-80 bg-fuchsia-400/20 rounded-full blur-3xl opacity-80" />
            </div>

            <div className="w-full max-w-2xl relative z-10 h-full flex items-center justify-center">
                <OnboardingWizard userId={userId} profile={profile as any} />
            </div>
        </div>
    )
}
