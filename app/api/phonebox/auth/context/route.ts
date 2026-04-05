import { NextResponse } from "next/server"
import { listPhoneBoxOrganizationsForToken, requirePhoneBoxToken } from "@/lib/data/phonebox"

export async function GET(request: Request) {
  try {
    const token = await requirePhoneBoxToken(request)
    const organizations = await listPhoneBoxOrganizationsForToken(token)
    const activeOrg = organizations.find((org) => org.id === token.org_id) || organizations[0] || null

    return NextResponse.json({
      isAuthenticated: true,
      isGuest: false,
      orgId: activeOrg?.id ?? null,
      orgSlug: activeOrg?.slug ?? null,
      orgName: activeOrg?.name ?? null,
      deviceId: token.id,
      deviceName: token.device_name,
    })
  } catch {
    return NextResponse.json({
      isAuthenticated: false,
      isGuest: false,
      orgId: null,
      orgSlug: null,
      orgName: null,
      deviceId: null,
      deviceName: null,
    }, { status: 401 })
  }
}
