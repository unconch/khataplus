import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ensureUserProfile } from "@/lib/data/profiles"
import { getUserOrgSlug } from "@/lib/data/organizations"

export const runtime = "nodejs"

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = data.user

  // Ensure profile exists. This also handles ID consolidation.
  const profile = await ensureUserProfile(user)

  // Try direct member lookup first
  let slug = await getUserOrgSlug(user.id)

  // Fallback to profile's designated organization if necessary
  if (!slug && (profile as any)?.organization_id) {
    const { getOrganization } = await import("@/lib/data/organizations")
    const org = await getOrganization((profile as any).organization_id)
    slug = org?.slug || null
  }

  if (!slug) {
    return NextResponse.json(
      { error: "Organization not found", slug: null },
      { status: 404 }
    )
  }

  return NextResponse.json({ slug })
}
