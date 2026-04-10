import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getProfile, upsertProfile } from "@/lib/data/profiles"
import { updateSystemSettings } from "@/lib/data/organizations"
import { resolveRequestOrgContext } from "@/lib/server/org-context"

const ALLOWED_GOVERNANCE_KEYS = new Set([
  "allow_staff_inventory",
  "allow_staff_sales",
  "allow_staff_reports",
  "allow_staff_reports_entry_only",
  "allow_staff_analytics",
  "allow_staff_add_inventory",
  "gst_enabled",
  "gst_inclusive",
  "show_buy_price_in_sales",
])

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profile = await getProfile(session.userId)
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const action = String(body?.action || "").trim()

    if (action === "biometric") {
      const biometricRequired = Boolean(body?.biometricRequired)
      await upsertProfile({
        ...profile,
        biometric_required: biometricRequired,
      })
      return NextResponse.json({ ok: true, biometricRequired })
    }

    if (action === "governance") {
      const ctx = await resolveRequestOrgContext()
      if (ctx.isGuest) {
        return NextResponse.json({ error: "Guest mode cannot update governance settings" }, { status: 403 })
      }

      if (ctx.role !== "owner") {
        return NextResponse.json({ error: "Owner privileges required" }, { status: 403 })
      }

      const rawSettings = body?.settings
      if (!rawSettings || typeof rawSettings !== "object") {
        return NextResponse.json({ error: "Settings payload required" }, { status: 400 })
      }

      const sanitizedEntries = Object.entries(rawSettings).filter(([key, value]) => {
        return ALLOWED_GOVERNANCE_KEYS.has(key) && typeof value === "boolean"
      })

      if (sanitizedEntries.length === 0) {
        return NextResponse.json({ error: "No valid governance updates supplied" }, { status: 400 })
      }

      const updates = Object.fromEntries(sanitizedEntries)
      await updateSystemSettings(updates, ctx.orgId)
      return NextResponse.json({ ok: true, settings: updates })
    }

    return NextResponse.json({ error: "Unsupported security settings action" }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Security settings update failed" }, { status: 500 })
  }
}
