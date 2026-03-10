import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

function stripAppLikeSubdomain(hostname: string): string {
  let base = hostname.toLowerCase()
  if (base.startsWith("www.")) base = base.slice(4)
  if (base.startsWith("demo.")) base = base.slice(5)
  if (base.startsWith("pos.")) base = base.slice(4)
  if (base.startsWith("app.")) base = base.slice(4)
  return base
}

function getCookieDomainFromEnv(): string | undefined {
  const raw =
    process.env.NEXT_PUBLIC_MAIN_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    ""
  if (!raw) return undefined
  try {
    const hostname = new URL(raw).hostname
    if (!hostname) return undefined
    if (hostname === "localhost" || hostname === "127.0.0.1") return undefined
    if (hostname.endsWith(".localhost")) return undefined
    const base = stripAppLikeSubdomain(hostname)
    return `.${base}`
  } catch {
    return undefined
  }
}

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
      cookieOptions: {
        domain: getCookieDomainFromEnv(),
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    }
  )
}

// Backward compat aliases
export const createSupabaseServerClient = createClient
export const createSupabaseServerClientWithCookieCollector = createClient
