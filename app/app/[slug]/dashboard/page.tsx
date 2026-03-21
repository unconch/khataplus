import DashboardPage from "@/app/(app)/dashboard/page"

export default function SlugDashboard({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return <DashboardPage searchParams={searchParams} />
}
