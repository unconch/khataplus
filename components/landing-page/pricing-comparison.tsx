"use client"

const comparisonRows = [
  { feature: "Invoice Limit", keep: "25/mo", starter: "Unlimited", pro: "Unlimited" },
  { feature: "Staff Seats", keep: "1", starter: "3", pro: "10" },
  { feature: "Store Locations", keep: "1", starter: "2", pro: "Unlimited" },
  { feature: "Inventory Items", keep: "50", starter: "500", pro: "Unlimited" },
  { feature: "GST Billing", keep: "✗", starter: "✓", pro: "✓" },
  { feature: "WhatsApp Sharing", keep: "✗", starter: "✓", pro: "✓" },
  { feature: "POS Terminal", keep: "✗", starter: "✗", pro: "✓" },
  { feature: "Analytics", keep: "✗", starter: "Basic", pro: "Full" },
  { feature: "Vyapar Import", keep: "✓", starter: "✓", pro: "✓" },
  { feature: "Works Offline", keep: "✗", starter: "✗", pro: "✓" },
]

const headers = [
  { key: "feature", label: "Capabilities" },
  { key: "keep", label: "Keep" },
  { key: "starter", label: "Starter" },
  { key: "pro", label: "Pro" },
] as const

export function PricingComparison() {
  return (
    <section className="max-w-6xl mx-auto px-6 mt-16 md:mt-20">
      <div className="text-center mb-8">
        <h3 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900">Feature Comparison</h3>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[720px] border-collapse">
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
                <td className="px-6 py-4 text-sm text-center text-zinc-700">{row.pro}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
