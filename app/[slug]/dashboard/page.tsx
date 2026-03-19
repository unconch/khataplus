import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export default async function SlugDashboardPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  if (slug === "app") {
    const cookieStore = await cookies()
    const orgSlug = String(cookieStore.get("kp_org_slug")?.value || "").trim()
    if (orgSlug && orgSlug !== "app" && orgSlug !== "dashboard") {
      redirect(`/app/${orgSlug}/dashboard`)
    }
    redirect("/onboarding")
  }
  redirect(`/app/${slug}/dashboard`)
}
