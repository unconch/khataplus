import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { sql } from "@/lib/db"
import { ensureImportJobsTable } from "../_shared"
import { requirePlanFeature, PlanFeatureError } from "@/lib/plan-feature-guard"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const orgId = String(body?.orgId || "").trim()
    const tempFiles = Array.isArray(body?.tempFiles) ? body.tempFiles : []

    if (!orgId || tempFiles.length === 0) {
      return NextResponse.json({ error: "orgId and tempFiles are required" }, { status: 400 })
    }

    await requirePlanFeature(orgId, "migration_import")

    await ensureImportJobsTable()

    const jobId = randomUUID()
    await sql`
      INSERT INTO import_jobs (id, org_id, status, temp_files)
      VALUES (${jobId}, ${orgId}, 'queued', ${JSON.stringify(tempFiles)}::jsonb)
    `

    const origin = new URL(request.url).origin
    // Fire-and-forget first worker tick. Job chain continues server-side.
    fetch(`${origin}/api/migration/jobs/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    }).catch(() => {})

    return NextResponse.json({ ok: true, jobId })
  } catch (error: any) {
    if (error instanceof PlanFeatureError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }
    return NextResponse.json({ error: error?.message || "Failed to start job" }, { status: 500 })
  }
}
