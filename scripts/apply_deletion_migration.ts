import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

// We'll build statements dynamically based on existing schema details.
// See runOnUrl for per-database checks.

function quoteIdent(name: string) {
    return '"' + name.replace(/"/g, '""') + '"'
}

async function tableExists(sql: any, table: string) {
    const res = await sql`SELECT to_regclass(${table}) as exists`;
    return !!res[0].exists;
}

async function getColumnType(sql: any, table: string, column: string) {
    const res = await sql`
        SELECT data_type, udt_name
        FROM information_schema.columns
        WHERE table_name = ${table} AND column_name = ${column}
    `;
    if (!res || res.length === 0) return null;
    return res[0];
}

async function runOnUrl(name: string, url: string) {
    console.log(`\n[${name}] Connecting...`)
    const sql = neon(url)

    // list of candidate tables to alter
    const tables = ['inventory','sales','customers','suppliers','expenses','reports','khata_transactions','supplier_transactions','audit_logs','organization_members','organization_invites']

    // determine org id and profile id types
    const orgIdCol = await getColumnType(sql, 'organizations', 'id')
    const profileIdCol = await getColumnType(sql, 'profiles', 'id')

    const orgIdType = orgIdCol ? (orgIdCol.udt_name === 'uuid' ? 'UUID' : orgIdCol.data_type.toUpperCase() === 'TEXT' || orgIdCol.udt_name === 'text' ? 'TEXT' : orgIdCol.udt_name.toUpperCase()) : null
    const profileIdType = profileIdCol ? (profileIdCol.udt_name === 'uuid' ? 'UUID' : profileIdCol.data_type.toUpperCase() === 'TEXT' || profileIdCol.udt_name === 'text' ? 'TEXT' : profileIdCol.udt_name.toUpperCase()) : null

    if (!orgIdType) {
        console.warn(`[${name}] Unable to determine organizations.id type — skipping FK adjustments and deletion tables.`)
    }

    for (const t of tables) {
        try {
            const exists = await tableExists(sql, t)
            if (!exists) {
                console.log(`[${name}] Skipping ${t} — table does not exist.`)
                continue
            }

            // Check whether the table has an org_id column
            const col = await getColumnType(sql, t, 'org_id')
            if (!col) {
                console.log(`[${name}] Skipping ${t} — no org_id column.`)
                continue
            }

            // Ensure types match before adding FK
            const colType = col.udt_name === 'uuid' ? 'UUID' : (col.data_type.toUpperCase() === 'TEXT' || col.udt_name === 'text' ? 'TEXT' : col.udt_name.toUpperCase())
            if (!orgIdType || colType !== orgIdType) {
                console.warn(`[${name}] Type mismatch for ${t}.org_id (${colType}) vs organizations.id (${orgIdType}). Skipping FK change.`)
                continue
            }

            const constraintName = `${t}_org_id_fkey`
            const stmt = `ALTER TABLE ${quoteIdent(t)} DROP CONSTRAINT IF EXISTS ${quoteIdent(constraintName)}, ADD CONSTRAINT ${quoteIdent(constraintName)} FOREIGN KEY (org_id) REFERENCES ${quoteIdent('organizations')}(id) ON DELETE CASCADE;`
            console.log(`[${name}] Executing on ${t}: ${stmt.substring(0,80)}...`)
            await (sql as any).query(stmt)
        } catch (e) {
            console.error(`[${name}] Failed to update table ${t}:`, e)
        }
    }

    // Create deletion tracking tables using matching types
    if (orgIdType && profileIdType) {
        // Ensure we pick matching types and defaults to avoid cast errors
        const requestsIdType = orgIdType === 'UUID' ? 'UUID' : (orgIdType === 'TEXT' ? 'TEXT' : orgIdType)
        const requestsIdDefault = requestsIdType === 'UUID' ? 'gen_random_uuid()' : "gen_random_uuid()::text"
        const requestedByType = profileIdType === 'UUID' ? 'UUID' : (profileIdType === 'TEXT' ? 'TEXT' : profileIdType)

        const createRequests = `CREATE TABLE IF NOT EXISTS org_deletion_requests (
            id ${requestsIdType} PRIMARY KEY DEFAULT ${requestsIdDefault},
            org_id ${orgIdType} NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            requested_by ${requestedByType} NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            org_name TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'cancelled', 'expired')),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days'
        );`

        try {
            console.log(`[${name}] Creating org_deletion_requests table...`)
            await (sql as any).query(createRequests)
        } catch (e) {
            console.error(`[${name}] Failed to create org_deletion_requests:`, e)
        }

        try {
            await (sql as any).query(`CREATE INDEX IF NOT EXISTS idx_deletion_requests_org_id ON org_deletion_requests(org_id) WHERE status = 'pending';`)
        } catch (e) {
            console.error(`[${name}] Failed to create deletion requests index:`, e)
        }

        const approvalsIdType = requestsIdType
        const approvalsIdDefault = requestsIdDefault

        const createApprovals = `CREATE TABLE IF NOT EXISTS org_deletion_approvals (
            id ${approvalsIdType} PRIMARY KEY DEFAULT ${approvalsIdDefault},
            request_id ${approvalsIdType} NOT NULL REFERENCES org_deletion_requests(id) ON DELETE CASCADE,
            owner_id ${requestedByType} NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            owner_name TEXT NOT NULL,
            owner_email TEXT NOT NULL,
            approved BOOLEAN DEFAULT NULL,
            responded_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(request_id, owner_id)
        );`

        try {
            console.log(`[${name}] Creating org_deletion_approvals table...`)
            await (sql as any).query(createApprovals)
        } catch (e) {
            console.error(`[${name}] Failed to create org_deletion_approvals:`, e)
        }

        try {
            await (sql as any).query(`CREATE INDEX IF NOT EXISTS idx_deletion_requests_expires ON org_deletion_requests(expires_at) WHERE status = 'pending';`)
        } catch (e) {
            console.error(`[${name}] Failed to create deletion requests expires index:`, e)
        }
    } else {
        console.warn(`[${name}] Skipping creation of deletion tables because org/profile id types are unknown.`)
    }

    console.log(`[${name}] Done.`)
}

async function main() {
  const prod = process.env.DATABASE_URL
  const demo = process.env.DEMO_DATABASE_URL

  if (!prod && !demo) {
    console.error('No DATABASE_URL or DEMO_DATABASE_URL found in .env.local')
    process.exit(1)
  }

  if (prod) await runOnUrl('Production', prod)
  if (demo) await runOnUrl('Demo', demo)

  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
