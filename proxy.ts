import { NextResponse, NextRequest } from 'next/server'
import { authMiddleware } from '@descope/nextjs-sdk/server'

const SYSTEM_PREFIXES = new Set([
    'auth', 'api', 'setup-organization', 'invite', 'join',
    'geoblocked', 'privacy', 'terms', 'terms-and-condition', 'terms-and-conditions', 'legal', '_next', 'pricing', 'roadmap',
    'dashboard', 'demo', 'marketing', 'offline', 'docs', 'features', 'feathures', 'solutions', 'monitoring',
    'pending-approval', 'tools', 'beta', 'for', 'shop', 'pos'
])

function getAppHostFromHost(hostname: string): string {
    if (!hostname) return "app.khataplus.online"
    if (hostname === "localhost" || hostname === "127.0.0.1") return "app.localhost"
    if (hostname.endsWith(".localhost")) return "app.localhost"

    let base = hostname
    if (base.startsWith("www.")) base = base.slice(4)
    if (base.startsWith("demo.")) base = base.slice(5)
    if (base.startsWith("pos.")) base = base.slice(4)
    if (base.startsWith("app.")) base = base.slice(4)

    return `app.${base}`
}

const descopeAuth = authMiddleware({
    redirectUrl: '/auth/login',
    publicRoutes: [
        '/',
        '/auth/login',
        '/auth/sign-up',
        '/auth/callback',
        '/api/auth/**',
        '/demo/**',
        '/pricing',
        '/features',
        '/feathures',
        '/solutions',
        '/privacy',
        '/terms',
        '/offline',
        '/monitoring',
        '/icon.svg',
        '/manifest.json',
        '/og-image.png',
        '/apple-icon.png',
    ],
})

export default async function proxy(req: NextRequest) {
    const pathname = req.nextUrl.pathname
    const url = req.nextUrl
    const hostHeader = (req.headers.get("host") || "").toLowerCase()
    const host = hostHeader.split(":")[0]
    const hostPort = hostHeader.includes(":") ? hostHeader.split(":")[1] : ""
    const isPosHost = host === "pos.khataplus.online" || host.startsWith("pos.")
    const isDemoHost = host === "demo.khataplus.online" || host.startsWith("demo.")
    const isAppHost = host === "app.khataplus.online" || host.startsWith("app.")
    const segments = pathname.split('/').filter(Boolean)
    const firstSegment = segments[0] || ''
    const isTenantRoute = !!firstSegment && !SYSTEM_PREFIXES.has(firstSegment) && !firstSegment.includes('.')
    const isDashboardPath = pathname === "/dashboard" || pathname.startsWith("/dashboard/")
    const isAuthPath = pathname === "/auth" || pathname.startsWith("/auth/")
    const isLegacyDemoDashboardPath = pathname === "/demo/dashboard" || pathname.startsWith("/demo/dashboard/")

    if (isLegacyDemoDashboardPath) {
        if (isDemoHost) {
            const normalizedPath = pathname.replace(/^\/demo/, "") || "/dashboard"
            const normalizedUrl = new URL(normalizedPath, req.url)
            normalizedUrl.search = url.search
            return NextResponse.redirect(normalizedUrl)
        }

        const demoHost = host.startsWith("demo.") ? host : `demo.${host}`
        const hostWithPort = hostPort ? `${demoHost}:${hostPort}` : demoHost
        const suffix = pathname.replace(/^\/demo/, "") || "/dashboard"
        const redirectUrl = new URL(req.url)
        redirectUrl.host = hostWithPort
        redirectUrl.pathname = suffix
        return NextResponse.redirect(redirectUrl)
    }

    if (!isAppHost && !isPosHost && !isDemoHost && !pathname.startsWith("/api/")) {
        if (isAuthPath || isDashboardPath || isTenantRoute) {
            const appHost = getAppHostFromHost(host)
            const hostWithPort = hostPort ? `${appHost}:${hostPort}` : appHost
            const redirectUrl = new URL(req.url)
            redirectUrl.host = hostWithPort
            return NextResponse.redirect(redirectUrl)
        }
    }

    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-invoke-path', pathname)
    if (req.cookies.has('guest_mode') || pathname.startsWith('/demo') || isDemoHost) {
        requestHeaders.set('x-guest-mode', 'true')
    }

    if (isDemoHost && pathname === "/") {
        const redirectUrl = new URL("/dashboard", req.url)
        redirectUrl.search = url.search
        return NextResponse.redirect(redirectUrl)
    }

    const baseResponse = isDemoHost
        ? NextResponse.next({ request: { headers: requestHeaders } })
        : await descopeAuth(req)
    const authRedirectLocation = baseResponse.headers.get('location')

    let orgSlug: string | null = null
    let rewrittenPathname = pathname

    // POS surface: only expose dedicated billing route at /:slug/sales
    if (isPosHost) {
        const posFirst = segments[0] || ''
        const posSecond = segments[1] || ''

        requestHeaders.set("x-app-surface", "pos")

        if (posFirst && !SYSTEM_PREFIXES.has(posFirst) && !posFirst.includes('.')) {
            orgSlug = posFirst
            requestHeaders.set("x-tenant-slug", orgSlug)
            requestHeaders.set("x-path-prefix", `/${orgSlug}`)

            if (posSecond !== "sales" || segments.length !== 2) {
                const redirectUrl = new URL(`/${orgSlug}/sales`, req.url)
                redirectUrl.search = url.search
                return NextResponse.redirect(redirectUrl)
            }

            rewrittenPathname = `/pos/${orgSlug}/sales`
        }
    } else if (firstSegment && !SYSTEM_PREFIXES.has(firstSegment) && !firstSegment.includes('.')) {
        orgSlug = firstSegment
        rewrittenPathname = '/' + segments.slice(1).join('/')
        if (rewrittenPathname === '/') rewrittenPathname = '/dashboard'

        requestHeaders.set('x-tenant-slug', orgSlug)
        requestHeaders.set('x-path-prefix', `/${orgSlug}`)
    }

    const cspHeader = `
        default-src 'self';
        script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.descope.com https://descopecdn.com https://accounts.google.com https://*.vercel-scripts.com https://checkout.razorpay.com https://api.razorpay.com https://*.razorpay.com;
        style-src 'self' 'unsafe-inline' https://*.descope.com https://descopecdn.com https://accounts.google.com https://grainy-gradients.vercel.app https://fonts.googleapis.com;
        img-src 'self' blob: data: https://*.descope.com https://descopecdn.com https://*.googleusercontent.com https://images.unsplash.com https://grainy-gradients.vercel.app https://accounts.google.com;
        font-src 'self' data: https://fonts.gstatic.com;
        frame-src 'self' https://*.descope.com https://descopecdn.com https://accounts.google.com https://checkout.razorpay.com https://api.razorpay.com https://*.razorpay.com https://*.rzp.io;
        connect-src 'self' https://*.descope.com https://api.descope.com https://descopecdn.com https://accounts.google.com https://*.vercel-scripts.com https://api.razorpay.com https://checkout.razorpay.com https://*.razorpay.com https://*.rzp.io;
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'none';
        block-all-mixed-content;
        upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim()

    const securityHeaders = {
        'Content-Security-Policy': cspHeader,
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
        'X-Permitted-Cross-Domain-Policies': 'none',
    }

    let finalResponse: NextResponse = baseResponse

    if (authRedirectLocation) {
        Object.entries(securityHeaders).forEach(([key, value]) => {
            finalResponse.headers.set(key, value)
        })
        return finalResponse
    }

    if (orgSlug) {
        const rewriteUrl = new URL(rewrittenPathname, req.url)
        rewriteUrl.search = url.search
        finalResponse = NextResponse.rewrite(rewriteUrl, {
            headers: requestHeaders,
        })
    } else {
        requestHeaders.forEach((value, key) => {
            finalResponse.headers.set(key, value)
        })
    }

    Object.entries(securityHeaders).forEach(([key, value]) => {
        finalResponse.headers.set(key, value)
    })
    if (isDemoHost) {
        finalResponse.cookies.set("guest_mode", "true", {
            path: "/",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 8,
            sameSite: "lax",
        })
    }

    return finalResponse
}

export const config = {
    matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
