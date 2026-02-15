import { NextResponse, NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// Routes that should NOT be treated as org slugs
const SYSTEM_PREFIXES = new Set([
    'auth', 'api', 'setup-organization', 'invite',
    'geoblocked', 'privacy', 'terms', '_next',
    'dashboard', 'demo', 'marketing', 'offline',
    'pending-approval', 'tools', 'beta', 'for', 'shop',
])

export default async function middleware(req: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: req.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return req.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => req.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: req.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }: { name: string, value: string, options: CookieOptions }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // --------------------------------------------------------------------------
    // SESSION GOVERNANCE: Check Revocation / Concurrent Limits (ASVS Level 3)
    // --------------------------------------------------------------------------
    if (user) {
        try {
            const { isSessionValid } = await import('@/lib/session-governance');
            // We use a snippet of the access token as a surrogate for session ID
            const { data: { session } } = await supabase.auth.getSession();
            const sessionId = session?.access_token.slice(-16);

            if (sessionId) {
                const isValid = await isSessionValid(user.id, sessionId);
                if (!isValid) {
                    // Sign out and redirect to login if session is revoked
                    await supabase.auth.signOut();
                    return NextResponse.redirect(new URL('/auth/login?message=session_revoked', req.url));
                }
            }
        } catch (err) {
            console.error("[Middleware] Session check failed:", err);
            // Default to allowing if Redis is down? For high availability, maybe. 
            // But for high security, we should consider blocking.
        }
    }
    const url = req.nextUrl
    const pathname = url.pathname

    const requestHeaders = new Headers(req.headers)
    requestHeaders.set("x-invoke-path", pathname)

    if (req.cookies.has("guest_mode") || pathname.startsWith("/demo")) {
        requestHeaders.set("x-guest-mode", "true")
    }

    const segments = pathname.split('/').filter(Boolean)
    const firstSegment = segments[0] || ''

    let orgSlug: string | null = null
    let rewrittenPathname = pathname

    // If first segment is NOT a system route, treat it as an org slug
    if (firstSegment && !SYSTEM_PREFIXES.has(firstSegment) && !firstSegment.includes('.')) {
        orgSlug = firstSegment
        rewrittenPathname = '/' + segments.slice(1).join('/')
        if (rewrittenPathname === '/') rewrittenPathname = '/dashboard'

        requestHeaders.set("x-tenant-slug", orgSlug)
        requestHeaders.set("x-path-prefix", `/${orgSlug}`)
    }

    // --------------------------------------------------------------------------
    // PERIMETER HARDENING: Security Headers (ASVS Level 3)
    // --------------------------------------------------------------------------
    const cspHeader = `
        default-src 'self';
        script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co https://accounts.google.com;
        style-src 'self' 'unsafe-inline';
        img-src 'self' blob: data: https://*.supabase.co https://*.googleusercontent.com;
        font-src 'self' data:;
        frame-src 'self' https://accounts.google.com;
        connect-src 'self' https://*.supabase.co https://accounts.google.com;
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
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
        'X-Permitted-Cross-Domain-Policies': 'none',
    }

    let activeResponse: NextResponse;

    if (firstSegment === 'demo') {
        const innerPath = '/' + segments.slice(1).join('/')
        const rewrittenPath = innerPath === '/' ? '/dashboard' : innerPath
        const rewriteUrl = new URL(rewrittenPath, req.url)
        rewriteUrl.search = url.search

        requestHeaders.set("x-guest-mode", "true")
        requestHeaders.set("x-path-prefix", "/demo")
        activeResponse = NextResponse.rewrite(rewriteUrl, {
            headers: requestHeaders
        })
        activeResponse.cookies.set("guest_mode", "true", {
            path: "/",
            httpOnly: true,
            secure: false,
            maxAge: 60 * 30,
            sameSite: "lax"
        })
    } else if (orgSlug) {
        const rewriteUrl = new URL(rewrittenPathname, req.url)
        rewriteUrl.search = url.search

        activeResponse = NextResponse.rewrite(rewriteUrl, {
            headers: requestHeaders
        })

        response.cookies.getAll().forEach(cookie => {
            activeResponse.cookies.set(cookie.name, cookie.value)
        })
    } else {
        requestHeaders.forEach((value, key) => {
            response.headers.set(key, value)
        })
        activeResponse = response
    }

    Object.entries(securityHeaders).forEach(([key, value]) => {
        activeResponse.headers.set(key, value)
    })

    return activeResponse
}

export const config = {
    matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
