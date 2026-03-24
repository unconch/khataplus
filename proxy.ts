import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/server"

const PUBLIC_ROUTES = new Set([
  "/auth/login",
  "/auth/sign-up",
  "/auth/sign-up-success",
  "/auth/invite-sign-up",
  "/auth/callback",
  "/auth/oauth-callback",
  "/demo",
])

const STATIC_PREFIXES = ["/_next", "/favicon.ico", "/logo", "/api/", "/manifest.json", "/robots.txt", "/sitemap.xml", "/sw.js"]
const CRITICAL_SYSTEM_ROUTES = new Set(["auth", "api", "_next", "favicon.ico", "logo", "onboarding"])
const INVALID_SLUGS = new Set(["", "undefined", "null"])

const APP_SECTION_PREFIXES = [
  "/dashboard",
  "/sales",
  "/inventory",
  "/khata",
  "/analytics",
  "/reports",
  "/settings",
  "/migration",
  "/security",
  "/pos",
] as const

function normalizeSlug(input: string | null | undefined): string | null {
  const value = String(input || "").trim().toLowerCase()
  if (!value || INVALID_SLUGS.has(value) || value.includes(".")) return null
  return value
}

function applySecurityHeaders(response: NextResponse) {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co https://accounts.google.com https://*.vercel-scripts.com https://checkout.razorpay.com https://api.razorpay.com https://*.razorpay.com",
    "style-src 'self' 'unsafe-inline' https://accounts.google.com https://fonts.googleapis.com",
    "img-src 'self' blob: data: https://*.supabase.co https://*.googleusercontent.com https://images.unsplash.com https://accounts.google.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "frame-src 'self' https://accounts.google.com https://checkout.razorpay.com https://*.razorpay.com https://*.rzp.io",
    "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://accounts.google.com https://*.vercel-scripts.com https://api.razorpay.com https://*.razorpay.com https://*.rzp.io https://o*.ingest.sentry.io https://*.vercel-insights.com https://*.vercel-analytics.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ")

  response.headers.set("Content-Security-Policy", csp)
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none")
  return response
}

function copyCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach(({ name, value, ...options }) => {
    target.cookies.set(name, value, options)
  })
}

function finalizeResponse(source: NextResponse, target: NextResponse) {
  copyCookies(source, target)
  // Propagate custom headers (path context, invoke path) to downstream handlers
  source.headers.forEach((value, key) => {
    if (key === "x-tenant-slug" || key.startsWith("x-path-prefix") || key.startsWith("x-invoke-path")) {
      target.headers.set(key, value)
    }
  })
  return applySecurityHeaders(target)
}

export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // 1. Static assets — skip everything
  if (pathname.startsWith("/api/") || STATIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const hostname = request.headers.get("host") || ""
  const segments = pathname.split("/").filter(Boolean)
  const firstSegment = segments[0] || ""
  const domain = hostname.split(":")[0]?.toLowerCase() || ""
  const isDemoHost = domain === "demo.khataplus.online" || domain.startsWith("demo.")

  // 2. Hard redirects
  if (pathname === "/merchant-academy" || pathname === "/merchantacademy") {
    return NextResponse.redirect(new URL("/docs", request.url), 307)
  }

  // 3. Marketing routes — no session needed
  const isPublicMarketing =
    pathname === "/" ||
    pathname === "/features" ||
    pathname === "/feathures" ||
    pathname === "/pricing" ||
    pathname === "/roadmap" ||
    pathname === "/docs" ||
    pathname.startsWith("/docs/") ||
    pathname === "/solutions" ||
    pathname === "/security"

  if (isPublicMarketing) {
    return applySecurityHeaders(NextResponse.next())
  }

  // 4. Resolve session
  let sessionResponse = NextResponse.next({ request: { headers: request.headers } })
  let user = null

  try {
    const sessionResult = await updateSession(request)
    sessionResponse = sessionResult.response
    user = sessionResult.user
  } catch (error) {
    console.error("[Proxy] updateSession threw:", error)
  }

  // Clean up guest cookie if real user is present
  if (user && request.cookies.has("guest_mode") && !pathname.startsWith("/demo")) {
    sessionResponse.cookies.delete("guest_mode")
  }

  // 5. Resolve slug from all sources
  const isAppScoped = firstSegment === "app"
  const pathSlug = isAppScoped && segments[1] && segments[1] !== "dashboard" ? segments[1] : null
  const isCanonicalAppDashboard = pathname === "/app/dashboard" || pathname.startsWith("/app/dashboard/")

  // Subdomain slug
  let slug: string | null = null
  const domainParts = domain.split(".")
  const isIpv4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(domain)
  const isLocalHost = domain === "localhost" || domain.endsWith(".localhost")
  if (domainParts.length >= 3 && !isIpv4 && !isLocalHost) {
    const subdomain = domainParts[0]
    if (subdomain !== "www" && subdomain !== "app" && subdomain !== domain) {
      slug = subdomain
    }
  }

  if (!slug && pathSlug) slug = normalizeSlug(pathSlug)
  if (!slug && isDemoHost) slug = "demo"
  if (!slug && firstSegment === "demo") slug = "demo"

  const activeOrgSlug = normalizeSlug(user?.user_metadata?.active_org_slug || user?.user_metadata?.activeOrgSlug)
  const cookieOrgSlug = normalizeSlug(request.cookies.get("kp_org_slug")?.value)
  const hasGuestAccess = request.cookies.has("guest_mode") || isDemoHost

  // Best known slug — prefer metadata over cookie
  const bestSlug = activeOrgSlug || cookieOrgSlug || slug

  // 6. Public auth routes
  if (PUBLIC_ROUTES.has(pathname)) {
    if (!user && hasGuestAccess && bestSlug && pathname.startsWith("/auth/")) {
      const redirectPath = bestSlug === "demo" ? `/dashboard${search}` : `/app/${bestSlug}/dashboard${search}`
      const redirectTo = new URL(redirectPath, request.url)
      return finalizeResponse(sessionResponse, NextResponse.redirect(redirectTo, 302))
    }
    if (user && bestSlug) {
      // User is already authenticated with a known org — redirect away from login
      const redirectTo = new URL(`/app/${bestSlug}/dashboard${search}`, request.url)
      return finalizeResponse(sessionResponse, NextResponse.redirect(redirectTo, 302))
    }
    // No session or no slug yet — let frontend handle it (post-OTP verify flow)
    return applySecurityHeaders(sessionResponse)
  }

  // 7. Unauthenticated — redirect to login
  if (!user && !hasGuestAccess) {
    const redirectUrl = new URL("/auth/login", request.url)
    redirectUrl.searchParams.set("next", pathname + search)
    return finalizeResponse(sessionResponse, NextResponse.redirect(redirectUrl, 302))
  }

  // 8. Authenticated — canonical dashboard redirect
  if (user && isCanonicalAppDashboard && bestSlug && bestSlug !== "dashboard") {
    const redirectTo = new URL(`/app/${bestSlug}/dashboard${search}`, request.url)
    return finalizeResponse(sessionResponse, NextResponse.redirect(redirectTo, 307))
  }

  // 9. Slug realignment — only inside /app/* routes
  if (user && pathname.startsWith("/app/") && slug && activeOrgSlug && slug !== activeOrgSlug) {
    const rest = pathname.replace(/^\/app\/[^/]+/, "")
    const redirectTo = new URL(`/app/${activeOrgSlug}${rest}${search}`, request.url)
    return finalizeResponse(sessionResponse, NextResponse.redirect(redirectTo, 307))
  }

  if (isDemoHost && pathname === "/app/demo") {
    return finalizeResponse(sessionResponse, NextResponse.redirect(new URL(`/dashboard${search}`, request.url), 307))
  }

  if (isDemoHost && pathname.startsWith("/app/demo/")) {
    const cleanPath = pathname.replace(/^\/app\/demo/, "") || "/dashboard"
    const redirectTo = new URL(`${cleanPath}${search}`, request.url)
    return finalizeResponse(sessionResponse, NextResponse.redirect(redirectTo, 307))
  }

  // 10. Invalid app slug guard
  if (!slug && isAppScoped && !isCanonicalAppDashboard) {
    return finalizeResponse(sessionResponse, NextResponse.redirect(new URL("/app/dashboard", request.url), 302))
  }

  // 11. System routes — no rewrite
  if (CRITICAL_SYSTEM_ROUTES.has(firstSegment)) {
    return finalizeResponse(sessionResponse, sessionResponse)
  }

  // Tenant root paths -> canonical /app/{slug}/* routes
  // Example: demo.khataplus.online/sales -> /app/demo/sales
  const shouldRouteToApp =
    !pathname.startsWith("/app/") &&
    APP_SECTION_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))

  if ((user || hasGuestAccess) && bestSlug && shouldRouteToApp) {
    const pathPrefix = `/app/${bestSlug}`
    const rewritePath = `${pathPrefix}${pathname}`

    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-tenant-slug", bestSlug)
    requestHeaders.set("x-path-prefix", pathPrefix)
    requestHeaders.set("x-invoke-path", rewritePath)

    const rewriteTo = new URL(`${rewritePath}${search}`, request.url)
    const rewriteResponse = NextResponse.rewrite(rewriteTo, { request: { headers: requestHeaders } })
    return finalizeResponse(sessionResponse, rewriteResponse)
  }

  // 12. Persist best slug to cookie for future requests
  if (user && !cookieOrgSlug && activeOrgSlug) {
    sessionResponse.cookies.set("kp_org_slug", activeOrgSlug, {
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
    })
  }

  // For canonical app routes, inject tenant headers into the downstream request.
  if ((user || hasGuestAccess) && slug && pathname.startsWith("/app/")) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-tenant-slug", slug)
    requestHeaders.set("x-path-prefix", `/app/${slug}`)
    requestHeaders.set("x-invoke-path", pathname)

    const nextResponse = NextResponse.next({ request: { headers: requestHeaders } })
    return finalizeResponse(sessionResponse, nextResponse)
  }

  return finalizeResponse(sessionResponse, sessionResponse)
}
