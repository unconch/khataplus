import { Suspense } from "react"
import { getGstr1B2B, getGstr3bStats } from "@/lib/gst-utils"
import { getUser } from "@/lib/dal"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Download, FileText, IndianRupee } from "lucide-react"
import { PriceDisplay } from "@/components/ui/price-display"
import { StateCard } from "@/components/ui/state-card"

export default async function GstHubPage() {
    const user = await getUser()
    if (!user) redirect("/login")

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

    const b2bInvoices = await getGstr1B2B(user.organization_id, startOfMonth, endOfMonth)
    const stats = await getGstr3bStats(user.organization_id, startOfMonth, endOfMonth)

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight">GST Hub</h1>
                    <p className="text-muted-foreground text-sm">Return Filing Assistant • {now.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        GSTR-1 JSON
                    </Button>
                    <Button className="gap-2 bg-primary text-primary-foreground">
                        <FileText className="h-4 w-4" />
                        File via ClearTax
                    </Button>
                </div>
            </div>

            {/* 3B Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="glass-panel border-zinc-200 dark:border-white/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Tax Liability</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PriceDisplay amount={stats.total_tax} size="xl" />
                        <p className="text-xs text-muted-foreground mt-1">To be paid by 20th</p>
                    </CardContent>
                </Card>
                <Card className="glass-panel border-zinc-200 dark:border-white/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Taxable Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PriceDisplay amount={stats.total_taxable} size="xl" />
                    </CardContent>
                </Card>
                <Card className="glass-panel border-zinc-200 dark:border-white/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">ITC Available</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center text-emerald-500 gap-1">
                            <IndianRupee className="h-4 w-4" />
                            <span className="text-2xl font-black tracking-tighter">0.00</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">From Purchase Invoices</p>
                    </CardContent>
                </Card>
            </div>

            {/* GSTR-1 B2B Table */}
            <h3 className="text-lg font-bold tracking-tight mt-8">B2B Invoices (GSTR-1)</h3>
            <div className="rounded-xl border border-border overflow-hidden bg-card">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>GSTIN</TableHead>
                            <TableHead>Party Name</TableHead>
                            <TableHead>Invoice No</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Taxable</TableHead>
                            <TableHead className="text-right">Tax</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {b2bInvoices.length > 0 ? b2bInvoices.map((inv) => (
                            <TableRow key={inv.invoice_no}>
                                <TableCell className="font-mono text-xs">{inv.gstin}</TableCell>
                                <TableCell className="font-medium">{inv.customer_name}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">#{inv.invoice_no}</TableCell>
                                <TableCell className="text-xs">{inv.invoice_date}</TableCell>
                                <TableCell className="text-right">₹{inv.taxable_value.toFixed(2)}</TableCell>
                                <TableCell className="text-right text-rose-500 font-medium">₹{(inv.cgst + inv.sgst).toFixed(2)}</TableCell>
                                <TableCell className="text-right font-bold">₹{inv.total_value.toFixed(2)}</TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-48 text-center">
                                    <StateCard
                                        variant="empty"
                                        title="No B2B Invoices"
                                        description="Sales with GSTINs will appear here"
                                        className="border-none bg-transparent shadow-none"
                                    />
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
