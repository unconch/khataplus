
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

export function AddInventoryDialog() {
    const [open, setOpen] = React.useState(false)
    const isDesktop = useMediaQuery("(min-width: 768px)")

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button size="sm" className="h-9 gap-2 shadow-lg hover:shadow-primary/20">
                        <PlusIcon className="h-4 w-4" />
                        <span>New SKU</span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] bg-white dark:bg-zinc-900 border border-zinc-200 p-0 overflow-hidden shadow-2xl">
                    <div className="p-6 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-white/5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
                                <PlusIcon className="h-5 w-5 text-foreground" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold">Register New SKU</DialogTitle>
                                <DialogDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Central Catalog Entry</DialogDescription>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 bg-white dark:bg-zinc-950">
                        <AddInventoryForm />
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                <Button size="sm" className="h-9 gap-2 shadow-lg hover:shadow-primary/20">
                    <PlusIcon className="h-4 w-4" />
                    <span>New SKU</span>
                </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[85vh]">
                <DrawerHeader className="text-left">
                    <DrawerTitle>Register New SKU</DrawerTitle>
                    <DrawerDescription>
                        Central Catalog Entry
                    </DrawerDescription>
                </DrawerHeader>
                <div className="px-4 pb-8 overflow-y-auto">
                    <AddInventoryForm />
                </div>
            </DrawerContent>
        </Drawer>
    )
}
