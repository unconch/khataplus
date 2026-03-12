import { SYSTEM_ROUTES } from "../lib/system-routes";

export async function assertNoReservedSlugConflicts(sql: any): Promise<void> {
    const conflicts = await sql`SELECT slug FROM organizations WHERE slug = ANY(${SYSTEM_ROUTES})`;
    if (conflicts && conflicts.length > 0) {
        const slugs = conflicts.map((c: any) => c.slug).join(", ");
        throw new Error(`Reserved route conflict: ${slugs}`);
    }
}
