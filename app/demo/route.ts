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

    if (user) {
        const { getUserOrganizations } = await import("@/lib/data/organizations")
        const userOrgs = await getUserOrganizations(user.id).catch(() => [])
        const slug = userOrgs?.[0]?.organization?.slug || 'dashboard'
        return NextResponse.redirect(new URL(`/${slug}/dashboard`, request.url))
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
