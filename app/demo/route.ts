import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const url = new URL(request.url)
    const host = request.headers.get("host") || ""

    // 1. If we are NOT on the demo subdomain yet, redirect to the demo subdomain's /demo path
    if (!host.startsWith("demo.")) {
        const subdomainUrl = new URL(request.url)
        // Strip www. if present to avoid demo.www.khataplus.online
        const cleanHost = host.replace(/^www\./, "")
        subdomainUrl.hostname = `demo.${cleanHost}`
        console.log("--- [DEBUG] /demo: Redirecting to subdomain entry point", subdomainUrl.toString(), "---")
        return NextResponse.redirect(subdomainUrl)
    }

    // 2. We ARE on the demo subdomain. Set the cookie and go to dashboard.
    const dashboardUrl = new URL("/dashboard", request.url)
    const response = NextResponse.redirect(dashboardUrl)

    // Set the guest mode cookie
    response.cookies.set("guest_mode", "true", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 30, // 30 mins
        sameSite: "lax"
    })

    console.log("--- [DEBUG] /demo: Subdomain reached. Setting guest cookie and redirecting to dashboard ---")
    return response
}
