type Props = {
  params: Promise<{ slug: string }>
}

export default async function InventoryPage({ params }: Props) {
  const { slug } = await params
  return <div>Inventory for org: {slug}</div>
}
