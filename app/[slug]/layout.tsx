import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OrgProvider } from "@/components/org-provider"
import { resolveTenant } from "@/lib/db"

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { slug: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const slug = params.slug

  if (!slug) {
    redirect("/onboarding")
  }

  const tenant = await resolveTenant(user.id, slug)

  if (!tenant) {
    redirect("/onboarding")
  }

  return (
    <OrgProvider value={{ orgId: tenant.orgId, slug: tenant.slug }}>
      {children}
    </OrgProvider>
  )
}
