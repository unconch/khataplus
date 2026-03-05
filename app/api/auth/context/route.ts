import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/data/auth"
import { getUserOrganizations } from "@/lib/data/organizations"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ isAuthenticated: false, isGuest: false, orgSlug: null })
    }

    let orgSlug: string | null = null
    if (!user.isGuest) {
      const orgs = await getUserOrganizations(user.userId)
      orgSlug = orgs[0]?.organization?.slug || null
    }

    return NextResponse.json({
      isAuthenticated: true,
      isGuest: Boolean(user.isGuest),
      orgSlug,
    })
  } catch {
    return NextResponse.json({ isAuthenticated: false, isGuest: false, orgSlug: null })
  }
}
