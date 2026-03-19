import { createBrowserClient } from "@supabase/ssr"

import { getSupabaseAnonKey, getSupabaseProxyUrl, getSupabaseUrl } from "@/lib/supabase/config"
import { getSupabaseCookieOptions } from "@/lib/supabase/cookies"

function buildProxyFetch(proxyBaseUrl: string) {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const originalUrl =
      typeof input === "string"
        ? new URL(input, getSupabaseUrl())
        : input instanceof URL
          ? input
          : new URL(input.url)

    const proxy = new URL(proxyBaseUrl)
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

let browserClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (browserClient) {
    return browserClient
  }

  const proxyUrl = getSupabaseProxyUrl()
  const cookieOptions = getSupabaseCookieOptions(
    typeof window === "undefined" ? undefined : window.location.hostname
  )

  browserClient = createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    global: proxyUrl ? { fetch: buildProxyFetch(proxyUrl) } : undefined,
    cookieOptions,
  })

  return browserClient
}
