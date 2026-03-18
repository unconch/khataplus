import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/server"
import { createServerClient } from "@supabase/ssr"

console.log("[Proxy] Proxy file loaded")

// Routes that don't need authentication
const PUBLIC_ROUTES = [
  "/auth/login",
  "/auth/sign-up",
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

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get("host") || ""
  const segments = pathname.split("/").filter(Boolean)
  const firstSegment = segments[0]
  const isAppScoped = firstSegment === "app"
  const pathSlug = isAppScoped ? segments[1] : null

  // 1. Skip middleware for static assets
  if (STATIC_ASSETS.some(prefix => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  console.log(`[Proxy] Request Details - Host: ${hostname}, Path: ${pathname}`)

  // 2. Refresh session and get response object
  let supabaseResponse: NextResponse
  try {
    supabaseResponse = await updateSession(request)
  } catch (error) {
    console.error("[Proxy] updateSession failed:", error)
    supabaseResponse = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }

  // ... (security headers part)


  // --------------------------------------------------------------------------
  // PERIMETER HARDENING: Security Headers (ASVS Level 3)
  // --------------------------------------------------------------------------
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
  `.replace(/\s{2,}/g, ' ').trim();

  const securityHeaders = {
    'Content-Security-Policy': cspHeader,
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Permitted-Cross-Domain-Policies': 'none',
  }

  Object.entries(securityHeaders).forEach(([key, value]) => {
    supabaseResponse.headers.set(key, value)
  })

  // 3. Resolve Tenant Slug (Path or Subdomain)
  let slug: string | null = null
  
  // Subdomain detection (e.g., demo.khataplus.online or demo.localhost)
  const hostParts = hostname.split(":") // remove port
  const domain = hostParts[0]
  const domainParts = domain.split(".")
  
  const isIpv4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(domain)
  const isLocalHost = domain === "localhost" || domain.endsWith(".localhost")

  // Only treat host as tenant subdomain when there are 3+ labels
  // (e.g. demo.khataplus.online). Apex domains like khataplus.online
  // must not be interpreted as tenant slugs.
  if (domainParts.length >= 3 && !isIpv4 && !isLocalHost) {
    const subdomain = domainParts[0]
    // Filter out common system subdomains
    if (subdomain !== "www" && subdomain !== "app" && subdomain !== domain) {
      slug = subdomain
    }
  }

  if (!slug && pathSlug && !pathSlug.includes(".")) {
    slug = pathSlug
  } else if (!slug && firstSegment === "demo") {
    // Force demo slug if path is /demo...
    slug = "demo"
  }

  // Guest Mode & Auth Logic
  const isDemo = slug === "demo"
  const isGuest = request.cookies.has("guest_mode") || isDemo
  
  console.log(`[Proxy] Slug Discovery - Slug: ${slug}, isDemo: ${isDemo}, isGuest: ${isGuest}`)
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route)) || pathname === "/"
  const isAuthRoute = pathname.startsWith("/auth")
  const isProtectedRoute = pathname.startsWith("/app/") || pathname.startsWith("/dashboard")

  // ... (auth logic part)


  // Redirect to login if not authenticated and not a public/guest route
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Redirect to login if not authenticated and not a public/guest route
  if (!user && isProtectedRoute && !isGuest) {
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (user && isAuthRoute && pathname !== "/auth/callback") {
    // If an authenticated user hits auth pages, send them to app shell
    // so CTA clicks don't appear to "do nothing" on the landing page.
    const dashboardPath = slug ? `/app/${slug}/dashboard` : "/dashboard"
    return NextResponse.redirect(new URL(dashboardPath, request.url))
  }

  // 5. Perform Rewrite for Tenant Routing
  if (slug) {
    // Determine if we should rewrite this path
    const CRITICAL_SYSTEM_ROUTES = new Set(["auth", "api", "_next", "favicon.ico", "logo", "onboarding"])
    const shouldRewrite = isAppScoped
      ? !!pathSlug && !pathSlug.includes(".")
      : !!firstSegment && !CRITICAL_SYSTEM_ROUTES.has(firstSegment) && !firstSegment.includes(".")
    
    if (isGuest) {
      supabaseResponse.headers.set("x-guest-mode", "true")
    }
    supabaseResponse.headers.set("x-tenant-slug", slug)

    // Internal rewrite target:
    // - /app/{slug}/... -> /{slug}/...
    // - subdomain tenant routes (e.g. demo.domain.com/dashboard) -> /{slug}/dashboard
    if (shouldRewrite) {
      const rewrittenPath = isAppScoped
        ? `/${slug}${segments.slice(2).length ? `/${segments.slice(2).join("/")}` : ""}`
        : `/${slug}${pathname === "/" ? "" : pathname}`
      const rewrittenUrl = new URL(rewrittenPath, request.url)
      
      console.log(`[Middleware] Rewriting to: ${rewrittenUrl.toString()}`)
      const rewriteResponse = NextResponse.rewrite(rewrittenUrl, {
        request: {
          headers: supabaseResponse.headers,
        },
      })
      
      supabaseResponse.cookies.getAll().forEach((c) => {
        rewriteResponse.cookies.set(c.name, c.value)
      })

      if (isDemo && !request.cookies.has("guest_mode")) {
        rewriteResponse.cookies.set("guest_mode", "true", { path: "/", maxAge: 3600 })
      }
      
      return rewriteResponse
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
