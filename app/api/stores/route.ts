import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/data/auth"
import { authorize } from "@/lib/security"
import { requireOrgContext } from "@/lib/server/org-context"
import { createStore, getStoresForUser, resolveActiveStoreId } from "@/lib/data/stores"

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

export async function POST(req: NextRequest) {
  const ctx = await requireOrgContext()
  if (ctx instanceof NextResponse) return ctx

  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { orgId, role } = ctx

  try {
    await authorize("Manage Stores", "admin", orgId)
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Forbidden" }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const name = String(body?.name || "").trim()
  const code = String(body?.code || "").trim() || null
  const address = String(body?.address || "").trim() || null
  const phone = String(body?.phone || "").trim() || null
  const isDefault = Boolean(body?.isDefault)

  if (!name) {
    return NextResponse.json({ error: "Store name is required" }, { status: 400 })
  }

  try {
    const created = await createStore(orgId, { name, code, address, phone, isDefault })
    const stores = await getStoresForUser(orgId, user.userId, role)
    const activeStoreId = await resolveActiveStoreId(orgId, user.userId, role)

    return NextResponse.json({ ok: true, store: created, stores, activeStoreId }, { status: 201 })
  } catch (error: any) {
    const message = String(error?.message || "Failed to create store")
    const lowered = message.toLowerCase()
    const status = lowered.includes("limit") ? 409 : lowered.includes("already exists") ? 409 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
