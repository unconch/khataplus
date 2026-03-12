import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"
import { isPublic } from "@/lib/system-routes"

export async function middleware(req: NextRequest) {
    const { pathname, hostname } = req.nextUrl

    // 0. Legacy subdomain redirect (remove after deprecation)
    if (hostname === "app.khataplus.online") {
        return NextResponse.redirect(
            new URL(pathname, "https://khataplus.online")
        )
    }

    // 1. Static bypass
    if (
        pathname.startsWith("/_next") ||
        pathname === "/favicon.ico" ||
        pathname === "/robots.txt" ||
        pathname === "/sitemap.xml"
    ) {
        return NextResponse.next()
    }

    // 2. Public route check
    if (isPublic(pathname)) {
        return NextResponse.next()
    }

    // 3. Auth guard (Edge-safe via Supabase SSR)
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => req.cookies.get(name)?.value } }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.redirect(
            new URL("/auth/login", req.url)
        )
    }

    // 4. Tenant root redirect: /acme -> /acme/dashboard
    const parts = pathname.split("/")
    if (parts.length === 2 && parts[1]) {
        return NextResponse.redirect(
            new URL(`${pathname}/dashboard`, req.url)
        )
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
    ],
}
