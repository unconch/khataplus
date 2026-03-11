import { NextResponse, NextRequest } from "next/server"

const SYSTEM_PREFIXES = new Set([
  "auth", "api", "_next", "setup-organization", "pricing",
  "features", "solutions", "docs", "roadmap", "privacy",
  "terms", "offline", "monitoring",
])

function hasSessionCookie(req: NextRequest) {
  return req.cookies.getAll().some((c) => c.name.includes("auth-token"))
}

export default function proxy(req: NextRequest) {
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next()
  }

  const { pathname } = req.nextUrl

  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/setup-organization") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/"
  ) {
    return NextResponse.next()
  }
  const host = (req.headers.get("host") || "").split(":")[0]
  const isLocalhost = host === "localhost" || host === "127.0.0.1"
  const isAppHost = host.startsWith("app.")
  const isAuthPath = pathname.startsWith("/auth")
  const isPublic =
    pathname === "/" ||
    pathname === "/setup-organization" ||
    pathname === "/pricing" ||
    pathname === "/features" ||
    pathname === "/roadmap" ||
    pathname === "/docs" ||
    pathname.startsWith("/docs/") ||
    pathname === "/solutions"

  const segments = pathname.split("/").filter(Boolean)
  const slug = segments[0]

  // Keep auth on main domain (production only)
  if (isAppHost && isAuthPath) {
    const mainHost = host.replace(/^app\./, "")
    const url = new URL(pathname, `https://${mainHost}`)
    return NextResponse.redirect(url)
  }

  // Require session on app host
  if (isAppHost && !hasSessionCookie(req) && !isAuthPath && !isPublic) {
    const mainHost = host.replace(/^app\./, "")
    const url = new URL("/auth/login", `https://${mainHost}`)
    return NextResponse.redirect(url)
  }

  // Handle slug routing — both localhost and app host
  if (
    (isAppHost || isLocalhost) &&
    slug &&
    !SYSTEM_PREFIXES.has(slug) &&
    segments.length > 1
  ) {
    const rest = segments.slice(1).join("/")
    const rewrite = req.nextUrl.clone()
    rewrite.pathname = rest ? `/${rest}` : "/dashboard"

    const response = NextResponse.rewrite(rewrite)
    response.headers.set("x-path-prefix", `/${slug}`)
    response.headers.set("x-invoke-path", rewrite.pathname)
    return response
  }

  const res = NextResponse.next()
  res.headers.set("x-proxy-path", pathname)
  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
