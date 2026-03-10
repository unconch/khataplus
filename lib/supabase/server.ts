import "server-only"

import { cookies } from "next/headers"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

function buildProxyFetch(proxyUrl: string) {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const originalUrl =
      typeof input === "string"
        ? new URL(input)
        : input instanceof URL
          ? input
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

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY")
  }

  return { url, anonKey }
}

export async function createSupabaseServerClient() {
  const { url, anonKey } = getSupabaseConfig()
  const proxyUrl = process.env.SUPABASE_PROXY_URL || process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL
  const cookieStore = await cookies()

  return createServerClient(url, anonKey, {
    global: proxyUrl ? { fetch: buildProxyFetch(proxyUrl) } : undefined,
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch (error) {
          // Ignore errors during rendering where cookies cannot be set
          // This prevents crashes when Supabase tries to refresh tokens in RSC
        }
      },
    },
  })
}

export type PendingCookie = {
  name: string
  value: string
  options?: CookieOptions
}

export function createSupabaseServerClientWithCookieCollector(
  initialCookies: Array<{ name: string; value: string }>
) {
  const { url, anonKey } = getSupabaseConfig()
  const proxyUrl = process.env.SUPABASE_PROXY_URL || process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL
  const pendingCookies: PendingCookie[] = []

  const client = createServerClient(url, anonKey, {
    global: proxyUrl ? { fetch: buildProxyFetch(proxyUrl) } : undefined,
    cookies: {
      getAll() {
        return initialCookies
      },
      setAll(cookiesToSet) {
        pendingCookies.push(...cookiesToSet)
      },
    },
  })

  return { client, pendingCookies }
}
