import { ShieldAlert, Globe } from "lucide-react"
import { Logo } from "@/components/ui/logo"

export default function GeoblockedPage() {
    return (
        <div className="min-h-svh bg-background flex flex-col items-center justify-center p-6 text-center">
            <div className="mb-8 relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                <Logo size={80} className="relative z-10 text-primary" />
            </div>

            <div className="space-y-4 max-w-md animate-slide-up">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-[10px] font-bold uppercase tracking-widest border border-destructive/20 mb-2">
                    <Globe className="h-3 w-3" />
                    Access Restricted
                </div>

                <h1 className="text-3xl font-black tracking-tighter text-foreground">
                    Available <span className="text-primary italic">Only in India</span>
                </h1>

                <p className="text-muted-foreground text-sm leading-relaxed">
                    KhataPlus is currently optimized for financial operations within India.
                    Access from your current location is restricted to ensure data sovereignty and regulatory compliance.
                </p>

                <div className="pt-6">
                    <div className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                        <ShieldAlert className="h-3 w-3" />
                        Regional Security Shield Active
                    </div>
                </div>
            </div>

            {/* Background Decoration */}
            <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
            </div>
        </div>
    )
}
