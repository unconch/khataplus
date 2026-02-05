"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo, LogoText } from "@/components/ui/logo"
import { Building2, Loader2 } from "lucide-react"

export default function SetupOrganizationPage() {
    const router = useRouter()
    const [name, setName] = useState("")
    const [gstin, setGstin] = useState("")
    const [address, setAddress] = useState("")
    const [phone, setPhone] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        setLoading(true)
        setError("")

        try {
            const res = await fetch("/api/organizations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    gstin: gstin.trim(),
                    address: address.trim(),
                    phone: phone.trim()
                })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed to create organization")
            }

            router.push("/home")
            router.refresh()
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <Card className="w-full max-w-lg border-primary/10 shadow-2xl">
                <CardHeader className="text-center space-y-4">
                    <div className="flex justify-center -mt-6">
                        <div className="bg-background p-2 rounded-full border shadow-sm">
                            <Logo size={48} className="text-primary" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <CardTitle className="text-3xl font-black tracking-tight">Onboard Your Business</CardTitle>
                        <CardDescription className="text-base">
                            Enter your business details to personalize your KhataPlus instance
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="name" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Business Name *</Label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="E.g. KhataPlus Enterprises"
                                        className="pl-10 h-11"
                                        autoFocus
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="gstin" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">GSTIN (Optional)</Label>
                                <Input
                                    id="gstin"
                                    value={gstin}
                                    onChange={(e) => setGstin(e.target.value)}
                                    placeholder="18AAAAA0000A1Z5"
                                    className="h-11 uppercase"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Business Phone</Label>
                                <Input
                                    id="phone"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+91 98765 43210"
                                    className="h-11"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="address" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Business Address</Label>
                                <Input
                                    id="address"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="123, Business Park, City, State, PIN"
                                    className="h-11"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                                <p className="text-sm text-destructive font-medium">{error}</p>
                            </div>
                        )}

                        <Button type="submit" className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20" disabled={loading || !name.trim()}>
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                    Initialising...
                                </>
                            ) : (
                                "Launch Business"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
