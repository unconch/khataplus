import { NextResponse } from "next/server"
import { getProductionSql, sql } from "@/lib/db"
import { requirePlanFeature, PlanFeatureError } from "@/lib/plan-feature-guard"

export async function POST(request: Request) {
  const db = getProductionSql() as any
  try {
    const body = await request.json()
    const orgId = String(body?.orgId || "").trim()
    if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 })
    await requirePlanFeature(orgId, "migration_import")

    const tablesRes = await sql`
      SELECT table_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND column_name = 'org_id'
      ORDER BY table_name
    `
    const skip = new Set(["organizations", "organization_members"])
    const tables = (tablesRes as any[])
      .map((r: any) => r.table_name)
      .filter((t: string) => !skip.has(t))
    const deleteOrder = [
      "sales",
      "expenses",
      "khata_transactions",
      "supplier_transactions",
      "daily_reports",
      "audit_logs",
      "customers",
      "suppliers",
      "inventory",
    ]
    const priority = new Map(deleteOrder.map((t, i) => [t, i]))
    tables.sort((a: string, b: string) => {
      const pa = priority.has(a) ? (priority.get(a) as number) : Number.MAX_SAFE_INTEGER
      const pb = priority.has(b) ? (priority.get(b) as number) : Number.MAX_SAFE_INTEGER
      return pa - pb
    })

    // IMPORTANT: BEGIN, all DELETEs, and COMMIT must run on the SAME connection.
    // Previously, BEGIN/COMMIT used the `sql` pool tag while DELETEs used db.query —
    // those are different connections, so the deletes were NOT inside the transaction.
    await db.query("BEGIN")
    try {
      await db.query(`
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_enforce_sales_immutability') THEN
            ALTER TABLE sales DISABLE TRIGGER trg_enforce_sales_immutability;
          END IF;
          IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_enforce_audit_immutability') THEN
            ALTER TABLE audit_logs DISABLE TRIGGER trg_enforce_audit_immutability;
          END IF;
        END $$;
      `)

      for (const t of tables) {
        const table = String(t).replace(/"/g, "\"\"")
        await db.query(`DELETE FROM "${table}" WHERE org_id = $1`, [orgId])
      }

      await db.query(`
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_enforce_sales_immutability') THEN
            ALTER TABLE sales ENABLE TRIGGER trg_enforce_sales_immutability;
          END IF;
          IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_enforce_audit_immutability') THEN
            ALTER TABLE audit_logs ENABLE TRIGGER trg_enforce_audit_immutability;
          END IF;
        END $$;
      `)
      await db.query("COMMIT")
    } catch (e) {
      await db.query("ROLLBACK")
      throw e
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    if (error instanceof PlanFeatureError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }
    return NextResponse.json({ error: error?.message || "Discard failed" }, { status: 500 })
  }
}
