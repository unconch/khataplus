import { NextResponse } from "next/server"
import { getCurrentUser, getUserOrganizationsResolved } from "@/lib/data/auth"
import { getProfile } from "@/lib/data/profiles"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ isAuthenticated: false, isGuest: false, orgSlug: null, userName: null, orgName: null })
    }

    if (user.isGuest) {
      return NextResponse.json({
        isAuthenticated: true,
        isGuest: true,
        orgSlug: "demo",
        userName: "Guest User",
        orgName: "KhataPlus Demo",
      })
    }

    let orgSlug: string | null = null
    let orgName: string | null = null
    const orgs = await getUserOrganizationsResolved(user.userId)
    const primaryOrg = orgs[0]?.organization || null
    orgSlug = primaryOrg?.slug || null
    orgName = primaryOrg?.name || null

    const profile = await getProfile(user.userId)
    const userName = profile?.name || profile?.email || user.email || null

    return NextResponse.json({
      isAuthenticated: true,
      isGuest: Boolean(user.isGuest),
      orgSlug,
      userName,
      orgName,
    })
  } catch {
    return NextResponse.json({ isAuthenticated: false, isGuest: false, orgSlug: null, userName: null, orgName: null })
  }
}
