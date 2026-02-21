"use client"

const modules = [
    {
        name: "Billing & Invoicing",
        description: "GST-ready billing, multi-format PDFs, and quick search commands keep every sale organized.",
        status: "Live"
    },
    {
        name: "Khata & Ledgers",
        description: "Customer balances, supplier dues, and ledger snapshots with automatic reminders.",
        status: "Live"
    },
    {
        name: "Inventory",
        description: "Stock levels, low stock alerts, and batch controls that sync across devices.",
        status: "Live"
    },
    {
        name: "Reports & Analytics",
        description: "Simple dashboards summarize daily sales, outlet performance, and collections.",
        status: "Live"
    },
    {
        name: "Offline PWA",
        description: "Installable experience for phones/tablets. Work continues even without connectivity.",
        status: "Live"
    },
    {
        name: "Self Help",
        description: "Docs, FAQs, and step-by-step guides for setup, billing, and compliance.",
        status: "Available"
    }
]

export function AvailabilitySection() {
    return (
        <section className="bg-white text-slate-900">
            <div className="max-w-5xl mx-auto px-6 py-16 space-y-6">
                <div className="space-y-2 text-center">
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-400">What is available</p>
                    <h2 className="text-3xl md:text-4xl font-black">KhataPlus is ready for your shop</h2>
                    <p className="text-base text-slate-600">
                        Every listed module is live and designed to run on entry-level devices and slow connections.
                    </p>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                    {modules.map((module) => (
                        <div key={module.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                            <div className="flex items-center justify-between">
                                <p className="text-lg font-bold text-slate-900">{module.name}</p>
                                <span className="text-xs font-semibold uppercase text-slate-500">{module.status}</span>
                            </div>
                            <p className="mt-2 text-sm text-slate-600">{module.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
