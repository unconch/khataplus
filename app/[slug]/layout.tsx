import { ReactNode } from "react"
import { notFound } from "next/navigation"
import { getOrganizationBySlug } from "@/lib/data/organizations"

type Props = {
  children: ReactNode
  params: { slug: string }
}

export default async function OrgLayout({ children, params }: Props) {
  const org = await getOrganizationBySlug(params.slug)

  if (!org && process.env.NODE_ENV !== "development") {
    notFound()
  }

  return <div>{children}</div>
}
