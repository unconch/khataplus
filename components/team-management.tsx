"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Users, UserPlus, Copy, Check, Trash2, Loader2, Sparkles, ShieldCheck, UserCog } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface TeamPageProps {
  orgId: string
  orgName: string
}

interface Member {
  id: string
  user_id: string
  role: "owner" | "manager" | "staff"
  user?: { name: string; email: string }
}

export function TeamManagement({ orgId, orgName }: TeamPageProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteRole, setInviteRole] = useState("staff")
  const [inviteLink, setInviteLink] = useState("")
  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    void fetchMembers()
  }, [orgId])

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/organizations/${orgId}/members`)
      const data = await res.json()
      setMembers(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  const copyText = async (text: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        return
      }
    } catch { }

    const el = document.createElement("textarea")
    el.value = text
    el.setAttribute("readonly", "")
    el.style.position = "absolute"
    el.style.left = "-9999px"
    document.body.appendChild(el)
    el.select()
    document.execCommand("copy")
    document.body.removeChild(el)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleInvite = async () => {
    setSending(true)
    try {
      const res = await fetch(`/api/organizations/${orgId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: inviteRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to create invite")
      setInviteLink(data.link || "")
      if (data.link) {
        await copyText(data.link)
      }
      toast.success("Invite link generated and copied.")
    } catch (e) {
      console.error(e)
      toast.error("Failed to create invite link")
    } finally {
      setSending(false)
    }
  }

  const handleRemove = async (userId: string) => {
    if (!confirm("Are you certain you want to remove this member from the organization?")) return
    try {
      const res = await fetch(`/api/organizations/${orgId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: userId }),
      })
      if (!res.ok) throw new Error("Failed to remove member")
      toast.success("Member removed")
      await fetchMembers()
    } catch (e) {
      console.error(e)
      toast.error("Failed to remove member")
    }
  }

  const roleColors = {
    owner: "bg-amber-500/10 text-amber-600 border-amber-200/50",
    manager: "bg-indigo-500/10 text-indigo-600 border-indigo-200/50",
    staff: "bg-zinc-500/10 text-zinc-500 border-zinc-200/50",
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Invite Section */}
      <div className="space-y-5">
        <div className="flex items-center gap-3 px-2">
          <div className="h-8 w-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600">
            <UserPlus size={16} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100">Invite Member</h3>
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Expansion & Collaboration</p>
          </div>
        </div>

        <div className="relative group overflow-hidden p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 transition-all">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles size={80} className="text-orange-500" />
          </div>

          <div className="relative z-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-end">
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">Assigned Privilege</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="h-10 rounded-xl bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-black text-[9px] uppercase tracking-widest">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-zinc-100 dark:border-zinc-800 p-1 shadow-2xl">
                  <SelectItem value="owner" className="rounded-lg focus:bg-amber-500/10 focus:text-amber-600 py-2.5 font-black text-[9px] uppercase tracking-widest">Owner</SelectItem>
                  <SelectItem value="manager" className="rounded-lg focus:bg-indigo-500/10 focus:text-indigo-600 py-2.5 font-black text-[9px] uppercase tracking-widest">Manager</SelectItem>
                  <SelectItem value="staff" className="rounded-lg focus:bg-zinc-100 py-2.5 font-black text-[9px] uppercase tracking-widest">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleInvite}
              disabled={sending}
              className="h-10 rounded-xl bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-orange-600 dark:hover:bg-orange-600 hover:text-white dark:hover:text-white shadow-lg font-black uppercase tracking-[0.2em] text-[9px] transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2.5" /> : <ShieldCheck className="h-4 w-4 mr-2.5" />}
              Generate Link
            </Button>

            {inviteLink && (
              <div className="flex items-center gap-3 p-1.5 pl-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-inner animate-in zoom-in-95 duration-500">
                <Input value={inviteLink} readOnly className="border-0 focus-visible:ring-0 bg-transparent text-[9px] font-mono font-bold tracking-tighter h-7 p-0" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-600 transition-all"
                  onClick={() => copyText(inviteLink)}
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500 animate-in zoom-in" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Crew Grid */}
      <div className="space-y-5">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
              <Users size={16} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100">Active Team</h3>
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Members of {orgName}</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-dashed border-zinc-100 dark:border-zinc-800 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-200" />
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-300">Synchronizing Team</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="group relative flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 shadow-sm hover:shadow-md transition-all duration-500 overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <UserCog size={48} className="rotate-12" />
                </div>

                <div className="relative z-10 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-950 font-black text-sm shadow-lg transition-all duration-500 group-hover:rotate-3 group-hover:scale-105">
                    {(member.user?.name || member.user?.email || "?")[0].toUpperCase()}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-sm tracking-tight text-zinc-900 dark:text-zinc-100 leading-none">{member.user?.name || member.user?.email?.split("@")[0]}</p>
                      <Badge className={cn("text-[8px] h-3.5 px-1.5 p-0 font-black uppercase tracking-widest border", roleColors[member.role])}>
                        {member.role === 'owner' && <Sparkles size={8} className="mr-0.5" />}
                        {member.role}
                      </Badge>
                    </div>
                    <p className="text-[10px] font-bold text-zinc-400 tracking-tight flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse inline-block" />
                      {member.user?.email}
                    </p>
                  </div>
                </div>

                {member.role !== "owner" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-red-500 hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100"
                    onClick={() => handleRemove(member.user_id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
