import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/data/auth"
import { requireOrgContext } from "@/lib/server/org-context"
import { ACTIVE_STORE_COOKIE, getStoresForUser } from "@/lib/data/stores"

export async function POST(req: NextRequest) {
  const ctx = await requireOrgContext()
  if (ctx instanceof NextResponse) return ctx

  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { orgId, role } = ctx
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
