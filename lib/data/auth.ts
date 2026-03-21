import "server-only"

import { headers } from "next/headers"
import { NextResponse } from "next/server"

import { sql } from "@/lib/db"
import { getProfile } from "@/lib/data/profiles"
import { createClient } from "@/lib/supabase/server"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const AUTH_STATE_COOKIE_NAMES = ["guest_mode", "biometric_verified", "kp_auth_next"] as const

export type AuthFlowMode = "login" | "register"

export type CurrentUser = {
  userId: string
  email: string
  isGuest: boolean
}

export type AuthOrganization = {
  id: string
  name: string | null
  role: string | null
  slug: string | null
}

export type AuthSendOtpInput = {
  email: string
  mode: AuthFlowMode
  name?: string
  next?: string
}

export type AuthSendOtpResult = {
  ok: boolean
  status: number
  phase: "verify" | "error"
  email?: string
  maskedEmail?: string
  next?: string
  error?: string
  redirectTo?: string
  org?: AuthOrganization | null
  user?: {
    email: string
    id: string
  }
}

export type AuthVerifyOtpInput = {
  email: string
  mode: AuthFlowMode
  name?: string
  next?: string
  token: string
}

export type AuthVerifyOtpResult = {
  ok: boolean
  status: number
  phase: "authenticated" | "error"
  error?: string
  maskedEmail?: string
  next?: string
  redirectTo?: string
  org?: AuthOrganization | null
  user?: {
    email: string
    id: string
  }
}

export type AuthCodeExchangeResult = {
  ok: boolean
  status: number
  error?: string
  redirectTo?: string
}

export type AuthContextResult = {
  authenticated: boolean
  guest: boolean
  isAuthenticated: boolean
  isGuest: boolean
  org: AuthOrganization | null
  orgName: string | null
  orgSlug: string | null
  redirectTo: string | null
  user: {
    email: string | null
    id: string | null
    name: string | null
  } | null
  userName: string | null
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function isValidEmail(email: string) {
  return EMAIL_PATTERN.test(email)
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label}_TIMEOUT`)), ms)
    promise
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch((err) => {
        clearTimeout(timer)
        reject(err)
      })
  })
}

export function maskEmail(email: string) {
  const [local, domain] = email.split("@")
  if (!local || !domain) return email
  if (local.length <= 2) return `${local[0] || "*"}*@${domain}`
  return `${local.slice(0, 2)}***@${domain}`
}

export function sanitizeNextPath(next: unknown, fallback = "/app/dashboard") {
  if (typeof next !== "string") return fallback

  const candidate = next.trim()
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.startsWith("/auth/")) {
    return fallback
  }

  return candidate || fallback
}

async function persistActiveOrgSlug(slug: string | null) {
  if (!slug) return
  // Placeholder persistence; intentionally fire-and-forget in verifyOtp
  return
}

async function resolveAppOrigin() {
  const headerStore = await headers()
  const forwardedHost = headerStore.get("x-forwarded-host")
  const host = forwardedHost || headerStore.get("host")
  const protocolHint = headerStore.get("x-forwarded-proto")

  if (host) {
    const protocol = protocolHint || (host.includes("localhost") ? "http" : "https")
    return `${protocol}://${host}`
  }

  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000"
}

async function buildEmailRedirectTo(next?: string) {
  const origin = await resolveAppOrigin()
  const url = new URL("/auth/callback", origin)
  url.searchParams.set("next", sanitizeNextPath(next, "/onboarding"))
  return url.toString()
}

function normalizeAuthErrorMessage(message: string, mode: AuthFlowMode) {
  const lower = message.toLowerCase()

  if (lower.includes("email not confirmed")) {
    return "Please verify the code from your email to continue."
  }

  if (lower.includes("invalid login credentials") || lower.includes("signups not allowed")) {
    return mode === "login"
      ? "No account found for this email. Please sign up first."
      : "This email address cannot be used to create an account right now."
  }

  if (lower.includes("rate limit") || lower.includes("over_email_send_rate_limit")) {
    return "Too many attempts. Please wait a minute and try again."
  }

  if (lower.includes("expired") || lower.includes("token has expired")) {
    return "The verification code has expired. Please request a new one."
  }

  if (lower.includes("invalid token") || lower.includes("token not found")) {
    return "Invalid verification code. Please try again."
  }

  return message
}

async function findProfileByEmail(email: string) {
  const rows = await sql`
    SELECT id
    FROM public.profiles
    WHERE lower(email) = lower(${email})
    LIMIT 1
  `

  return rows[0]?.id ? String(rows[0].id) : null
}

async function getPrimaryOrganizationForUser(userId: string): Promise<AuthOrganization | null> {
  try {
    const rows = await sql`
      SELECT om.org_id, om.role, o.name, o.slug
      FROM public.organization_members om
      JOIN public.organizations o ON o.id = om.org_id
      WHERE om.user_id = ${userId}
      ORDER BY om.last_active_at DESC NULLS LAST, o.created_at DESC
      LIMIT 1
    `

    if (!rows[0]) return null

    return {
      id: String(rows[0].org_id),
      name: rows[0].name ? String(rows[0].name) : null,
      role: rows[0].role ? String(rows[0].role) : null,
      slug: rows[0].slug ? String(rows[0].slug) : null,
    }
  } catch (error) {
    const message = String((error as Error)?.message || error || "")
    if (!message.toLowerCase().includes("last_active_at")) {
      throw error
    }

    const fallbackRows = await sql`
      SELECT om.org_id, om.role, o.name, o.slug
      FROM public.organization_members om
      JOIN public.organizations o ON o.id = om.org_id
      WHERE om.user_id = ${userId}
      ORDER BY o.created_at DESC
      LIMIT 1
    `

    if (!fallbackRows[0]) return null

    return {
      id: String(fallbackRows[0].org_id),
      name: fallbackRows[0].name ? String(fallbackRows[0].name) : null,
      role: fallbackRows[0].role ? String(fallbackRows[0].role) : null,
      slug: fallbackRows[0].slug ? String(fallbackRows[0].slug) : null,
    }
  }
}

export async function resolvePostAuthRedirect(userId: string, requestedNext?: string) {
  const safeNext = sanitizeNextPath(requestedNext, "")
  const org = await getPrimaryOrganizationForUser(userId)
  const slug = String(org?.slug || "").trim()
  const hasValidSlug = slug && slug !== "undefined" && slug !== "null"

  // Canonicalize any generic dashboard path to app slug-scoped dashboard path.
  if (safeNext) {
    if (hasValidSlug && (safeNext === "/dashboard" || safeNext.startsWith("/dashboard/"))) {
      return `/app/${slug}${safeNext}`
    }
    if (safeNext === "/app/dashboard" || safeNext.startsWith("/app/dashboard/")) {
      return hasValidSlug
        ? safeNext.replace(/^\/app\/dashboard/, `/app/${slug}/dashboard`)
        : "/app/dashboard"
    }
    return safeNext
  }

  if (hasValidSlug) {
    return `/app/${slug}/dashboard`
  }

  return "/app/dashboard"
}

async function sendOtp(input: AuthSendOtpInput): Promise<AuthSendOtpResult> {
  const email = normalizeEmail(input.email)
  const safeNext = sanitizeNextPath(input.next, "/app/dashboard")
  const name = input.name?.trim()

  if (!email) {
    return { ok: false, status: 400, phase: "error", error: "Email is required." }
  }

  if (!isValidEmail(email)) {
    return { ok: false, status: 400, phase: "error", error: "Enter a valid email address." }
  }

  if (input.mode === "register") {
    const existingProfileId = await findProfileByEmail(email)
    if (existingProfileId) {
      return {
        ok: false,
        status: 409,
        phase: "error",
        error: "An account with this email already exists. Please sign in instead.",
      }
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: input.mode === "register",
      emailRedirectTo: await buildEmailRedirectTo(safeNext),
      data: name
        ? {
            full_name: name,
            name,
          }
        : undefined,
    },
  })

  if (error) {
    return {
      ok: false,
      status: 400,
      phase: "error",
      error: normalizeAuthErrorMessage(error.message, input.mode),
    }
  }

  return {
    ok: true,
    status: 200,
    phase: "verify",
    email,
    maskedEmail: maskEmail(email),
    next: safeNext,
  }
}

async function verifyOtp(input: AuthVerifyOtpInput): Promise<AuthVerifyOtpResult> {
  const email = normalizeEmail(input.email)
  const token = input.token.trim()
  const safeNext = sanitizeNextPath(input.next, "/app/dashboard")

  if (!email) {
    return { ok: false, status: 400, phase: "error", error: "Email is required." }
  }

  if (!token) {
    return { ok: false, status: 400, phase: "error", error: "Verification code is required." }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  })

  if (error) {
    return {
      ok: false,
      status: 401,
      phase: "error",
      error: normalizeAuthErrorMessage(error.message, input.mode),
    }
  }

  const user = data.user
  if (!user?.id) {
    return {
      ok: false,
      status: 401,
      phase: "error",
      error: "We could not create a session for this verification code.",
    }
  }

  const nameFromInput = input.name?.trim()
  const nameFromMetadata =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : undefined

  const metadataSlug = (() => {
    const v = String(
      (user as any)?.user_metadata?.active_org_slug ||
        (user as any)?.user_metadata?.activeOrgSlug ||
        ""
    )
      .trim()
      .toLowerCase()
    return v && v !== "undefined" && v !== "null" && !v.includes(".") ? v : null
  })()
  const cookieSlug: string | null = null

  // Fire all post-auth tasks without waiting
  Promise.allSettled([
    (async () => {
      try {
        const { ensureProfile } = await import("@/lib/data/profiles")
        await ensureProfile(user.id, user.email || email, nameFromInput || nameFromMetadata)
      } catch (e) {
        console.warn("[AUTH] ensureProfile failed", e)
      }
    })(),
    persistActiveOrgSlug(metadataSlug || cookieSlug || null).catch(() => {}),
  ])

  // Return immediately — don't wait for DB calls
  const redirectTo = metadataSlug
    ? `/app/${metadataSlug}/dashboard`
    : cookieSlug
      ? `/app/${cookieSlug}/dashboard`
      : "/app/dashboard"

  return {
    ok: true,
    status: 200,
    phase: "authenticated" as const,
    next: safeNext,
    redirectTo,
    org: metadataSlug ? { id: "", name: null, role: null, slug: metadataSlug } : null,
    user: { email: user.email || email, id: user.id },
  }
}

export async function requestLoginOtp(input: Omit<AuthSendOtpInput, "mode">) {
  return sendOtp({ ...input, mode: "login" })
}

export async function requestRegistrationOtp(input: Omit<AuthSendOtpInput, "mode">) {
  return sendOtp({ ...input, mode: "register" })
}

export async function verifyLoginOtp(input: Omit<AuthVerifyOtpInput, "mode">) {
  return verifyOtp({ ...input, mode: "login" })
}

export async function verifyRegistrationOtp(input: Omit<AuthVerifyOtpInput, "mode">) {
  return verifyOtp({ ...input, mode: "register" })
}

export async function exchangeAuthCodeForSession(code: string, next?: string): Promise<AuthCodeExchangeResult> {
  const authCode = code.trim()
  if (!authCode) {
    return { ok: false, status: 400, error: "Missing authentication code." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(authCode)

  if (error) {
    return {
      ok: false,
      status: 401,
      error: normalizeAuthErrorMessage(error.message, "login"),
    }
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user?.id) {
    return { ok: false, status: 401, error: "Authenticated session not found after callback." }
  }

  const name =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : undefined

  try {
    const { ensureProfile } = await import("@/lib/data/profiles")
    await ensureProfile(user.id, user.email || `supabase_${user.id}@local.invalid`, name)
  } catch (profileError) {
    // Avoid trapping users at auth callback for transient/profile migration issues.
    console.warn("[AUTH] Profile sync failed after callback exchange; continuing session flow", profileError)
  }

  return {
    ok: true,
    status: 200,
    redirectTo: await resolvePostAuthRedirect(user.id, next),
  }
}

export async function isGuestMode() {
  const { cookies } = await import("next/headers")
  const cookieStore = await cookies()
  const headerStore = await headers()
  const host = (headerStore.get("x-forwarded-host") || headerStore.get("host") || "").toLowerCase()
  const hostname = host.split(",")[0]?.trim().split(":")[0] || ""
  const isDemoHost = hostname === "demo.khataplus.online" || hostname.startsWith("demo.")
  return cookieStore.has("guest_mode") || headerStore.get("x-guest-mode") === "true" || isDemoHost
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (await isGuestMode()) {
    return { userId: "guest-user", email: "guest@khataplus.demo", isGuest: true }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user?.id) {
    return null
  }

  return {
    userId: user.id,
    email: user.email || `supabase_${user.id}@local.invalid`,
    isGuest: false,
  }
}

export async function getCurrentOrgId(explicitUserId?: string): Promise<string | null> {
  let userId = explicitUserId

  if (!userId) {
    const user = await getCurrentUser()
    userId = user?.userId
  }

  if (await isGuestMode() || !userId || userId === "guest-user") return "demo-org"

  try {
    const orgs = await getUserOrganizationsResolved(userId)
    return orgs[0]?.org_id || null
  } catch (error: unknown) {
    const message = String((error as Error)?.message || error || "").toLowerCase()
    const dbConnectivityIssue =
      message.includes("error connecting to database") ||
      message.includes("fetch failed") ||
      message.includes("econnreset") ||
      message.includes("etimedout") ||
      message.includes("enotfound") ||
      message.includes("socket hang up")

    if (dbConnectivityIssue) return null
    throw error
  }
}

export async function getUserOrganizationsResolved(userId: string): Promise<any[]> {
  const { getUserOrganizations } = await import("./organizations")
  const orgs = await getUserOrganizations(userId)
  if (orgs.length > 0) return orgs as any[]

  let rows: any[] = []
  try {
    const { getProductionSql } = await import("../db")
    const db = getProductionSql()
    rows = await db`
      SELECT om.id, om.org_id, om.user_id, om.role, om.created_at, to_jsonb(o.*) as org_data
      FROM organization_members om
      JOIN organizations o ON o.id = om.org_id
      WHERE om.user_id = ${userId}
      ORDER BY om.created_at ASC
    `
  } catch (error: unknown) {
    const message = String((error as Error)?.message || error || "").toLowerCase()
    const dbConnectivityIssue =
      message.includes("error connecting to database") ||
      message.includes("fetch failed") ||
      message.includes("econnreset") ||
      message.includes("etimedout") ||
      message.includes("enotfound") ||
      message.includes("socket hang up")

    if (dbConnectivityIssue) return []
    throw error
  }

  return rows.map((row: any) => ({
    id: row.id,
    org_id: row.org_id,
    user_id: row.user_id,
    role: row.role,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    organization: typeof row.org_data === "string" ? JSON.parse(row.org_data) : row.org_data,
  }))
}

export async function buildAuthContext(): Promise<AuthContextResult> {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    return {
      authenticated: false,
      guest: false,
      isAuthenticated: false,
      isGuest: false,
      org: null,
      orgName: null,
      orgSlug: null,
      redirectTo: null,
      user: null,
      userName: null,
    }
  }

  if (currentUser.isGuest) {
    return {
      authenticated: true,
      guest: true,
      isAuthenticated: true,
      isGuest: true,
      org: {
        id: "demo-org",
        name: "KhataPlus Demo",
        role: "owner",
        slug: "demo",
      },
      orgName: "KhataPlus Demo",
      orgSlug: "demo",
      redirectTo: "/demo",
      user: {
        email: currentUser.email,
        id: currentUser.userId,
        name: "Guest User",
      },
      userName: "Guest User",
    }
  }

  const [profile, org] = await Promise.all([
    getProfile(currentUser.userId),
    getPrimaryOrganizationForUser(currentUser.userId),
  ])

  const redirectTo = await resolvePostAuthRedirect(currentUser.userId)
  const userName = profile?.name || profile?.email || currentUser.email || null

  return {
    authenticated: true,
    guest: false,
    isAuthenticated: true,
    isGuest: false,
    org,
    orgName: org?.name || null,
    orgSlug: org?.slug || null,
    redirectTo,
    user: {
      email: currentUser.email,
      id: currentUser.userId,
      name: userName,
    },
    userName,
  }
}

export function clearAuthStateCookies(response: NextResponse) {
  AUTH_STATE_COOKIE_NAMES.forEach((cookieName) => {
    response.cookies.delete(cookieName)
  })

  return response
}
