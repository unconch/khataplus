"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, subMonths } from "date-fns"
import { toast } from "sonner"

interface GstrExportButtonProps {
    orgId: string
}

export function GstrExportButton({ orgId }: GstrExportButtonProps) {
    const [loading, setLoading] = useState(false)
    const [month, setMonth] = useState(format(new Date(), "yyyy-MM")) // Default current month

    const handleDownload = async () => {
        try {
            setLoading(true)
            toast.info("Generating GSTR-1 JSON...")

            // Trigger download via window location or fetch blob
            const url = `/api/gstr1/download?month=${month}&orgId=${orgId}`

            // Check if file exists/generates correctly first (optional, but good for UX)
            const res = await fetch(url)
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Failed to generate report")
            }

            // Trigger actual download
            const blob = await res.blob()
            const downloadUrl = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = downloadUrl
            // Filename is usually set by Content-Disposition, but we can force one
            a.download = `GSTR1_${month}.json`
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(downloadUrl)

            toast.success("Download started!")
        } catch (error) {
            console.error(error)
            toast.error("Export Failed", { description: error instanceof Error ? error.message : "Unknown error" })
        } finally {
            setLoading(false)
        }
    }

    // Generate last 6 months options
    const months = Array.from({ length: 6 }).map((_, i) => {
        const d = subMonths(new Date(), i)
        return {
            value: format(d, "yyyy-MM"),
            label: format(d, "MMMM yyyy")
        }
    })

    return (
        <div className="flex items-center gap-2">
            <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-[180px] h-12 rounded-2xl bg-white/50 border-0 shadow-sm">
                    <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                    {months.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Button
                onClick={handleDownload}
                disabled={loading}
                className="rounded-2xl h-12 px-6 font-bold shadow-xl shadow-primary/10 transition-all hover:scale-105 active:scale-95"
            >
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                Export JSON
            </Button>
        </div>
    )
}
