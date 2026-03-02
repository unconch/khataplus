"use client"

import { useState, useRef, useEffect } from "react"
import {
    Smartphone, MapPin, Mail, Globe,
    Download, Layout, Type, Palette,
    Image as ImageIcon, QrCode, CheckCircle2,
    RotateCw, Layers, Printer, Share2, Upload,
    CreditCard, Map, Phone, Building, Star,
    Camera, Instagram, Briefcase, Store, Zap,
    Ticket, Calendar, User, ShoppingBag, Youtube,
    Facebook, Twitter, Wand2, Trash2, Save, Cloud,
    Music, Gamepad, Paintbrush, Utensils, Scissors,
    Ghost, Sparkles, Gem, Link, Plane, Heart,
    Coffee, Film, Gift, ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import html2canvas from "html2canvas"
import { toast } from "sonner"
import QRCode from "react-qr-code"
import { ScrollArea } from "@/components/ui/scroll-area"

// --- Types & Constants ---

type CardSide = "front" | "back"
type FontStyle = "sans" | "serif" | "mono" | "script"
type CardPurpose = "professional" | "social" | "commerce" | "event"

const FONTS = {
    sans: "font-sans",
    serif: "font-serif",
    mono: "font-mono",
    script: "font-serif italic"
}

const PURPOSES: { id: CardPurpose, label: string, icon: any, desc: string }[] = [
    { id: 'professional', label: 'Pro Business', icon: Briefcase, desc: 'Corporate & Personal Identity' },
    { id: 'social', label: 'Creator Link', icon: Camera, desc: 'Digital Presence & Social handles' },
    { id: 'commerce', label: 'Store Offer', icon: Store, desc: 'Promotions, Discounts & Coupons' },
    { id: 'event', label: 'Invite Pass', icon: Ticket, desc: 'Exclusive Access & Invitations' },
]

const PALETTES = [
    { name: "Emerald Elite", primary: "#10b981", text: "#064e3b", bg: "#ecfdf5" },
    { name: "Deep Obsidian", primary: "#18181b", text: "#ffffff", bg: "#09090b" },
    { name: "Alpine Blue", primary: "#3b82f6", text: "#1e3a8a", bg: "#eff6ff" },
    { name: "Luxury Gold", primary: "#d4af37", text: "#422006", bg: "#fefce8" },
    { name: "Rose Quartz", primary: "#f43f5e", text: "#881337", bg: "#fff1f2" },
    { name: "Royal Purple", primary: "#8b5cf6", text: "#4c1d95", bg: "#f5f3ff" },
    { name: "Matte Black", primary: "#2dd4bf", text: "#ffffff", bg: "#111827" },
    { name: "Cyber Neon", primary: "#00ff9d", text: "#000000", bg: "#ffffff" },
]

const PRESETS_BG = [
    { name: "None", value: "" },
    { name: "Dot Grid", value: "radial-gradient(#cbd5e1 1px, transparent 1px)" },
    { name: "Diagonal", value: "repeating-linear-gradient(45deg, #f1f5f9 0, #f1f5f9 10px, transparent 10px, transparent 20px)" },
    { name: "Mesh", value: "radial-gradient(at 40% 20%, rgba(255,100,255,0.1) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(100,200,255,0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(255,255,255,0.1) 0px, transparent 50%)" },
    { name: "Checker", value: "repeating-linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%, #eee), repeating-linear-gradient(45deg, #eee 25%, #fff 25%, #fff 75%, #eee 75%, #eee)" },
    { name: "Waves", value: "radial-gradient(circle at 100% 50%, transparent 20%, rgba(255,255,255,0.3) 21%, rgba(255,255,255,0.3) 34%, transparent 35%, transparent), radial-gradient(circle at 0% 50%, transparent 20%, rgba(255,255,255,0.3) 21%, rgba(255,255,255,0.3) 34%, transparent 35%, transparent) 0 0" }
]

export function BusinessCardTool() {
    // --- State ---
    const [side, setSide] = useState<CardSide>("front")
    const [purpose, setPurpose] = useState<CardPurpose>("professional")
    const cardRef = useRef<HTMLDivElement>(null)

    // Identity
    const [shopName, setShopName] = useState("Store Name")
    const [logo, setLogo] = useState<string | null>(null)

    // Details (Professional)
    const [ownerName, setOwnerName] = useState("Your Name")
    const [tagline, setTagline] = useState("Your Tagline")
    const [phone, setPhone] = useState("")
    const [email, setEmail] = useState("email@example.com")
    const [address, setAddress] = useState("Your Address, City")
    const [website, setWebsite] = useState("www.example.com")

    // Details (Social)
    const [handle, setHandle] = useState("@username")
    const [platform, setPlatform] = useState("Instagram")
    const [bio, setBio] = useState("Creator | Vlogger")

    // Details (Commerce)
    const [offerTitle, setOfferTitle] = useState("SALE")
    const [offerCode, setOfferCode] = useState("SAVE20")
    const [offerSub, setOfferSub] = useState("20% OFF Everything")
    const [expiry, setExpiry] = useState("Valid until Dec 31")

    // Details (Event)
    const [eventTitle, setEventTitle] = useState("Party")
    const [eventDate, setEventDate] = useState("Aug 15 • 5 PM")
    const [eventLoc, setEventLoc] = useState("Location")
    const [rsvp, setRsvp] = useState("RSVP: 9876543210")

    // Design
    const [layout, setLayout] = useState("layout1")
    const [font, setFont] = useState<FontStyle>("sans")
    const [palette, setPalette] = useState(PALETTES[0])
    const [customColor, setCustomColor] = useState("")
    const [showQr, setShowQr] = useState(true)
    const [qrValue, setQrValue] = useState("https://khataplus.com")

    // Advanced Design
    const [bgImage, setBgImage] = useState<string | null>(null)
    const [bgPattern, setBgPattern] = useState(PRESETS_BG[0].value)
    const [overlayOpacity, setOverlayOpacity] = useState(10) // 0-100
    const [logoSize, setLogoSize] = useState(80) // %
    const [logoRadius, setLogoRadius] = useState(50) // %

    // --- Effects ---

    // Load from LocalStorage
    useEffect(() => {
        const saved = localStorage.getItem("khata_card_studio")
        if (saved) {
            try {
                const data = JSON.parse(saved)
                setShopName(data.shopName || shopName)
                setOwnerName(data.ownerName || ownerName)
                setPhone(data.phone || phone)
                setEmail(data.email || email)
                setPurpose(data.purpose || "professional")
                toast("Session Restored")
            } catch (e) { console.error("Failed to load save", e) }
        }
    }, [])

    // Auto-Save
    useEffect(() => {
        const data = { shopName, ownerName, phone, email, purpose }
        localStorage.setItem("khata_card_studio", JSON.stringify(data))
    }, [shopName, ownerName, phone, email, purpose])

    // Reset layout on purpose switch
    useEffect(() => { setLayout("layout1") }, [purpose])

    // --- Helpers ---

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader()
            reader.onload = (e) => setLogo(e.target?.result as string)
            reader.readAsDataURL(e.target.files[0])
        }
    }

    const activeColor = customColor || palette.primary
    const activeText = customColor ? "#ffffff" : palette.text
    const activeBg = customColor ? `${customColor}10` : palette.bg

    const handleRandomize = () => {
        const randomPalette = PALETTES[Math.floor(Math.random() * PALETTES.length)]
        const randomFont = Object.keys(FONTS)[Math.floor(Math.random() * 3)] as FontStyle
        let maxLayout = 8 // Increased for all categories
        const randomLayout = `layout${Math.floor(Math.random() * maxLayout) + 1}`

        setPalette(randomPalette)
        setCustomColor("")
        setFont(randomFont)
        setLayout(randomLayout)
        toast.success("Randomized style!")
    }

    const handleExport = async (format: 'png') => {
        if (!cardRef.current) return
        toast.loading("Rendering high-quality card...")
        try {
            await new Promise(resolve => setTimeout(resolve, 800)) // Wait for images
            const canvas = await html2canvas(cardRef.current, { scale: 4, backgroundColor: null, useCORS: true })
            const image = canvas.toDataURL("image/png")
            const link = document.createElement("a")
            link.href = image
            link.download = `card-${purpose}-${side}.png`
            link.click()
            toast.dismiss()
            toast.success("Downloaded!")
        } catch (err) {
            toast.error("Export failed.")
        }
    }

    // --- RENDERERS ---

    const BackgroundLayer = () => (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute inset-0" style={{ backgroundColor: activeBg }} />
            {bgPattern && (
                <div className="absolute inset-0 opacity-30"
                    style={{ backgroundImage: bgPattern, backgroundSize: "20px 20px" }} />
            )}
            {bgImage && (
                <div className="absolute inset-0 bg-cover bg-center mix-blend-overlay"
                    style={{ backgroundImage: `url(${bgImage})`, opacity: overlayOpacity / 100 }} />
            )}
        </div>
    )

    // ==========================================
    // PROFESSIONAL TEMPLATES (1-8)
    // ==========================================
    const ProfessionalCard = () => (
        <div className={cn("w-full h-full relative overflow-hidden flex", FONTS[font], layout === "layout2" ? "border-4 border-black" : "")} style={{ color: palette.text }}>

            {/* ... Existing Layouts 1-6 ... */}
            {layout === "layout1" && ( /* High-End Split */
                <>
                    <div className="w-[38%] h-full p-8 flex flex-col items-center justify-center text-center relative z-10" style={{ backgroundColor: activeColor, color: "#fff" }}>
                        <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
                        <div className="flex items-center justify-center mb-6 overflow-hidden bg-white shadow-2xl transition-transform hover:scale-105" style={{ width: `${logoSize}px`, height: `${logoSize}px`, borderRadius: `${logoRadius}%` }}> {logo ? <img src={logo} className="w-full h-full object-cover" /> : <Store size={32} className="text-zinc-900" />} </div>
                        <h3 className="font-black text-xs uppercase tracking-[0.2em] leading-tight mb-2">{shopName}</h3>
                        <div className="w-6 h-0.5 bg-white/40 mb-2" />
                        <p className="text-[8px] font-bold opacity-70 uppercase tracking-[0.3em]">{tagline}</p>
                    </div>
                    <div className="flex-1 p-10 flex flex-col justify-between bg-white relative z-10">
                        <BackgroundLayer />
                        <div className="relative z-10">
                            <h2 className="text-3xl font-black tracking-tighter uppercase italic mb-1" style={{ color: "#000" }}>{ownerName}</h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 text-zinc-400">Chief Executive</p>
                            <div className="space-y-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                <div className="flex items-center gap-4"><div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeColor }} /> {phone}</div>
                                <div className="flex items-center gap-4"><div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeColor }} /> {email}</div>
                                <div className="flex items-center gap-4"><div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeColor }} /> {address}</div>
                            </div>
                        </div>
                        {showQr && <div className="absolute bottom-8 right-8 grayscale opacity-20"><QRCode value={qrValue} size={64} /></div>}
                    </div>
                </>
            )}

            {layout === "layout2" && ( /* Matrix Tech Grid */
                <div className="w-full h-full p-8 bg-zinc-950 text-white relative flex flex-col justify-between overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_14px]" />
                    <div className="flex justify-between items-start relative z-10">
                        <div className="space-y-2">
                            <h1 className="text-2xl font-black italic uppercase tracking-tighter leading-none">{shopName}</h1>
                            <div className="h-0.5 w-12" style={{ backgroundColor: activeColor }} />
                        </div>
                        <div className="text-[9px] font-mono text-zinc-500 border border-zinc-800 px-2 py-1 uppercase">ID: KH-8820</div>
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-5xl font-black tracking-tighter uppercase leading-[0.8] mb-4 overflow-hidden">{ownerName.split(' ')[0]}<br /><span className="text-transparent" style={{ WebkitTextStroke: "1px rgba(255,255,255,0.3)" }}>{ownerName.split(' ')[1]}</span></h2>
                        <div className="flex gap-8 text-[9px] font-mono text-zinc-400 uppercase tracking-widest">
                            <div className="flex flex-col gap-1"><span>TEL: {phone}</span><span>EML: {email}</span></div>
                            <div className="flex flex-col gap-1"><span>LOC: {address.split(',')[0]}</span><span>WEB: {website.replace('www.', '')}</span></div>
                        </div>
                    </div>
                </div>
            )}

            {layout === "layout3" && ( /* Boutique Ivory */
                <div className="w-full h-full p-12 bg-[#faf9f6] text-zinc-900 border border-zinc-200 relative overflow-hidden flex flex-col items-center justify-between text-center">
                    <div className="absolute top-0 left-0 w-24 h-24 border-t-2 border-l-2 m-4 opacity-20" style={{ borderColor: activeColor }} />
                    <div className="absolute bottom-0 right-0 w-24 h-24 border-b-2 border-r-2 m-4 opacity-20" style={{ borderColor: activeColor }} />
                    <div className="relative z-10">
                        <h1 className="font-serif italic text-4xl mb-2">{ownerName}</h1>
                        <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-zinc-400 mb-8">{shopName}</p>
                    </div>
                    <div className="relative z-10 w-full max-w-xs h-px bg-zinc-200 mb-8" />
                    <div className="relative z-10 flex flex-col gap-2 text-[10px] font-medium tracking-widest text-zinc-500 uppercase">
                        <span>{phone} • {email}</span>
                        <span className="opacity-60">{address}</span>
                    </div>
                </div>
            )}

            {layout === "layout4" && ( /* Obsidian Gold */
                <div className="w-full h-full p-10 bg-black text-white relative overflow-hidden flex items-center justify-between">
                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-zinc-800/10 to-transparent pointer-events-none" />
                    <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-[100px] opacity-20" style={{ backgroundColor: activeColor }} />
                    <div className="relative z-10">
                        <div className="w-16 h-px mb-6" style={{ backgroundColor: activeColor }} />
                        <h1 className="text-4xl font-serif mb-2 tracking-tight">{ownerName}</h1>
                        <p className="text-[11px] font-black uppercase tracking-[0.4em] opacity-40 mb-12">{tagline}</p>
                        <div className="space-y-2 text-[10px] font-mono opacity-60">
                            <p className="flex items-center gap-2">P // {phone}</p>
                            <p className="flex items-center gap-2">E // {email}</p>
                        </div>
                    </div>
                    <div className="relative z-10">
                        <div className="w-24 h-24 border border-zinc-800 rounded-full p-6 backdrop-blur-sm flex items-center justify-center">
                            {logo ? <img src={logo} className="w-full h-full object-contain brightness-0 invert" /> : <Gem size={32} className="opacity-20" />}
                        </div>
                    </div>
                </div>
            )}

            {layout === "layout5" && ( /* Minimal Gallery */
                <div className="w-full h-full bg-white flex flex-col relative">
                    <div className="h-[70%] w-full bg-zinc-50 border-b border-zinc-100 p-12 flex flex-col justify-center">
                        <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">{ownerName}</h1>
                        <p className="text-xs font-bold uppercase tracking-[0.5em] text-zinc-300">{shopName}</p>
                    </div>
                    <div className="flex-1 p-8 flex items-center justify-between bg-white px-12">
                        <div className="text-[9px] font-black uppercase tracking-widest leading-loose text-zinc-400">
                            {phone} <br /> {email}
                        </div>
                        <div className="h-8 w-8 rounded-full border border-zinc-900 flex items-center justify-center p-2" style={{ borderColor: activeColor }}>
                            <ArrowRight size={14} style={{ color: activeColor }} />
                        </div>
                    </div>
                </div>
            )}

            {layout === "layout6" && ( /* Modernist Swiss */
                <div className="w-full h-full grid grid-cols-[1fr,250px] bg-white border border-zinc-100">
                    <div className="p-10 flex flex-col justify-between">
                        <div className="space-y-1">
                            {ownerName.split(' ').map((name, i) => (
                                <h1 key={i} className="text-5xl font-black italic tracking-tighter leading-[0.8] overflow-hidden">{name}</h1>
                            ))}
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] space-y-2 text-zinc-900">
                            <div className="flex items-center gap-2"><Smartphone size={12} strokeWidth={3} /> {phone}</div>
                            <div className="flex items-center gap-2"><Mail size={12} strokeWidth={3} /> {email}</div>
                        </div>
                    </div>
                    <div className="p-10 flex flex-col justify-between text-white border-l border-zinc-100" style={{ backgroundColor: activeColor }}>
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center">
                            {logo ? <img src={logo} className="w-full h-full object-cover p-2" /> : <Store size={32} />}
                        </div>
                        <div>
                            <h2 className="text-lg font-black uppercase tracking-tighter leading-tight italic">{shopName}</h2>
                            <p className="text-[8px] font-bold opacity-70 uppercase tracking-widest mt-1">{tagline}</p>
                        </div>
                    </div>
                </div>
            )}

            {layout === "layout7" && ( /* Architectural Ledger */
                <div className="w-full h-full bg-[#f4f4f5] text-zinc-900 p-8 relative flex flex-col justify-between border-t-8 border-zinc-900">
                    <div className="absolute top-0 right-0 p-8 text-[60px] font-black opacity-[0.03] leading-none select-none">DESIGN // 01</div>
                    <div className="flex justify-between items-start pt-4 border-t border-zinc-300">
                        <div><h1 className="text-xl font-black uppercase tracking-tighter italic">{shopName}</h1></div>
                        <div className="text-[9px] font-black uppercase tracking-widest">K.PLUS STUDIO</div>
                    </div>
                    <div className="flex justify-between items-end">
                        <div>
                            <h2 className="text-3xl font-black tracking-tighter italic uppercase mb-2">{ownerName}</h2>
                            <div className="flex gap-6 text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                                <span>{phone}</span> <span>{email}</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 grayscale opacity-20"><QRCode value={qrValue} size={48} /></div>
                    </div>
                </div>
            )}

            {layout === "layout8" && ( /* Heritage Card */
                <div className="w-full h-full bg-[#fdfbf7] p-12 flex flex-col items-center justify-center text-center relative border border-zinc-200">
                    <div className="absolute inset-4 border border-zinc-200 pointer-events-none" />
                    <div className="relative z-10 mb-6">
                        {logo ? <img src={logo} className="w-16 h-16 object-contain grayscale" /> : <Building size={48} className="text-zinc-300" />}
                    </div>
                    <h1 className="font-serif italic text-3xl text-zinc-800 mb-1">{shopName}</h1>
                    <div className="w-8 h-px bg-zinc-300 my-4" />
                    <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 mb-2">{ownerName}</h2>
                    <p className="font-mono text-[8px] uppercase tracking-widest text-zinc-400">{phone} — {email}</p>
                </div>
            )}

        </div>
    )

    // ==========================================
    // SOCIAL TEMPLATES (1-8)
    // ==========================================
    const SocialCard = () => (
        <div className={cn("w-full h-full relative overflow-hidden flex flex-col", FONTS[font])} style={{ color: palette.text }}>
            {/* Same as before for Layouts 1-6 */}
            {layout === "layout1" && (<div className="w-full h-full flex flex-col items-center justify-center text-center p-8 relative"> <div className="absolute inset-0 z-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" style={{ background: customColor ? `linear-gradient(135deg, ${customColor}, #000)` : undefined }} /> <div className="relative z-10 text-white w-full"> <div className="w-24 h-24 mx-auto mb-4 rounded-full border-4 border-white/30 p-1 shadow-2xl"> <div className="w-full h-full rounded-full overflow-hidden bg-white/10 backdrop-blur-md"> {logo ? <img src={logo} className="w-full h-full object-cover" /> : <User className="w-full h-full p-4" />} </div> </div> <h2 className="text-3xl font-black tracking-tight drop-shadow-md">{handle}</h2> <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold mt-2 border border-white/20"> {platform} Creator </div> </div> </div>)}
            {layout === "layout2" && (<div className="w-full h-full bg-black text-white p-6 flex items-end justify-between relative overflow-hidden font-mono"> <div className="relative z-10 w-full"> <h1 className="text-5xl font-bold uppercase tracking-tighter mix-blend-difference" style={{ textShadow: "2px 2px 0px #ff00ff, -2px -2px 0px #00ff00" }}>{handle}</h1> <p className="text-xs text-green-400 mt-2 font-mono">&gt; STATUS: ONLINE</p> </div> </div>)}
            {layout === "layout3" && (<div className="w-full h-full bg-[#fdfaf6] p-8 flex items-center gap-6 relative"> <div className="flex-1"> <h2 className="text-xl font-serif font-black text-green-900">{handle}</h2> <p className="text-xs text-orange-800 italic mt-1 font-serif">{bio}</p> </div> </div>)}
            {layout === "layout4" && (<div className="w-full h-full bg-zinc-900 border-2 border-purple-500 relative flex items-center p-6 text-white overflow-hidden"> <div className="relative z-10 flex items-center gap-4 w-full"> <div className="w-20 h-20 bg-black border-2 border-green-400 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(74,222,128,0.5)]"> {logo ? <img src={logo} className="w-full h-full object-cover" /> : <Gamepad size={32} className="text-green-400" />} </div> <div> <h1 className="text-2xl font-bold italic uppercase">{handle}</h1> </div> </div> </div>)}
            {layout === "layout5" && (<div className="w-full h-full p-6 flex flex-col justify-end relative bg-stone-100"> <div className="relative z-10 border-l-4 pl-4" style={{ borderColor: activeColor }}> <h1 className="text-3xl font-serif italic text-zinc-800">{handle}</h1> <p className="text-xs text-zinc-500 mt-1">Digital Artist & Illustrator</p> </div> </div>)}
            {layout === "layout6" && (<div className="w-full h-full relative text-white"> <div className="absolute inset-0 bg-zinc-800 bg-cover bg-center" style={{ backgroundImage: logo ? `url(${logo})` : undefined, filter: logo ? "brightness(0.7)" : "none" }}> {!logo && <div className="w-full h-full flex items-center justify-center text-zinc-600"><p>Upload Logo as BG</p></div>} </div> <div className="absolute bottom-0 left-0 w-full p-6 pt-12 bg-gradient-to-t from-black/90 to-transparent"> <h1 className="text-2xl font-bold">{handle}</h1> <p className="text-xs opacity-90">{bio}</p> </div> </div>)}

            {/* NEW TEMPLATES */}
            {layout === "layout7" && ( /* Polaroid Style */
                <div className="w-full h-full bg-zinc-100 p-6 flex items-center justify-center rotate-3 scale-95">
                    <div className="bg-white p-3 pb-8 shadow-xl w-64 rotate-[-3deg] transform hover:rotate-0 transition-transform duration-500">
                        <div className="aspect-square bg-zinc-200 overflow-hidden mb-3 grayscale hover:grayscale-0 transition-all">
                            {logo ? <img src={logo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-zinc-300"><Camera /></div>}
                        </div>
                        <h2 className="font-handwriting text-center text-lg font-bold text-zinc-800 transform -rotate-1" style={{ fontFamily: 'cursive' }}>{handle}</h2>
                    </div>
                </div>
            )}

            {layout === "layout8" && ( /* 3D Depth */
                <div className="w-full h-full bg-zinc-900 flex items-center justify-center perspective-1000">
                    <div className="relative transform rotate-y-12 rotate-x-12 hover:rotate-0 transition-transform duration-500 p-8 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl text-center">
                        <div className="mb-4 text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">
                            {handle}
                        </div>
                        <p className="text-white/60 text-xs font-light tracking-widest uppercase">{platform}</p>
                    </div>
                </div>
            )}
        </div>
    )

    // ==========================================
    // COMMERCE TEMPLATES (1-8)
    // ==========================================
    const CommerceCard = () => (
        <div className={cn("w-full h-full relative overflow-hidden", FONTS[font])} style={{ backgroundColor: activeBg, color: palette.text }}>
            <BackgroundLayer />
            {/* Existing 1-4 */}
            {layout === "layout1" && (<div className="w-full h-full p-4 flex items-center relative z-10"> <div className="w-full border-2 border-dashed border-current rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2 bg-white/80 backdrop-blur-sm"> <h3 className="text-xs font-bold uppercase tracking-widest">{shopName}</h3> <h1 className="text-4xl font-black tracking-tight" style={{ color: activeColor }}>{offerCode}</h1> <div className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold">{offerTitle}</div> </div> </div>)}
            {layout === "layout2" && (<div className="w-full h-full flex bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 relative border-4 border-yellow-600"> <div className="w-[70%] h-full p-6 flex flex-col justify-center border-r-2 border-dotted border-yellow-700"> <h2 className="text-xl font-serif font-bold text-yellow-900 italic">{offerTitle}</h2> <h1 className="text-3xl font-black text-yellow-950 mt-1">{offerCode}</h1> </div> </div>)}
            {layout === "layout3" && (<div className="w-full h-full p-6 rounded-xl relative overflow-hidden text-white flex flex-col justify-between" style={{ backgroundColor: activeColor }}> <div className="flex justify-between items-start"> <h3 className="font-bold opacity-80">{shopName}</h3> <CreditCard className="opacity-50" /> </div> <h1 className="text-2xl font-bold tracking-widest">{offerCode}</h1> <div className="flex justify-between items-end text-[10px] font-mono opacity-80"> <span>{expiry}</span> <span>${offerTitle}</span> </div> </div>)}
            {layout === "layout4" && (<div className="w-full h-full bg-white p-4 font-mono text-xs flex flex-col items-center justify-center text-center shadow-inner relative"> <p className="mb-2 uppercase">*** {shopName} ***</p> <div className="w-full border-b border-dashed border-zinc-300 my-2" /> <h1 className="text-2xl font-bold my-2">{offerTitle}</h1> <div className="border border-black px-4 py-1 font-bold text-lg my-2">{offerCode}</div> </div>)}

            {/* NEW TEMPLATES */}
            {layout === "layout5" && ( /* Loyalty Card */
                <div className="w-full h-full bg-white p-6 relative">
                    <div className="mb-4">
                        <h2 className="font-bold uppercase tracking-tight text-lg" style={{ color: activeColor }}>{shopName}</h2>
                        <p className="text-[9px] font-bold text-zinc-400 uppercase">Loyalty Club</p>
                    </div>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(n => (
                            <div key={n} className="flex-1 aspect-square rounded-full border-2 border-zinc-200 flex items-center justify-center">
                                {n <= 3 ? <Heart size={14} className="fill-current" style={{ color: activeColor }} /> : <span className="text-[10px] font-bold text-zinc-300">{n}</span>}
                            </div>
                        ))}
                    </div>
                    <p className="text-[9px] text-zinc-400 mt-4 text-center">Buy 5 Get 1 Free</p>
                </div>
            )}

            {layout === "layout6" && ( /* Flash Sale */
                <div className="w-full h-full bg-red-600 text-white flex flex-col items-center justify-center p-4 text-center overflow-hidden relative">
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_20px)] opacity-10" />
                    <Zap size={48} className="mb-2 animate-pulse" />
                    <h1 className="text-5xl font-black italic uppercase -rotate-2">{offerTitle}</h1>
                    <div className="bg-yellow-400 text-black font-bold uppercase text-xs px-2 py-1 mt-2 -rotate-2">Limited Time Only</div>
                </div>
            )}

            {layout === "layout7" && ( /* Minimal Barcode */
                <div className="w-full h-full bg-white p-8 flex flex-col justify-between items-start border-l-8" style={{ borderColor: activeColor }}>
                    <h1 className="text-3xl font-light">{offerCode}</h1>
                    <div className="w-full">
                        <div className="h-12 w-full bg-black mask-image" style={{ maskImage: "linear-gradient(90deg, transparent 5%, black 5%, black 10%, transparent 10%, black 15%, black 30%, transparent 30%, black 35%, black 90%)" }} />
                        <p className="text-[9px] font-mono mt-1 text-center w-full tracking-widest">{offerCode}</p>
                    </div>
                </div>
            )}

            {layout === "layout8" && ( /* Sticker Style */
                <div className="w-full h-full bg-zinc-100 flex items-center justify-center p-6">
                    <div className="bg-white rounded-full p-8 border-4 border-dashed border-zinc-300 shadow-xl transform rotate-12 flex flex-col items-center justify-center text-center aspect-square w-48">
                        <h2 className="text-3xl font-black text-emerald-500">{offerTitle}</h2>
                        <p className="font-bold text-xs uppercase">{shopName}</p>
                    </div>
                </div>
            )}
        </div>
    )

    // ==========================================
    // EVENT TEMPLATES (1-8)
    // ==========================================
    const EventCard = () => (
        <div className={cn("w-full h-full relative overflow-hidden flex", FONTS[font], layout === "layout1" ? "bg-zinc-900 text-white" : "text-zinc-900")}>
            {/* Existing 1-4 */}
            {layout === "layout1" && (<> <div className="w-[70%] h-full p-6 flex flex-col justify-center border-r border-dashed border-white/20 relative z-10"> <p className="text-xs text-emerald-400 font-mono mb-2 uppercase">ADMIT ONE</p> <h1 className="text-3xl font-black uppercase leading-none mb-1">{eventTitle}</h1> <p className="text-xs opacity-70">{shopName}</p> </div> <div className="w-[30%] h-full flex flex-col items-center justify-center p-2 relative z-10 bg-black/20"> <span className="-rotate-90 whitespace-nowrap text-[8px] font-mono opacity-50 tracking-widest">NO REFUNDS</span> </div> </>)}
            {layout === "layout2" && (<div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-[#fffcf5] relative border p-4"> <div className="w-full h-full border border-black/20 flex flex-col items-center justify-center p-4"> <h3 className="text-xs uppercase tracking-[0.2em] mb-4 text-zinc-500">You Are Invited</h3> <h1 className="text-3xl font-serif italic mb-2 text-zinc-800">{eventTitle}</h1> <p className="font-medium text-sm">{eventDate}</p> </div> </div>)}
            {layout === "layout3" && (<div className="w-full h-full bg-white flex flex-col items-center pt-8 relative shadow-lg"> <div className="absolute top-2 w-12 h-2 rounded-full bg-zinc-200" /> <div className="relative z-10 text-center w-full px-6"> <h1 className="text-2xl font-bold uppercase mt-4">{eventTitle}</h1> <h2 className="font-bold text-lg">{ownerName}</h2> </div> </div>)}
            {layout === "layout4" && (<div className="w-full h-full bg-pink-500 text-white relative flex overflow-hidden"> <div className="relative z-10 p-6 flex flex-col justify-center w-2/3 bg-white/10 backdrop-blur-sm h-full skew-x-[-10deg] ml-[-20px] pl-10"> <div className="skew-x-[10deg]"> <h1 className="text-4xl font-black uppercase leading-[0.8]">{eventTitle.split(' ').map(w => <span key={w} className="block">{w}</span>)}</h1> </div> </div> </div>)}

            {/* NEW TEMPLATES */}
            {layout === "layout5" && ( /* Boarding Pass */
                <div className="w-full h-full bg-zinc-50 flex border-t-8" style={{ borderColor: activeColor }}>
                    <div className="flex-1 p-6 flex flex-col justify-between">
                        <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase"><span>Flight</span><span>Class</span></div>
                        <div className="flex justify-between font-mono text-lg font-bold"><span>KP-88</span><span>First</span></div>
                        <div className="flex justify-between items-center mt-4">
                            <div><h1 className="text-2xl font-black">{eventLoc.substring(0, 3).toUpperCase()}</h1><p className="text-[10px] text-zinc-400">FROM</p></div>
                            <Plane className="text-zinc-300" />
                            <div className="text-right"><h1 className="text-2xl font-black">{eventTitle.substring(0, 3).toUpperCase()}</h1><p className="text-[10px] text-zinc-400">TO</p></div>
                        </div>
                    </div>
                    <div className="w-12 border-l-2 border-dashed border-zinc-200 bg-white flex items-center justify-center">
                        {showQr && <div className="-rotate-90"><QRCode value={qrValue} size={32} /></div>}
                    </div>
                </div>
            )}

            {layout === "layout6" && ( /* Calendar Save The Date */
                <div className="w-full h-full bg-white p-6 flex items-center gap-6">
                    <div className="w-1/3 aspect-square bg-red-50 rounded-xl flex flex-col items-center justify-center border border-red-100 text-red-600">
                        <span className="text-xs font-bold uppercase">AUG</span>
                        <span className="text-3xl font-black">15</span>
                    </div>
                    <div className="flex-1">
                        <h2 className="font-serif italic text-xl text-zinc-800">Save the Date</h2>
                        <h1 className="font-bold uppercase tracking-tight text-zinc-900">{eventTitle}</h1>
                        <p className="text-xs text-zinc-500 mt-2">{eventLoc}</p>
                    </div>
                </div>
            )}

            {layout === "layout7" && ( /* Movie Ticket */
                <div className="w-full h-full bg-zinc-900 text-yellow-500 p-4 border-y-4 border-dashed border-zinc-800 flex flex-col items-center justify-center text-center font-mono relative">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
                    <Film size={32} className="mb-2 opacity-50" />
                    <h1 className="text-xl font-bold uppercase tracking-widest border-b border-yellow-500/50 pb-2 mb-2">{eventTitle}</h1>
                    <div className="flex gap-4 text-xs font-bold">
                        <span>ROW A</span>
                        <span>SEAT 12</span>
                    </div>
                </div>
            )}

            {layout === "layout8" && ( /* Gift Certificate */
                <div className="w-full h-full bg-[#fdfdfd] border p-6 flex items-center gap-4 shadow-inner">
                    <Gift size={48} style={{ color: activeColor }} />
                    <div>
                        <h3 className="font-serif italic text-zinc-400">Gift Certificate</h3>
                        <h1 className="font-bold text-xl">{eventTitle}</h1>
                        <p className="text-[10px] font-mono mt-1 text-zinc-400">CODE: {offerCode}</p>
                    </div>
                </div>
            )}
        </div>
    )


    // --- EDITOR UI START ---
    return (
        <div className="w-full h-full pt-16 flex bg-transparent relative z-10">

            {/* 1. SIDEBAR NAV - SLEEK TOOL SHELF */}
            <div className="w-24 bg-black/40 backdrop-blur-3xl border-r border-white/5 flex flex-col items-center py-8 gap-10">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(16,185,129,0.3)] group cursor-help relative">
                    <Wand2 className="text-white group-hover:rotate-12 transition-transform" size={24} />
                    <div className="absolute left-full ml-4 px-3 py-1 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded hidden group-hover:block whitespace-nowrap z-50">Studio Core v4</div>
                </div>

                <div className="flex flex-col gap-6">
                    {PURPOSES.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setPurpose(p.id)}
                            className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-all relative group",
                                purpose === p.id
                                    ? "bg-white text-black shadow-[0_15px_30px_-10px_rgba(255,255,255,0.3)] scale-110"
                                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5")}
                        >
                            <p.icon size={22} strokeWidth={purpose === p.id ? 2.5 : 2} />
                            {purpose === p.id && <div className="absolute left-0 w-1 h-6 bg-emerald-500 rounded-r-full" />}
                            <div className="absolute left-full ml-4 px-3 py-1 bg-zinc-900 text-zinc-400 text-[10px] font-black uppercase tracking-widest rounded hidden group-hover:block whitespace-nowrap z-50 border border-zinc-800 shadow-xl">{p.label}</div>
                        </button>
                    ))}
                </div>

                <div className="mt-auto pb-8 flex flex-col gap-6 items-center">
                    <button
                        onClick={handleRandomize}
                        className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-emerald-500 transition-all group"
                        title="Randomize Style"
                    >
                        <RotateCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                    </button>
                </div>
            </div>

            {/* 2. MAIN PANEL (Split View) */}
            <div className="flex-1 flex flex-col lg:flex-row relative">

                {/* 2A. EDITOR (Left Side) */}
                <div className="w-full lg:w-[450px] xl:w-[500px] bg-black/60 backdrop-blur-2xl border-r border-white/5 flex flex-col animate-in slide-in-from-left duration-700">
                    <div className="p-8 border-b border-white/5 flex items-center justify-between">
                        <div>
                            <h2 className="text-white font-black text-2xl tracking-tighter uppercase italic">{PURPOSES.find(p => p.id === purpose)?.label}</h2>
                            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">{PURPOSES.find(p => p.id === purpose)?.desc}</p>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase tracking-widest">Live Editor</div>
                    </div>

                    <ScrollArea className="flex-1 px-8 py-10">
                        <div className="space-y-12">

                            {/* SECTION: IDENTITY */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-px bg-emerald-500/50" />
                                    <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Core Identity</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Brand Name</Label>
                                        <Input value={shopName} onChange={(e) => setShopName(e.target.value)} className="bg-zinc-900/50 border-zinc-800 text-white h-12 focus:ring-emerald-500/20 focus:border-emerald-500/40 rounded-xl" placeholder="KhataPlus Retail" />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        {purpose === 'professional' && (
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Member Name</Label>
                                                <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className="bg-zinc-900/50 border-zinc-800 text-white h-12 rounded-xl" placeholder="Full Name" />
                                            </div>
                                        )}
                                        {purpose === 'social' && (
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Handle</Label>
                                                <Input value={handle} onChange={(e) => setHandle(e.target.value)} className="bg-zinc-900/50 border-zinc-800 text-white h-12 rounded-xl font-bold" placeholder="@username" />
                                            </div>
                                        )}
                                        {purpose === 'commerce' && (
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Promo Code</Label>
                                                <Input value={offerCode} onChange={(e) => setOfferCode(e.target.value)} className="bg-zinc-900/50 border-zinc-800 text-white h-12 rounded-xl font-mono" placeholder="SALE50" />
                                            </div>
                                        )}
                                        {purpose === 'event' && (
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Event Name</Label>
                                                <Input value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} className="bg-zinc-900/50 border-zinc-800 text-white h-12 rounded-xl" placeholder="Grand Opening" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {purpose === 'professional' && <>
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Phone</Label>
                                                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-zinc-900/50 border-zinc-800 text-white h-12 rounded-xl" placeholder="+91" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Email</Label>
                                                <Input value={email} onChange={(e) => setEmail(e.target.value)} className="bg-zinc-900/50 border-zinc-800 text-white h-12 rounded-xl" placeholder="Email" />
                                            </div>
                                        </>}
                                        {purpose === 'social' && <>
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Platform</Label>
                                                <Input value={platform} onChange={(e) => setPlatform(e.target.value)} className="bg-zinc-900/50 border-zinc-800 text-white h-12 rounded-xl" placeholder="e.g. Instagram" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Bio</Label>
                                                <Input value={bio} onChange={(e) => setBio(e.target.value)} className="bg-zinc-900/50 border-zinc-800 text-white h-12 rounded-xl" placeholder="Creator" />
                                            </div>
                                        </>}
                                    </div>
                                </div>
                            </div>

                            {/* SECTION: TEMPLATE SELECTION */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-px bg-emerald-500/50" />
                                    <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Signature Layouts</h3>
                                </div>
                                <div className="grid grid-cols-4 gap-3">
                                    {Array.from({ length: 8 }, (_, i) => i + 1).map(i => (
                                        <button
                                            key={i}
                                            onClick={() => setLayout(`layout${i}`)}
                                            className={cn("aspect-square rounded-2xl border-2 flex flex-col items-center justify-center transition-all group relative overflow-hidden",
                                                layout === `layout${i}`
                                                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                                                    : "border-zinc-800 bg-zinc-900/50 text-zinc-600 hover:border-zinc-700 hover:bg-zinc-800")}
                                        >
                                            <span className="text-xl font-black italic tracking-tighter">{i}</span>
                                            {layout === `layout${i}` && <div className="absolute inset-0 border-4 border-emerald-500/20 blur-sm pointer-events-none" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* SECTION: FINISH & BRANDING */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-px bg-emerald-500/50" />
                                    <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Brand Finish</h3>
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <Label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Signature Palettes</Label>
                                        <div className="flex flex-wrap gap-3">
                                            {PALETTES.map(p => (
                                                <button
                                                    key={p.name}
                                                    onClick={() => { setPalette(p); setCustomColor("") }}
                                                    className={cn("w-10 h-10 rounded-full border-2 transition-all hover:scale-110 relative group",
                                                        palette.name === p.name && !customColor ? "border-white shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-110" : "border-zinc-800")}
                                                    style={{ backgroundColor: p.primary }}
                                                >
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 border border-zinc-800 text-[8px] font-bold text-zinc-400 whitespace-nowrap rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">{p.name}</div>
                                                </button>
                                            ))}
                                            <div className="w-10 h-10 rounded-full border-2 border-zinc-800 flex items-center justify-center overflow-hidden relative group hover:border-zinc-600">
                                                <div className="absolute inset-0 bg-[conic-gradient(from_0deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)]" />
                                                <Input type="color" className="absolute opacity-0 w-full h-full cursor-pointer" onChange={(e) => setCustomColor(e.target.value)} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-white/5 space-y-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <Label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Brand Assets</Label>
                                            <div className="text-[8px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">SVG Supported</div>
                                        </div>
                                        <div className="relative group">
                                            <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 rounded-xl border border-dashed border-zinc-800 group-hover:border-emerald-500/30 transition-all flex items-center justify-center gap-3">
                                                <Upload size={16} className="text-zinc-500 group-hover:text-emerald-500" />
                                                <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-400 uppercase tracking-widest">{logo ? 'Replace Logo' : 'Drop Logo Here'}</span>
                                            </div>
                                            <Input type="file" onChange={handleLogoUpload} className="relative z-10 w-full h-12 opacity-0 cursor-pointer" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>

                    {/* BOTTOM ACTION BAR */}
                    <div className="p-8 border-t border-white/5 bg-black/40 backdrop-blur-3xl flex gap-4">
                        <Button
                            className="flex-1 h-14 bg-white text-black hover:bg-zinc-200 rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] transition-all shadow-[0_20px_40px_-15px_rgba(255,255,255,0.2)] group overflow-hidden"
                            onClick={() => handleExport('png')}
                        >
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                            <Download size={18} className="mr-3" />
                            Download Asset
                        </Button>
                    </div>
                </div>

                {/* 2B. PREVIEW (Right Side Canvas) */}
                <div className="flex-1 bg-transparent relative overflow-hidden flex items-center justify-center p-8 lg:p-24 overflow-y-auto">
                    {/* Atmospheric Lighting Behind the Card */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 blur-[180px] rounded-full pointer-events-none mix-blend-screen opacity-50" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none mix-blend-screen opacity-30" />

                    {/* Industrial Texture Layer */}
                    <div className="absolute inset-0 opacity-[0.2] pointer-events-none mix-blend-overlay"
                        style={{ backgroundImage: "radial-gradient(#333 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

                    {/* Card Container - Suspended in Space */}
                    <div className="relative group perspective-1000 w-full max-w-[650px]">
                        <div
                            ref={cardRef}
                            className="relative w-full aspect-[1.75/1] bg-white text-black shadow-[0_50px_100px_-30px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden animate-in fade-in zoom-in duration-1000 transform hover:scale-[1.02] transition-transform duration-700"
                        >
                            {purpose === 'professional' && <ProfessionalCard />}
                            {purpose === 'social' && <SocialCard />}
                            {purpose === 'commerce' && <CommerceCard />}
                            {purpose === 'event' && <EventCard />}
                        </div>

                        {/* Shadow Reflection */}
                        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-[80%] h-12 bg-black/60 blur-[30px] rounded-full opacity-20 pointer-events-none" />
                    </div>

                    {/* Context Hints */}
                    <div className="absolute bottom-12 inset-x-0 flex justify-center gap-12 text-zinc-500 text-[9px] font-black uppercase tracking-[0.4em] opacity-40">
                        <span className="flex items-center gap-2"><Layers size={12} /> CMYK Optimized</span>
                        <span className="flex items-center gap-2"><Printer size={12} /> 300 DPI Rendering</span>
                        <span className="flex items-center gap-2"><Share2 size={12} /> High-Res Vectoring</span>
                    </div>
                </div>

            </div>
        </div>
    )
}
