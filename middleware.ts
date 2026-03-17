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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Skip middleware for static assets
  if (STATIC_ASSETS.some(prefix => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  // 2. Refresh session and get response object
  // Standard Supabase SSR middleware pattern
  let supabaseResponse = await updateSession(request)

  // 3. Get current session
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

  // 4. Route Protection Logic
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route)) || pathname === "/"
  const isAuthRoute = pathname.startsWith("/auth")

  if (!user && !isPublicRoute) {
    // Redirect to login if trying to access protected route while logged out
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (user && isAuthRoute && pathname !== "/auth/callback") {
    // Redirect to home (which redirects to dashboard) if trying to access auth pages while logged in
    return NextResponse.redirect(new URL("/", request.url))
  }

  // 5. Tenant Injection & Caching
  const segments = pathname.split("/").filter(Boolean)
  const firstSegment = segments[0]

  // If the first segment looks like a slug (not in public routes or reserved prefixes)
  const RESERVED_PREFIXES = new Set([...PUBLIC_ROUTES.map(r => r.split("/")[1]), "api", "onboarding"])
  
  if (firstSegment && !RESERVED_PREFIXES.has(firstSegment) && !firstSegment.includes(".")) {
    const slug = firstSegment
    
    // Check cache in cookie
    const cacheKey = `kp-tenant-${slug}`
    const cachedContext = request.cookies.get(cacheKey)?.value

    if (cachedContext) {
      try {
        const { orgId } = JSON.parse(cachedContext)
        supabaseResponse.headers.set("x-tenant-slug", slug)
        supabaseResponse.headers.set("x-org-id", orgId)
      } catch {
        // Cache invalid, proceeds without headers (or handles in server components)
      }
    } else if (user) {
      // If we are on a tenant route but no cache, we let the Server Component handle the resolution
      // and update the cache cookie in the response.
      // But for middleware robustness, we can inject a "needs-resolution" header.
      supabaseResponse.headers.set("x-tenant-slug", slug)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
