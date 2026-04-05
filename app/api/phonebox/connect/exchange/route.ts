import { NextResponse } from "next/server"
import { exchangePhoneBoxConnectCode, resolvePhoneBoxBaseUrl } from "@/lib/data/phonebox"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({} as any))
    const code = String(body?.code || "").trim()
    if (!code) {
      return NextResponse.json({ error: "Connect code is required." }, { status: 400 })
    }

    const result = await exchangePhoneBoxConnectCode({
      code,
      deviceName: body?.deviceName ? String(body.deviceName) : null,
      deviceModel: body?.deviceModel ? String(body.deviceModel) : null,
      appVersion: body?.appVersion ? String(body.appVersion) : null,
    })

    return NextResponse.json({
      ok: true,
      token: result.token,
      deviceId: result.deviceId,
      baseUrl: await resolvePhoneBoxBaseUrl(),
      organizationId: result.organization.id,
      organizationName: result.organization.name,
      organizationSlug: result.organization.slug,
      role: result.organization.role,
    })
  } catch (error: any) {
    if (String(error?.message || "") === "INVALID_CODE") {
      return NextResponse.json({ error: "Invalid or expired connect code." }, { status: 401 })
    }
    return NextResponse.json({ error: error?.message || "Could not exchange connect code." }, { status: 500 })
  }
}
