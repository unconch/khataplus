import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import OnboardingWizard from "@/components/onboarding-wizard"

export default async function OnboardingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <OnboardingWizard userId={user.id} />
    </div>
  )
}
