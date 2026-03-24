import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET() {
    const checks: Record<string, any> = {
        status: "unknown",
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || "unknown",
        db: false,
        redis: false,
    }

    // Database health check
    try {
        const { sql } = await import("@/lib/db")
        const result = await sql`SELECT 1 AS ok`
        checks.db = result.length > 0
    } catch (err: any) {
        checks.db = false
        checks.dbError = err?.message?.slice(0, 100)
    }

    // Redis health check (via rate-limit module)
    try {
        const { rateLimit } = await import("@/lib/rate-limit")
        await rateLimit("health-check", 1000, 60_000)
        checks.redis = true
    } catch (err: any) {
        // RateLimitError means Redis IS working (just over limit) — shouldn't happen with limit=1000
        if (err?.name === "RateLimitError") {
            checks.redis = true
        } else {
            checks.redis = false
        }
    }

    checks.status = checks.db ? "healthy" : "degraded"

    return NextResponse.json(checks, {
        status: checks.db ? 200 : 503,
        headers: {
            "Cache-Control": "no-cache, no-store",
            "X-API-Version": "v1",
        },
    })
}
