type Props = {
  params: { slug: string }
}

export default function InventoryPage({ params }: Props) {
  return <div>Inventory for org: {params.slug}</div>
}
