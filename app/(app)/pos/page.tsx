import { headers } from "next/headers"
import { redirect } from "next/navigation"

export default async function PosIndexPage() {
  const slug = (await headers()).get("x-tenant-slug")
  if (slug) {
    redirect(`/app/${slug}/pos/sales`)
  }
  redirect("/dashboard/sales")
}
