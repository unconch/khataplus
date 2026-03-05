import { cookies, headers } from "next/headers"
import { sql } from "@/lib/db"

export type Store = {
  id: string
  org_id: string
  name: string
  code: string
  address: string | null
  phone: string | null
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

const ACTIVE_STORE_COOKIE = "kp_active_store"

export async function ensureStoreSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      address TEXT NULL,
      phone TEXT NULL,
      is_default BOOLEAN NOT NULL DEFAULT false,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`CREATE INDEX IF NOT EXISTS idx_stores_org ON stores(org_id)`

  await sql`
    CREATE TABLE IF NOT EXISTS member_store_scopes (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      store_id TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(org_id, user_id, store_id)
    )
  `

  await sql`CREATE INDEX IF NOT EXISTS idx_member_store_scopes_org_user ON member_store_scopes(org_id, user_id)`
}

function makeStoreId(orgId: string) {
  return `store_${String(orgId).replace(/[^a-zA-Z0-9]/g, "").slice(0, 24)}_main`
}

export async function ensureDefaultStore(orgId: string): Promise<Store> {
  await ensureStoreSchema()
  const rows = await sql`SELECT * FROM stores WHERE org_id = ${orgId} ORDER BY is_default DESC, created_at ASC LIMIT 1`
  if (rows[0]) return rows[0] as Store

  const id = makeStoreId(orgId)
  const inserted = await sql`
    INSERT INTO stores (id, org_id, name, code, address, phone, is_default, is_active)
    VALUES (${id}, ${orgId}, 'Main Branch', 'MAIN', NULL, NULL, true, true)
    RETURNING *
  `
  return inserted[0] as Store
}

export async function getStoresForOrg(orgId: string): Promise<Store[]> {
  await ensureDefaultStore(orgId)
  const rows = await sql`SELECT * FROM stores WHERE org_id = ${orgId} AND is_active = true ORDER BY is_default DESC, created_at ASC`
  return rows as Store[]
}

export async function getStoresForUser(orgId: string, userId: string, role: string): Promise<Store[]> {
  if (role === "owner" || role === "manager" || role === "admin" || role === "main admin") {
    return getStoresForOrg(orgId)
  }

  await ensureDefaultStore(orgId)
  const rows = await sql`
    SELECT s.*
    FROM member_store_scopes mss
    JOIN stores s ON s.id = mss.store_id
    WHERE mss.org_id = ${orgId}
      AND mss.user_id = ${userId}
      AND s.is_active = true
    ORDER BY s.is_default DESC, s.created_at ASC
  `

  if ((rows as Store[]).length > 0) return rows as Store[]
  return (await getStoresForOrg(orgId)).slice(0, 1)
}

export async function resolveActiveStoreId(
  orgId: string,
  userId: string,
  role: string,
  options?: { allowAll?: boolean }
): Promise<string | null> {
  const stores = await getStoresForUser(orgId, userId, role)
  if (stores.length === 0) return null

  const canAll = Boolean(options?.allowAll && (role === "owner" || role === "manager" || role === "admin" || role === "main admin"))
  const fromCookie = (await cookies()).get(ACTIVE_STORE_COOKIE)?.value
  const fromHeader = (await headers()).get("x-store-id") || undefined
  const selected = fromHeader || fromCookie

  if (selected) {
    if (canAll) {
      const found = (await getStoresForOrg(orgId)).find((s) => s.id === selected)
      if (found) return found.id
    } else if (stores.some((s) => s.id === selected)) {
      return selected
    }
  }

  return stores[0]?.id || null
}

export { ACTIVE_STORE_COOKIE }
