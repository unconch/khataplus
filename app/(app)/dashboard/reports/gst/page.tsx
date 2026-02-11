import { Suspense } from "react"
import { getGstr1B2B, getGstr3bStats } from "@/lib/gst-utils"
import { getProfile } from "@/lib/data/profiles"
import { getCurrentUser } from "@/lib/data/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Download, FileText, IndianRupee, BadgeIndianRupee } from "lucide-react"
import { PriceDisplay } from "@/components/ui/price-display"
import { StateCard } from "@/components/ui/state-card"
import { startOfMonth, endOfMonth, format } from "date-fns"

export default async function GstReportPage() {
    const user = await getCurrentUser()
    if (!user) redirect("/auth/login")

    const profile = await getProfile(user.userId)
    if (!profile || !profile.organization_id || (profile.role !== "owner" && profile.role !== "main admin")) {
        redirect("/dashboard")
    }

    return (
        <div className="space-y-8 animate-slide-up">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary">
                        <BadgeIndianRupee className="h-5 w-5" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Compliance Engine</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter">GST Intelligence</h1>
                </div>
                <Button className="rounded-2xl h-12 px-6 font-bold shadow-xl shadow-primary/10">
                    <Download className="h-4 w-4 mr-2" />
                    Export GSTR-1 JSON
                </Button>
            </div>

            <Suspense fallback={<div>Loading GST Data...</div>}>
                <GstContent orgId={profile.organization_id!} />
            </Suspense>
        </div>
    )
}

async function GstContent({ orgId }: { orgId: string }) {
    const now = new Date()
    const startDate = format(startOfMonth(now), "yyyy-MM-dd")
    const endDate = format(endOfMonth(now), "yyyy-MM-dd")

    const b2bInvoices = await getGstr1B2B(orgId, startDate, endDate)
    const stats = await getGstr3bStats(orgId, startDate, endDate)

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StateCard
                    title="Total Liability"
                    description="Outward supplies tax"
                    value={`₹${stats.total_tax.toLocaleString()}`}
                    icon={IndianRupee}
                />
                <StateCard
                    title="ITC Available"
                    description="Input tax credit (Estimated)"
                    value="₹0"
                    variant="success"
                    icon={FileText}
                />
                <StateCard
                    title="Net Payable"
                    description="Draft GSTR-3B balance"
                    value={`₹${stats.total_tax.toLocaleString()}`}
                    variant="error"
                    icon={BadgeIndianRupee}
                />
            </div>

            <Card className="rounded-[2.5rem] border-zinc-200/50 dark:border-white/5 overflow-hidden">
                <CardHeader className="p-8 border-b border-zinc-100 dark:border-white/5">
                    <CardTitle className="text-xl font-black tracking-tight">GSTR-1: B2B Invoices</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="px-8 font-bold">Recipient GSTIN</TableHead>
                                <TableHead className="font-bold text-center">Invoice No</TableHead>
                                <TableHead className="font-bold text-right">Taxable Value</TableHead>
                                <TableHead className="font-bold text-right px-8 text-primary">Total Tax</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {b2bInvoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground font-medium">
                                        No B2B transactions recorded for this period.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                b2bInvoices.map((inv) => (
                                    <TableRow key={inv.invoice_no} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="px-8 font-black font-mono text-sm tracking-widest">{inv.gstin}</TableCell>
                                        <TableCell className="text-center font-bold">{inv.invoice_no}</TableCell>
                                        <TableCell className="text-right font-mono">
                                            <PriceDisplay amount={inv.taxable_value} size="sm" />
                                        </TableCell>
                                        <TableCell className="text-right px-8 text-primary font-black">
                                            <PriceDisplay amount={inv.cgst + inv.sgst + inv.igst} size="sm" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                <Card className="rounded-3xl border-zinc-200/50 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-900/50 p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <FileText className="h-5 w-5" />
                        </div>
                        <h4 className="font-bold text-lg">HSN Summary</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">Detailed HSN/SAC wise summary of outward supplies for compliance report.</p>
                    <Button variant="outline" className="mt-auto rounded-xl w-fit h-10 px-6 text-xs font-bold border-zinc-200 dark:border-white/10">View Analysis</Button>
                </Card>

                <Card className="rounded-3xl border-zinc-200/50 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-900/50 p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                            <BadgeIndianRupee className="h-5 w-5" />
                        </div>
                        <h4 className="font-bold text-lg">Document Series</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">Sequence check for all tax invoices issued during the current tax period.</p>
                    <Button variant="outline" className="mt-auto rounded-xl w-fit h-10 px-6 text-xs font-bold border-zinc-200 dark:border-white/10">Audit Series</Button>
                </Card>
            </div>
        </div>
    )
}
