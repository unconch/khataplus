"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Drawer,
    DrawerContent,
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
                <DialogContent className="max-w-4xl h-[90vh] p-0 overflow-hidden border-none bg-card shadow-xl rounded-2xl focus:outline-none flex flex-col [&>button]:top-[22px] [&>button]:right-5">
                    <div className="flex-1 min-h-0 overflow-hidden">
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
            <DrawerContent className="h-[90vh] p-0 overflow-hidden flex flex-col">
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
            </DrawerContent>
        </Drawer>
    )
}
