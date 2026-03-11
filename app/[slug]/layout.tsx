import { ReactNode } from "react"
import { notFound } from "next/navigation"
import { getOrganizationBySlug } from "@/lib/data/organizations"

type Props = {
  children: ReactNode
  params: Promise<{ slug: string }>
}

export default async function OrgLayout({ children, params }: Props) {
  const { slug } = await params
  const org = await getOrganizationBySlug(slug)

  if (!org && process.env.NODE_ENV !== "development") {
    notFound()
  }

  return <div>{children}</div>
}
