import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function resolveEnvelopeUrl(dsn: string): string | null {
  try {
    const url = new URL(dsn)
    const projectId = url.pathname.replace(/^\/+/, "").split("/").filter(Boolean).pop()
    const publicKey = url.username

    if (!projectId || !publicKey) return null

    return `${url.protocol}//${url.host}/api/${projectId}/envelope/?sentry_key=${encodeURIComponent(publicKey)}&sentry_version=7`
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN ?? ""
  const envelopeUrl = resolveEnvelopeUrl(dsn)

  if (!envelopeUrl) {
    return NextResponse.json({ error: "Sentry tunnel is not configured." }, { status: 500 })
  }

  const payload = await request.text()
  if (!payload) {
    return NextResponse.json({ error: "Empty Sentry payload." }, { status: 400 })
  }

  try {
    const upstream = await fetch(envelopeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-sentry-envelope" },
      body: payload,
      cache: "no-store",
    })

    return new NextResponse(null, {
      status: upstream.ok ? 200 : upstream.status,
      headers: { "Cache-Control": "no-store" },
    })
  } catch {
    return NextResponse.json({ error: "Failed to forward Sentry payload." }, { status: 502 })
  }
}
