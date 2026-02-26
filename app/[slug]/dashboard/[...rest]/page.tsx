import { redirect } from "next/navigation"

export default async function SlugDashboardCatchAllPage(
  props: { params: Promise<{ rest?: string[] }> }
) {
  const { rest = [] } = await props.params
  const suffix = rest.length > 0 ? `/${rest.join("/")}` : ""
  redirect(`/dashboard${suffix}`)
}
