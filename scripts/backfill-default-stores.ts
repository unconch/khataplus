import "dotenv/config"

import { randomUUID } from "node:crypto"
import { sql } from "./db"

function makeStoreId(orgId: string) {
  return `store_${String(orgId).replace(/[^a-zA-Z0-9]/g, "").slice(0, 24)}_main`
}

async function ensureStoreSchema() {
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
}

async function ensureDefaultStore(orgId: string) {
  await ensureStoreSchema()

  const existingRows = await sql`
    SELECT *
    FROM stores
    WHERE org_id = ${orgId}
    ORDER BY is_default DESC, created_at ASC
    LIMIT 1
  `

  if (existingRows[0]) {
    const existing = existingRows[0] as any
    if (!existing.is_default) {
      const currentId = String(existing.id)
      await sql`
        UPDATE stores
        SET is_default = CASE WHEN id = ${currentId} THEN true ELSE false END,
            updated_at = NOW()
        WHERE org_id = ${orgId}
      `
      existing.is_default = true
    }
    return existing
  }

  const id = makeStoreId(orgId) || `store_${randomUUID().replace(/-/g, "")}`
  const inserted = await sql`
    INSERT INTO stores (id, org_id, name, code, address, phone, is_default, is_active)
    VALUES (${id}, ${orgId}, 'Main Branch', 'MAIN', NULL, NULL, true, true)
    RETURNING *
  `

  return inserted[0]
}

async function main() {
  const orgs = await sql`SELECT id, name, slug FROM organizations ORDER BY created_at ASC`

  if (orgs.length === 0) {
    console.log("[backfill-default-stores] No organizations found.")
    return
  }

  console.log(`[backfill-default-stores] Ensuring default stores for ${orgs.length} organizations...`)

  for (const org of orgs as Array<{ id: string; name?: string | null; slug?: string | null }>) {
    const store = await ensureDefaultStore(org.id)
    console.log(
      `[backfill-default-stores] ${org.id} (${org.slug || org.name || "unknown"}) -> ${store.id} (${store.name})`
    )
  }

  console.log("[backfill-default-stores] Completed successfully.")
}

main().catch((error) => {
  console.error("[backfill-default-stores] Failed:", error)
  process.exit(1)
})
