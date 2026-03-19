import { type NextRequest, NextResponse } from "next/server"

import { updateSession } from "@/lib/supabase/server"

const PUBLIC_ROUTES = [
  "/auth/login",
  "/auth/sign-up",
  "/auth/sign-up-success",
  "/auth/invite-sign-up",
  "/auth/callback",
  "/auth/oauth-callback",
  "/demo",
]

const STATIC_ASSETS = [
  "/_next",
  "/favicon.ico",
  "/logo",
  "/api/public",
]

const CRITICAL_SYSTEM_ROUTES = new Set(["auth", "api", "_next", "favicon.ico", "logo", "onboarding"])
const INVALID_SLUGS = new Set(["", "undefined", "null"])

function normalizeSlug(input: string | null | undefined): string | null {
  const value = String(input || "").trim().toLowerCase()
  if (!value || INVALID_SLUGS.has(value) || value.includes(".")) {
    return null
  }
  return value
}

function applySecurityHeaders(response: NextResponse) {
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co https://accounts.google.com https://*.vercel-scripts.com https://checkout.razorpay.com https://api.razorpay.com https://*.razorpay.com;
    style-src 'self' 'unsafe-inline' https://accounts.google.com https://grainy-gradients.vercel.app https://fonts.googleapis.com;
    img-src 'self' blob: data: https://*.supabase.co https://*.googleusercontent.com https://images.unsplash.com https://grainy-gradients.vercel.app https://accounts.google.com;
    font-src 'self' data: https://fonts.gstatic.com;
    frame-src 'self' https://accounts.google.com https://checkout.razorpay.com https://api.razorpay.com https://*.razorpay.com https://*.rzp.io;
    connect-src 'self' https://*.supabase.co https://accounts.google.com https://*.vercel-scripts.com https://api.razorpay.com https://checkout.razorpay.com https://*.razorpay.com https://*.rzp.io;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, " ").trim()

  const securityHeaders = {
    "Content-Security-Policy": cspHeader,
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Permitted-Cross-Domain-Policies": "none",
  }

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

function copyCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    const { name, value, ...options } = cookie
    target.cookies.set(name, value, options)
  })
}

function finalizeResponse(source: NextResponse, target: NextResponse) {
  copyCookies(source, target)
  return applySecurityHeaders(target)
}

export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const hostname = request.headers.get("host") || ""
  const segments = pathname.split("/").filter(Boolean)
  const firstSegment = segments[0]
  const isAppScoped = firstSegment === "app"
  const isCanonicalAppDashboard = pathname === "/app/dashboard" || pathname.startsWith("/app/dashboard/")
  const pathSlug = isAppScoped && segments[1] !== "dashboard" ? segments[1] : null

  if (pathname === "/merchant-academy" || pathname === "/merchantacademy") {
    return NextResponse.redirect(new URL("/docs", request.url), 307)
  }

  if (STATIC_ASSETS.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  const hasSupabaseAuthCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("-auth-token"))
  const hasGuestCookie = request.cookies.has("guest_mode")
  const isPublicMarketingPath =
    pathname === "/" ||
    pathname === "/features" ||
    pathname === "/feathures" ||
    pathname === "/pricing" ||
    pathname === "/roadmap" ||
    pathname === "/docs" ||
    pathname === "/solutions" ||
    pathname === "/security"

  // Fast path for marketing routes: avoid tenant/session logic that can cause
  // root-path rewrite loops or slow auth round-trips.
  if (isPublicMarketingPath) {
    return applySecurityHeaders(NextResponse.next())
  }

  let sessionResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })
  let user = null

  try {
    const sessionResult = await updateSession(request)
    sessionResponse = sessionResult.response
    user = sessionResult.user

    if (sessionResult.error && !sessionResult.error.message.toLowerCase().includes("auth session missing")) {
      console.error("[Proxy] updateSession failed:", sessionResult.error)
    }
  } catch (error) {
    console.error("[Proxy] updateSession threw:", error)
  }

  if (user && request.cookies.has("guest_mode") && !pathname.startsWith("/demo")) {
    sessionResponse.cookies.delete("guest_mode")
  }

  applySecurityHeaders(sessionResponse)

  let slug: string | null = null
  const domain = hostname.split(":")[0] || ""
  const domainParts = domain.split(".")
  const isIpv4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(domain)
  const isLocalHost = domain === "localhost" || domain.endsWith(".localhost")

  if (domainParts.length >= 3 && !isIpv4 && !isLocalHost) {
    const subdomain = domainParts[0]
    if (subdomain !== "www" && subdomain !== "app" && subdomain !== domain) {
      slug = subdomain
    }
  }

  if (!slug && pathSlug) {
    slug = normalizeSlug(pathSlug)
  } else if (!slug && firstSegment === "demo") {
    slug = "demo"
  }

  // Prefer active org slug from authenticated user metadata when URL doesn't carry one.
  const activeOrgSlug =
    user &&
    typeof (user as any).user_metadata?.active_org_slug === "string" &&
    (user as any).user_metadata.active_org_slug.trim().length > 0
      ? (user as any).user_metadata.active_org_slug.trim()
      : null
  if (!slug && activeOrgSlug) {
    slug = normalizeSlug(activeOrgSlug)
  }
  // Cookie-based tenant affinity should not influence public marketing routes.
  if (!slug && !isPublicMarketingPath) {
    slug = normalizeSlug(request.cookies.get("kp_org_slug")?.value)
  }

  const isDemo = slug === "demo"
  const isGuest = isDemo || (!user && hasGuestCookie)
  const isAuthRoute = pathname.startsWith("/auth")
  const isProtectedRoute =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/onboarding" ||
    pathname.startsWith("/app/")
  const isAuthCallbackRoute = pathname === "/auth/callback" || pathname === "/auth/oauth-callback"
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route)) || pathname === "/"

  if (!user && isProtectedRoute && !isGuest && !isPublicRoute) {
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("next", `${pathname}${search}`)
    return finalizeResponse(sessionResponse, NextResponse.redirect(loginUrl, 303))
  }

  // If a user is already authenticated, skip auth pages.
  if (user && isAuthRoute && !isAuthCallbackRoute) {
    const dashboardPath = "/dashboard"
    return finalizeResponse(sessionResponse, NextResponse.redirect(new URL(dashboardPath, request.url), 303))
  }

  // Canonical /app/dashboard aliases should resolve to app slug-scoped dashboard.
  if (isCanonicalAppDashboard) {
    if (slug) {
      const canonicalPath =
        pathname === "/app/dashboard"
          ? `/app/${slug}/dashboard`
          : pathname.replace(/^\/app\/dashboard/, `/app/${slug}/dashboard`)
      return finalizeResponse(sessionResponse, NextResponse.redirect(new URL(canonicalPath, request.url), 303))
    }
  }

  // Canonicalize legacy tenant dashboard URLs to /app/{slug}/dashboard
  if (user && slug && firstSegment === slug && (pathname === `/${slug}/dashboard` || pathname.startsWith(`/${slug}/dashboard/`))) {
    const suffix = pathname.slice(`/${slug}`.length)
    return finalizeResponse(sessionResponse, NextResponse.redirect(new URL(`/app/${slug}${suffix}`, request.url), 303))
  }
  // Canonicalize legacy tenant POS URLs to /app/{slug}/pos...
  if (user && slug && firstSegment === slug && (pathname === `/${slug}/pos` || pathname.startsWith(`/${slug}/pos/`))) {
    const suffix = pathname.slice(`/${slug}`.length)
    return finalizeResponse(sessionResponse, NextResponse.redirect(new URL(`/app/${slug}${suffix}`, request.url), 303))
  }

  if (slug) {
    const isDirectTenantPath = !isAppScoped && firstSegment === slug
    const shouldRewrite = isAppScoped
      ? !!pathSlug && !pathSlug.includes(".")
      : pathname === "/" ||
        isDirectTenantPath ||
        (!!firstSegment && !CRITICAL_SYSTEM_ROUTES.has(firstSegment) && !firstSegment.includes("."))

    if (isGuest) {
      sessionResponse.headers.set("x-guest-mode", "true")
    }
    sessionResponse.headers.set("x-tenant-slug", slug)

    if (shouldRewrite) {
      const rewrittenPath = isAppScoped
        ? `/${segments.slice(2).join("/")}`
        : isDirectTenantPath
          ? `/${segments.slice(1).join("/")}`
        : pathname === "/"
          ? `/${slug}`
          : `/${slug}${pathname}`

      const rewrittenUrl = new URL(rewrittenPath, request.url)
      const forwardedHeaders = new Headers(request.headers)
      forwardedHeaders.set("x-tenant-slug", slug)
      if (isGuest) {
        forwardedHeaders.set("x-guest-mode", "true")
      }

      const rewriteResponse = NextResponse.rewrite(rewrittenUrl, {
        request: {
          headers: forwardedHeaders,
        },
      })

      if (isDemo && !hasGuestCookie && !user) {
        rewriteResponse.cookies.set("guest_mode", "true", { path: "/", maxAge: 3600 })
      }

      return finalizeResponse(sessionResponse, rewriteResponse)
    }
  }

  return sessionResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
