import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OrgProvider } from "@/components/org-provider"
import { resolveTenant } from "@/lib/db"

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const supabase = await createClient()

  const { slug } = await params

  // 1. Resolve Auth (Guests allowed for demo)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isDemo = slug === "demo"

  if (!user && !isDemo) {
    redirect("/auth/login")
  }

  if (!slug) {
    redirect("/onboarding")
  }

  // 2. Resolve Tenant
  let tenant = user ? await resolveTenant(user.id, slug) : null

  // synthetic tenant for demo
  if (!tenant && isDemo) {
    tenant = {
      orgId: "demo-org-id", // Should match your demo data org_id
      slug: "demo",
      role: "owner",
    }
  }

  if (!tenant) {
    redirect("/onboarding")
  }

  return (
    <OrgProvider value={{ orgId: tenant.orgId, slug: tenant.slug }}>
      {children}
    </OrgProvider>
  )
}
