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
    Coffee, Film, Gift
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
    { id: 'professional', label: 'Pro', icon: Briefcase, desc: 'Business' },
    { id: 'social', label: 'Creator', icon: Camera, desc: 'Social' },
    { id: 'commerce', label: 'Shop', icon: ShoppingBag, desc: 'Offers' },
    { id: 'event', label: 'Event', icon: Calendar, desc: 'Invites' },
]

const PALETTES = [
    { name: "Emerald City", primary: "#10b981", text: "#064e3b", bg: "#ecfdf5" },
    { name: "Royal Blue", primary: "#2563eb", text: "#1e3a8a", bg: "#eff6ff" },
    { name: "Midnight Gold", primary: "#fbbf24", text: "#fffbeb", bg: "#18181b" },
    { name: "Crimson Red", primary: "#dc2626", text: "#7f1d1d", bg: "#fef2f2" },
    { name: "Slate Minimal", primary: "#475569", text: "#0f172a", bg: "#f8fafc" },
    { name: "Violet Vibes", primary: "#8b5cf6", text: "#4c1d95", bg: "#f5f3ff" },
    { name: "Barbie Pink", primary: "#db2777", text: "#831843", bg: "#fdf2f8" },
    { name: "Forest Dark", primary: "#22c55e", text: "#f0fdf4", bg: "#052e16" },
    { name: "Cyber Black", primary: "#00ff9d", text: "#ffffff", bg: "#000000" },
    { name: "Luxury Gold", primary: "#d4af37", text: "#ffffff", bg: "#1a1a1a" },
    { name: "Cotton Candy", primary: "#f472b6", text: "#831843", bg: "#fff1f2" },
    { name: "Ocean Breeze", primary: "#0ea5e9", text: "#0c4a6e", bg: "#f0f9ff" },
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
            {layout === "layout1" && ( /* Modern Split */
                <>
                    <div className="w-[35%] h-full p-6 flex flex-col items-center justify-center text-center relative z-10" style={{ backgroundColor: activeColor, color: "#fff" }}>
                        <div className="flex items-center justify-center mb-4 overflow-hidden bg-white/20 backdrop-blur-sm shadow-inner" style={{ width: `${logoSize}px`, height: `${logoSize}px`, borderRadius: `${logoRadius}%` }}> {logo ? <img src={logo} className="w-full h-full object-cover" /> : <Store size={32} />} </div>
                        <h3 className="font-bold leading-tight text-shadow-sm">{shopName}</h3>
                        <p className="text-[10px] opacity-80 mt-1 uppercase tracking-wider">{tagline}</p>
                    </div>
                    <div className="flex-1 p-8 flex flex-col justify-center bg-white relative z-10">
                        <BackgroundLayer />
                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold uppercase" style={{ color: "#18181b" }}>{ownerName}</h2>
                            <p className="text-sm font-medium mb-6 opacity-60">Manager</p>
                            <div className="space-y-2 text-xs font-medium opacity-80">
                                <div className="flex items-center gap-3"><Smartphone size={14} style={{ color: activeColor }} /> {phone}</div>
                                <div className="flex items-center gap-3"><Mail size={14} style={{ color: activeColor }} /> {email}</div>
                                <div className="flex items-center gap-3"><MapPin size={14} style={{ color: activeColor }} /> {address}</div>
                            </div>
                        </div>
                        {showQr && <div className="absolute bottom-4 right-4 opacity-10 mix-blend-multiply"><QRCode value={qrValue} size={60} /></div>}
                    </div>
                </>
            )}

            {layout === "layout2" && ( /* Neo-Brutalism */
                <div className="w-full h-full p-6 bg-[#fffdf5] font-mono relative z-10">
                    <div className="w-full h-full border-4 border-black p-4 flex flex-col justify-between" style={{ boxShadow: "8px 8px 0px 0px rgba(0,0,0,1)" }}>
                        <div className="flex justify-between items-start border-b-4 border-black pb-2">
                            <div><h1 className="text-2xl font-black uppercase tracking-tighter">{shopName}</h1><p className="text-xs font-bold bg-black text-white inline-block px-1">{tagline}</p></div>
                            {logo && <img src={logo} className="w-10 h-10 object-contain border-2 border-black rounded-full" />}
                        </div>
                        <div className="space-y-1 text-sm font-bold"><p>CONTACT: {phone}</p><p>MAIL: {email}</p></div>
                        <div className="bg-black text-white p-2 text-center text-xs font-bold uppercase">{ownerName}</div>
                    </div>
                </div>
            )}

            {layout === "layout3" && ( /* Clean Minimal */
                <div className="w-full h-full p-8 flex flex-col justify-center bg-white relative">
                    <BackgroundLayer />
                    <div className="relative z-10 flex gap-6 items-center">
                        <div className="h-24 w-1 bg-zinc-900" style={{ backgroundColor: activeColor }} />
                        <div><h1 className="text-3xl font-light tracking-wide text-zinc-800">{ownerName}</h1><p className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-4">{shopName}</p><div className="flex gap-4 text-[10px] text-zinc-400 font-medium uppercase tracking-wider"><span>{phone}</span> • <span>{email}</span></div></div>
                    </div>
                </div>
            )}

            {layout === "layout4" && ( /* Dark Executive */
                <div className="w-full h-full p-8 flex items-center justify-between bg-zinc-900 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-black/50 to-transparent z-0" />
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full blur-3xl opacity-20" style={{ backgroundColor: activeColor }} />
                    <div className="relative z-10 space-y-4">
                        <div className="w-12 h-1 mb-6" style={{ backgroundColor: activeColor }} />
                        <h1 className="text-3xl font-serif">{ownerName}</h1>
                        <p className="text-xs opacity-60 tracking-widest uppercase">{tagline}</p>
                        <div className="pt-4 text-[10px] opacity-80 font-light space-y-1"><p>{phone}</p><p>{email}</p></div>
                    </div>
                    <div className="relative z-10 flex flex-col items-end gap-4">
                        {logo ? <img src={logo} className="w-16 h-16 object-contain filter brightness-0 invert opacity-80" /> : <Store className="w-12 h-12 opacity-50" />}
                    </div>
                </div>
            )}

            {layout === "layout5" && ( /* Centered Studio */
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-white border-[12px] border-double" style={{ borderColor: activeColor }}>
                    {logo && <img src={logo} className="w-14 h-14 object-contain mb-3" />}
                    <h1 className="text-2xl font-bold uppercase tracking-widest text-zinc-900">{shopName}</h1>
                    <div className="w-10 h-1 bg-black my-3 mx-auto" style={{ backgroundColor: activeColor }} />
                    <h2 className="text-lg font-medium text-zinc-600">{ownerName}</h2>
                </div>
            )}

            {layout === "layout6" && ( /* Geometric / Swiss */
                <div className="w-full h-full grid grid-cols-2 bg-white">
                    <div className="p-8 flex flex-col justify-between">
                        <h1 className="text-3xl font-bold leading-none">{ownerName.split(' ')[0]}<br />{ownerName.split(' ')[1]}</h1>
                        <div className="text-[10px] font-bold space-y-1"><p>{phone}</p><p>{email}</p></div>
                    </div>
                    <div className="relative flex flex-col items-center justify-center p-6 text-white text-center" style={{ backgroundColor: activeColor }}>
                        <h2 className="text-xl font-bold mb-2">{shopName}</h2>
                        <p className="text-[9px] opacity-80">{tagline}</p>
                    </div>
                </div>
            )}

            {/* NEW TEMPLATES */}
            {layout === "layout7" && ( /* Architect Blueprint */
                <div className="w-full h-full bg-[#0a4da2] text-white p-6 relative font-mono overflow-hidden">
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                    <div className="border-2 border-white/50 w-full h-full p-4 relative z-10 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <h1 className="text-xl font-bold uppercase border-b-2 border-white/50 pb-1">{shopName}</h1>
                            <div className="text-[8px] border border-white p-1">PLAN: A-01</div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-2xl font-bold">{ownerName}</h2>
                            <p className="text-[10px] opacity-70">ARCHITECT</p>
                        </div>
                        <div className="text-[9px] font-mono flex gap-4 opacity-80 pt-4 border-t border-white/30">
                            <span>{phone}</span> <span>{email}</span>
                        </div>
                    </div>
                </div>
            )}

            {layout === "layout8" && ( /* Classic Serif / Law Firm */
                <div className="w-full h-full bg-[#fdfbf7] p-8 flex flex-col items-center justify-center text-center relative border border-zinc-200">
                    <div className="absolute top-4 bottom-4 left-4 right-4 border border-zinc-300 pointer-events-none" />
                    <div className="w-12 h-12 mb-4 opacity-80" style={{ color: activeColor }}>{logo ? <img src={logo} className="w-full h-full object-contain" /> : <Building size={48} />}</div>
                    <h1 className="font-serif text-2xl text-zinc-800 tracking-wide mb-1">{shopName}</h1>
                    <div className="w-8 h-px bg-zinc-400 my-4" />
                    <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-zinc-500">{ownerName}</h2>
                    <p className="font-serif text-[10px] italic text-zinc-400 mt-2">{phone}</p>
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
        <div className="w-full h-screen bg-zinc-950 flex overflow-hidden">

            {/* 1. SIDEBAR NAV */}
            <div className="w-20 bg-zinc-900 border-r border-zinc-800 flex flex-col items-center py-6 gap-6 z-20">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center mb-4">
                    <Wand2 className="text-white" size={20} />
                </div>
                {PURPOSES.map(p => (
                    <button key={p.id} onClick={() => setPurpose(p.id)}
                        className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                            purpose === p.id ? "bg-white text-zinc-900 shadow-lg scale-110" : "text-zinc-500 hover:bg-zinc-800")}>
                        <p.icon size={22} strokeWidth={purpose === p.id ? 2.5 : 2} />
                    </button>
                ))}
                <div className="mt-auto flex flex-col gap-4">
                    <button onClick={handleRandomize} className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400"><RotateCw size={18} /></button>
                </div>
            </div>

            {/* 2. MAIN PANEL (Split View) */}
            <div className="flex-1 flex flex-col lg:flex-row relative">

                {/* 2A. EDITOR (Left) */}
                <div className="w-full lg:w-[400px] xl:w-[480px] bg-zinc-950 border-r border-zinc-800 flex flex-col">
                    <div className="p-6 border-b border-zinc-800">
                        <h2 className="text-white font-bold text-xl">{PURPOSES.find(p => p.id === purpose)?.label} Settings</h2>
                        <p className="text-zinc-500 text-xs">Customize details and design.</p>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="p-6 space-y-8">

                            {/* SECTION: CONTENT */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest">Content</h3>
                                <div className="space-y-3">
                                    {/* Common Fields */}
                                    <div className="grid grid-cols-1 gap-3">
                                        <Input value={shopName} onChange={(e) => setShopName(e.target.value)} className="bg-zinc-900 border-zinc-800 text-zinc-200 h-10" placeholder="Brand Name" />
                                        {purpose === 'professional' && <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className="bg-zinc-900 border-zinc-800 text-zinc-200" placeholder="Full Name" />}
                                        {purpose === 'social' && <Input value={handle} onChange={(e) => setHandle(e.target.value)} className="bg-zinc-900 border-zinc-800 text-zinc-200 font-bold" placeholder="@handle" />}
                                        {purpose === 'commerce' && <Input value={offerCode} onChange={(e) => setOfferCode(e.target.value)} className="bg-zinc-900 border-zinc-800 text-zinc-200 font-mono" placeholder="CODE" />}
                                        {purpose === 'event' && <Input value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} className="bg-zinc-900 border-zinc-800 text-zinc-200" placeholder="Event Name" />}
                                    </div>

                                    {/* Sub Fields */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {purpose === 'professional' && <>
                                            <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-zinc-900 border-zinc-800 text-zinc-200" placeholder="Phone" />
                                            <Input value={email} onChange={(e) => setEmail(e.target.value)} className="bg-zinc-900 border-zinc-800 text-zinc-200" placeholder="Email" />
                                        </>}
                                        {purpose === 'social' && <>
                                            <Input value={platform} onChange={(e) => setPlatform(e.target.value)} className="bg-zinc-900 border-zinc-800 text-zinc-200" placeholder="Platform" />
                                            <Input value={bio} onChange={(e) => setBio(e.target.value)} className="bg-zinc-900 border-zinc-800 text-zinc-200" placeholder="Bio" />
                                        </>}
                                    </div>
                                </div>
                            </div>

                            {/* SECTION: STYLE */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest">Style</h3>
                                <div className="grid grid-cols-4 gap-2">
                                    {Array.from({ length: 8 }, (_, i) => i + 1).map(i => (
                                        <button key={i} onClick={() => setLayout(`layout${i}`)} className={cn("aspect-square rounded-lg border-2 flex flex-col items-center justify-center transition-all", layout === `layout${i}` ? "border-emerald-500 bg-emerald-500/10 text-emerald-500" : "border-zinc-800 bg-zinc-900 text-zinc-600 hover:bg-zinc-800")}>
                                            <span className="text-lg font-bold">{i}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* SECTION: PALETTE */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest">Color & Brand</h3>
                                <div className="flex flex-wrap gap-2">
                                    {PALETTES.map(p => (<button key={p.name} onClick={() => { setPalette(p); setCustomColor("") }} className={cn("w-8 h-8 rounded-full border-2 transition-transform hover:scale-110", palette.name === p.name && !customColor ? "border-white" : "border-transparent")} style={{ backgroundColor: p.primary }} />))}
                                    <div className="w-8 h-8 rounded-full border-2 border-zinc-700 flex items-center justify-center overflow-hidden relative">
                                        <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-blue-500 opacity-50" />
                                        <Input type="color" className="absolute opacity-0 w-full h-full cursor-pointer" onChange={(e) => setCustomColor(e.target.value)} />
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-zinc-800">
                                    <Label className="text-zinc-500 text-xs uppercase font-bold mb-2 block">Logo</Label>
                                    <Input type="file" onChange={handleLogoUpload} className="bg-zinc-900 border-zinc-800 text-zinc-400 text-xs" />
                                </div>
                            </div>

                        </div>
                    </ScrollArea>

                    {/* BOTTOM BAR */}
                    <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex gap-2">
                        <Button className="flex-1 bg-white text-black hover:bg-zinc-200" onClick={() => handleExport('png')}>
                            <Download size={16} className="mr-2" /> Download
                        </Button>
                    </div>
                </div>

                {/* 2B. PREVIEW (Right) */}
                <div className="flex-1 bg-[#0c0c0e] relative overflow-hidden flex items-center justify-center p-8 lg:p-16">
                    {/* Background Grid */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none"
                        style={{ backgroundImage: "radial-gradient(#333 1px, transparent 1px)", backgroundSize: "20px 20px" }} />

                    {/* Card Container */}
                    <div
                        ref={cardRef}
                        className="relative w-full max-w-[500px] aspect-[1.75/1] bg-white text-black shadow-2xl rounded-xl overflow-hidden animate-in fade-in scale-in duration-500"
                    >
                        {purpose === 'professional' && <ProfessionalCard />}
                        {purpose === 'social' && <SocialCard />}
                        {purpose === 'commerce' && <CommerceCard />}
                        {purpose === 'event' && <EventCard />}
                    </div>

                </div>

            </div>
        </div>
    )
}
