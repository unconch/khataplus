import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export default async function SlugDashboardCatchAllPage(
  props: { params: Promise<{ slug: string; rest?: string[] }> }
) {
  const { slug, rest = [] } = await props.params
  const suffix = rest.length > 0 ? `/${rest.join("/")}` : ""
  if (slug === "app") {
    const cookieStore = await cookies()
    const orgSlug = String(cookieStore.get("kp_org_slug")?.value || "").trim()
    if (orgSlug && orgSlug !== "app" && orgSlug !== "dashboard") {
      redirect(`/app/${orgSlug}/dashboard${suffix}`)
    }
    redirect("/onboarding")
  }
  redirect(`/app/${slug}/dashboard${suffix}`)
}
