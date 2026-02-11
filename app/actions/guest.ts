"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { audit } from "@/lib/security"

/**
 * Creates a restricted Guest Session cookie.
 * This instructs the DB client to strictly use DEMO_DATABASE_URL.
 */
export async function createGuestSession() {
    // 1. Check if Demo DB is configured (Removed for Local Mock Mode)
    // if (!process.env.DEMO_DATABASE_URL) {
    //    throw new Error("Demo Environment is not active.")
    // }

    // 2. Set Cookie strictness
    console.log("--- [DEBUG] createGuestSession: Setting Guest Cookie ---")
    const cookieStore = await cookies()
    cookieStore.set("guest_mode", "true", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 30, // 30 minutes session
        sameSite: "lax"
    })

    // 3. Mark the session start
    // We can't log to DB here because the cookie isn't set on the request yet so getSql() might default?
    // Actually getSql() reads cookies() directly, so it might work if Next.js propagates it.
    // 3. Mark the session start and redirect to the Rewritten URL
    const { headers } = await import("next/headers")
    const host = (await headers()).get("host") || "localhost:3000"

    if (!host.startsWith("demo.")) {
        // Absolute redirect for subdomain change
        const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
        redirect(`${protocol}://demo.${host}/dashboard`)
    } else {
        redirect("/dashboard")
    }
}

/**
 * Destroys the guest session
 */
export async function endGuestSession() {
    const cookieStore = await cookies()
    cookieStore.delete("guest_mode")
    redirect("/")
}
