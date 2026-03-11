type Props = {
  params: { slug: string }
}

export default function CustomersPage({ params }: Props) {
  return <div>Customers for org: {params.slug}</div>
}
