import "server-only"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/data/auth"
import { createSessionFingerprint } from "@/lib/session-identity"

export interface SessionStepUpClaims {
  authTime: number | null
  methods: string[]
  acr: string | null
}

function normalizeUnixSeconds(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value > 1_000_000_000_000) return Math.floor(value / 1000)
    if (value > 0) return Math.floor(value)
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return normalizeUnixSeconds(parsed)
  }
  return null
}

function decodeJwtPayload(token: string): Record<string, any> | null {
  if (!token) return null
  const parts = token.split(".")
  if (parts.length < 2) return null

  try {
    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(parts[1].length / 4) * 4, "=")

    return JSON.parse(Buffer.from(payload, "base64").toString("utf8"))
  } catch {
    return null
  }
}

function normalizeMethods(value: unknown): string[] {
  const out = new Set<string>()
  if (Array.isArray(value)) {
    value.forEach((entry) => {
      if (typeof entry === "string" && entry.trim()) {
        out.add(entry.trim().toLowerCase())
        return
      }

      if (entry && typeof entry === "object") {
        const method = (entry as any).method
        if (typeof method === "string" && method.trim()) {
          out.add(method.trim().toLowerCase())
        }
      }
    })
  } else if (typeof value === "string" && value.trim()) {
    out.add(value.trim().toLowerCase())
  }
  return Array.from(out)
}

function extractStepUpClaimsFromToken(token: string | null): SessionStepUpClaims {
  const claims = decodeJwtPayload(token || "")
  const authTime = normalizeUnixSeconds(
    claims?.auth_time ?? claims?.iat ?? claims?.exp ?? null
  )
  const methods = normalizeMethods(claims?.amr)
  const acr = typeof claims?.aal === "string" ? claims.aal : typeof claims?.acr === "string" ? claims.acr : null
  return { authTime, methods, acr }
}

export async function getSession() {
  try {
    const cookieStore = await cookies()
    const currentUser = await getCurrentUser()
    if (currentUser?.authMethod === "passkey") {
      const passkeySessionCookie = cookieStore.get("kp_passkey_session")?.value || null
      const isBiometricVerified = cookieStore.get("biometric_verified")?.value === "true"
      return {
        user: {
          id: currentUser.userId,
          email: currentUser.email || undefined,
          name: null,
        },
        userId: currentUser.userId,
        email: currentUser.email || undefined,
        role: null,
        isBiometricVerified,
        sessionId: createSessionFingerprint(passkeySessionCookie),
        stepUp: { authTime: null, methods: ["passkey"], acr: null },
      }
    }

    const supabase = await createClient()

    // Serialize these calls to avoid race conditions in Turbopack/Next.js 16
    const { data: sessionData } = await supabase.auth.getSession()
    const { data: userData } = await supabase.auth.getUser()

    const user = userData?.user || sessionData?.session?.user
    if (!user?.id) return null

    const isBiometricVerified = cookieStore.get("biometric_verified")?.value === "true"
    const accessToken = sessionData?.session?.access_token || null
    const stepUp = extractStepUpClaimsFromToken(accessToken)

    const name =
      (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
      (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
      null
    const role =
      typeof user.user_metadata?.active_org_role === "string"
        ? user.user_metadata.active_org_role
        : null

    return {
      user: {
        id: user.id,
        email: user.email || undefined,
        name,
      },
      userId: user.id,
      email: user.email || undefined,
      role,
      isBiometricVerified,
      sessionId: createSessionFingerprint(accessToken),
      stepUp,
    }
  } catch (e) {
    console.error("Supabase session error:", e)
    return null
  }
}
