"use client"

const comparisonRows = [
  { feature: "Invoice Limit", keep: "25/mo", starter: "Unlimited" },
  { feature: "Staff Seats", keep: "1", starter: "3" },
  { feature: "Store Locations", keep: "1", starter: "1" },
  { feature: "Inventory Items", keep: "50", starter: "500" },
  { feature: "Basic Billing Reports", keep: "Yes", starter: "Yes" },
  { feature: "GST Billing", keep: "No", starter: "Yes" },
  { feature: "Analytics", keep: "Basic", starter: "Basic" },
  { feature: "CSV Import", keep: "Yes", starter: "Yes" },
]

const headers = [
  { key: "feature", label: "Capabilities" },
  { key: "keep", label: "Keep" },
  { key: "starter", label: "Starter" },
] as const

export function PricingComparison() {
  return (
    <section className="mx-auto mt-16 max-w-6xl px-6 md:mt-20">
      <div className="text-center mb-8">
        <h3 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900">Feature Comparison</h3>
      </div>

      <div className="overflow-x-auto rounded-[2rem] border border-zinc-200/90 bg-white shadow-[0_24px_60px_-38px_rgba(15,23,42,0.14)] backdrop-blur-xl">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/90">
              {headers.map((header, index) => (
                <th
                  key={header.key}
                  className={`px-6 py-4 text-sm font-bold text-zinc-800 ${index === 0 ? "text-left" : "text-center"}`}
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row) => (
              <tr key={row.feature} className="border-b border-zinc-100/95 last:border-b-0">
                <td className="px-6 py-4 text-sm font-semibold text-zinc-900">{row.feature}</td>
                <td className="px-6 py-4 text-sm text-center text-zinc-800">{row.keep}</td>
                <td className="px-6 py-4 text-sm text-center text-zinc-800">{row.starter}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
