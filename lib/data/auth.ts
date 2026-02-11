"use server"

export async function isGuestMode() {
    const { cookies, headers } = await import("next/headers")
    const cookieStore = await cookies()
    const hasGuestCookie = cookieStore.has("guest_mode")

    if (hasGuestCookie) {
        console.log("--- [DEBUG] isGuestMode: Found guest_mode cookie ---")
        return true
    }

    const headerList = await headers()
    const path = headerList.get("x-invoke-path") || ""
    const referer = headerList.get("referer") || ""
    const tenantSlug = headerList.get("x-tenant-slug")

    const guestByHeader = path.startsWith("/demo") || referer.includes("/demo") || tenantSlug === "demo"
    console.log(`--- [DEBUG] isGuestMode: cookie=${hasGuestCookie} path=${path} slug=${tenantSlug} guestByHeader=${guestByHeader} ---`)

    return guestByHeader
}

export async function getCurrentUser(): Promise<{ userId: string, isGuest: boolean } | null> {
    const { session } = await import("@descope/nextjs-sdk/server")
    const sessionRes = await session()
    const userId = sessionRes?.token?.sub

    if (userId) {
        return { userId, isGuest: false }
    }

    if (await isGuestMode()) {
        return { userId: "guest-user", isGuest: true }
    }

    return null
}

export async function getCurrentOrgId(explicitUserId?: string): Promise<string | null> {
    const { getUserOrganizations } = await import("./organizations");
    let userId = explicitUserId;
    if (!userId) {
        const user = await getCurrentUser();
        userId = user?.userId;
    }

    if (!userId || userId === "guest-user") return "demo-org";

    const orgs = await getUserOrganizations(userId);
    return orgs[0]?.org_id || null;
}
