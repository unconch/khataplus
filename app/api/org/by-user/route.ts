import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { getUserOrgSlug } from "@/lib/data/organizations"

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

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const slug = await getUserOrgSlug(data.user.id)
    return NextResponse.json({ slug })
  } catch (err: any) {
    console.error("org lookup failed", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
