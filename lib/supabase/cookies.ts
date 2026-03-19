const KNOWN_APP_SUBDOMAINS = new Set(["www", "demo", "pos", "app"])

export function normalizeHostname(hostname: string | null | undefined) {
  return (hostname || "")
    .toLowerCase()
    .split(",")[0]
    ?.trim()
    .split(":")[0] || ""
}

export function stripKnownSubdomain(hostname: string) {
  const normalized = normalizeHostname(hostname)
  const parts = normalized.split(".").filter(Boolean)

  if (parts.length <= 2) {
    return normalized
  }

  if (KNOWN_APP_SUBDOMAINS.has(parts[0] || "")) {
    return parts.slice(1).join(".")
  }

  return normalized
}

export function resolveCookieDomain(hostname: string | null | undefined) {
  const normalized = normalizeHostname(hostname)
  if (!normalized || normalized === "localhost" || normalized === "127.0.0.1") {
    return undefined
  }

  if (normalized.endsWith(".localhost") || /^\d{1,3}(\.\d{1,3}){3}$/.test(normalized)) {
    return undefined
  }

  const baseDomain = stripKnownSubdomain(normalized)
  return baseDomain ? `.${baseDomain}` : undefined
}

export function getSupabaseCookieOptions(hostname?: string | null) {
  return {
    domain: resolveCookieDomain(hostname),
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    httpOnly: false,
  }
}
