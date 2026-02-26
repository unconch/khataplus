"use client"

import { useMemo, useState } from "react"
import type { Customer, KhataTransaction } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { getWhatsAppUrl, WhatsAppMessages } from "@/lib/whatsapp"
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  IndianRupee,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
} from "lucide-react"

interface KhataLedgerProps {
  customer: Customer
  transactions: KhataTransaction[]
  orgId: string
  userId: string
  shopName: string
}

type TxTypeFilter = "all" | "credit" | "payment"
type EntryType = "credit" | "payment"

function computeBalance(items: KhataTransaction[]): number {
  return items.reduce((sum, tx) => (tx.type === "credit" ? sum + Number(tx.amount) : sum - Number(tx.amount)), 0)
}

function enrichWithRunningBalance(items: KhataTransaction[]): KhataTransaction[] {
  const asc = [...items].sort((a, b) => {
    const t = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    if (t !== 0) return t
    return a.id.localeCompare(b.id)
  })

  let running = 0
  const byId = new Map<string, number>()
  for (const tx of asc) {
    running += tx.type === "credit" ? Number(tx.amount) : -Number(tx.amount)
    byId.set(tx.id, running)
  }

  return items.map((tx) => ({ ...tx, running_balance: byId.get(tx.id) }))
}

export function KhataLedger({ customer, transactions: initialTransactions, orgId, shopName }: KhataLedgerProps) {
  const [transactions, setTransactions] = useState<KhataTransaction[]>(() => enrichWithRunningBalance(initialTransactions))
  const [entryType, setEntryType] = useState<EntryType>("credit")
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<TxTypeFilter>("all")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState("")
  const [editNote, setEditNote] = useState("")

  const stats = useMemo(() => {
    const totalCredit = transactions.filter((t) => t.type === "credit").reduce((s, t) => s + Number(t.amount), 0)
    const totalPayment = transactions.filter((t) => t.type === "payment").reduce((s, t) => s + Number(t.amount), 0)
    const balance = totalCredit - totalPayment
    return { totalCredit, totalPayment, balance, count: transactions.length }
  }, [transactions])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return transactions.filter((tx) => {
      const typeOk = typeFilter === "all" ? true : tx.type === typeFilter
      const text = `${tx.note || ""} ${tx.created_by_name || ""}`.toLowerCase()
      const qOk = q ? text.includes(q) : true
      return typeOk && qOk
    })
  }, [transactions, query, typeFilter])

  const refreshLocal = (next: KhataTransaction[]) => setTransactions(enrichWithRunningBalance(next))

  const handleAdd = async () => {
    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast.error("Enter a valid amount")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/khata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.id,
          type: entryType,
          amount: numericAmount,
          note: note.trim() || null,
          orgId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to add entry")

      refreshLocal([data as KhataTransaction, ...transactions])
      setAmount("")
      setNote("")
      toast.success(entryType === "credit" ? "Credit added" : "Payment added")
    } catch (error: any) {
      toast.error(error?.message || "Could not add entry")
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (tx: KhataTransaction) => {
    setEditingId(tx.id)
    setEditAmount(String(tx.amount))
    setEditNote(tx.note || "")
  }

  const handleSaveEdit = async (txId: string) => {
    const numericAmount = Number(editAmount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast.error("Enter a valid amount")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/khata", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txId, amount: numericAmount, note: editNote, orgId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to update entry")
      refreshLocal(transactions.map((tx) => (tx.id === txId ? (data as KhataTransaction) : tx)))
      setEditingId(null)
      toast.success("Entry updated")
    } catch (error: any) {
      toast.error(error?.message || "Could not update entry")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (txId: string) => {
    if (!confirm("Delete this ledger entry?")) return
    setSaving(true)
    try {
      const res = await fetch(`/api/khata?txId=${encodeURIComponent(txId)}&orgId=${encodeURIComponent(orgId)}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to delete entry")
      refreshLocal(transactions.filter((tx) => tx.id !== txId))
      toast.success("Entry deleted")
    } catch (error: any) {
      toast.error(error?.message || "Could not delete entry")
    } finally {
      setSaving(false)
    }
  }

  const balanceLabel = stats.balance >= 0 ? "You Will Get" : "You Will Give"
  const balanceClass = stats.balance >= 0 ? "text-emerald-600" : "text-rose-600"
  const balanceBg = stats.balance >= 0 ? "from-emerald-500 to-teal-600" : "from-rose-500 to-orange-600"

  const reminderUrl = customer.phone
    ? getWhatsAppUrl(customer.phone, WhatsAppMessages.ledgerSummary(customer.name, shopName, stats.balance))
    : null

  return (
    <div className="space-y-6 pb-24">
      <Card className={cn("border-none shadow-xl overflow-hidden bg-gradient-to-br text-white", balanceBg)}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-white/80 text-[10px] uppercase font-black tracking-widest">{balanceLabel}</p>
              <h2 className="text-4xl font-black tracking-tight flex items-center gap-1">
                <IndianRupee className="h-8 w-8" />
                {Math.abs(stats.balance).toLocaleString()}
              </h2>
              <p className="text-xs font-bold text-white/90">{customer.name}</p>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <UserRound className="h-7 w-7" />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="bg-white/20 text-white border-0">Entries: {stats.count}</Badge>
            <Badge className="bg-white/20 text-white border-0">Credit: Rs {stats.totalCredit.toLocaleString()}</Badge>
            <Badge className="bg-white/20 text-white border-0">Payment: Rs {stats.totalPayment.toLocaleString()}</Badge>
          </div>
          {reminderUrl && (
            <div className="mt-4">
              <a href={reminderUrl} target="_blank" rel="noreferrer">
                <Button className="h-9 text-xs font-black uppercase tracking-widest bg-white text-zinc-900 hover:bg-white/90">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send WhatsApp Reminder
                </Button>
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border border-zinc-100 dark:border-zinc-800">
        <CardContent className="p-4 md:p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={entryType === "credit" ? "default" : "outline"}
              onClick={() => setEntryType("credit")}
              className="h-9 text-xs font-black uppercase tracking-widest"
            >
              <ArrowUpRight className="h-4 w-4 mr-1" />
              Credit
            </Button>
            <Button
              type="button"
              variant={entryType === "payment" ? "default" : "outline"}
              onClick={() => setEntryType("payment")}
              className="h-9 text-xs font-black uppercase tracking-widest"
            >
              <ArrowDownLeft className="h-4 w-4 mr-1" />
              Payment
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              step="0.01"
              placeholder="Amount"
              className="h-10 font-bold"
            />
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (optional)"
              className="md:col-span-2 min-h-10 h-10"
            />
          </div>
          <Button onClick={handleAdd} disabled={saving} className="h-10 text-xs font-black uppercase tracking-widest">
            <Plus className="h-4 w-4 mr-1" />
            Add Entry
          </Button>
        </CardContent>
      </Card>

      <Card className="border border-zinc-100 dark:border-zinc-800">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="relative w-full md:w-80">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search note or creator" className="pl-9 h-9" />
            </div>
            <div className="flex items-center gap-2">
              {(["all", "credit", "payment"] as const).map((k) => (
                <Button
                  key={k}
                  variant={typeFilter === k ? "default" : "outline"}
                  className="h-8 text-[10px] uppercase font-black tracking-widest"
                  onClick={() => setTypeFilter(k)}
                >
                  {k}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-12 rounded-xl border border-dashed">
                <Calendar className="h-8 w-8 mx-auto text-zinc-300 mb-2" />
                <p className="text-sm text-muted-foreground">No matching entries</p>
              </div>
            ) : (
              filtered.map((tx) => {
                const isCredit = tx.type === "credit"
                return (
                  <div key={tx.id} className="rounded-xl border bg-zinc-50/40 dark:bg-zinc-900/20 p-3 md:p-4">
                    {editingId === tx.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <Input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
                          <Input value={editNote} onChange={(e) => setEditNote(e.target.value)} placeholder="Note" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" onClick={() => handleSaveEdit(tx.id)} disabled={saving}>Save</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className={cn("text-sm font-black uppercase tracking-tight", isCredit ? "text-rose-600" : "text-emerald-600")}>
                            {isCredit ? "Credit (You gave)" : "Payment (You got)"}
                          </p>
                          <p className="text-[11px] font-bold text-zinc-500">
                            {new Date(tx.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                          {tx.note && <p className="text-xs text-zinc-700 dark:text-zinc-300">{tx.note}</p>}
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                            Running: Rs {Math.abs(tx.running_balance || 0).toLocaleString()} {Number(tx.running_balance || 0) >= 0 ? "receivable" : "payable"}
                          </p>
                        </div>
                        <div className="text-right space-y-2">
                          <p className={cn("text-lg font-black", isCredit ? "text-rose-600" : "text-emerald-600")}>
                            {isCredit ? "+" : "-"}Rs {Number(tx.amount).toLocaleString()}
                          </p>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(tx)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600" onClick={() => handleDelete(tx.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      <p className={cn("text-center text-xs font-black uppercase tracking-widest", balanceClass)}>
        Live ledger balance: Rs {Math.abs(computeBalance(transactions)).toLocaleString()} {computeBalance(transactions) >= 0 ? "to collect" : "to pay"}
      </p>
    </div>
  )
}

