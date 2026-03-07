"use client"

function stripAppLikeSubdomain(hostname: string): string {
  let base = hostname.toLowerCase()
  if (base.startsWith("www.")) base = base.slice(4)
  if (base.startsWith("demo.")) base = base.slice(5)
  if (base.startsWith("pos.")) base = base.slice(4)
  if (base.startsWith("app.")) base = base.slice(4)
  return base
}

function normalizeMainOrigin(raw?: string): string {
  if (!raw) {
    if (process.env.NODE_ENV === "development") return "http://localhost:3000"
    return "https://khataplus.online"
  }
  try {
    const parsed = new URL(raw)
    parsed.hostname = stripAppLikeSubdomain(parsed.hostname)
    return parsed.origin
  } catch {
    return process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://khataplus.online"
  }
}

const DEFAULT_MAIN_ORIGIN = normalizeMainOrigin(
  process.env.NEXT_PUBLIC_MAIN_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL
)

function getMainHostFromHostname(hostname: string): string {
  if (!hostname) return "khataplus.online"
  if (hostname === "localhost" || hostname === "127.0.0.1") return "localhost"
  if (hostname.endsWith(".localhost")) return "localhost"

  return stripAppLikeSubdomain(hostname)
}

function getMainOrigin(): string {
  if (typeof window === "undefined") return DEFAULT_MAIN_ORIGIN
  const { protocol, hostname, port } = window.location
  const mainHost = getMainHostFromHostname(hostname)
  const portPart = port ? `:${port}` : ""
  return `${protocol}//${mainHost}${portPart}`
}

export function useMainAuthUrls() {
  const origin = getMainOrigin()
  return {
    signInUrl: `${origin}/login`,
    signUpUrl: `${origin}/sign-up`,
  }
}
