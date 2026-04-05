import { NextResponse } from "next/server"
import { listPhoneBoxMembers, requirePhoneBoxToken } from "@/lib/data/phonebox"

export async function GET(request: Request) {
  try {
    const token = await requirePhoneBoxToken(request)
    const { searchParams } = new URL(request.url)
    const orgId = String(searchParams.get("orgId") || token.org_id).trim()
    const members = await listPhoneBoxMembers(orgId, token.user_id)
    return NextResponse.json(members)
  } catch (error: any) {
    if (String(error?.message || "") === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
