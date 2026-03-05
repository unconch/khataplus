import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser, getCurrentOrgId } from "@/lib/data/auth"
import { getUserOrganizations } from "@/lib/data/organizations"
import { getStoresForUser, resolveActiveStoreId } from "@/lib/data/stores"

export async function GET(req: NextRequest) {
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
  const activeStoreId = await resolveActiveStoreId(orgId, user.userId, role, { allowAll: true })
  return NextResponse.json({ stores, activeStoreId })
}
