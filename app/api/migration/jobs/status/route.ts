import { NextResponse } from "next/server"
import { ensureImportJobsTable, getJob } from "../_shared"
import { requirePlanFeature, PlanFeatureError } from "@/lib/plan-feature-guard"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = String(searchParams.get("jobId") || "").trim()
    if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 })

    await ensureImportJobsTable()
    const job = await getJob(jobId)
    if (!job) return NextResponse.json({ error: "job not found" }, { status: 404 })
    await requirePlanFeature(String(job.org_id), "migration_import")

    return NextResponse.json({
      id: job.id,
      orgId: job.org_id,
      status: job.status,
      totalRecords: Number(job.total_records || 0),
      processedRecords: Number(job.processed_records || 0),
      totalSteps: Number(job.total_steps || 0),
      completedSteps: Number(job.completed_steps || 0),
      currentType: job.current_type || null,
      successRows: Number(job.success_rows || 0),
      failedRows: Number(job.failed_rows || 0),
      errors: Array.isArray(job.errors) ? job.errors : [],
      result: job.result || null,
      errorMessage: job.error_message || null,
    })
  } catch (error: any) {
    if (error instanceof PlanFeatureError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }
    return NextResponse.json({ error: error?.message || "Failed to fetch job status" }, { status: 500 })
  }
}
