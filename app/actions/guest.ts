"use server"

import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { audit } from "@/lib/security"

const DEFAULT_DEMO_DASHBOARD_URL = "https://demo.khataplus.online/dashboard"

async function resolveDemoDashboardUrl() {
    const headerStore = await headers()
    const hostRaw = headerStore.get("x-forwarded-host") || headerStore.get("host") || ""
    const protoRaw = headerStore.get("x-forwarded-proto") || "https"

    if (!hostRaw) return DEFAULT_DEMO_DASHBOARD_URL

    const hostValue = hostRaw.split(",")[0].trim()
    const protoValue = protoRaw.split(",")[0].trim()
    const hostNoPort = hostValue.split(":")[0].toLowerCase()
    const isLocalHost =
        hostNoPort === "localhost" ||
        hostNoPort.endsWith(".localhost") ||
        /^\d{1,3}(\.\d{1,3}){3}$/.test(hostNoPort)

    if (isLocalHost) {
        return `${protoValue}://${hostValue}/dashboard`
    }

    const portPart = hostValue.includes(":") ? `:${hostValue.split(":")[1]}` : ""
    const baseHost = hostNoPort.startsWith("demo.") ? hostNoPort.slice(5) : hostNoPort
    return `${protoValue}://demo.${baseHost}${portPart}/dashboard`
}

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
    redirect(await resolveDemoDashboardUrl())
}

/**
 * Destroys the guest session
 */
export async function endGuestSession() {
    const cookieStore = await cookies()
    cookieStore.delete("guest_mode")
    redirect("/")
}
