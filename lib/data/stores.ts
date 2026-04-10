import { cookies } from "next/headers"
import { sql } from "@/lib/db"
import { getStoreLimit } from "@/lib/billing-plans"

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

export const ACTIVE_STORE_COOKIE = "kp_active_store"
const ELEVATED_STORE_ROLES = new Set(["owner", "admin", "manager"])

function normalizeStoreId(value: string | null | undefined) {
  const storeId = String(value || "").trim()
  if (!storeId || storeId === "undefined" || storeId === "null") return null
  return storeId
}

function mapStore(row: any): Store {
  return {
    id: String(row.id),
    org_id: String(row.org_id),
    name: String(row.name),
    code: String(row.code),
    address: row.address ? String(row.address) : null,
    phone: row.phone ? String(row.phone) : null,
    is_default: Boolean(row.is_default),
    is_active: Boolean(row.is_active),
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  }
}

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

  await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS address TEXT NULL`
  await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS phone TEXT NULL`
  await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT false`
  await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true`
  await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

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
  if (rows[0]) return mapStore(rows[0])

  const id = makeStoreId(orgId)
  const inserted = await sql`
    INSERT INTO stores (id, org_id, name, code, address, phone, is_default, is_active)
    VALUES (${id}, ${orgId}, 'Main Branch', 'MAIN', NULL, NULL, true, true)
    RETURNING *
  `
  return mapStore(inserted[0])
}

export async function getStoresForOrg(orgId: string): Promise<Store[]> {
  await ensureDefaultStore(orgId)
  const rows = await sql`
    SELECT *
    FROM stores
    WHERE org_id = ${orgId}
      AND is_active = true
    ORDER BY is_default DESC, created_at ASC, name ASC
  `
  return rows.map(mapStore)
}

export async function getStoresForUser(orgId: string, userId: string, role: string): Promise<Store[]> {
  const stores = await getStoresForOrg(orgId)
  if (stores.length === 0) return []

  const normalizedRole = String(role || "").trim().toLowerCase()
  if (ELEVATED_STORE_ROLES.has(normalizedRole)) {
    return stores
  }

  const scopedRows = await sql`
    SELECT store_id
    FROM member_store_scopes
    WHERE org_id = ${orgId}
      AND user_id = ${userId}
  `

  if (scopedRows.length === 0) {
    // Transitional fallback until store-scope management is exposed in the UI.
    return stores
  }

  const allowedStoreIds = new Set(
    scopedRows
      .map((row: any) => normalizeStoreId(row.store_id))
      .filter((storeId): storeId is string => Boolean(storeId))
  )

  return stores.filter((store) => allowedStoreIds.has(store.id))
}

export async function getStoreById(orgId: string, storeId: string): Promise<Store | null> {
  await ensureStoreSchema()
  const rows = await sql`
    SELECT *
    FROM stores
    WHERE org_id = ${orgId}
      AND id = ${storeId}
      AND is_active = true
    LIMIT 1
  `
  return rows[0] ? mapStore(rows[0]) : null
}

export async function createStore(
  orgId: string,
  input: { name: string; code?: string | null; address?: string | null; phone?: string | null; isDefault?: boolean }
): Promise<Store> {
  await ensureStoreSchema()
  const name = String(input.name || "").trim()
  if (!name) throw new Error("Store name is required")

  const normalizedCode = String(input.code || name)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 12) || `STORE-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

  const existingStores = await getStoresForOrg(orgId)
  const orgRows = await sql`SELECT plan_type FROM organizations WHERE id = ${orgId} LIMIT 1`
  const storeLimit = getStoreLimit(orgRows[0]?.plan_type)
  if (storeLimit !== null && existingStores.length >= storeLimit) {
    throw new Error(`Store limit reached for current plan (${storeLimit})`)
  }

  const duplicateRows = await sql`
    SELECT id
    FROM stores
    WHERE org_id = ${orgId}
      AND (LOWER(name) = LOWER(${name}) OR UPPER(code) = ${normalizedCode})
    LIMIT 1
  `
  if (duplicateRows.length > 0) {
    throw new Error("A store with this name or code already exists")
  }

  const id = `store_${crypto.randomUUID().replace(/-/g, "")}`
  const shouldBecomeDefault = Boolean(input.isDefault) || existingStores.length === 0

  if (shouldBecomeDefault) {
    await sql`UPDATE stores SET is_default = false, updated_at = NOW() WHERE org_id = ${orgId}`
  }

  const rows = await sql`
    INSERT INTO stores (id, org_id, name, code, address, phone, is_default, is_active)
    VALUES (
      ${id},
      ${orgId},
      ${name},
      ${normalizedCode},
      ${input.address ? String(input.address).trim() : null},
      ${input.phone ? String(input.phone).trim() : null},
      ${shouldBecomeDefault},
      true
    )
    RETURNING *
  `

  return mapStore(rows[0])
}

export async function persistActiveStoreId(storeId: string) {
  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_STORE_COOKIE, storeId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function clearActiveStoreId() {
  const cookieStore = await cookies()
  cookieStore.delete(ACTIVE_STORE_COOKIE)
}

export async function resolveActiveStoreId(
  orgId: string,
  userId: string,
  role: string,
  options?: { allowAll?: boolean }
): Promise<string | null> {
  const stores = await getStoresForUser(orgId, userId, role)
  if (stores.length === 0) return null
  const cookieStore = await cookies()
  const cookieStoreId = normalizeStoreId(cookieStore.get(ACTIVE_STORE_COOKIE)?.value)
  if (cookieStoreId && stores.some((store) => store.id === cookieStoreId)) {
    return cookieStoreId
  }

  const defaultStore = stores.find((store) => store.is_default)
  if (defaultStore?.id) return defaultStore.id

  return stores[0]?.id || null
}

export async function selectActiveStoreId(
  orgId: string,
  userId: string,
  role: string,
  requestedStoreId?: string | null
): Promise<string | null> {
  const stores = await getStoresForUser(orgId, userId, role)
  if (stores.length === 0) {
    await clearActiveStoreId()
    return null
  }

  const nextStoreId = normalizeStoreId(requestedStoreId)
  const matched = nextStoreId ? stores.find((store) => store.id === nextStoreId) : null
  const resolvedStoreId = matched?.id || stores.find((store) => store.is_default)?.id || stores[0]?.id || null

  if (!resolvedStoreId) {
    await clearActiveStoreId()
    return null
  }

  await persistActiveStoreId(resolvedStoreId)
  return resolvedStoreId
}
