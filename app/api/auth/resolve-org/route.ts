import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { getUserOrganizations } from "@/lib/data/organizations"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll() {
          // No-op: this endpoint is read-only and does not set cookies.
        },
      },
    }
  )

  const { data } = await supabase.auth.getSession()
  const user = data?.session?.user

  if (!user) {
    return NextResponse.json({ slug: null }, { status: 401 })
  }

  try {
    const orgs = await getUserOrganizations(user.id)
    const slug = orgs[0]?.organization?.slug || null
    return NextResponse.json({ slug })
  } catch (err: any) {
    return NextResponse.json(
      { slug: null, error: err?.message || "Failed to resolve org" },
      { status: 500 }
    )
  }
}
