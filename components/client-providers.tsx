"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"

const MotionProvider = dynamic(() => import("@/components/motion-provider").then(m => m.MotionProvider), { ssr: false })
const SyncProvider = dynamic(() => import("@/components/sync-provider").then(m => m.SyncProvider), { ssr: false })
const PwaInstallPrompt = dynamic(() => import("@/components/pwa-install-prompt").then(m => m.PwaInstallPrompt), { ssr: false })
const OfflineBanner = dynamic(() => import("@/components/offline-banner").then(m => m.OfflineBanner), { ssr: false })
const ScrollToTop = dynamic(() => import("@/components/scroll-to-top").then(m => m.ScrollToTop), { ssr: false })
const ReferralTracker = dynamic(() => import("@/components/referral-tracker").then(m => m.ReferralTracker), { ssr: false })

export function ClientProviders() {
    return (
        <MotionProvider>
            <SyncProvider>
                <Suspense fallback={null}>
                    <ReferralTracker />
                </Suspense>
                <ScrollToTop />
                <OfflineBanner />
                <PwaInstallPrompt />
            </SyncProvider>
        </MotionProvider>
    )
}
