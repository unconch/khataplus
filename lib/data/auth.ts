"use server"

export async function isGuestMode() {
    const { cookies } = await import("next/headers")
    const cookieStore = await cookies()
    return cookieStore.has("guest_mode")
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
