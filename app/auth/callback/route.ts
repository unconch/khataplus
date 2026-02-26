import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const cookieStore = await cookies()
    const nextFromCookie = cookieStore.get("kp_auth_next")?.value
    const requestedNext = searchParams.get("next") ?? (nextFromCookie ? decodeURIComponent(nextFromCookie) : "/dashboard")
    const next =
        requestedNext &&
            requestedNext.startsWith("/") &&
            !requestedNext.startsWith("/auth/")
            ? requestedNext
            : "/dashboard"

    try {
        // Descope cookies can arrive a moment after widget success callback.
        // Retry briefly to avoid false callback_failed redirects.
        let authSession = await getSession()
        if (!authSession?.userId) {
            await sleep(180)
            authSession = await getSession()
        }
        if (!authSession?.userId) {
            await sleep(250)
            authSession = await getSession()
        }

        const userId = authSession?.userId
        const email = authSession?.email || (userId ? `descope_${userId}@local.invalid` : "")
        const name = authSession?.user?.name as string | undefined

        if (userId) {
            const referrerCode = cookieStore.get("kp_referral")?.value

            const { ensureProfile } = await import("@/lib/data/profiles")
            await ensureProfile(
                userId,
                email,
                name,
                undefined,
                referrerCode
            )

            try {
                const { registerSession } = await import("@/lib/session-governance")
                const tokenTail = userId.slice(-16)
                await registerSession(userId, tokenTail)
            } catch (err) {
                console.warn("[AuthCallback] Session governance registration skipped:", err)
            }

            const res = next.startsWith("/")
                ? NextResponse.redirect(`${origin}${next}`)
                : NextResponse.redirect(`${origin}/setup-organization`)
            res.cookies.delete("kp_auth_next")
            return res
        }
    } catch (err) {
        console.error("[AuthCallback] Session logic failed:", err)
    }

    return NextResponse.redirect(`${origin}/auth/login?error=callback_failed`)
}
