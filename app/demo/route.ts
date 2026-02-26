import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const logoutUrl = new URL("/api/auth/logout", request.url)
    logoutUrl.searchParams.set("returnTo", "/auth/login")
    return NextResponse.redirect(logoutUrl)
}
