import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: Request) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    // Ensure demo always uses the guest/demo sandbox. If a user is currently
    // signed in, sign them out so the demo sandbox is used instead of their
    // personal organization (avoid redirecting logged-in users to setup).
    if (user) {
        try {
            await supabase.auth.signOut()
        } catch (err) {
            // ignore sign-out errors; continue to set guest cookie and redirect
            console.warn("/demo: failed to sign out user before entering demo", err)
        }
    }

    const dashboardUrl = new URL("/demo/dashboard", request.url)
    const response = NextResponse.redirect(dashboardUrl)
    response.cookies.set("guest_mode", "true", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 30,
        sameSite: "lax"
    })

    return response
}
