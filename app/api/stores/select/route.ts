import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser, getCurrentOrgId } from "@/lib/data/auth"
import { getUserOrganizations } from "@/lib/data/organizations"
import { ACTIVE_STORE_COOKIE, getStoresForUser } from "@/lib/data/stores"

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orgId = user.isGuest ? "demo-org" : (await getCurrentOrgId(user.userId))
  if (!orgId) return NextResponse.json({ error: "Missing org" }, { status: 400 })

  let role = "staff"
  if (!user.isGuest) {
    const orgs = await getUserOrganizations(user.userId)
    role = String(orgs.find((o: any) => String(o.org_id) === String(orgId))?.role || "staff")
  }

  const stores = await getStoresForUser(orgId, user.userId, role)
  const storeId = stores[0]?.id
  if (!storeId) return NextResponse.json({ error: "No store available" }, { status: 404 })

  const res = NextResponse.json({ ok: true, storeId })
  res.cookies.set(ACTIVE_STORE_COOKIE, storeId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })
  return res
}
