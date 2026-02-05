"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus, Loader2, Store, Phone, MapPin, Tag } from "lucide-react"
import { Supplier } from "@/lib/types"

interface AddSupplierDialogProps {
    orgId: string
    onSuccess?: (supplier: Supplier) => void
}

export function AddSupplierDialog({ orgId, onSuccess }: AddSupplierDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        address: "",
        gstin: ""
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const res = await fetch("/api/suppliers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, orgId })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed to add supplier")
            }

            const newSupplier = await res.json()
            onSuccess?.(newSupplier)
            setOpen(false)
            setFormData({ name: "", phone: "", address: "", gstin: "" })
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 rounded-xl shadow-lg">
                    <UserPlus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add Supplier</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Add New Supplier</DialogTitle>
                        <DialogDescription>
                            Create a new supplier profile to track purchases and payments.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Supplier Name</Label>
                            <div className="relative">
                                <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Acme Wholesale"
                                    className="pl-9"
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone Number (Optional)</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="Enter 10 digit number"
                                    className="pl-9"
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="gstin">GSTIN (Optional)</Label>
                            <div className="relative">
                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="gstin"
                                    value={formData.gstin}
                                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                                    placeholder="e.g. 07AAAAA0000A1Z5"
                                    className="pl-9 text-xs"
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="address">Address (Optional)</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="City, State"
                                    className="pl-9"
                                />
                            </div>
                        </div>
                        {error && <p className="text-sm text-destructive font-medium">{error}</p>}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Create Supplier"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
