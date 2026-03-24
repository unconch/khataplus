/**
 * Centralized guest/prod database context resolver.
 * Replaces the ~15 duplicated blocks of:
 *   const { isGuestMode } = await import("./auth")
 *   const isGuest = await isGuestMode()
 *   const { getDemoSql, getProductionSql } = await import("../db")
 *   const db = isGuest ? getDemoSql() : getProductionSql()
 */

import { isGuestMode } from "./data/auth";
import { getDemoSql, getProductionSql } from "./db";

export type DbFlavor = "demo" | "prod";

export interface ContextualDb {
    db: ReturnType<typeof getDemoSql>;
    isGuest: boolean;
    flavor: DbFlavor;
}

/**
 * Returns the correct database client based on the current request context
 * (guest mode vs production).
 */
export async function getContextualDb(): Promise<ContextualDb> {
    const isGuest = await isGuestMode();
    return {
        db: isGuest ? getDemoSql() : getProductionSql(),
        isGuest,
        flavor: isGuest ? "demo" : "prod",
    };
}
