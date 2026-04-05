import { NextResponse } from "next/server"
import { buildAuthContext } from "@/lib/data/auth"

export async function GET() {
  try {
    const auth = await buildAuthContext()

    return NextResponse.json({
      isAuthenticated: auth.isAuthenticated,
      isGuest: auth.isGuest,
      orgSlug: auth.orgSlug,
      orgName: auth.orgName,
    })
  } catch {
    return NextResponse.json({ isAuthenticated: false, isGuest: false, orgSlug: null, orgName: null })
  }
}
