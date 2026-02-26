import { sql } from "@/lib/db"

export async function ensureImportJobsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS import_jobs (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      temp_files JSONB NOT NULL DEFAULT '[]'::jsonb,
      payload_bucket TEXT,
      payload_path TEXT,
      total_records INTEGER NOT NULL DEFAULT 0,
      processed_records INTEGER NOT NULL DEFAULT 0,
      total_steps INTEGER NOT NULL DEFAULT 0,
      completed_steps INTEGER NOT NULL DEFAULT 0,
      cursor_type_index INTEGER NOT NULL DEFAULT 0,
      cursor_offset INTEGER NOT NULL DEFAULT 0,
      current_type TEXT,
      success_rows INTEGER NOT NULL DEFAULT 0,
      failed_rows INTEGER NOT NULL DEFAULT 0,
      errors JSONB NOT NULL DEFAULT '[]'::jsonb,
      result JSONB,
      error_message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
}

export async function getJob(jobId: string) {
  const rows = await sql`SELECT * FROM import_jobs WHERE id = ${jobId} LIMIT 1`
  return rows[0] as any
}

