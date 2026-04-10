import { NextResponse } from "next/server"
import {
  ACTIVE_ORG_COOKIE,
  getCurrentUser,
  getUserOrganizationsResolved,
  persistActiveOrgSlug,
} from "@/lib/data/auth"

function normalizeSlug(value: unknown) {
  const slug = String(value || "").trim().toLowerCase()
  if (!slug || slug === "undefined" || slug === "null" || slug.includes(".")) {
    return null
  }
  return slug
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.isGuest) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({} as { slug?: unknown }))
    const slug = normalizeSlug(body?.slug)
    if (!slug) {
      return NextResponse.json({ error: "Organization slug is required" }, { status: 400 })
    }

    const organizations = await getUserOrganizationsResolved(user.userId)
    const membership = organizations.find((entry: any) => {
      const orgSlug = normalizeSlug(entry?.organization?.slug)
      return orgSlug === slug
    })

    if (!membership) {
      return NextResponse.json({ error: "Organization not found" }, { status: 403 })
    }

    await persistActiveOrgSlug(slug)

    const response = NextResponse.json({
      ok: true,
      slug,
      orgId: String(membership.org_id || membership.organization?.id || ""),
      name: membership.organization?.name ? String(membership.organization.name) : null,
      role: membership.role ? String(membership.role) : null,
    })

    response.cookies.set(ACTIVE_ORG_COOKIE, slug, {
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
    })

    return response
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to select organization" },
      { status: 500 }
    )
  }
}
