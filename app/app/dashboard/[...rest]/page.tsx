import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export default async function AppDashboardResolverCatchAllPage(
  props: { params: Promise<{ rest?: string[] }> }
) {
  const { rest = [] } = await props.params
  const suffix = rest.length > 0 ? `/${rest.join("/")}` : ""

  const { buildAuthContext, getCurrentUser } = await import("@/lib/data/auth")

  const user = await getCurrentUser()
  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(`/app/dashboard${suffix}`)}`)
  }
  if (user.isGuest) {
    redirect(`/app/demo/dashboard${suffix}`)
  }

  const cookieStore = await cookies()
  const hintedSlug = String(cookieStore.get("kp_org_slug")?.value || "").trim()
  const slug = hintedSlug || String((await buildAuthContext()).orgSlug || "").trim()

  if (slug) {
    redirect(`/app/${slug}/dashboard${suffix}`)
  }

  redirect("/onboarding")
}
