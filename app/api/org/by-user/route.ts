import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ensureUserProfile } from "@/lib/data/profiles"
import { getUserOrgSlug } from "@/lib/data/organizations"

export const runtime = "nodejs"

export async function GET() {
  const supabase = createClient()

  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = data.user

  await ensureUserProfile(user)

  const slug = await getUserOrgSlug(user.id)

  if (!slug) {
    return NextResponse.json(
      { error: "Organization not found" },
      { status: 404 }
    )
  }

  return NextResponse.json({ slug })
}
