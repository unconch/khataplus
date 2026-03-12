export const SYSTEM_ROUTES = [
    "auth",
    "pricing",
    "docs",
    "features",
    "about",
    "api",
    "onboarding",
]

export const SLUG_REGEX = /^[a-z](?:[a-z0-9]|-(?=[a-z0-9])){1,30}[a-z0-9]$/

export function isPublic(pathname: string): boolean {
    const root = pathname.split("/")[1]
    return SYSTEM_ROUTES.includes(root)
}

export function isReserved(slug: string): boolean {
    return SYSTEM_ROUTES.includes(slug.toLowerCase())
}

export function isValidSlug(slug: string): boolean {
    return SLUG_REGEX.test(slug)
}

export async function assertNoReservedSlugConflicts(db: any): Promise<void> {
    const conflicts = await db`SELECT slug FROM organizations WHERE slug = ANY(${SYSTEM_ROUTES})`
    if (conflicts && conflicts.length > 0) {
        const slugs = conflicts.map((c: any) => c.slug).join(", ")
        throw new Error(`Reserved route conflict: ${slugs}`)
    }
}
