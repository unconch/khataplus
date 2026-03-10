import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

function buildProxyFetch(proxyUrl: string) {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const originalUrl =
      typeof input === "string" ? new URL(input)
      : input instanceof URL ? input
      : new URL(input.url)

    const proxy = new URL(proxyUrl)
    const target = new URL(originalUrl.toString())
    target.protocol = proxy.protocol
    target.host = proxy.host

    const request =
      typeof input === "string" || input instanceof URL
        ? new Request(target.toString(), init)
        : new Request(target.toString(), input)

    return fetch(request)
  }
}

export async function createClient() {
  const cookieStore = await cookies()
  const proxyUrl = (
    process.env.SUPABASE_PROXY_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL
  )?.replace(/\/$/, "")

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: proxyUrl ? { fetch: buildProxyFetch(proxyUrl) } : undefined,
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
    }
  )
}

// Backward compat aliases
export const createSupabaseServerClient = createClient
export const createSupabaseServerClientWithCookieCollector = createClient
