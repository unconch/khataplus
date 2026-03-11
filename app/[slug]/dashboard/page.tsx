export default function DashboardPage({
  params,
}: {
  params: { slug: string }
}) {
  return <div>Dashboard for {params.slug}</div>
}
