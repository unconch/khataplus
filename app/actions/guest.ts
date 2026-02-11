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
    const cookieStore = await cookies()
    cookieStore.set("guest_mode", "true", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 30,
        sameSite: "lax"
    })
    redirect("/demo/dashboard")
}

/**
 * Destroys the guest session
 */
export async function endGuestSession() {
    const cookieStore = await cookies()
    cookieStore.delete("guest_mode")
    redirect("/")
}
