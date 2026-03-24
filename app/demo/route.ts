import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const current = new URL(request.url)
    const hostname = current.hostname.toLowerCase()
    const isLocalHost =
        hostname === "localhost" ||
        hostname.endsWith(".localhost") ||
        /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)

    const targetUrl = isLocalHost
        ? new URL("/dashboard", current)
        : (() => {
            const baseHost = hostname.startsWith("demo.") ? hostname.slice(5) : hostname
            const demoHost = `demo.${baseHost}`
            const demoUrl = new URL(`${current.protocol}//${demoHost}/dashboard`)
            if (current.port) demoUrl.port = current.port
            return demoUrl
        })()

    const response = NextResponse.redirect(targetUrl)
    response.cookies.set("guest_mode", "true", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 30,
    })
    return response
}
