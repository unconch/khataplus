"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { PlusIcon } from "lucide-react"
import { AddInventoryForm } from "@/components/add-inventory-form"
import { useMediaQuery } from "@/hooks/use-media-query"

interface AddInventoryDialogProps {
    trigger?: React.ReactNode
}

export function AddInventoryDialog({ trigger }: AddInventoryDialogProps) {
    const [open, setOpen] = React.useState(false)
    const isDesktop = useMediaQuery("(min-width: 768px)")

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    {trigger || (
                        <Button size="sm" className="h-9 px-4 gap-2 shadow-md hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all active:scale-95">
                            <PlusIcon className="h-3.5 w-3.5" />
                            <span className="text-[11px] font-black uppercase tracking-widest">New SKU</span>
                        </Button>
                    )}
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] p-0 border-none bg-transparent shadow-2xl overflow-hidden">
                    <div className="bg-white dark:bg-zinc-950 rounded-2xl relative overflow-hidden border border-zinc-100 dark:border-white/5">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 opacity-30" />

                        <div className="p-5 border-b border-zinc-100 dark:border-white/5">
                            <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                                    <PlusIcon className="h-4 w-4 text-zinc-900 dark:text-zinc-50" />
                                </div>
                                <div className="space-y-0.5">
                                    <DialogTitle className="text-xl font-black italic tracking-tighter text-zinc-950 dark:text-zinc-50 leading-none">
                                        Register New <span className="text-emerald-600">SKU.</span>
                                    </DialogTitle>
                                    <DialogDescription className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Central Catalog Injection</DialogDescription>
                                </div>
                            </div>
                        </div>
                        <div className="p-5">
                            <AddInventoryForm />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                {trigger || (
                    <Button size="sm" className="h-9 px-4 gap-2 shadow-md transition-all active:scale-95">
                        <PlusIcon className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-black uppercase tracking-widest">New SKU</span>
                    </Button>
                )}
            </DrawerTrigger>
            <DrawerContent className="max-h-[85vh]">
                <DrawerHeader className="text-left py-4">
                    <DrawerTitle className="text-lg font-black uppercase tracking-tight">Register New SKU</DrawerTitle>
                    <DrawerDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                        Central Catalog Injection
                    </DrawerDescription>
                </DrawerHeader>
                <div className="px-4 pb-8 overflow-y-auto">
                    <AddInventoryForm />
                </div>
            </DrawerContent>
        </Drawer>
    )
}
