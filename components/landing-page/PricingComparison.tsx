"use client"

const comparisonRows = [
  { feature: "Invoice Limit", keep: "25/mo", starter: "Unlimited" },
  { feature: "Staff Seats", keep: "1", starter: "3" },
  { feature: "Store Locations", keep: "1", starter: "2" },
  { feature: "Inventory Items", keep: "50", starter: "500" },
  { feature: "Basic Billing Reports", keep: "Yes", starter: "Yes" },
  { feature: "GST Billing", keep: "No", starter: "Yes" },
  { feature: "WhatsApp Sharing", keep: "No", starter: "Yes" },
  { feature: "Analytics", keep: "No", starter: "Basic" },
  { feature: "CSV Import", keep: "Yes", starter: "Yes" },
]

const headers = [
  { key: "feature", label: "Capabilities" },
  { key: "keep", label: "Keep" },
  { key: "starter", label: "Starter" },
] as const

export function PricingComparison() {
  return (
    <section className="max-w-6xl mx-auto px-6 mt-16 md:mt-20">
      <div className="text-center mb-8">
        <h3 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900">Feature Comparison</h3>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              {headers.map((header, index) => (
                <th
                  key={header.key}
                  className={`px-6 py-4 text-sm font-bold text-zinc-700 ${index === 0 ? "text-left" : "text-center"}`}
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row) => (
              <tr key={row.feature} className="border-b border-zinc-100 last:border-b-0">
                <td className="px-6 py-4 text-sm font-semibold text-zinc-800">{row.feature}</td>
                <td className="px-6 py-4 text-sm text-center text-zinc-700">{row.keep}</td>
                <td className="px-6 py-4 text-sm text-center text-zinc-700">{row.starter}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
