type Props = {
  params: Promise<{ slug: string }>
}

export default async function SettingsPage({ params }: Props) {
  const { slug } = await params
  return <div>Settings for org: {slug}</div>
}
