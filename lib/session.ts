import { createClient } from "./supabase/server"
import { cookies } from "next/headers"

/**
 * Validates and retrieves the current Supabase session.
 */
export async function getSession() {
    try {
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user) return null

        const cookieStore = await cookies()
        const isBiometricVerified = cookieStore.get('biometric_verified')?.value === 'true'

        return {
            user,
            userId: user.id,
            email: user.email,
            isBiometricVerified
        }
    } catch (e) {
        console.error("Supabase session error:", e)
        return null
    }
}
