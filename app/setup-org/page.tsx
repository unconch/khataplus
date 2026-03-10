import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
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

export default async function SetupOrgAliasPage() {
  const sessionRes = await getSession()
  const userId = sessionRes?.userId

  if (!userId) {
    redirect(SETUP_REAUTH_LOGIN)
  }

  const [userOrgs, profile] = await Promise.all([
    getUserOrganizationsResolved(userId),
    getProfile(userId)
  ])

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

  redirect("/setup-organization?reauth=1")
}
