import { NextResponse, NextRequest } from 'next/server'

// Routes that should NOT be treated as org slugs
const SYSTEM_PREFIXES = new Set([
    'auth', 'api', 'setup-organization', 'invite', 'join',
    'geoblocked', 'privacy', 'terms', 'terms-and-condition', 'terms-and-conditions', 'legal', '_next', 'pricing', 'roadmap',
    'dashboard', 'demo', 'marketing', 'offline', 'docs', 'solutions',
    'pending-approval', 'tools', 'beta', 'for', 'shop', 'monitoring'
])

export default async function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname
    const url = req.nextUrl
    const requestHeaders = new Headers(req.headers)

    requestHeaders.set("x-invoke-path", pathname)
    if (req.cookies.has("guest_mode") || pathname.startsWith("/demo")) {
        requestHeaders.set("x-guest-mode", "true")
    }

    const segments = pathname.split('/').filter(Boolean)
    const firstSegment = segments[0] || ''

    let orgSlug: string | null = null
    let rewrittenPathname = pathname

    // If first segment is NOT a system route and not a file, treat it as an org slug
    if (firstSegment && !SYSTEM_PREFIXES.has(firstSegment) && !firstSegment.includes('.')) {
        orgSlug = firstSegment
        rewrittenPathname = '/' + segments.slice(1).join('/')
        if (rewrittenPathname === '/') rewrittenPathname = '/dashboard'

        requestHeaders.set("x-tenant-slug", orgSlug)
        requestHeaders.set("x-path-prefix", `/${orgSlug}`)
    }

    // Security Headers are now handled in next.config.mjs for consistency and to avoid conflicts
    const securityHeaders = {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
        'X-Permitted-Cross-Domain-Policies': 'none',
    }

    let finalResponse: NextResponse = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    })

    if (orgSlug) {
        const rewriteUrl = new URL(rewrittenPathname, req.url)
        rewriteUrl.search = url.search
        finalResponse = NextResponse.rewrite(rewriteUrl, {
            headers: requestHeaders,
        })
    }

    // Apply security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
        finalResponse.headers.set(key, value)
    })

    return finalResponse
}

export const config = {
    matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
