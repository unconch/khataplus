interface Env {
  SUPABASE_ORIGIN: string
  ALLOWED_ORIGINS?: string
}

const ALLOWED_PREFIXES = [
  "/auth/v1",
  "/rest/v1",
  "/storage/v1",
  "/realtime/v1",
  "/functions/v1",
  "/graphql/v1",
]

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, "")
}

function isAllowedPath(pathname: string): boolean {
  return ALLOWED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

function parseAllowedOrigins(raw?: string): Set<string> {
  if (!raw) return new Set()
  return new Set(
    raw
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
  )
}

function resolveCorsOrigin(request: Request, allowedOrigins: Set<string>): string | null {
  const origin = request.headers.get("Origin")
  if (!origin) return null
  if (allowedOrigins.size === 0) return origin
  return allowedOrigins.has(origin) ? origin : null
}

function withCorsHeaders(response: Response, origin: string | null): Response {
  const out = new Response(response.body, response)
  if (origin) {
    out.headers.set("Access-Control-Allow-Origin", origin)
    out.headers.set("Vary", "Origin")
  }
  out.headers.set("Access-Control-Allow-Credentials", "true")
  out.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
  out.headers.set("Access-Control-Allow-Headers", "authorization,apikey,content-type,x-client-info,x-supabase-api-version")
  out.headers.set("Access-Control-Max-Age", "86400")
  return out
}

function buildUpstreamUrl(requestUrl: URL, supabaseOrigin: string): URL {
  const upstream = new URL(requestUrl.toString())
  const base = new URL(supabaseOrigin)
  upstream.protocol = base.protocol
  upstream.host = base.host
  return upstream
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (!env.SUPABASE_ORIGIN) {
      return new Response("Missing SUPABASE_ORIGIN", { status: 500 })
    }

    const requestUrl = new URL(request.url)
    if (requestUrl.pathname === "/healthz") {
      return new Response("ok", { status: 200 })
    }

    if (!isAllowedPath(requestUrl.pathname)) {
      return new Response("Not found", { status: 404 })
    }

    const allowedOrigins = parseAllowedOrigins(env.ALLOWED_ORIGINS)
    const corsOrigin = resolveCorsOrigin(request, allowedOrigins)

    if (request.method === "OPTIONS") {
      return withCorsHeaders(new Response(null, { status: 204 }), corsOrigin)
    }

    const upstreamUrl = buildUpstreamUrl(requestUrl, normalizeOrigin(env.SUPABASE_ORIGIN))
    const headers = new Headers(request.headers)
    headers.set("x-forwarded-host", request.headers.get("host") || "")
    headers.set("x-forwarded-proto", "https")

    const upstreamRequest = new Request(upstreamUrl.toString(), {
      method: request.method,
      headers,
      body: request.body,
      redirect: "manual",
      duplex: "half",
    } as RequestInit)

    const upstreamResponse = await fetch(upstreamRequest)
    return withCorsHeaders(upstreamResponse, corsOrigin)
  },
}
