import { createBrowserClient } from "@supabase/ssr"

function stripAppLikeSubdomain(hostname: string): string {
  let base = hostname.toLowerCase()
  if (base.startsWith("www.")) base = base.slice(4)
  if (base.startsWith("demo.")) base = base.slice(5)
  if (base.startsWith("pos.")) base = base.slice(4)
  if (base.startsWith("app.")) base = base.slice(4)
  return base
}

function getCookieDomainFromBrowser(): string | undefined {
  if (typeof window === "undefined") return undefined
  const hostname = window.location.hostname
  if (!hostname) return undefined
  if (hostname === "localhost" || hostname === "127.0.0.1") return undefined
  if (hostname.endsWith(".localhost")) return undefined
  const base = stripAppLikeSubdomain(hostname)
  return `.${base}`
}

function buildProxyFetch(proxyBaseUrl: string) {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const originalUrl =
      typeof input === "string"
        ? new URL(input)
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

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const proxyUrl =
    process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL?.replace(/\/$/, "") ||
    process.env.SUPABASE_PROXY_URL?.replace(/\/$/, "")

  return createBrowserClient(url, key, {
    global: proxyUrl ? { fetch: buildProxyFetch(proxyUrl) } : undefined,
    cookieOptions: {
      domain: getCookieDomainFromBrowser(),
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  })
}
