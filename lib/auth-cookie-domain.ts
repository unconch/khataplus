import "server-only"

function isIpAddress(hostname: string): boolean {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)
}

export function resolveSharedCookieDomain(hostnameRaw: string): string | undefined {
  const hostname = String(hostnameRaw || "").trim().toLowerCase()
  if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost") || isIpAddress(hostname)) {
    return undefined
  }

  let base = hostname
  if (base.startsWith("www.")) base = base.slice(4)
  if (base.startsWith("demo.")) base = base.slice(5)
  if (base.startsWith("pos.")) base = base.slice(4)
  if (base.startsWith("app.")) base = base.slice(4)

  const parts = base.split(".").filter(Boolean)
  if (parts.length < 2) return undefined

  return `.${base}`
}
