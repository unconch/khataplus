type Props = {
  params: { slug: string }
}

export default function SettingsPage({ params }: Props) {
  return <div>Settings for org: {params.slug}</div>
}
