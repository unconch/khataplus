import { NextResponse, NextRequest } from "next/server"

const PUBLIC_ROUTES = [
  "/",
  "/auth",
  "/api",
  "/onboarding",
  "/pricing",
  "/features",
  "/docs",
]

function isPublic(pathname: string) {
  return PUBLIC_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(route + "/")
  )
}

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // allow public routes
  if (isPublic(pathname) || pathname.startsWith("/_next")) {
    return NextResponse.next()
  }

  // everything else passes through
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
