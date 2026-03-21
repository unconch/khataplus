import { redirect } from "next/navigation"

export default function SlugDashboardRest({ params }: { params: { slug: string; rest: string[] } }) {
  const rest = params.rest?.join("/") || ""
  redirect(`/dashboard/${rest}`)
}
