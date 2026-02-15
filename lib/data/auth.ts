"use server"

export async function isGuestMode() {
    const { cookies, headers } = await import("next/headers")
    const cookieStore = await cookies()
    const headerList = await headers()
    return cookieStore.has("guest_mode") || headerList.get("x-guest-mode") === "true"
}

export async function getCurrentUser(): Promise<{ userId: string, email: string, isGuest: boolean } | null> {
    const { getSession } = await import("../session")
    const session = await getSession()
    const userId = session?.userId
    const email = session?.email

    if (userId && email) {
        return { userId, email, isGuest: false }
    }

    if (await isGuestMode()) {
        return { userId: "guest-user", email: "guest@khataplus.demo", isGuest: true }
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

    if (await isGuestMode() || !userId || userId === "guest-user") return "demo-org";

    const orgs = await getUserOrganizations(userId);
    return orgs[0]?.org_id || null;
}
