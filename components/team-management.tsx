"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Users, UserPlus, Copy, Check, Trash2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

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
    const [inviteEmail, setInviteEmail] = useState("")
    const [inviteRole, setInviteRole] = useState("staff")
    const [inviteLink, setInviteLink] = useState("")
    const [copied, setCopied] = useState(false)
    const [sending, setSending] = useState(false)

    useEffect(() => {
        fetchMembers()
    }, [orgId])

    const fetchMembers = async () => {
        try {
            const res = await fetch(`/api/organizations/${orgId}/members`)
            const data = await res.json()
            setMembers(data)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleInvite = async () => {
        if (!inviteEmail.trim()) {
            return
        }
        setSending(true)

        try {
            const res = await fetch(`/api/organizations/${orgId}/members`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: inviteEmail, role: inviteRole })
            })
            const data = await res.json()

            if (res.ok) {
                setInviteLink(data.link)
                setInviteEmail("")
            }
        } catch (e) {
            console.error(e)
        } finally {
            setSending(false)
        }
    }

    const copyLink = () => {
        navigator.clipboard.writeText(inviteLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleRemove = async (userId: string) => {
        if (!confirm("Remove this member?")) {
            return
        }

        try {
            await fetch(`/api/organizations/${orgId}/members`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ memberId: userId })
            })
            fetchMembers()
        } catch (e) {
            console.error(e)
        }
    }

    const roleColors = {
        owner: "bg-amber-500/10 text-amber-500",
        manager: "bg-blue-500/10 text-blue-500",
        staff: "bg-zinc-500/10 text-zinc-400"
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Invite Team Member
                    </CardTitle>
                    <CardDescription>
                        Invite someone to join {orgName}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="sm:col-span-2 space-y-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                placeholder="teammate@example.com"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Select value={inviteRole} onValueChange={setInviteRole}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="owner">Owner</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="staff">Staff</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Button onClick={handleInvite} disabled={sending || !inviteEmail.trim()}>
                        {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                        Create Invite Link
                    </Button>

                    {inviteLink && (
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                            <Input value={inviteLink} readOnly className="text-xs" />
                            <Button variant="outline" size="icon" onClick={copyLink}>
                                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Team Members
                    </CardTitle>
                    <CardDescription>
                        {members.length} member{members.length !== 1 ? "s" : ""}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {members.map((member) => (
                                <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                                            {(member.user?.name || member.user?.email || "?")[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium">{member.user?.name || member.user?.email}</p>
                                            {member.user?.name && (
                                                <p className="text-xs text-muted-foreground">{member.user.email}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge className={cn("capitalize", roleColors[member.role])}>
                                            {member.role}
                                        </Badge>
                                        {member.role !== "owner" && (
                                            <Button variant="ghost" size="icon" onClick={() => handleRemove(member.user_id)}>
                                                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
