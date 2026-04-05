import { NextResponse } from "next/server"
import { createPhoneBoxConnectCode } from "@/lib/data/phonebox"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({} as any))
    const deviceName = String(body?.deviceName || "Front Counter").trim() || "Front Counter"
    const redirectUri = String(body?.redirectUri || "phonebox://connect").trim() || "phonebox://connect"
    const orgId = body?.orgId ? String(body.orgId) : null

    const result = await createPhoneBoxConnectCode({
      orgId,
      deviceName,
      redirectUri,
    })

    return NextResponse.json({
      ok: true,
      code: result.code,
      organization: result.organization,
      redirectUrl: `${redirectUri}?code=${encodeURIComponent(result.code)}`,
    })
  } catch (error: any) {
    if (String(error?.message || "") === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (String(error?.message || "") === "NO_ORGANIZATION") {
      return NextResponse.json({ error: "No organization available for this account." }, { status: 400 })
    }
    return NextResponse.json({ error: error?.message || "Could not start PhoneBox connect." }, { status: 500 })
  }
}
