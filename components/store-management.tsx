"use client"

import type { FormEvent } from "react"
import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Building2, Check, Loader2, MapPin, Phone, Plus, Store } from "lucide-react"
import { toast } from "sonner"

type ManagedStore = {
  id: string
  name: string
  code: string
  address: string | null
  phone: string | null
  is_default: boolean
  is_active: boolean
}

interface StoreManagementProps {
  orgId: string
}

export function StoreManagement({ orgId }: StoreManagementProps) {
  const [stores, setStores] = useState<ManagedStore[]>([])
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [switchingStoreId, setSwitchingStoreId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "",
    code: "",
    address: "",
    phone: "",
    isDefault: false,
  })

  const loadStores = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/stores", { cache: "no-store" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to load stores")
      setStores(Array.isArray(data?.stores) ? data.stores : [])
      setActiveStoreId(String(data?.activeStoreId || "").trim() || null)
    } catch (error) {
      setStores([])
      setActiveStoreId(null)
      toast.error(error instanceof Error ? error.message : "Failed to load stores")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadStores()
  }, [loadStores])

  const handleCreateStore = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          code: form.code,
          address: form.address,
          phone: form.phone,
          isDefault: form.isDefault,
          orgId,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to create store")

      setOpen(false)
      setForm({ name: "", code: "", address: "", phone: "", isDefault: false })
      setStores(Array.isArray(data?.stores) ? data.stores : [])
      setActiveStoreId(String(data?.activeStoreId || "").trim() || null)
      toast.success("Store created")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create store")
    } finally {
      setSaving(false)
    }
  }

  const handleSelectStore = async (storeId: string) => {
    if (!storeId || storeId === activeStoreId) return
    setSwitchingStoreId(storeId)
    try {
      const res = await fetch("/api/stores/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to switch store")
      setActiveStoreId(String(data?.storeId || storeId))
      toast.success("Active store updated")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to switch store")
    } finally {
      setSwitchingStoreId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100">Store Management</h3>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Create branches and verify local switching</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="h-10 rounded-xl bg-zinc-950 text-white hover:bg-emerald-600 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-emerald-500 dark:hover:text-zinc-950">
              <Plus className="mr-2 h-4 w-4" />
              Add Store
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[460px]">
            <form onSubmit={handleCreateStore}>
              <DialogHeader>
                <DialogTitle>Create Store</DialogTitle>
                <DialogDescription>Add another branch so the multi-store UI can be tested locally.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="store-name">Store Name</Label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="store-name"
                      value={form.name}
                      onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                      className="pl-9"
                      placeholder="Downtown Branch"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="store-code">Store Code</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="store-code"
                      value={form.code}
                      onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))}
                      className="pl-9"
                      placeholder="DTWN"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="store-address">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="store-address"
                      value={form.address}
                      onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                      className="pl-9"
                      placeholder="GS Road, Guwahati"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="store-phone">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="store-phone"
                      value={form.phone}
                      onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                      className="pl-9"
                      placeholder="9876543210"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Make default store</p>
                    <p className="text-xs text-zinc-500">New invoices and screens will fall back here.</p>
                  </div>
                  <Switch checked={form.isDefault} onCheckedChange={(checked) => setForm((current) => ({ ...current, isDefault: checked }))} />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Store
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {loading ? (
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50/60 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/40">
            Loading stores...
          </div>
        ) : stores.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-800">
            No stores found.
          </div>
        ) : (
          stores.map((store) => {
            const isActive = store.id === activeStoreId
            return (
              <div key={store.id} className="rounded-2xl border border-zinc-100 bg-white px-4 py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-black text-zinc-900 dark:text-zinc-100">{store.name}</p>
                      {store.is_default ? <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/70 dark:text-emerald-200">Default</Badge> : null}
                      {isActive ? <Badge className="border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-950/70 dark:text-sky-200">Active</Badge> : null}
                    </div>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">{store.code}</p>
                    {store.address ? <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{store.address}</p> : null}
                    {store.phone ? <p className="mt-1 text-sm text-zinc-500">{store.phone}</p> : null}
                  </div>

                  {isActive ? (
                    <Check className="h-4 w-4 shrink-0 text-sky-500" />
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={switchingStoreId === store.id}
                      onClick={() => void handleSelectStore(store.id)}
                      className="rounded-xl"
                    >
                      {switchingStoreId === store.id ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                      Make Active
                    </Button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
