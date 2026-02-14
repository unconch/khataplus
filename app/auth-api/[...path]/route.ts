import { NextRequest, NextResponse } from "next/server"

const DESCOPE_BASE = "https://api.descope.com"

async function proxy(req: NextRequest) {
    const path = req.nextUrl.pathname.replace("/auth-api", "")
    const url = `${DESCOPE_BASE}${path}${req.nextUrl.search}`

    try {
        const res = await fetch(url, {
            method: req.method,
            headers: {
                "content-type": req.headers.get("content-type") || "application/json",
                "authorization": req.headers.get("authorization") || "",
                "x-descope-project-id": process.env.NEXT_PUBLIC_DESCOPE_PROJECT_ID || "",
            },
            body: req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined,
        })

        const body = await res.text()
        return new NextResponse(body, {
            status: res.status,
            headers: {
                "content-type": res.headers.get("content-type") || "application/json",
                "access-control-allow-origin": "*",
                "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
                "access-control-allow-headers": "Content-Type, Authorization",
            },
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
