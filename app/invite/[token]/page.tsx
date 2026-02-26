"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Logo, LogoText } from "@/components/ui/logo"
import { Loader2, CheckCircle, XCircle, ShieldCheck, Zap } from "lucide-react"

export default function AcceptInvitePage() {
    const router = useRouter()
    const params = useParams()
    const token = params.token as string

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
    const [message, setMessage] = useState("")
    const [orgName, setOrgName] = useState("")
    const [orgSlug, setOrgSlug] = useState("")

    useEffect(() => {
        const acceptInvite = async () => {
            try {
                const res = await fetch(`/api/invite/${token}`, { method: "POST" })
                const data = await res.json()

                if (res.status === 401) {
                    router.push(`/auth/login?next=${encodeURIComponent(`/invite/${token}`)}&invite=${token}`)
                    return
                }

                if (!res.ok) {
                    throw new Error(data.error || "Failed to accept invite")
                }

                setStatus("success")
                setOrgName(data.orgName)
                setOrgSlug(data.orgSlug || "")
                setMessage("Institutional Identity Secured.")

                setTimeout(() => {
                    if (data.orgSlug) {
                        router.push(`/${data.orgSlug}/dashboard`)
                    } else {
                        router.push("/dashboard")
                    }
                    router.refresh()
                }, 2000)
            } catch (e: any) {
                setStatus("error")
                setMessage(e.message || "Invalid or expired invite link")
            }
        }

        if (token) {
            acceptInvite()
        }
    }, [token, router])

    return (
        <div className="min-h-screen w-full flex overflow-hidden bg-zinc-950 relative items-center justify-center p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,rgba(255,255,255,0.04)_1px,transparent_0)] bg-[size:32px_32px] z-0" />

            <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-700">
                <div className="absolute -inset-1 bg-emerald-500/20 rounded-[40px] blur-xl opacity-30" />

                <Card className="bg-zinc-900/80 border-white/10 rounded-[36px] overflow-hidden shadow-2xl backdrop-blur-2xl text-center border">
                    <CardHeader className="pt-12 pb-6 space-y-6">
                        <div className="flex justify-center">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 shadow-xl">
                                <Logo size={56} className="text-emerald-500" />
                            </div>
                        </div>
                        <LogoText className="items-center" />
                    </CardHeader>

                    <CardContent className="px-10 pb-12 space-y-8">
                        {status === "loading" && (
                            <div className="space-y-6 animate-pulse">
                                <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                                    <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 italic">Processing Access</p>
                                    <h2 className="text-xl font-black text-white italic uppercase tracking-tight">Syncing KhataPlus Node...</h2>
                                </div>
                            </div>
                        )}

                        {status === "success" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="h-16 w-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                                    <CheckCircle className="h-8 w-8 text-emerald-500" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">
                                        Welcome to <span className="text-emerald-500">{orgName}!</span>
                                    </h2>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 italic">{message}</p>
                                </div>
                                <div className="pt-4 flex items-center justify-center gap-3">
                                    <Zap className="h-4 w-4 text-emerald-500 animate-pulse" />
                                    <span className="text-sm font-bold text-zinc-400">Redirecting to Control Panel...</span>
                                </div>
                            </div>
                        )}

                        {status === "error" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="h-16 w-16 rounded-3xl bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto">
                                    <XCircle className="h-8 w-8 text-red-500" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Invite Expired</h2>
                                    <p className="text-sm font-bold text-zinc-400">{message}</p>
                                </div>
                                <Button
                                    onClick={() => router.push("/auth/login")}
                                    className="w-full py-7 !rounded-[20px] bg-white text-zinc-950 hover:bg-zinc-100 font-black text-sm uppercase italic tracking-widest transition-all border-none"
                                >
                                    Return to Terminal
                                </Button>
                            </div>
                        )}
                    </CardContent>

                    {/* Status accent */}
                    {status === 'success' && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                    )}
                </Card>
            </div>
        </div>
    )
}
