// app/auth-api/[...path]/route.ts
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
    const path = req.nextUrl.pathname.replace("/auth-api", "")
    const url = `${DESCOPE_BASE}${path}${req.nextUrl.search}`

    try {
        const res = await fetch(url, {
            method: req.method,
            headers: {
                "content-type": req.headers.get("content-type") || "application/json",
                "authorization": req.headers.get("authorization") || "",
            },
            body: req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined
        })

        const body = await res.text()
        return new NextResponse(body, {
            status: res.status,
            headers: {
                "content-type": res.headers.get("content-type") || "application/json",
            },
        })
    } catch (err) {
        return NextResponse.json({ error: "Proxy failed" }, { status: 502 })
    }
}
