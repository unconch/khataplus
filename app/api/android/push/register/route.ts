import { NextResponse } from "next/server"
import { registerAndroidPushDevice } from "@/lib/android-push"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({} as any))
    const result = await registerAndroidPushDevice({
      installationId: String(body?.installationId || "").trim(),
      fcmToken: String(body?.fcmToken || "").trim(),
      deviceModel: body?.deviceModel ? String(body.deviceModel) : null,
      appVersion: body?.appVersion ? String(body.appVersion) : null,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unable to register device" },
      { status: 400 }
    )
  }
}
