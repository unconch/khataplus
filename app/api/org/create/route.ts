import { NextRequest, NextResponse } from "next/server"
import { createOrganization } from "@/lib/data/organizations"
import { createServerClient } from "@supabase/ssr"
import { isValidSlug, isReserved } from "@/lib/system-routes"
import { RateLimitError, rateLimit } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
    // 1. Auth Guard (Edge-safe)
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => req.cookies.get(name)?.value } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Rate Limit: 5 req/hour/user
    try {
        await rateLimit(`create-org:${user.id}`, 5, 3600000)
    } catch (error: any) {
        if (error instanceof RateLimitError || error?.status === 429) {
            const retryAfter = Math.ceil((error?.retryAfterMs || 0) / 1000)
            return NextResponse.json(
                { error: "Rate limit exceeded" },
                { status: 429, headers: retryAfter ? { "Retry-After": String(retryAfter) } : undefined }
            )
        }
        throw error
    }

    try {
        const body = await req.json()
        const { name, slug, details } = body

        // 3. Validation
        if (!name || name.length < 3) {
            return NextResponse.json({ error: "Business name must be at least 3 characters." }, { status: 400 })
        }

        if (isReserved(slug)) {
            return NextResponse.json({ error: "This name is reserved." }, { status: 400 })
        }

        if (!isValidSlug(slug)) {
            return NextResponse.json({ error: "Workspace URL must be 3-32 characters and contain only lowercase letters, numbers, or single hyphens." }, { status: 400 })
        }

        // 4. Creation
        const org = await createOrganization(name, user.id, { ...details, slug })
        return NextResponse.json(org)
    } catch (error: any) {
        console.error("Org creation failed:", error)
        return NextResponse.json({ error: error.message || "Failed to create organization" }, { status: 500 })
    }
}
