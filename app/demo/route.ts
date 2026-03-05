import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const current = new URL(request.url)
    const baseHost = current.hostname.startsWith("demo.") ? current.hostname.slice(5) : current.hostname
    const demoHost = `demo.${baseHost}`
    const demoUrl = new URL(`${current.protocol}//${demoHost}/dashboard`)
    if (current.port) demoUrl.port = current.port
    return NextResponse.redirect(demoUrl)
}
