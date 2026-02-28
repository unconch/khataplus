import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { mkdir, writeFile } from "fs/promises"
import { join } from "path"
import { tmpdir } from "os"
import { requirePlanFeature, PlanFeatureError } from "@/lib/plan-feature-guard"

const BUCKET = "local"
const LOCAL_DIR = join(tmpdir(), "khataplus-migration-temp")

async function ensureBucket() {
  await mkdir(LOCAL_DIR, { recursive: true })
}

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const orgId = String(form.get("orgId") || "").trim()
    const file = form.get("file")

    if (!orgId || !(file instanceof File)) {
      return NextResponse.json({ error: "orgId and file are required" }, { status: 400 })
    }

    await requirePlanFeature(orgId, "migration_import")

    await ensureBucket()

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const key = `org/${orgId}/${Date.now()}-${randomUUID()}-${safeName}`
    const fullPath = join(LOCAL_DIR, key.replace(/[\\/]/g, "_"))
    const arrayBuffer = await file.arrayBuffer()
    const bytes = Buffer.from(arrayBuffer)

    await writeFile(fullPath, bytes)

    return NextResponse.json({
      ok: true,
      bucket: BUCKET,
      path: fullPath,
      name: file.name,
      size: file.size,
    })
  } catch (error: any) {
    if (error instanceof PlanFeatureError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }
    return NextResponse.json({ error: error?.message || "Upload failed" }, { status: 500 })
  }
}
