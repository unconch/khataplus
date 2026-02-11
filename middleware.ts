import { authMiddleware } from '@descope/nextjs-sdk/server'
import { NextResponse, NextRequest } from 'next/server'

export default async function middleware(req: NextRequest) {
    const url = req.nextUrl
    const hostname = req.headers.get("host") || ""

    // 1. Subdomain / Tenant Detection
    const rootDomains = ["localhost:3000", "khataplus.com", "www.khataplus.com", "khataplus.vercel.app"]
    let tenantSlug = null
    const isIp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(hostname)

    if (!rootDomains.includes(hostname) && !isIp) {
        // Extract subdomain (e.g., apple.localhost:3000 => apple)
        const parts = hostname.split('.')
        if (parts.length >= 2) {
            tenantSlug = parts[0]
        }
    }

    const isDemo = tenantSlug === "demo"

    console.log(`--- [DEBUG] Middleware: host=${hostname} tenant=${tenantSlug} isDemo=${isDemo} path=${url.pathname} ---`)

    // If on a subdomain (not root) and at the root path "/", redirect to "/dashboard"
    // This makes sure org.domain.com/ takes you to org.domain.com/dashboard
    if (tenantSlug && url.pathname === "/") {
        const dashboardUrl = new URL("/dashboard", req.url)
        console.log(`--- [DEBUG] Middleware: Redirecting subdomain root to /dashboard ---`)
        return NextResponse.redirect(dashboardUrl)
    }

    // Redirect /demo/* (but not /demo itself) to demo.domain/*
    // /demo is the entry point that sets guest cookies
    if (url.pathname.startsWith("/demo") && url.pathname !== "/demo" && !isDemo) {
        const newUrl = new URL(req.url)
        newUrl.pathname = url.pathname.replace(/^\/demo/, "")
        if (newUrl.pathname === "" || newUrl.pathname === "/") newUrl.pathname = "/dashboard"

        // Handle localhost:3000 => demo.localhost:3000
        newUrl.hostname = `demo.${url.hostname}`
        console.log(`--- [DEBUG] Middleware: Redirecting /demo path to subdomain: ${newUrl.hostname}${newUrl.pathname} ---`)
        return NextResponse.redirect(newUrl)
    }

    // Inject path and tenant slug for layout detection
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set("x-invoke-path", url.pathname)
    if (tenantSlug) {
        requestHeaders.set("x-tenant-slug", tenantSlug)
    }

    // 2. Auth Middleware Configuration
    const publicRoutes = [
        "/",
        "/auth/login",
        "/auth/sign-up",
        "/demo",
        "/api/debug-db",
        "/setup-organization",
        "/invite/:path*",
        "/geoblocked",
        "/api/sentry-tunnel",
        "/privacy",
        "/terms",
    ]

    // If on demo subdomain, all dashboard and api routes are public
    if (isDemo) {
        console.log("--- [DEBUG] Middleware: Demo Subdomain - Opening /dashboard and /api ---")
        publicRoutes.push("/dashboard")
        publicRoutes.push("/dashboard/:path*")
        publicRoutes.push("/api/:path*")
    }

    // Wrap authMiddleware
    // @ts-ignore
    const descopeMiddleware = authMiddleware({
        projectId: process.env.NEXT_PUBLIC_DESCOPE_PROJECT_ID,
        publicRoutes,
        redirectUrl: "/auth/login",
    })

    // Create a new request with the updated headers
    const newReq = new NextRequest(req.url, {
        headers: requestHeaders,
    })

    // Execute authMiddleware
    const response = await descopeMiddleware(newReq as any)

    if (response) {
        // If authMiddleware returned a response (like a redirect), we return it
        // but we still want to make sure our headers are there if it's a "next" response
        return response
    }

    // If no response from authMiddleware, we continue with our updated headers
    const finalResponse = NextResponse.next({
        request: {
            headers: requestHeaders,
        }
    })

    // Ensure headers are also in the final response
    if (tenantSlug) {
        finalResponse.headers.set("x-tenant-slug", tenantSlug)
    }
    finalResponse.headers.set("x-invoke-path", url.pathname)

    return finalResponse
}

export const config = {
    matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
