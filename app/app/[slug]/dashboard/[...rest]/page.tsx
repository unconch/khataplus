import { notFound } from "next/navigation"

type Params = { slug: string; rest: string[] }
type SearchParams = { [key: string]: string | string[] | undefined }

export default async function SlugDashboardRest(props: {
  params: Promise<Params>
  searchParams: Promise<SearchParams>
}) {
  const { rest = [] } = await props.params
  const searchParams = props.searchParams
  const [section, subId] = rest

  switch (section) {
    case undefined: {
      const Page = (await import("@/app/(app)/dashboard/page")).default
      return <Page searchParams={searchParams} />
    }
    case "admin": {
      const Page = (await import("@/app/(app)/dashboard/admin/page")).default
      return <Page searchParams={searchParams} />
    }
    case "analytics": {
      const Page = (await import("@/app/(app)/dashboard/analytics/page")).default
      return <Page />
    }
    case "customers": {
      const Page = (await import("@/app/(app)/dashboard/customers/page")).default
      return <Page />
    }
    case "executive": {
      const Page = (await import("@/app/(app)/dashboard/executive/page")).default
      return <Page />
    }
    case "inventory": {
      if (subId) {
        const Page = (await import("@/app/(app)/dashboard/inventory/[id]/page")).default
        return <Page params={Promise.resolve({ id: subId })} />
      }
      const Page = (await import("@/app/(app)/dashboard/inventory/page")).default
      return <Page />
    }
    case "khata": {
      if (subId) {
        const Page = (await import("@/app/(app)/dashboard/khata/[id]/page")).default
        return <Page params={Promise.resolve({ id: subId })} />
      }
      const Page = (await import("@/app/(app)/dashboard/khata/page")).default
      return <Page />
    }
    case "logs": {
      const Page = (await import("@/app/(app)/dashboard/logs/page")).default
      return <Page />
    }
    case "migration": {
      const Page = (await import("@/app/(app)/dashboard/migration/page")).default
      return <Page />
    }
    case "reports": {
      if (subId === "gst") {
        const Page = (await import("@/app/(app)/dashboard/reports/gst/page")).default
        return <Page />
      }
      const Page = (await import("@/app/(app)/dashboard/reports/page")).default
      return <Page />
    }
    case "sales": {
      const Page = (await import("@/app/(app)/dashboard/sales/page")).default
      return <Page searchParams={searchParams as Promise<{ action?: string }>} />
    }
    case "security": {
      const Page = (await import("@/app/(app)/dashboard/security/page")).default
      return <Page />
    }
    case "settings": {
      const Page = (await import("@/app/(app)/dashboard/settings/page")).default
      return <Page />
    }
    case "suppliers": {
      if (subId) {
        const Page = (await import("@/app/(app)/dashboard/suppliers/[id]/page")).default
        return <Page params={Promise.resolve({ id: subId })} />
      }
      const Page = (await import("@/app/(app)/dashboard/suppliers/page")).default
      return <Page />
    }
    default:
      notFound()
  }
}
