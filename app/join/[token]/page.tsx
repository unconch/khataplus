import { getInviteByToken, getOrganization, getOrganizationMembers } from "@/lib/data/organizations";
import { Button } from "@/components/ui/button";
import { Logo, LogoText } from "@/components/ui/logo";
import { ShieldCheck, UserPlus, LogIn, ArrowRight, Building2, Users, Clock, Globe } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import QRCode from "react-qr-code";

export default async function JoinOrganizationPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const invite = await getInviteByToken(token);

    if (!invite) {
        notFound();
    }

    const [org, members, session] = await Promise.all([
        getOrganization(invite.org_id),
        getOrganizationMembers(invite.org_id),
        getSession()
    ]);

    const isLoggedIn = !!session?.userId;
    const expiresAt = new Date(invite.expires_at).getTime();

    // Calculate initial time left (Server-side)
    const now = Date.now();
    const timeLeft = Math.max(0, expiresAt - now);
    const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));

    // Get up to 5 members for the social proof stack
    const displayMembers = members.slice(0, 5);
    const remainingCount = Math.max(0, members.length - 5);

    return (
        <div className="min-h-screen w-full flex overflow-hidden bg-zinc-950 relative">
            {/* Background elements to match the Auth redesign */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,rgba(255,255,255,0.04)_1px,transparent_0)] bg-[size:32px_32px] z-0" />
            <div className="absolute inset-0 mesh-gradient opacity-20 z-0" />

            <div className="relative z-10 w-full flex flex-col items-center justify-center p-6 sm:p-12 lg:flex-row lg:gap-20">
                {/* Left Side: Context & Branding (Desktop) */}
                <div className="hidden lg:flex flex-col max-w-sm space-y-12 animate-in fade-in slide-in-from-left-10 duration-1000">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                            <Clock className="h-3 w-3" />
                            Expiring in {daysLeft} Days
                        </div>
                        <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none">
                            The Team is <span className="text-emerald-500">Waiting.</span>
                        </h2>
                        <p className="text-zinc-500 font-bold text-lg leading-relaxed">
                            Join **{org?.name}** and consolidate your business operations into a single high-performance terminal.
                        </p>
                    </div>

                    {/* QR Code for Mobile Onboarding */}
                    <div className="space-y-4">
                        <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest italic">Switch to Mobile</div>
                        <div className="p-4 bg-white rounded-[24px] inline-block shadow-2xl shadow-emerald-500/10 border-4 border-white/5">
                            <QRCode
                                value={`${process.env.NEXT_PUBLIC_APP_URL || "https://khataplus.online"}/join/${token}`}
                                size={120}
                                bgColor="#ffffff"
                                fgColor="#09090b"
                                level="H"
                            />
                        </div>
                    </div>
                </div>

                {/* Center: Invite Card */}
                <div className="w-full max-w-[480px] space-y-10">
                    {/* Header / Branding (Mobile/Tablet Only) */}
                    <div className="flex flex-col items-center space-y-4 lg:hidden animate-in fade-in slide-in-from-top-10 duration-1000">
                        <div className="p-3 bg-white/5 backdrop-blur-xl rounded-[22px] border border-white/10 shadow-2xl">
                            <Logo size={48} className="text-emerald-500" />
                        </div>
                        <LogoText className="items-center" />
                    </div>

                    <div className="relative group animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
                        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-indigo-500/20 rounded-[40px] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000" />

                        <div className="relative glass-card bg-zinc-900/80 border border-white/10 rounded-[36px] overflow-hidden shadow-2xl backdrop-blur-2xl">
                            <div className="p-10 space-y-8">
                                <div className="space-y-4 text-center">
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] italic mb-2">
                                        <ShieldCheck className="h-3 w-3" />
                                        Official Invitation
                                    </div>
                                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">
                                        Join <span className="text-emerald-500">{org?.name}.</span>
                                    </h1>

                                    {/* Social Proof Stack */}
                                    <div className="flex flex-col items-center gap-3 pt-2">
                                        <div className="flex -space-x-3">
                                            {displayMembers.map((member, i) => (
                                                <div
                                                    key={member.id}
                                                    className="h-9 w-9 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center text-xs font-black text-emerald-400 shadow-xl"
                                                    title={member.user?.name}
                                                >
                                                    {member.user?.name?.[0].toUpperCase() || "U"}
                                                </div>
                                            ))}
                                            {remainingCount > 0 && (
                                                <div className="h-9 w-9 rounded-full bg-emerald-500 border-2 border-zinc-900 flex items-center justify-center text-[10px] font-black text-white shadow-xl">
                                                    +{remainingCount}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">
                                            Join {members.length} colleagues already in the team
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-6 rounded-[24px] bg-white/5 border border-white/10 space-y-2 group/item hover:bg-white/10 transition-colors">
                                        <Building2 className="h-5 w-5 text-emerald-400" />
                                        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Organization</div>
                                        <div className="text-sm font-black text-white truncate uppercase italic">{org?.name}</div>
                                    </div>
                                    <div className="p-6 rounded-[24px] bg-white/5 border border-white/10 space-y-2 group/item hover:bg-white/10 transition-colors">
                                        <Users className="h-5 w-5 text-indigo-400" />
                                        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Target Role</div>
                                        <div className="text-sm font-black text-white truncate uppercase italic">{invite.role}</div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4">
                                    {isLoggedIn ? (
                                        <Button
                                            asChild
                                            className="w-full py-8 !rounded-[24px] bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg uppercase italic tracking-widest transition-all shadow-xl shadow-emerald-600/20 active:scale-[0.98] group"
                                        >
                                            <Link href={`/invite/${token}`}>
                                                Join Team Now
                                                <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                                            </Link>
                                        </Button>
                                    ) : (
                                        <div className="flex flex-col gap-4">
                                            <Button
                                                asChild
                                                className="w-full py-8 !rounded-[24px] bg-white text-zinc-950 hover:bg-zinc-100 font-black text-lg uppercase italic tracking-widest transition-all shadow-xl active:scale-[0.98] group border-none"
                                            >
                                                <Link href={`/auth/sign-up?invite=${token}`}>
                                                    Create Account
                                                    <UserPlus className="ml-3 h-5 w-5 transition-transform group-hover:scale-110" />
                                                </Link>
                                            </Button>

                                            <Button
                                                asChild
                                                variant="outline"
                                                className="w-full py-8 !rounded-[24px] bg-transparent border-white/10 hover:bg-white/5 text-white font-black text-lg uppercase italic tracking-widest transition-all active:scale-[0.98] group"
                                            >
                                                <Link href={`/auth/login?next=${encodeURIComponent(`/invite/${token}`)}&invite=${token}`}>
                                                    Login to Join
                                                    <LogIn className="ml-3 h-5 w-5 transition-transform group-hover:scale-110" />
                                                </Link>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer hint */}
                            <div className="px-10 py-6 bg-emerald-500/5 border-t border-white/5 text-center flex items-center justify-center gap-4">
                                <div className="flex items-center gap-1.5">
                                    <Globe className="h-3 w-3 text-emerald-500/50" />
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] italic">
                                        SECURED BY KHATAPLUS PROTOCOL
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Back to Home */}
                    <div className="text-center animate-in fade-in duration-1000 delay-500">
                        <Link href="/" className="text-zinc-600 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest">
                            ← Return to KhataPlus Terminal
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
