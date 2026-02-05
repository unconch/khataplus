import { authMiddleware } from "@descope/nextjs-sdk/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default async function middleware(req: NextRequest) {
    const url = req.nextUrl
    const hostname = req.headers.get("host") || ""

    // 1. Subdomain / Tenant Detection
    const searchParams = url.searchParams.toString()
    const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ""}`

    // Define patterns to ignore (root domains)
    const rootDomains = ["localhost:3000", "khataplus.com", "www.khataplus.com", "khataplus.vercel.app"]

    let tenantSlug = null
    if (!rootDomains.includes(hostname)) {
        // Extract subdomain (e.g., apple.localhost:3000 => apple)
        const parts = hostname.split('.')
        if (parts.length >= 2) {
            tenantSlug = parts[0]
        }
    }

    // 2. Geoblocking Logic
    const country = (req as any).geo?.country || "IN"
    const isIndia = country === "IN"

    if (!isIndia && url.pathname !== "/" && url.pathname !== "/geoblocked") {
        return NextResponse.redirect(new URL("/geoblocked", req.url))
    }

    // 3. Auth Middleware & Header Injection
    // @ts-ignore - Dynamic middleware wrapping
    const response = await authMiddleware({
        projectId: process.env.NEXT_PUBLIC_DESCOPE_PROJECT_ID,
        publicRoutes: ["/", "/auth/login", "/auth/sign-up", "/api/debug-db", "/setup-organization", "/invite/:path*", "/geoblocked", "/api/sentry-tunnel"],
    })(req as any)

    const finalResponse = response || NextResponse.next()

    // Inject tenant slug into headers for server components
    if (tenantSlug) {
        finalResponse.headers.set("x-tenant-slug", tenantSlug)
    }

    return finalResponse
}

export const config = {
    matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
}
