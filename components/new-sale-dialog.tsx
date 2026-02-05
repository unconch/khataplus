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
    org?: { name: string; gstin?: string }
}

export function NewSaleDialog({ inventory, userId, gstInclusive, gstEnabled, defaultOpen = false, orgId, org }: NewSaleDialogProps) {
    const [open, setOpen] = React.useState(defaultOpen)
    const isDesktop = useMediaQuery("(min-width: 768px)")

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button size="default" className="gap-2 shadow-lg hover:shadow-primary/20 bg-primary text-primary-foreground font-bold rounded-2xl h-11 px-6">
                        <PlusIcon className="h-4 w-4" />
                        <span>New Sale</span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl p-0 overflow-hidden border-none bg-card shadow-xl rounded-2xl focus:outline-none max-h-[90vh]">
                    <div className="p-6 border-b border-zinc-100 dark:border-white/5 sticky top-0 z-10 bg-background/80 backdrop-blur-md">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold tracking-tight">New Sale</DialogTitle>
                            <DialogDescription className="text-sm font-medium text-muted-foreground">
                                Record a new transaction
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    <div className="p-8 overflow-y-auto max-h-[70vh]">
                        <SalesForm
                            inventory={inventory}
                            userId={userId}
                            gstInclusive={gstInclusive}
                            gstEnabled={gstEnabled}
                            orgId={orgId}
                            org={org}
                        // Pass onSuccess to close dialog? 
                        // The SalesForm currently handles its own state/toast but doesn't receive a "close" callback prop.
                        // We might want to add that if needed, but for now user closes manually.
                        />
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                <Button size="default" className="gap-2 shadow-lg hover:shadow-primary/20 bg-primary text-primary-foreground font-bold rounded-2xl h-11 px-6">
                    <PlusIcon className="h-4 w-4" />
                    <span>New Sale</span>
                </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[90vh]">
                <DrawerHeader className="text-left">
                    <DrawerTitle>New Sale</DrawerTitle>
                    <DrawerDescription>
                        Record a new transaction
                    </DrawerDescription>
                </DrawerHeader>
                <div className="px-4 pb-8 overflow-y-auto">
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
