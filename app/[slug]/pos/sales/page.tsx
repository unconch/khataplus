type Props = {
  params: Promise<{ slug: string }>
}

export default async function PosSalesPage({ params }: Props) {
  const { slug } = await params
  return <div>POS sales for org: {slug}</div>
}
