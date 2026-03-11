type Props = {
  params: { slug: string }
}

export default function PosSalesPage({ params }: Props) {
  return <div>POS sales for org: {params.slug}</div>
}
