import { authMiddleware } from '@descope/nextjs-sdk/server'
import { NextResponse, NextRequest } from 'next/server'

// Routes that should NOT be treated as org slugs
const SYSTEM_PREFIXES = new Set([
    'auth', 'auth-api', 'api', 'setup-organization', 'invite',
    'geoblocked', 'privacy', 'terms', '_next',
    'dashboard', 'demo', 'marketing', 'offline',
    'pending-approval', 'tools', 'beta', 'for', 'shop',
])

export default async function middleware(req: NextRequest) {
    const url = req.nextUrl
    const pathname = url.pathname
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set("x-invoke-path", pathname)

    // Ensure guest mode header is passed if cookie is present
    if (req.cookies.has("guest_mode") || pathname.startsWith("/demo")) {
        requestHeaders.set("x-guest-mode", "true")
    }

    // Extract first path segment
    const segments = pathname.split('/').filter(Boolean)
    const firstSegment = segments[0] || ''

    // Handle demo: /demo or /demo/* → set guest cookie, rewrite to /dashboard/*
    if (firstSegment === 'demo') {
        const innerPath = '/' + segments.slice(1).join('/')
        const rewrittenPath = innerPath === '/' ? '/dashboard' : innerPath
        const rewriteUrl = new URL(rewrittenPath, req.url)
        rewriteUrl.search = url.search

        requestHeaders.set("x-guest-mode", "true")
        requestHeaders.set("x-path-prefix", "/demo")
        const response = NextResponse.rewrite(rewriteUrl, {
            request: { headers: requestHeaders }
        })
        response.cookies.set("guest_mode", "true", {
            path: "/",
            httpOnly: true,
            secure: false, // Ensure cookies work on local Firefox without HTTPS
            maxAge: 60 * 30,
            sameSite: "lax"
        })
        return response
    }

    let orgSlug: string | null = null
    let rewrittenPathname = pathname

    // If first segment is NOT a system route, treat it as an org slug
    if (firstSegment && !SYSTEM_PREFIXES.has(firstSegment) && !firstSegment.includes('.')) {
        orgSlug = firstSegment
        // Strip org slug: /orgslug/dashboard → /dashboard
        rewrittenPathname = '/' + segments.slice(1).join('/')
        if (rewrittenPathname === '/') rewrittenPathname = '/dashboard'

        requestHeaders.set("x-tenant-slug", orgSlug)
        requestHeaders.set("x-path-prefix", `/${orgSlug}`)
    }

    // Public routes
    const publicRoutes = [
        "/",
        "/auth/login",
        "/auth/sign-up",
        "/setup-organization",
        "/invite/:path*",
        "/geoblocked",
        "/api/sentry-tunnel",
        "/api/debug-db",
        "/auth-api/:path*",
        "/tools",
        "/tools/:path*",
        "/tools/gst-calculator",
        "/tools/business-card",
        "/beta",
        "/for/:path*",
        "/shop/:path*",
        "/privacy",
        "/terms",
    ]



    // @ts-ignore
    const descopeMiddleware = authMiddleware({
        projectId: process.env.NEXT_PUBLIC_DESCOPE_PROJECT_ID,
        publicRoutes,
        redirectUrl: "/auth/login",
    })

    // If we have an org slug, rewrite the URL (strip slug prefix)
    if (orgSlug) {
        const rewriteUrl = new URL(rewrittenPathname, req.url)
        rewriteUrl.search = url.search

        // Auth check against the rewritten path
        const authReq = new NextRequest(rewriteUrl, { headers: requestHeaders })
        const authResponse = await descopeMiddleware(authReq as any)
        if (authResponse) return authResponse

        // Rewrite to internal path
        return NextResponse.rewrite(rewriteUrl, {
            request: { headers: requestHeaders }
        })
    }

    // Bypass auth for system routes (except dashboard) and explicit public routes
    const isSystemRoute = SYSTEM_PREFIXES.has(firstSegment) && firstSegment !== 'dashboard'
    const isPublicRoute = publicRoutes.some(route => {
        if (route.endsWith(":path*")) {
            return pathname.startsWith(route.replace(":path*", ""))
        }
        return pathname === route
    })

    if (isSystemRoute || isPublicRoute) {
        return NextResponse.next({
            request: { headers: requestHeaders }
        })
    }

    // No org slug — normal request
    const newReq = new NextRequest(req.url, { headers: requestHeaders })
    const authResponse = await descopeMiddleware(newReq as any)

    if (authResponse) {
        if (pathname.includes("api") || pathname.includes("tools")) {
            console.log(`[Middleware] Auth Intercepted: ${pathname} -> Redirecting to ${authResponse.headers.get("location")}`)
        }
        return authResponse
    }

    return NextResponse.next({
        request: { headers: requestHeaders }
    })
}

export const config = {
    matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
