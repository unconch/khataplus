import { NextRequest, NextResponse } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { getUserOrganizations } from "@/lib/data/organizations"

function stripAppLikeSubdomain(hostname: string): string {
  let base = hostname.toLowerCase()
  if (base.startsWith("www.")) base = base.slice(4)
  if (base.startsWith("demo.")) base = base.slice(5)
  if (base.startsWith("pos.")) base = base.slice(4)
  if (base.startsWith("app.")) base = base.slice(4)
  return base
}

function getAppHostFromRequest(hostname: string): string {
  if (!hostname) return "app.khataplus.online"
  if (hostname === "localhost" || hostname === "127.0.0.1") return hostname
  if (hostname.endsWith(".localhost")) return hostname
  return `app.${stripAppLikeSubdomain(hostname)}`
}

function getCookieDomainFromHost(hostname: string): string | undefined {
  if (!hostname) return undefined
  if (hostname === "localhost" || hostname === "127.0.0.1") return undefined
  if (hostname.endsWith(".localhost")) return undefined
  return `.${stripAppLikeSubdomain(hostname)}`
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const hostname = (req.headers.get("host") || "").split(":")[0].toLowerCase()
  const port = url.port ? `:${url.port}` : ""
  const protocol = url.protocol
  const mainBase = `${protocol}//${stripAppLikeSubdomain(hostname) || "khataplus.online"}${port}`

  const cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            cookiesToSet.push({ name, value, options })
          })
        },
      },
      cookieOptions: {
        domain: getCookieDomainFromHost(hostname),
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    }
  )

  const { data: sessionData } = await supabase.auth.getSession()
  const user = sessionData?.session?.user ?? null

  const safeNextRaw = url.searchParams.get("next") || ""
  const safeNext =
    safeNextRaw && safeNextRaw.startsWith("/") && !safeNextRaw.startsWith("/auth/")
      ? safeNextRaw
      : ""

  if (!user) {
    const loginUrl = new URL("/auth/login", mainBase)
    if (safeNext) loginUrl.searchParams.set("next", safeNext)
    const redirect = NextResponse.redirect(loginUrl)
    cookiesToSet.forEach(({ name, value, options }) => redirect.cookies.set(name, value, options))
    return redirect
  }

  if (safeNext && safeNext.startsWith("/setup-organization")) {
    const redirect = NextResponse.redirect(new URL(safeNext, mainBase))
    cookiesToSet.forEach(({ name, value, options }) => redirect.cookies.set(name, value, options))
    return redirect
  }

  let slug = typeof user.user_metadata?.active_org_slug === "string"
    ? user.user_metadata.active_org_slug
    : undefined
  let orgId = typeof user.user_metadata?.active_org_id === "string"
    ? user.user_metadata.active_org_id
    : undefined
  let orgRole = typeof user.user_metadata?.active_org_role === "string"
    ? user.user_metadata.active_org_role
    : undefined

  if (!slug || !orgId || !orgRole) {
    try {
      const orgs = await getUserOrganizations(user.id)
      const firstOrg = orgs[0]?.organization
      const fallbackMembership = orgs[0]

      if (!slug) {
        slug = typeof firstOrg?.slug === "string" ? firstOrg.slug : undefined
      }
      if (!orgId) {
        if (slug) {
          const match = orgs.find((entry) => entry?.organization?.slug === slug)
          orgId = match?.organization?.id || firstOrg?.id
          if (!orgRole) {
            orgRole = match?.role || fallbackMembership?.role
          }
        } else {
          orgId = firstOrg?.id
          if (!orgRole) {
            orgRole = fallbackMembership?.role
          }
        }
      } else if (!orgRole) {
        const match = orgs.find((entry) => entry?.organization?.id === orgId)
        orgRole = match?.role || fallbackMembership?.role
      }
    } catch {
      slug = slug || undefined
      orgId = orgId || undefined
      orgRole = orgRole || undefined
    }
  }

  if (!slug) {
    const redirect = NextResponse.redirect(new URL("/setup-organization", mainBase))
    cookiesToSet.forEach(({ name, value, options }) => redirect.cookies.set(name, value, options))
    return redirect
  }

  const metadataUpdates: Record<string, string> = {}
  if (slug && user.user_metadata?.active_org_slug !== slug) {
    metadataUpdates.active_org_slug = slug
  }
  if (orgId && user.user_metadata?.active_org_id !== orgId) {
    metadataUpdates.active_org_id = orgId
  }
  if (orgRole && user.user_metadata?.active_org_role !== orgRole) {
    metadataUpdates.active_org_role = orgRole
  }
  if (Object.keys(metadataUpdates).length > 0) {
    try {
      await supabase.auth.updateUser({ data: metadataUpdates })
    } catch {
      // Best-effort only.
    }
  }

  const appHost = getAppHostFromRequest(hostname)
  const appBase = `${protocol}//${appHost}${port}`
  const redirect = NextResponse.redirect(new URL(`/${slug}/dashboard`, appBase))
  cookiesToSet.forEach(({ name, value, options }) => redirect.cookies.set(name, value, options))
  return redirect
}
