import { AnimatedLogo } from "@/components/animated-logo"
export function LoadingScreen({ message = "Loading KhataPlus..." }: { message?: string }) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md">
            <div className="flex flex-col items-center gap-6 p-12 rounded-3xl">
                <AnimatedLogo size={140} />
                {/* Optional Message - kept minimal as per request for "logo instead of loading screen" */}
                {/* <p className="text-sm font-medium text-muted-foreground animate-pulse mt-4">{message}</p> */}
            </div>
        </div>
    )
}
