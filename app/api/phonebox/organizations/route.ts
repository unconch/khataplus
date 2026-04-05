import { NextResponse } from "next/server"
import { listPhoneBoxOrganizationsForToken, requirePhoneBoxToken } from "@/lib/data/phonebox"

export async function GET(request: Request) {
  try {
    const token = await requirePhoneBoxToken(request)
    const organizations = await listPhoneBoxOrganizationsForToken(token)
    return NextResponse.json(organizations)
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
