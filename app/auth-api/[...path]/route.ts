
import { NextRequest, NextResponse } from "next/server"

const DESCOPE_BASE = "https://api.descope.com"

export async function GET(req: NextRequest) {
    return proxy(req)
}
export async function POST(req: NextRequest) {
    return proxy(req)
}
export async function PUT(req: NextRequest) {
    return proxy(req)
}
export async function DELETE(req: NextRequest) {
    return proxy(req)
}
export async function OPTIONS(req: NextRequest) {
    return proxy(req)
}

async function proxy(req: NextRequest) {
    // Handling the path correctly for the app structure
    const path = req.nextUrl.pathname.replace("/auth-api", "")
    const url = `${DESCOPE_BASE}${path}${req.nextUrl.search}`

    try {
        const requestHeaders = new Headers(req.headers)
        // host header must be deleted so fetch can set it correctly for the target
        requestHeaders.delete("host")
        requestHeaders.delete("connection")

        const res = await fetch(url, {
            method: req.method,
            headers: requestHeaders,
            body: req.method !== "GET" && req.method !== "HEAD" ? await req.arrayBuffer() : undefined,
            redirect: "follow"
        })

        console.log(`[KhataPlus Proxy Response] ${res.status} for ${url}`)

        const buffer = await res.arrayBuffer()

        const responseHeaders = new Headers(res.headers)
        // Remove hop-by-hop and problematic headers for NextResponse
        responseHeaders.delete("content-encoding")
        responseHeaders.delete("content-length")
        responseHeaders.delete("transfer-encoding")
        responseHeaders.delete("connection")

        return new NextResponse(buffer, {
            status: res.status,
            headers: responseHeaders
        })
    } catch (err: any) {
        console.error(`[KhataPlus Proxy Error] ${err.message} for ${url}`)
        return NextResponse.json({ error: "Proxy failed", details: err.message }, { status: 502 })
    }
}
