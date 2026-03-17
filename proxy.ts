import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/server"
import { createServerClient } from "@supabase/ssr"

// Routes that don't need authentication
const PUBLIC_ROUTES = [
  "/auth/login",
  "/auth/sign-up",
  "/auth/callback",
  "/auth/oauth-callback",
  "/demo",
  "/marketing",
  "/pricing",
  "/terms",
  "/privacy",
  "/legal",
]

const STATIC_ASSETS = [
  "/_next",
  "/favicon.ico",
  "/logo",
  "/api/public",
]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get("host") || ""

  // 1. Skip middleware for static assets
  if (STATIC_ASSETS.some(prefix => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  // 2. Refresh session and get response object
  let supabaseResponse = await updateSession(request)

  // 3. Resolve Tenant Slug (Path or Subdomain)
  let slug: string | null = null
  const segments = pathname.split("/").filter(Boolean)
  const firstSegment = segments[0]
  
  // Subdomain detection (e.g., demo.khataplus.online)
  const hostParts = hostname.split(".")
  const isLocalhost = hostname.includes("localhost") || hostname.includes("127.0.0.1")
  
  if (!isLocalhost && hostParts.length >= 3) {
    const subdomain = hostParts[0]
    if (subdomain !== "www" && subdomain !== "app") {
      slug = subdomain
    }
  }

  const SYSTEM_PREFIXES = new Set([
    "auth", "api", "setup-organization", "invite",
    "geoblocked", "privacy", "terms", "terms-and-condition", "terms-and-conditions", "legal", "_next", "pricing", "roadmap",
    "dashboard", "demo", "marketing", "offline", "docs", "solutions",
    "pending-approval", "tools", "beta", "for", "shop", "onboarding"
  ])
  
  const RESERVED_PREFIXES = SYSTEM_PREFIXES
  
  // Path-based slug detection (e.g., khataplus.online/acme/...) - takes precedence if no subdomain
  if (!slug && firstSegment && !RESERVED_PREFIXES.has(firstSegment) && !firstSegment.includes(".")) {
    slug = firstSegment
  }

  // Redirect to login if not authenticated and not a public route
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

  // 4. Guest Mode & Auth Logic
  const isDemo = slug === "demo"
  const isGuest = request.cookies.has("guest_mode") || isDemo
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route)) || pathname === "/"
  const isAuthRoute = pathname.startsWith("/auth")

  // Redirect to login if not authenticated and not a public/guest route
  if (!user && !isPublicRoute && !isGuest) {
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (user && isAuthRoute && pathname !== "/auth/callback") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // 5. Perform Rewrite for Tenant Routing
  if (slug) {
    // Determine if we should rewrite this path
    const shouldRewrite = !RESERVED_PREFIXES.has(firstSegment) && !firstSegment.includes(".")
    
    if (isGuest) {
      supabaseResponse.headers.set("x-guest-mode", "true")
    }

    const cacheKey = `kp-tenant-${slug}`
    const cachedContext = request.cookies.get(cacheKey)?.value

    if (cachedContext) {
      try {
        const { orgId } = JSON.parse(cachedContext)
        supabaseResponse.headers.set("x-tenant-slug", slug)
        supabaseResponse.headers.set("x-org-id", orgId)
      } catch { }
    } else {
      supabaseResponse.headers.set("x-tenant-slug", slug)
      // For demo, we might want to hardcode a demo org ID if known, 
      // but resolveTenant in layout handles it if not set here.
    }

    // Rewrite if it's a tenant route and not already prefixed
    if (shouldRewrite && firstSegment !== slug) {
      const rewrittenUrl = new URL(`/${slug}${pathname === "/" ? "" : pathname}`, request.url)
      
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

  // Fallback: If user visits /dashboard on main domain, redirect to their last tenant
  if (pathname === "/dashboard" && user && !slug) {
    const { getRedirectPath } = await import("@/lib/auth/server")
    const redirectPath = await getRedirectPath(user.id)
    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
