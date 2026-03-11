import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function AuthCallback({
  searchParams,
}: {
  searchParams: { code?: string }
}) {
  const supabase = await createClient()

  if (searchParams?.code) {
    await supabase.auth.exchangeCodeForSession(searchParams.code)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/sign-in")
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organizations(slug)")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!membership) {
    redirect("/setup-organization")
  }

  const slug = membership.organizations?.[0]?.slug

  if (!slug) {
    redirect("/setup-organization")
  }

  redirect(`/${slug}/dashboard`)
}
