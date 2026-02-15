import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in search params, use it as the redirection URL
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        cookieStore.set({ name, value, ...options })
                    },
                    remove(name: string, options: CookieOptions) {
                        cookieStore.set({ name, value: '', ...options })
                    },
                },
            }
        )
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error && data.session && data.user) {
            try {
                // Ensure profile is synced with Neon on first login/signup
                const { ensureProfile } = await import('@/lib/data/profiles');
                await ensureProfile(
                    data.user.id,
                    data.user.email!,
                    data.user.user_metadata?.full_name
                );

                // REGISTER SESSION for Governance (ASVS Level 3)
                const { registerSession } = await import('@/lib/session-governance');
                await registerSession(data.user.id, data.session.access_token.slice(-16)); // Use a snippet of the token or session ID as key

                // Fetch user orgs to redirect to correct slug
                const { getUserOrganizations } = await import('@/lib/data/organizations');
                const userOrgs = await getUserOrganizations(data.user.id);

                if (userOrgs && userOrgs.length > 0) {
                    return NextResponse.redirect(`${origin}/${userOrgs[0].organization.slug}/dashboard`);
                }

                return NextResponse.redirect(`${origin}/setup-organization`);

            } catch (syncErr) {
                console.error("[AuthCallback] Session logic failed:", syncErr);
            }
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
