import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/data/auth"
import { requireOrgContext } from "@/lib/server/org-context"
import { getStoresForUser, resolveActiveStoreId } from "@/lib/data/stores"

export async function GET(req: NextRequest) {
  const ctx = await requireOrgContext()
  if (ctx instanceof NextResponse) return ctx

  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { orgId, role } = ctx
  const stores = await getStoresForUser(orgId, user.userId, role)
  const activeStoreId = await resolveActiveStoreId(orgId, user.userId, role)
  return NextResponse.json({ stores, activeStoreId })
}
