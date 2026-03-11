import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { getSession } from "@/lib/session"
import { OnboardingWizard } from "@/components/onboarding-wizard"
import { getProfile } from "@/lib/data"
import { getOrganization } from "@/lib/data/organizations"
import { getUserOrganizationsResolved } from "@/lib/data/auth"
import { getAppHostFromHostname } from "@/lib/auth-redirect"

export const dynamic = "force-dynamic"
const SETUP_REAUTH_LOGIN = `/auth/login?next=${encodeURIComponent("/setup-organization?reauth=1")}`

async function getAppOrigin(): Promise<string> {
    const headerList = await headers()
    const forwardedHost = headerList.get("x-forwarded-host")
    const hostHeader = forwardedHost || headerList.get("host") || "app.khataplus.online"
    const firstHost = hostHeader.split(",")[0]?.trim() || "app.khataplus.online"
    const [hostname, port] = firstHost.split(":")
    const isLocal = hostname === "localhost" || hostname === "127.0.0.1" || hostname?.endsWith(".localhost")
    const protocol = headerList.get("x-forwarded-proto") || (isLocal ? "http" : "https")
    const appHost = getAppHostFromHostname(hostname || "app.khataplus.online")
    return `${protocol}://${appHost}${port ? `:${port}` : ""}`
}

export default async function SetupOrganizationPage({
    searchParams,
}: {
    searchParams: { reauth?: string | string[] }
}) {
    const reauth = Array.isArray(searchParams?.reauth) ? searchParams.reauth[0] : searchParams?.reauth

    if (reauth !== "1") {
        redirect(SETUP_REAUTH_LOGIN)
    }

    const sessionRes = await getSession()
    const userId = sessionRes?.userId

    if (!userId) {
        redirect(SETUP_REAUTH_LOGIN)
    }

    const [userOrgs, profile] = await Promise.all([getUserOrganizationsResolved(userId), getProfile(userId)])

    const appOrigin = await getAppOrigin()

    if (userOrgs.length > 0) {
        const slug = userOrgs[0]?.organization?.slug
        if (slug) {
            redirect(`${appOrigin}/${slug}/dashboard`)
        }
        redirect(`${appOrigin}/dashboard`)
    }

    if (profile?.organization_id) {
        const org = await getOrganization(profile.organization_id)
        if (org?.slug) {
            redirect(`${appOrigin}/${org.slug}/dashboard`)
        }
        if (org) {
            redirect(`${appOrigin}/dashboard`)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 pt-20 sm:pt-4 relative overflow-hidden">
            {/* Background Aesthetics */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-0 -right-4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl opacity-50" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            </div>

            <div className="w-full max-w-xl relative z-10 py-4">
                <OnboardingWizard userId={userId} profile={profile as any} />
            </div>
        </div>
    )
}
