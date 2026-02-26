"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Drawer,
    DrawerContent,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { PlusIcon } from "lucide-react"
import type { InventoryItem } from "@/lib/types"
import { SalesForm } from "./sales-form"
import { useMediaQuery } from "@/hooks/use-media-query"

interface NewSaleDialogProps {
    inventory: InventoryItem[]
    userId: string
    gstInclusive: boolean
    gstEnabled: boolean
    defaultOpen?: boolean
    orgId: string
    org?: { name: string; gstin?: string; upi_id?: string }
    trigger?: React.ReactNode
}

export function NewSaleDialog({ inventory, userId, gstInclusive, gstEnabled, defaultOpen = false, orgId, org, trigger }: NewSaleDialogProps) {
    const [open, setOpen] = React.useState(defaultOpen)
    const isDesktop = useMediaQuery("(min-width: 768px)")

    const header = (
        <div className="px-5 md:px-6 py-4 flex items-center justify-between bg-zinc-50/95 dark:bg-zinc-900/60 border-b border-zinc-100 dark:border-white/5 relative overflow-hidden shrink-0">
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)", backgroundSize: "14px 14px" }} />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500 opacity-60" />
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500 text-zinc-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    <PlusIcon size={14} strokeWidth={3} />
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 leading-none mb-1">Sales Terminal</span>
                    <h2 className="text-sm font-black tracking-tight uppercase text-zinc-950 dark:text-zinc-50">New <span className="text-emerald-600">Checkout</span></h2>
                </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-900 border shadow-sm border-zinc-100 dark:border-white/5">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">
                    {inventory.length} SKUs | {gstEnabled ? (gstInclusive ? "GST Incl" : "GST Excl") : "GST Off"}
                </span>
            </div>
        </div>
    )

    const triggerElement = trigger || (
        <Button
            size="sm"
            className="h-10 px-6 rounded-xl bg-zinc-950 text-white font-bold text-xs shadow-xl transition-all hover:bg-zinc-800 active:scale-95 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400 group"
        >
            <PlusIcon className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" />
            New Sale
        </Button>
    )

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    {triggerElement}
                </DialogTrigger>
                <DialogContent className="max-w-5xl h-[88vh] p-0 overflow-hidden border-none bg-white dark:bg-zinc-950 shadow-2xl rounded-3xl flex flex-col [&>button]:hidden sm:[&>button]:flex sm:[&>button]:top-[18px] sm:[&>button]:right-5 sm:[&>button]:bg-white/50 sm:[&>button]:backdrop-blur sm:[&>button]:rounded-lg sm:[&>button]:border sm:[&>button]:border-zinc-200 focus:outline-none">
                    <DialogTitle className="sr-only">Create New Transaction</DialogTitle>
                    {header}
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <SalesForm
                            inventory={inventory}
                            userId={userId}
                            gstInclusive={gstInclusive}
                            gstEnabled={gstEnabled}
                            orgId={orgId}
                            org={org}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                {triggerElement}
            </DrawerTrigger>
            <DrawerContent className="h-[92vh] p-0 overflow-hidden flex flex-col bg-white dark:bg-zinc-950 border-none rounded-t-[2.5rem]">
                <DrawerTitle className="sr-only">Create New Transaction</DrawerTitle>
                {header}
                <div className="flex-1 min-h-0 overflow-hidden focus:outline-none">
                    <SalesForm
                        inventory={inventory}
                        userId={userId}
                        gstInclusive={gstInclusive}
                        gstEnabled={gstEnabled}
                        orgId={orgId}
                        org={org}
                    />
                </div>
            </DrawerContent>
        </Drawer>
    )
}
