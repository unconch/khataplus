"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"

export function ReferralTracker() {
    const searchParams = useSearchParams()

    useEffect(() => {
        const ref = searchParams.get("ref")
        if (ref) {
            console.log(`[ReferralTracker] Captured referral code: ${ref}`)
            // Set cookie that expires in 30 days
            const d = new Date()
            d.setTime(d.getTime() + (30 * 24 * 60 * 60 * 1000))
            const expires = "expires=" + d.toUTCString()
            document.cookie = `kp_referral=${ref};${expires};path=/;SameSite=Lax`
        }
    }, [searchParams])

    return null
}
