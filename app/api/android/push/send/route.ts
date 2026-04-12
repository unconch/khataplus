import { NextResponse } from "next/server"
import { broadcastAndroidPush } from "@/lib/android-push"

function getSecret(request: Request) {
  return (
    request.headers.get("x-khataplus-push-secret") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    ""
  ).trim()
}

export async function POST(request: Request) {
  const secret = getSecret(request)
  const expected = process.env.ANDROID_PUSH_WEBHOOK_SECRET?.trim()

  if (!expected || secret !== expected) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({} as any))
    const result = await broadcastAndroidPush({
      id: String(body?.id || `${body?.version || "release"}-${Date.now()}`),
      version: String(body?.version || "").trim(),
      date: body?.date ? String(body.date).trim() : null,
      title: String(body?.title || "KhataPlus update available").trim(),
      summary: String(body?.summary || "A new Android build is ready.").trim(),
      highlights: Array.isArray(body?.highlights)
        ? body.highlights.map((item: any) => String(item).trim()).filter(Boolean)
        : [],
      downloadUrl: body?.downloadUrl ? String(body.downloadUrl).trim() : null,
    })

    return NextResponse.json({ ok: true, result })
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unable to broadcast Android push" },
      { status: 500 }
    )
  }
}
