import { NextResponse } from "next/server"
import { resolvePostAuthPath, toAppOriginFromRequestUrl } from "@/lib/auth-redirect"
import { resolveSharedCookieDomain } from "@/lib/auth-cookie-domain"
import { createSupabaseServerClientWithCookieCollector } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const { searchParams, origin } = requestUrl
  const requestedNext = searchParams.get("next") || "/dashboard"
  const next =
    requestedNext.startsWith("/") && !requestedNext.startsWith("/auth/")
      ? requestedNext
      : "/dashboard"

  const cookieHeader = request.headers.get("cookie")
  const initialCookies =
    cookieHeader
      ?.split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .reduce<Array<{ name: string; value: string }>>((acc, entry) => {
        const idx = entry.indexOf("=")
        if (idx <= 0) return acc
        acc.push({ name: entry.slice(0, idx), value: entry.slice(idx + 1) })
        return acc
      }, []) || []

  try {
    const { client: supabase, pendingCookies } = createSupabaseServerClientWithCookieCollector(initialCookies)
    const code = searchParams.get("code")
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        throw error
      }
    }

    const { data } = await supabase.auth.getUser()
    const user = data.user

    if (user?.id) {
      const { ensureProfile } = await import("@/lib/data/profiles")
      await ensureProfile(
        user.id,
        user.email || `supabase_${user.id}@local.invalid`,
        (user.user_metadata?.name as string) || (user.user_metadata?.full_name as string) || undefined
      )

      try {
        const { registerSession } = await import("@/lib/session-governance")
        const tokenTail = user.id.slice(-16)
        await registerSession(user.id, tokenTail)
      } catch (err) {
        console.warn("[AuthCallback] Session governance registration skipped:", err)
      }

      const redirectPath = await resolvePostAuthPath(user.id, next)
      const appOrigin = toAppOriginFromRequestUrl(requestUrl)
      const res = redirectPath.startsWith("/")
        ? NextResponse.redirect(`${appOrigin}${redirectPath}`)
        : NextResponse.redirect(`${appOrigin}/setup-organization`)

      const domain = resolveSharedCookieDomain(requestUrl.hostname)
      const secure = process.env.NODE_ENV === "production"
      for (const cookie of pendingCookies) {
        res.cookies.set(cookie.name, cookie.value, {
          ...cookie.options,
          path: "/",
          sameSite: "lax",
          secure,
          domain: domain || undefined,
        })
      }

      res.cookies.delete("kp_auth_next")
      return res
    }
  } catch (err) {
    console.error("[AuthCallback] Session logic failed:", err)
  }

  return NextResponse.redirect(`${origin}/auth/login?error=callback_failed`)
}
