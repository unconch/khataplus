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

  redirect("/setup-organization")
}
