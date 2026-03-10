import { NextResponse, NextRequest } from "next/server"

const SYSTEM_PREFIXES = new Set([
  "auth",
  "api",
  "_next",
  "pricing",
  "features",
  "solutions",
  "docs",
  "roadmap",
  "privacy",
  "terms",
  "offline",
  "monitoring",
])

function hasSessionCookie(req: NextRequest) {
  return req.cookies.getAll().some((c) => c.name.includes("auth-token"))
}

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const host = (req.headers.get("host") || "").split(":")[0]

  const isAppHost = host.startsWith("app.")
  const isAuthPath = pathname.startsWith("/auth")
  const isPublic =
    pathname === "/" ||
    pathname === "/pricing" ||
    pathname === "/features" ||
    pathname === "/roadmap" ||
    pathname === "/docs" ||
    pathname.startsWith("/docs/") ||
    pathname === "/solutions"

  // Keep auth on main domain
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

  const segments = pathname.split("/").filter(Boolean)
  const slug = segments[0]

  if (isAppHost && slug && !SYSTEM_PREFIXES.has(slug)) {
    const rewrite = req.nextUrl.clone()
    rewrite.pathname = "/" + segments.slice(1).join("/") || "/dashboard"
    return NextResponse.rewrite(rewrite)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
