import { NextResponse } from "next/server"

// Fallback route handler for /demo
// Primary handling is in middleware, this is a safety fallback
export async function GET(request: Request) {
    const dashboardUrl = new URL("/demo/dashboard", request.url)
    const response = NextResponse.redirect(dashboardUrl)

    response.cookies.set("guest_mode", "true", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 30,
        sameSite: "lax"
    })

    return response
}
