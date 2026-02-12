
import { NextRequest, NextResponse } from "next/server"

const DESCOPE_BASE_URL = "https://api.descope.com"

async function proxyRequest(req: NextRequest) {
    const path = req.nextUrl.pathname.replace("/auth-api", "")
    const url = `${DESCOPE_BASE_URL}${path}${req.nextUrl.search}`

    const headers = new Headers(req.headers)
    headers.delete("host")

    const response = await fetch(url, {
        method: req.method,
        headers,
        body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
        duplex: "half",
    } as RequestInit)

    return new NextResponse(response.body, {
        status: response.status,
        headers: response.headers,
    })
}

export const GET = proxyRequest
export const POST = proxyRequest
export const PUT = proxyRequest
export const DELETE = proxyRequest
export const PATCH = proxyRequest
