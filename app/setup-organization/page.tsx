import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function SetupOrganizationPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/sign-in")
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Setup Organization</h1>
      <p>User: {user.email}</p>
    </div>
  )
}
