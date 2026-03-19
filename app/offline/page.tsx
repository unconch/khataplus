import { WifiOff, ShieldAlert, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"

export default function OfflinePage() {
    return (
        <div className="min-h-svh bg-background flex flex-col items-center justify-center p-6 text-center">
            <div className="mb-8 relative transition-transform duration-700 hover:scale-110">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                <Logo size={80} className="relative z-10 text-primary" />
            </div>

            <div className="space-y-4 max-w-md animate-slide-up">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-[10px] font-bold uppercase tracking-widest border border-destructive/20 mb-2">
                    <WifiOff className="h-3 w-3" />
                    Connection Severed
                </div>

                <h1 className="text-3xl font-black tracking-tighter text-foreground">
                    You're Sailing <span className="text-primary italic">Offline</span>
                </h1>

                <p className="text-muted-foreground text-sm leading-relaxed">
                    The secure ledger requires a link to sync real-time transactions.
                    Don't worry—cached data is still accessible.
                </p>

                <div className="grid grid-cols-1 gap-2 pt-6">
                    <Button asChild variant="default" className="h-12 font-bold shadow-lg shadow-primary/20">
                        <Link href="/dashboard">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Return to Dashboard
                        </Link>
                    </Button>
                    <Button asChild variant="ghost" className="h-12 text-muted-foreground hover:text-foreground">
                        <Link href="/dashboard/sales">
                            View Cached Sales
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="mt-12 flex items-center gap-2 text-[10px] text-muted-foreground/50 font-medium uppercase tracking-[0.2em]">
                <ShieldAlert className="h-3 w-3" />
                Secure Offline Mode Active
            </div>

            {/* Background Shimmy */}
            <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-orbit" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-orbit-slow" />
            </div>
        </div>
    )
}
