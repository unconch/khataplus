import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/data/auth"
import { getSession } from "@/lib/session"
import { describeSession, getUserSessions, registerSession, revokeAllSessions, revokeSession } from "@/lib/session-governance"

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const authSession = await getSession()
  const currentSessionId = authSession?.sessionId || ""

  if (currentSessionId) {
    const details = describeSession(request.headers)
    await registerSession({
      userId: user.userId,
      sessionId: currentSessionId,
      userAgent: details.userAgent,
      ipAddress: details.ipAddress,
    })
  }

  const sessions = await getUserSessions(user.userId, currentSessionId)

  return NextResponse.json({
    sessions,
    currentSessionId: currentSessionId || null,
  })
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const revokeAll = Boolean(body?.revokeAll)
  const sessionId = String(body?.sessionId || "").trim()

  if (revokeAll) {
    await revokeAllSessions(user.userId)
    return NextResponse.json({ ok: true, revoked: "all" })
  }

  if (!sessionId) {
    return NextResponse.json({ error: "Session ID required" }, { status: 400 })
  }

  await revokeSession(user.userId, sessionId)
  return NextResponse.json({ ok: true, revoked: sessionId })
}
