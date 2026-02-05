import { Suspense } from "react"
import { getGstr1B2B, getGstr3bStats } from "@/lib/gst-utils"
import { getProfile } from "@/lib/data"
import { redirect } from "next/navigation"
import { session } from "@descope/nextjs-sdk/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Download, FileText, IndianRupee, BadgeIndianRupee } from "lucide-react"
import { PriceDisplay } from "@/components/ui/price-display"
import { StateCard } from "@/components/ui/state-card"

export default async function GstHubPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
    const currSession = await session()
    const userId = (currSession as any)?.token?.sub || (currSession as any)?.user?.userId
    if (!userId) redirect("/")

    const profile = await getProfile(userId)
    if (!profile) redirect("/")

    const orgId = profile.organization_id || ""

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

    const b2bInvoices = await getGstr1B2B(orgId, startOfMonth, endOfMonth)
    const stats = await getGstr3bStats(orgId, startOfMonth, endOfMonth)

    return (
        <div className="p-4 max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <BadgeIndianRupee className="h-8 w-8 text-primary" />
                        GST Compliance Hub
                    </h1>
                    <p className="text-muted-foreground font-medium mt-1">
                        Return Filing Assistant • {now.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2 font-bold">
                        <Download className="h-4 w-4" />
                        GSTR-1 JSON
                    </Button>
                    <Button className="gap-2 bg-primary text-primary-foreground font-bold">
                        <FileText className="h-4 w-4" />
                        File via ClearTax
                    </Button>
                </div>
            </div>

            {/* 3B Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="glass-panel border-zinc-200 dark:border-white/10 rounded-[2rem] p-4">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Tax Liability</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PriceDisplay amount={stats.total_tax} size="xl" />
                        <p className="text-xs text-muted-foreground mt-2">To be paid by 20th</p>
                    </CardContent>
                </Card>
                <Card className="glass-panel border-zinc-200 dark:border-white/10 rounded-[2rem] p-4">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Taxable Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PriceDisplay amount={stats.total_taxable} size="xl" />
                    </CardContent>
                </Card>
                <Card className="glass-panel border-zinc-200 dark:border-white/10 rounded-[2rem] p-4">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">ITC Available</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center text-emerald-500 gap-1">
                            <IndianRupee className="h-4 w-4" />
                            <span className="text-3xl font-black tracking-tighter">0.00</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">From Purchase Invoices</p>
                    </CardContent>
                </Card>
            </div>

            {/* GSTR-1 B2B Table */}
            <div className="space-y-4">
                <h3 className="text-xl font-black tracking-tight">B2B Invoices (GSTR-1)</h3>
                <div className="rounded-[2rem] border border-border overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 border-b border-border/50">
                                <TableHead className="font-bold">GSTIN</TableHead>
                                <TableHead className="font-bold">Party Name</TableHead>
                                <TableHead className="font-bold">Invoice No</TableHead>
                                <TableHead className="font-bold">Date</TableHead>
                                <TableHead className="text-right font-bold">Taxable</TableHead>
                                <TableHead className="text-right font-bold">Tax</TableHead>
                                <TableHead className="text-right font-bold">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {b2bInvoices.length > 0 ? b2bInvoices.map((inv) => (
                                <TableRow key={inv.invoice_no} className="border-b border-border/50 last:border-0">
                                    <TableCell className="font-mono text-xs">{inv.gstin}</TableCell>
                                    <TableCell className="font-bold">{inv.customer_name}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground font-medium">#{inv.invoice_no}</TableCell>
                                    <TableCell className="text-xs font-medium">{inv.invoice_date}</TableCell>
                                    <TableCell className="text-right font-medium">₹{inv.taxable_value.toFixed(2)}</TableCell>
                                    <TableCell className="text-right text-rose-500 font-bold">₹{(inv.cgst + inv.sgst).toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-black">₹{inv.total_value.toFixed(2)}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-64 text-center">
                                        <StateCard
                                            variant="empty"
                                            title="No B2B Invoices"
                                            description="Sales with customer GSTINs will automatically appear here for your GSTR-1 filing."
                                            className="border-none bg-transparent shadow-none"
                                        />
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}
