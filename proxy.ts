import { NextResponse, NextRequest } from 'next/server'
import { authMiddleware } from '@descope/nextjs-sdk/server'

// Routes that should NOT be treated as org slugs
const SYSTEM_PREFIXES = new Set([
    'auth', 'api', 'setup-organization', 'invite', 'join',
    'geoblocked', 'privacy', 'terms', 'terms-and-condition', 'terms-and-conditions', 'legal', '_next', 'pricing', 'roadmap',
    'dashboard', 'demo', 'marketing', 'offline', 'docs', 'solutions',
    'pending-approval', 'tools', 'beta', 'for', 'shop',
])

const descopeAuth = authMiddleware({
    redirectUrl: '/auth/login',
    // Only public paths. All other paths will require a session.
    publicRoutes: [
        '/',
        '/auth/login',
        '/auth/sign-up',
        '/auth/callback',
        '/api/auth/**',
        '/demo/**',
        '/pricing',
        '/privacy',
        '/terms',
        '/offline',
        '/icon.svg',
        '/manifest.json',
        '/og-image.png',
        '/apple-icon.png'
    ],
})

export default async function middleware(req: NextRequest) {
    const baseResponse = await descopeAuth(req)
    const pathname = req.nextUrl.pathname
    const url = req.nextUrl
    const requestHeaders = new Headers(req.headers)
    const authRedirectLocation = baseResponse.headers.get("location")

    requestHeaders.set("x-invoke-path", pathname)
    if (req.cookies.has("guest_mode") || pathname.startsWith("/demo")) {
        requestHeaders.set("x-guest-mode", "true")
    }

    const segments = pathname.split('/').filter(Boolean)
    const firstSegment = segments[0] || ''

    let orgSlug: string | null = null
    let rewrittenPathname = pathname

    if (firstSegment && !SYSTEM_PREFIXES.has(firstSegment) && !firstSegment.includes('.')) {
        orgSlug = firstSegment
        rewrittenPathname = '/' + segments.slice(1).join('/')
        if (rewrittenPathname === '/') rewrittenPathname = '/dashboard'

        requestHeaders.set("x-tenant-slug", orgSlug)
        requestHeaders.set("x-path-prefix", `/${orgSlug}`)
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

    return finalResponse
}

export const config = {
    matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
