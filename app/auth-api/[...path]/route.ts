import { NextRequest, NextResponse } from "next/server"

const DESCOPE_BASE = "https://api.descope.com"

async function proxy(req: NextRequest) {
    const path = req.nextUrl.pathname.replace("/auth-api", "")
    const url = `${DESCOPE_BASE}${path}${req.nextUrl.search}`

    const isAsset = path.includes("/static/") || path.endsWith(".js") || path.endsWith(".css") || path.endsWith(".svg")

    const requestHeaders = new Headers(req.headers)
    // host header must be deleted so fetch can set it correctly for the target
    requestHeaders.delete("host")
    requestHeaders.delete("connection")

    if (!isAsset && !requestHeaders.has("x-descope-project-id")) {
        requestHeaders.set("x-descope-project-id", process.env.NEXT_PUBLIC_DESCOPE_PROJECT_ID || "")
    }

    try {
        const res = await fetch(url, {
            method: req.method,
            headers: requestHeaders,
            body: req.method !== "GET" && req.method !== "HEAD" ? await req.arrayBuffer() : undefined,
            cache: isAsset ? 'force-cache' : 'no-store'
        })

        const body = await res.arrayBuffer()

        const responseHeaders = new Headers(res.headers)
        // Remove hop-by-hop and problematic headers for NextResponse
        responseHeaders.delete("content-encoding")
        responseHeaders.delete("content-length")
        responseHeaders.delete("transfer-encoding")
        responseHeaders.delete("connection")

        // Add CORS
        responseHeaders.set("access-control-allow-origin", "*")
        responseHeaders.set("access-control-allow-methods", "GET,POST,PUT,DELETE,OPTIONS")
        responseHeaders.set("access-control-allow-headers", "Content-Type, Authorization, x-descope-project-id")

        return new NextResponse(body, {
            status: res.status,
            headers: responseHeaders,
        })
    } catch (err) {
        console.error("Proxy error:", err)
        return NextResponse.json({ error: "Proxy failed" }, { status: 502 })
    }
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const DELETE = proxy
export const OPTIONS = proxy
