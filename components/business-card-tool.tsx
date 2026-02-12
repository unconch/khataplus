"use client"

import { useState, useRef, useEffect } from "react"
import {
    Smartphone, MapPin, Mail, Globe,
    Download, Layout, Type, Palette,
    Image as ImageIcon, QrCode, CheckCircle2,
    RotateCw, Layers, Printer, Share2, Upload,
    CreditCard, Map, Phone, Building, Star,
    Camera, Instagram, Briefcase, Store, Zap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import html2canvas from "html2canvas"
import { toast } from "sonner"
import QRCode from "react-qr-code"

// --- Types & Constants ---

type CardSide = "front" | "back"
type FontStyle = "sans" | "serif" | "mono"
type CardLayout = "modern" | "classic" | "corporate" | "creative"

const FONTS = {
    sans: "font-sans",
    serif: "font-serif",
    mono: "font-mono"
}

const TEMPLATES: Record<CardLayout, { name: string, description: string }> = {
    modern: { name: "Modern Split", description: "Bold geometric design with strong branding" },
    corporate: { name: "Executive Suite", description: "Clean, professional whitespace-heavy layout" },
    creative: { name: "Studio Vibrant", description: "Artistic layout with full-bleed color" },
    classic: { name: "Timeless Card", description: "Traditional centered text and border" }
}

const PALETTES = [
    { name: "Emerald City", primary: "#10b981", text: "#064e3b", bg: "#ecfdf5" },
    { name: "Royal Blue", primary: "#2563eb", text: "#1e3a8a", bg: "#eff6ff" },
    { name: "Midnight Gold", primary: "#fbbf24", text: "#fffbeb", bg: "#18181b" },
    { name: "Crimson Red", primary: "#dc2626", text: "#7f1d1d", bg: "#fef2f2" },
    { name: "Slate Minimal", primary: "#475569", text: "#0f172a", bg: "#f8fafc" },
    { name: "Violet Vibes", primary: "#8b5cf6", text: "#4c1d95", bg: "#f5f3ff" },
]

export function BusinessCardTool() {
    // --- State ---
    const [side, setSide] = useState<CardSide>("front")
    const cardRef = useRef<HTMLDivElement>(null)

    // Identity
    const [shopName, setShopName] = useState("Sharma General Store")
    const [ownerName, setOwnerName] = useState("Rahul Sharma")
    const [tagline, setTagline] = useState("Premium Quality Groceries")
    const [logo, setLogo] = useState<string | null>(null)

    // Contact
    const [phone, setPhone] = useState("+91 98765 43210")
    const [email, setEmail] = useState("rahul@khataplus.com")
    const [address, setAddress] = useState("123, Main Market, Guwahati")
    const [website, setWebsite] = useState("www.khataplus.com")

    // Design
    const [layout, setLayout] = useState<CardLayout>("modern")
    const [font, setFont] = useState<FontStyle>("sans")
    const [palette, setPalette] = useState(PALETTES[0])
    const [showQr, setShowQr] = useState(true)
    const [qrValue, setQrValue] = useState("upi://pay?pa=rahul@upi&pn=RahulSharma") // Start with UPI template

    // --- Actions ---

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => setLogo(reader.result as string)
            reader.readAsDataURL(file)
        }
    }

    const handleExport = async (format: 'png' | 'pdf') => {
        if (!cardRef.current) return
        toast.loading("Rendering high-quality card...")

        try {
            // Wait a moment for fonts/images to settle
            await new Promise(resolve => setTimeout(resolve, 500))

            const canvas = await html2canvas(cardRef.current, {
                scale: 4, // Ultra high res (300 DPI equivalent)
                backgroundColor: null,
                useCORS: true,
                logging: false
            })

            const image = canvas.toDataURL("image/png")

            if (format === 'png') {
                const link = document.createElement("a")
                link.href = image
                link.download = `${shopName.replace(/\s+/g, '-')}-${side}.png`
                link.click()
            }

            toast.dismiss()
            toast.success("Card downloaded successfully!")
        } catch (err) {
            console.error(err)
            toast.error("Export failed. Please try again.")
        }
    }

    // --- Renderers ---

    const CardContent = () => (
        <div className={cn("w-full h-full relative overflow-hidden transition-all duration-500", FONTS[font])}
            style={{ backgroundColor: palette.bg, color: palette.text }}>

            {/* --- MODERN LAYOUT --- */}
            {layout === "modern" && (
                <div className="w-full h-full flex" style={{ backgroundColor: "#ffffff" }}>
                    {/* Sidebar */}
                    <div className="w-[35%] h-full relative p-6 flex flex-col items-center justify-center text-center"
                        style={{ backgroundColor: palette.primary }}>
                        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 overflow-hidden border-2"
                            style={{ backgroundColor: "rgba(255,255,255,0.2)", borderColor: "rgba(255,255,255,0.3)" }}>
                            {logo ? <img src={logo} className="w-full h-full object-cover" /> : <StoreIcon size={32} style={{ color: "#ffffff" }} />}
                        </div>
                        <h3 className="font-bold text-lg leading-tight mb-1" style={{ color: "#ffffff" }}>{shopName}</h3>
                        <p className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.8)" }}>{tagline}</p>
                    </div>
                    {/* Main Content */}
                    <div className="flex-1 p-8 flex flex-col justify-center gap-4">
                        <div className="border-b-2 pb-4 mb-2" style={{ borderColor: palette.primary + '30' }}>
                            <h2 className="text-2xl font-bold uppercase tracking-tight" style={{ color: "#18181b" }}>{ownerName}</h2>
                            <p className="text-sm font-medium" style={{ color: "#71717a" }}>Proprietor</p>
                        </div>
                        <div className="space-y-2 text-xs font-medium" style={{ color: "#3f3f46" }}>
                            <div className="flex items-center gap-3">
                                <Smartphone size={14} style={{ color: palette.primary }} /> {phone}
                            </div>
                            <div className="flex items-center gap-3">
                                <Mail size={14} style={{ color: palette.primary }} /> {email}
                            </div>
                            <div className="flex items-center gap-3">
                                <MapPin size={14} style={{ color: palette.primary }} /> {address}
                            </div>
                        </div>
                        {showQr && side === "front" && (
                            <div className="absolute bottom-4 right-4 opacity-20">
                                <QRCode value={qrValue} size={48} viewBox={`0 0 256 256`} style={{ height: "auto", maxWidth: "100%", width: "100%" }} />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- CORPORATE LAYOUT --- */}
            {layout === "corporate" && (
                <div className="w-full h-full p-8 flex flex-col justify-between" style={{ backgroundColor: "#ffffff" }}>
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded flex items-center justify-center overflow-hidden" style={{ backgroundColor: "#f1f5f9" }}>
                                {logo ? <img src={logo} className="w-full h-full object-cover" /> : <StoreIcon size={24} style={{ color: "#0f172a" }} />}
                            </div>
                            <div>
                                <h3 className="font-bold text-xl tracking-tight" style={{ color: "#0f172a" }}>{shopName}</h3>
                                <p className="text-xs uppercase tracking-widest" style={{ color: "#64748b" }}>{tagline}</p>
                            </div>
                        </div>
                        {showQr && (
                            <div className="p-1 border rounded" style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}>
                                <QRCode value={qrValue} size={40} />
                            </div>
                        )}
                    </div>

                    <div className="h-px w-full my-4" style={{ backgroundColor: "#e2e8f0" }} />

                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <h2 className="text-lg font-bold" style={{ color: "#0f172a" }}>{ownerName}</h2>
                            <p className="text-xs mb-4" style={{ color: "#64748b" }}>Owner / Manager</p>
                        </div>
                        <div className="space-y-1.5 text-xs text-right" style={{ color: "#475569" }}>
                            <p>{phone}</p>
                            <p>{email}</p>
                            <p>{website}</p>
                            <p className="pt-2 italic">{address}</p>
                        </div>
                    </div>
                    {/* Accent Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-2" style={{ backgroundColor: palette.primary }} />
                </div>
            )}

            {/* --- CREATIVE LAYOUT --- */}
            {layout === "creative" && (
                <div className="w-full h-full p-8 relative flex items-center justify-between overflow-hidden" style={{ backgroundColor: palette.bg, color: palette.text }}>
                    {/* Big Background Shape */}
                    <div className="absolute top-[-50%] right-[-20%] w-[100%] h-[200%] rotate-12 opacity-50 z-0" style={{ backgroundColor: palette.primary }} />

                    <div className="relative z-10 space-y-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                {logo && <img src={logo} className="w-8 h-8 rounded-full object-cover shadow-sm" />}
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Creative Studio</span>
                            </div>
                            <h1 className="text-4xl font-black leading-none tracking-tighter" style={{ color: palette.primary }}>
                                {shopName.split(' ')[0]}<br />
                                <span className="text-black/80" style={{ color: "rgba(0,0,0,0.8)" }}>{shopName.split(' ').slice(1).join(' ')}</span>
                            </h1>
                        </div>
                        <div className="space-y-1">
                            <p className="font-bold text-sm">{ownerName}</p>
                            <p className="text-xs opacity-60">{phone} • {email}</p>
                        </div>
                    </div>

                    <div className="relative z-10 p-2 rounded-xl rotate-3 border-2" style={{ backgroundColor: "#ffffff", borderColor: palette.primary, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}>
                        <QRCode value={qrValue} size={64} fgColor={palette.primary} />
                    </div>
                </div>
            )}

            {/* --- CLASSIC LAYOUT --- */}
            {layout === "classic" && (
                <div className="w-full h-full p-4 flex items-center justify-center" style={{ backgroundColor: "#ffffff" }}>
                    <div className="w-full h-full border-4 border-double flex flex-col items-center justify-center text-center p-6 space-y-4"
                        style={{ borderColor: palette.primary }}>

                        {logo && <img src={logo} className="w-12 h-12 object-contain mb-2" />}

                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold uppercase tracking-widest" style={{ color: palette.primary }}>{shopName}</h2>
                            <div className="flex items-center justify-center gap-2 opacity-60">
                                <div className="h-px w-8 bg-current" style={{ backgroundColor: palette.primary }} />
                                <p className="text-[10px] uppercase tracking-widest" style={{ color: "#52525b" }}>{tagline}</p>
                                <div className="h-px w-8 bg-current" style={{ backgroundColor: palette.primary }} />
                            </div>
                        </div>

                        <div className="py-4">
                            <p className="text-lg font-medium" style={{ color: "#18181b" }}>{ownerName}</p>
                            <p className="text-xs italic opacity-70" style={{ color: "#71717a" }}>Proprietor</p>
                        </div>

                        <div className="text-[10px] font-medium space-y-1 opacity-80" style={{ color: "#3f3f46" }}>
                            <p>{address} • {phone}</p>
                            <p>{email} • {website}</p>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )

    // --- Main UI ---
    return (
        <div className="max-w-[1400px] mx-auto p-4 lg:p-8 min-h-screen bg-zinc-50 dark:bg-zinc-950">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black italic tracking-tight text-zinc-900 dark:text-white">Card Studio Pro</h1>
                    <p className="text-zinc-500 font-medium">Professional Identity Designer</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2" onClick={() => handleExport('png')}>
                        <Download size={18} />
                        Download PNG
                    </Button>
                    <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleExport('png')}>
                        <Printer size={18} />
                        Print Ready PDF
                    </Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-start">

                {/* LEFT: EDITOR CONTROLS */}
                <div className="lg:col-span-4 xl:col-span-3 space-y-6">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                        <Tabs defaultValue="content" className="w-full">
                            <TabsList className="w-full grid grid-cols-3 h-14 bg-zinc-50/50 p-1">
                                <TabsTrigger value="content" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Content</TabsTrigger>
                                <TabsTrigger value="design" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Design</TabsTrigger>
                                <TabsTrigger value="branding" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Brand</TabsTrigger>
                            </TabsList>

                            {/* CONTENT TAB */}
                            <TabsContent value="content" className="p-5 space-y-5">
                                <div className="space-y-3">
                                    <Label className="text-xs font-bold uppercase text-zinc-400">Business Identity</Label>
                                    <Input value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="Shop Name" className="font-bold" />
                                    <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Tagline" />
                                    <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Owner Name" />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-xs font-bold uppercase text-zinc-400">Contact Details</Label>
                                    <div className="relative">
                                        <Smartphone className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                                        <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-9" placeholder="Phone" />
                                    </div>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                                        <Input value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" placeholder="Email" />
                                    </div>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                                        <Input value={address} onChange={(e) => setAddress(e.target.value)} className="pl-9" placeholder="Address" />
                                    </div>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                                        <Input value={website} onChange={(e) => setWebsite(e.target.value)} className="pl-9" placeholder="Website" />
                                    </div>
                                </div>
                            </TabsContent>

                            {/* DESIGN TAB */}
                            <TabsContent value="design" className="p-5 space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-xs font-bold uppercase text-zinc-400">Layout</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(Object.entries(TEMPLATES) as [CardLayout, any][]).map(([key, t]) => (
                                            <div key={key}
                                                onClick={() => setLayout(key)}
                                                className={cn(
                                                    "cursor-pointer rounded-lg border-2 p-3 hover:bg-zinc-50 transition-all",
                                                    layout === key ? "border-emerald-500 bg-emerald-50/50" : "border-zinc-100"
                                                )}>
                                                <p className="font-bold text-sm capitalize">{t.name}</p>
                                                <p className="text-[10px] text-zinc-500 leading-tight mt-1">{t.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-xs font-bold uppercase text-zinc-400">Theme Palette</Label>
                                    <div className="grid grid-cols-6 gap-2">
                                        {PALETTES.map((p) => (
                                            <button
                                                key={p.name}
                                                onClick={() => setPalette(p)}
                                                className={cn(
                                                    "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                                                    palette.name === p.name ? "border-zinc-900 scale-110" : "border-transparent"
                                                )}
                                                style={{ backgroundColor: p.primary }}
                                                title={p.name}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-xs font-bold uppercase text-zinc-400">Typography</Label>
                                    <div className="flex gap-2">
                                        {(['sans', 'serif', 'mono'] as const).map(f => (
                                            <Button
                                                key={f}
                                                variant={font === f ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setFont(f)}
                                                className="flex-1 capitalize"
                                            >
                                                {f}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>

                            {/* BRANDING TAB */}
                            <TabsContent value="branding" className="p-5 space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-xs font-bold uppercase text-zinc-400">Company Logo</Label>
                                    <div className="border-2 border-dashed border-zinc-200 rounded-xl p-8 flex flex-col items-center justify-center gap-2 hover:bg-zinc-50 transition-colors cursor-pointer relative">
                                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                        {logo ? (
                                            <img src={logo} className="h-16 object-contain" />
                                        ) : (
                                            <>
                                                <Upload className="text-zinc-400" />
                                                <p className="text-xs text-zinc-500">Click to upload logo</p>
                                            </>
                                        )}
                                    </div>
                                    {logo && (
                                        <Button variant="ghost" size="sm" className="w-full text-red-500 h-8" onClick={() => setLogo(null)}>Remove Logo</Button>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-bold uppercase text-zinc-400">QR Code</Label>
                                        <Switch checked={showQr} onCheckedChange={setShowQr} />
                                    </div>
                                    {showQr && (
                                        <Input
                                            value={qrValue}
                                            onChange={(e) => setQrValue(e.target.value)}
                                            placeholder="https:// or upi://"
                                            className="font-mono text-xs"
                                        />
                                    )}
                                    <p className="text-[10px] text-zinc-400">
                                        Use `upi://pay?pa=VPA&pn=NAME` for Payments
                                    </p>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>

                {/* RIGHT: PREVIEW CANVAS */}
                <div className="lg:col-span-8 xl:col-span-9 flex flex-col items-center min-h-[600px] gap-8">

                    {/* View Controls */}
                    <div className="bg-white rounded-full shadow-sm border border-zinc-200 p-1 flex items-center gap-1">
                        <Button
                            variant={side === "front" ? "secondary" : "ghost"}
                            className="rounded-full px-6"
                            onClick={() => setSide("front")}
                        >
                            Front Side
                        </Button>
                        <Button
                            variant={side === "back" ? "secondary" : "ghost"}
                            className="rounded-full px-6"
                            onClick={() => setSide("back")}
                        >
                            Back Side
                        </Button>
                    </div>

                    {/* Canvas Area */}
                    <div className="relative w-full max-w-2xl px-4">
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                            className="aspect-[1.75/1] w-full bg-white rounded-xl shadow-2xl relative group overflow-hidden"
                            style={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
                        >
                            {/* The Exportable Area */}
                            <div ref={cardRef} className="w-full h-full">
                                {side === "front" ? (
                                    <CardContent />
                                ) : (
                                    // Professional Back Side with functional QR
                                    <div className={cn("w-full h-full flex flex-col items-center justify-center p-8", FONTS[font])}
                                        style={{ backgroundColor: palette.primary, color: "white" }}>
                                        {logo && <img src={logo} className="w-16 h-16 object-contain mb-4 filter brightness-0 invert" />}
                                        <h2 className="text-3xl font-bold tracking-tight mb-4" style={{ color: "#ffffff" }}>{shopName}</h2>
                                        {showQr && (
                                            <div className="p-3 rounded-xl" style={{ backgroundColor: "#ffffff", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}>
                                                <QRCode value={qrValue} size={100} />
                                            </div>
                                        )}
                                        <p className="mt-6 font-medium opacity-80" style={{ color: "#ffffff" }}>{website}</p>
                                    </div>
                                )}
                            </div>

                            {/* Hover Overlay Hints */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-0 transition-opacity flex items-center justify-center pointer-events-none">
                                <span className="bg-white/90 px-4 py-2 rounded-full font-bold text-sm shadow-lg">Preview Mode</span>
                            </div>
                        </motion.div>

                        {/* Real-world Scale Hint */}
                        <div className="mt-8 text-center">
                            <p className="text-xs text-zinc-400 uppercase tracking-widest font-bold">Standard 3.5" x 2.0" Business Card</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}

function StoreIcon({ className, size, style }: { className?: string, size: number, style?: React.CSSProperties }) {
    return <CreditCard className={className} size={size} style={style} />
}

