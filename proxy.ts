import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"
import { isPublic } from "@/lib/system-routes"

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 1. Static bypass
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/images/") ||
    pathname === "/" ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/icon.svg" ||
    pathname === "/apple-icon.png" ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    /\.(ico|png|jpg|jpeg|svg|webp|gif|css|js|woff|woff2|ttf|map)$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  // 2. Public route check
  if (isPublic(pathname)) {
    return NextResponse.next()
  }

  // 3. Auth guard
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => req.cookies.get(name)?.value } }
  )
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL("/auth/login", req.url))
  }

  // 4. Tenant root redirect: /acme -> /acme/dashboard
  const parts = pathname.split("/")
  if (parts.length === 2 && parts[1]) {
    return NextResponse.redirect(new URL(`${pathname}/dashboard`, req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|icon.svg|apple-icon.png|manifest.json).*)",
  ],
}
