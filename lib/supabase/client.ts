import { createBrowserClient } from "@supabase/ssr"

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

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  const proxyUrl = process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL

  if (!url || !anonKey) {
    throw new Error("Supabase client env vars are missing.")
  }

  return createBrowserClient(url, anonKey, {
    global: proxyUrl ? { fetch: buildProxyFetch(proxyUrl) } : undefined,
  })
}

export const supabaseClient = createClient()
