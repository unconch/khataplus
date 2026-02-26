import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { upsertProfile } from "@/lib/data/profiles"
import { updateOrganization, updateSystemSettings } from "@/lib/data/organizations"

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const isProfileView = Boolean(body?.isProfileView)
    const profile = body?.profile
    const org = body?.org
    const settings = body?.settings

    if (!profile?.id || profile.id !== session.userId) {
      return NextResponse.json({ error: "Forbidden profile update" }, { status: 403 })
    }

    if (isProfileView) {
      await upsertProfile(profile)
      return NextResponse.json({ ok: true })
    }

    if (!org?.id) {
      return NextResponse.json({ error: "Organization ID required" }, { status: 400 })
    }

    await updateOrganization(org.id, org)
    await updateSystemSettings(settings || {}, org.id)
    await upsertProfile(profile)

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Update failed" }, { status: 500 })
  }
}
