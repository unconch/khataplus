import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/data/auth"
import { requireOrgContext } from "@/lib/server/org-context"
import { selectActiveStoreId } from "@/lib/data/stores"

export async function POST(req: NextRequest) {
  const ctx = await requireOrgContext()
  if (ctx instanceof NextResponse) return ctx

  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { orgId, role } = ctx
  const body = await req.json().catch(() => ({}))
  const requestedStoreId = String(body?.storeId || "").trim() || null
  const storeId = await selectActiveStoreId(orgId, user.userId, role, requestedStoreId)
  if (!storeId) return NextResponse.json({ error: "No store available" }, { status: 404 })
  return NextResponse.json({ ok: true, storeId })
}
