import { NextResponse } from "next/server"
import { registerPhoneBoxDevice, requirePhoneBoxToken } from "@/lib/data/phonebox"

export async function POST(request: Request) {
  try {
    const token = await requirePhoneBoxToken(request)
    const body = await request.json().catch(() => ({} as any))

    const result = await registerPhoneBoxDevice(token, {
      deviceName: String(body?.deviceName || token.device_name || "Front Counter"),
      deviceModel: body?.deviceModel ? String(body.deviceModel) : null,
      appVersion: body?.appVersion ? String(body.appVersion) : null,
      organizationId: body?.organizationId ? String(body.organizationId) : null,
      monitoredPackages: Array.isArray(body?.monitoredPackages)
        ? body.monitoredPackages.map((value: any) => String(value))
        : [],
    })

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
