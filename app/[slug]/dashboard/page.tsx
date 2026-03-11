import { HomeDashboardClient } from "@/components/dashboard/home-dashboard-client"

type Props = {
  params: { slug: string }
}

export default function DashboardPage({ params }: Props) {
  return <HomeDashboardClient orgSlug={params.slug} />
}
