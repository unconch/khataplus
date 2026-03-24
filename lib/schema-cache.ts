/**
 * Centralized schema column detection with in-memory TTL cache.
 * 
 * Replaces the per-file pattern of querying information_schema.columns
 * on every request (hasInventoryCategoryColumn, hasInventoryArchivedColumn,
 * getSalesColumnNames, getDailyReportColumnNames, getAlertSchema).
 * 
 * Results are cached for 5 minutes to avoid repeated round-trips.
 */

const cache = new Map<string, { columns: Set<string>; ts: number }>();
const TTL_MS = 300_000; // 5 minutes

/**
 * Check if a table has a specific column, with automatic caching.
 * First call for a table fetches all columns; subsequent calls are instant.
 */
export async function hasColumn(table: string, column: string, db: any): Promise<boolean> {
    const cached = cache.get(table);
    if (cached && Date.now() - cached.ts < TTL_MS) {
        return cached.columns.has(column);
    }

    const rows = await db`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = ${table}
    `;
    const cols = new Set<string>(rows.map((r: any) => String(r.column_name)));
    cache.set(table, { columns: cols, ts: Date.now() });
    return cols.has(column);
}

/**
 * Get all column names for a table, with automatic caching.
 */
export async function getTableColumns(table: string, db: any): Promise<Set<string>> {
    const cached = cache.get(table);
    if (cached && Date.now() - cached.ts < TTL_MS) {
        return cached.columns;
    }

    const rows = await db`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = ${table}
    `;
    const cols = new Set<string>(rows.map((r: any) => String(r.column_name)));
    cache.set(table, { columns: cols, ts: Date.now() });
    return cols;
}

/**
 * Invalidate the cache for a specific table (e.g., after ALTER TABLE).
 */
export function invalidateSchemaCache(table?: string): void {
    if (table) {
        cache.delete(table);
    } else {
        cache.clear();
    }
}
