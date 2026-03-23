import { NextResponse } from "next/server";
import { getDemoSql } from "@/lib/db";

const ensureFeatureRequestSchema = async () => {
  const demoSql = getDemoSql() as any;

  await demoSql.query(`CREATE SCHEMA IF NOT EXISTS demo_feedback`);
  await demoSql.query(`
    CREATE TABLE IF NOT EXISTS demo_feedback.feature_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      page TEXT NOT NULL DEFAULT 'roadmap',
      title TEXT NOT NULL,
      details TEXT NOT NULL,
      contact_email TEXT,
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await demoSql.query(`
    CREATE INDEX IF NOT EXISTS idx_demo_feature_requests_submitted_at
    ON demo_feedback.feature_requests (submitted_at DESC)
  `);
};

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const title = String(body?.title || "").trim();
    const details = String(body?.details || "").trim();
    const contactEmail = String(body?.contactEmail || "").trim();
    const page = String(body?.page || "roadmap").trim() || "roadmap";

    if (!title || !details) {
      return NextResponse.json({ error: "Title and details are required." }, { status: 400 });
    }

    await ensureFeatureRequestSchema();

    const demoSql = getDemoSql();
    const rows = await demoSql`
      INSERT INTO demo_feedback.feature_requests (page, title, details, contact_email)
      VALUES (${page}, ${title}, ${details}, ${contactEmail || null})
      RETURNING id, submitted_at
    `;

    return NextResponse.json({ ok: true, request: rows[0] || null });
  } catch (error: any) {
    console.error("[ROADMAP/FEATURE_REQUEST]", error);
    return NextResponse.json({ error: error?.message || "Failed to submit feature request." }, { status: 500 });
  }
}
