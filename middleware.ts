import { NextResponse, NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const SYSTEM_PREFIXES = new Set([
    'auth', 'api', 'setup-organization', 'invite', 'join',
    'geoblocked', 'privacy', 'terms', 'terms-and-condition', 'terms-and-conditions', 'legal', '_next', 'pricing', 'roadmap',
    'dashboard', 'demo', 'marketing', 'offline', 'docs', 'features', 'feathures', 'solutions', 'monitoring',
    'pending-approval', 'tools', 'beta', 'for', 'shop', 'pos',
    'login', 'sign-up'
])

function getAppHostFromHost(hostname: string): string {
    if (!hostname) return "app.khataplus.online"
    if (hostname === "localhost" || hostname === "127.0.0.1") return hostname
    if (hostname.endsWith(".localhost")) return hostname

    let base = hostname
    if (base.startsWith("www.")) base = base.slice(4)
    if (base.startsWith("demo.")) base = base.slice(5)
    if (base.startsWith("pos.")) base = base.slice(4)
    if (base.startsWith("app.")) base = base.slice(4)

    return `app.${base}`
}

function getMainHostFromHost(hostname: string): string {
    if (!hostname) return "khataplus.online"
    if (hostname === "localhost" || hostname === "127.0.0.1") return "localhost"
    if (hostname.endsWith(".localhost")) return "localhost"

    let base = hostname
    if (base.startsWith("www.")) base = base.slice(4)
    if (base.startsWith("demo.")) base = base.slice(5)
    if (base.startsWith("pos.")) base = base.slice(4)
    if (base.startsWith("app.")) base = base.slice(4)

    return base
}

function isPublicRoute(pathname: string): boolean {
    if (pathname === '/' || pathname === '/login' || pathname === '/sign-up') return true
    if (pathname === '/auth/login' || pathname === '/auth/sign-up' || pathname === '/auth/callback') return true
    if (pathname.startsWith('/api/auth/')) return true
    if (pathname.startsWith('/demo/')) return true
    if (pathname === '/pricing' || pathname === '/features' || pathname === '/feathures') return true
    if (pathname === '/solutions' || pathname === '/privacy' || pathname === '/terms') return true
    if (pathname === '/offline' || pathname === '/monitoring') return true
    if (pathname === '/icon.svg' || pathname === '/manifest.json') return true
    if (pathname === '/og-image.png' || pathname === '/apple-icon.png') return true
    return false
}

function resolveSupabaseCspSources(): string {
    const base = ["https://*.supabase.co"]
    const raw = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim()
    if (raw) {
        try {
            const origin = new URL(raw).origin
            if (!base.includes(origin)) {
                base.unshift(origin)
            }
        } catch {
            // Ignore malformed env and keep default source.
        }
    }
    return base.join(" ")
}

export default async function proxy(req: NextRequest) {
    const pathname = req.nextUrl.pathname
    const url = req.nextUrl
    const hostHeader = (req.headers.get("host") || "").toLowerCase()
    const host = hostHeader.split(":")[0]
    const hostPort = hostHeader.includes(":") ? hostHeader.split(":")[1] : ""
    const isPosHost = host === "pos.khataplus.online" || host.startsWith("pos.")
    const isDemoHost = host === "demo.khataplus.online" || host.startsWith("demo.")
    const isAppHost = host === "app.khataplus.online" || host.startsWith("app.")
    const isLocalDevHost = host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost")
    const isSubdomain = isAppHost || isPosHost || isDemoHost
    const segments = pathname.split('/').filter(Boolean)
    const firstSegment = segments[0] || ''
    const isTenantRoute = !!firstSegment && !SYSTEM_PREFIXES.has(firstSegment) && !firstSegment.includes('.')
    const isDashboardPath = pathname === "/dashboard" || pathname.startsWith("/dashboard/")
    const isAuthPath = pathname === "/auth" || pathname.startsWith("/auth/")
    const isCleanAuthPath = pathname === "/login" || pathname === "/sign-up"
    const isLegacyDemoDashboardPath = pathname === "/demo/dashboard" || pathname.startsWith("/demo/dashboard/")

    // Keep marketing landing off app subdomain.
    if (isAppHost && pathname === "/") {
        const redirectUrl = new URL("/dashboard", req.url)
        redirectUrl.search = url.search
        return NextResponse.redirect(redirectUrl)
    }

    // Keep auth pages on the main domain, never on any subdomain.
    if (!isLocalDevHost && isSubdomain && (isAuthPath || isCleanAuthPath)) {
        const mainHost = getMainHostFromHost(host)
        const hostWithPort = hostPort ? `${mainHost}:${hostPort}` : mainHost
        const protocol = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
        const redirectUrl = new URL(pathname + url.search, `${protocol}://${hostWithPort}`)
        return NextResponse.redirect(redirectUrl)
    }

    // Normalize accidental "/login/*" or "/sign-up/*" prefixes on subdomains.
    if (isSubdomain && (pathname.startsWith("/login/") || pathname.startsWith("/sign-up/"))) {
        const normalizedPath = pathname.replace(/^\/(login|sign-up)/, "") || "/"
        const redirectUrl = new URL(normalizedPath, req.url)
        redirectUrl.search = url.search
        return NextResponse.redirect(redirectUrl)
    }

    // Expose clean auth URLs on main domain while serving existing auth pages.
    if (!isAppHost && !isPosHost && !isDemoHost && pathname === "/login") {
        const rewriteUrl = new URL("/auth/login", req.url)
        rewriteUrl.search = url.search
        return NextResponse.rewrite(rewriteUrl)
    }

    if (!isAppHost && !isPosHost && !isDemoHost && pathname === "/sign-up") {
        const rewriteUrl = new URL("/auth/sign-up", req.url)
        rewriteUrl.search = url.search
        return NextResponse.rewrite(rewriteUrl)
    }

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

    if (!isLocalDevHost && !isAppHost && !isPosHost && !isDemoHost && !pathname.startsWith("/api/")) {
        // Keep auth pages on the main marketing domain.
        if (isDashboardPath || isTenantRoute) {
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

    let baseResponse = NextResponse.next({ request: { headers: requestHeaders } })
    let user: any = null
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!isDemoHost && supabaseUrl && supabaseAnonKey && !pathname.startsWith('/api/')) {
        const supabase = createServerClient(
            supabaseUrl,
            supabaseAnonKey,
            {
                cookies: {
                    getAll() {
                        return req.cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
                        baseResponse = NextResponse.next({
                            request: {
                                headers: req.headers,
                            },
                        })
                        cookiesToSet.forEach(({ name, value, options }: { name: string, value: string, options: CookieOptions }) =>
                            baseResponse.cookies.set(name, value, options)
                        )
                    },
                },
            }
        )

        const { data } = await supabase.auth.getUser()
        user = data.user || null
    }

    if (!isDemoHost && !user && !isPublicRoute(pathname)) {
        const loginPath = `/auth/login?next=${encodeURIComponent(pathname + (url.search || ''))}`
        if (!isLocalDevHost && isSubdomain) {
            const mainHost = getMainHostFromHost(host)
            const hostWithPort = hostPort ? `${mainHost}:${hostPort}` : mainHost
            const protocol = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
            return NextResponse.redirect(new URL(loginPath, `${protocol}://${hostWithPort}`))
        }
        return NextResponse.redirect(new URL(loginPath, req.url))
    }

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
        const remainder = segments.slice(1)
        if (remainder[0] === "pos") {
            const posTail = remainder.slice(1).join("/")
            rewrittenPathname = `/pos/${orgSlug}${posTail ? `/${posTail}` : ""}`
        } else {
            rewrittenPathname = '/' + remainder.join('/')
            if (rewrittenPathname === '/') rewrittenPathname = '/dashboard'
        }

        requestHeaders.set('x-tenant-slug', orgSlug)
        requestHeaders.set('x-path-prefix', `/${orgSlug}`)
    }

    const supabaseSources = resolveSupabaseCspSources()
    const cspHeader = `
        default-src 'self';
        script-src 'self' 'unsafe-eval' 'unsafe-inline' ${supabaseSources} https://accounts.google.com https://*.vercel-scripts.com https://checkout.razorpay.com https://api.razorpay.com https://*.razorpay.com;
        style-src 'self' 'unsafe-inline' https://accounts.google.com https://grainy-gradients.vercel.app https://fonts.googleapis.com;
        img-src 'self' blob: data: ${supabaseSources} https://*.googleusercontent.com https://images.unsplash.com https://grainy-gradients.vercel.app https://accounts.google.com;
        font-src 'self' data: https://fonts.gstatic.com;
        frame-src 'self' https://accounts.google.com https://checkout.razorpay.com https://api.razorpay.com https://*.razorpay.com https://*.rzp.io;
        connect-src 'self' ${supabaseSources} https://sweet-feather-8f6f.khataplus.workers.dev https://accounts.google.com https://*.vercel-scripts.com https://api.razorpay.com https://checkout.razorpay.com https://*.razorpay.com https://*.rzp.io https://o*.ingest.sentry.io https://*.vercel-insights.com https://*.vercel-analytics.com;
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
