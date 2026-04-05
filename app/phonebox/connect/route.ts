import { NextResponse } from "next/server"
import { createPhoneBoxConnectCode } from "@/lib/data/phonebox"
import { getSession } from "@/lib/session"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const deviceName = String(url.searchParams.get("device_name") || "Front Counter").trim() || "Front Counter"
  const redirectUri = String(url.searchParams.get("redirect_uri") || "phonebox://connect").trim() || "phonebox://connect"
  const orgId = url.searchParams.get("org_id")

  const session = await getSession()
  if (!session?.userId) {
    const loginUrl = new URL("/auth/login", url.origin)
    loginUrl.searchParams.set("next", `${url.pathname}${url.search}`)
    return NextResponse.redirect(loginUrl)
  }

  try {
    const result = await createPhoneBoxConnectCode({
      orgId,
      deviceName,
      redirectUri,
    })
    return Response.redirect(`${redirectUri}?code=${encodeURIComponent(result.code)}`, 302)
  } catch {
    return Response.redirect(`${url.origin}/app/dashboard?phonebox_connect=failed`, 302)
  }
}
