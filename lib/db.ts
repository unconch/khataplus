import 'server-only';
import { neon } from '@neondatabase/serverless';

// Cache connections to avoid re-initializing on every query
// Note: In serverless, global scope is often reused.
let prodSqlInstance: any = null;
let demoSqlInstance: any = null;

// Helper to sanitize connection strings (removes psql '...' wrapper if present)
const sanitizeConnString = (url: string) => {
    if (!url) return url;
    let sanitized = url.trim();
    // Remove psql '...' wrapper
    if (sanitized.startsWith("psql '") && sanitized.endsWith("'")) {
        sanitized = sanitized.substring(6, sanitized.length - 1);
    }
    // Remove just '...' if present
    else if (sanitized.startsWith("'") && sanitized.endsWith("'")) {
        sanitized = sanitized.substring(1, sanitized.length - 1);
    }
    return sanitized;
}

// Helper to get or create specific connection
const getClient = (url: string, isGuest: boolean) => {
    const sanitizedUrl = sanitizeConnString(url);
    if (isGuest) {
        if (!demoSqlInstance) {
            console.log('[DB] Initializing SANDBOX Connection...');
            demoSqlInstance = neon(sanitizedUrl);
        }
        return demoSqlInstance;
    } else {
        if (!prodSqlInstance) {
            console.log('[DB] Initializing PRODUCTION Connection...');
            prodSqlInstance = neon(sanitizedUrl);
        }
        return prodSqlInstance;
    }
}

/**
 * Main SQL Client execution wrapper.
 * Dynamically selects the database based on the 'guest_mode' cookie.
 */
export const sql = async (stringsOrQuery: TemplateStringsArray | string, ...values: any[]) => {
    let connectionUrl = process.env.DATABASE_URL;
    let isGuest = false;

    try {
        const { session } = await import('@descope/nextjs-sdk/server');
        const sessionRes = await session();
        const userId = sessionRes?.token?.sub;

        const { cookies, headers } = await import('next/headers');
        const cookieStore = await cookies();
        const headerList = await headers();
        const path = headerList.get('x-invoke-path') || "";

        const isDemoRoute = path.startsWith('/demo');
        const hasGuestCookie = cookieStore.has('guest_mode');

        console.log(`[DB DEBUG] Path: ${path}, UserID: ${userId}, hasGuest: ${hasGuestCookie}, isDemoRoute: ${isDemoRoute}`);

        // Only use Guest Mode if NOT authenticated, OR explicitly on a /demo route
        if ((!userId && hasGuestCookie) || isDemoRoute) {
            isGuest = true;
            if (!process.env.DEMO_DATABASE_URL) {
                // STRICT SECURITY RULE: Fail if Guest Mode is active but no Demo DB is configured.
                throw new Error('SECURITY ALERT: Demo Database URL not configured. Guest Session terminated for security.');
            }
            connectionUrl = process.env.DEMO_DATABASE_URL;
        }
    } catch (e: any) {
        console.log(`[DB ERROR] Failed to detect context: ${e.message}. Defaulting to PROD.`);
        // If we define security error, rethrow it
        if (e.message && e.message.includes('SECURITY ALERT')) {
            throw e;
        }
        // If cookies() fails (e.g. outside request context), we default to PROD (connectionUrl is already set)
        // This is standard behavior for scripts/cron jobs which are "system" (production) level.
    }

    if (!connectionUrl) {
        throw new Error('DATABASE_URL is not defined.');
    }

    const client = getClient(connectionUrl, isGuest);

    // @ts-ignore
    return client(stringsOrQuery, ...values);
};

// Deprecated: getSql should strictly not be used directly if we want isolation
// We keep it for legacy compat if strictly needed, but it will only return PROD
// and warn. Ideally, we remove it.
export const getSql = () => {
    console.warn('[DEPRECATED] getSql() called directly. This effectively bypasses Guest Mode isolation check. Defaulting to PROD.');
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL not set');
    }
    if (!prodSqlInstance) {
        const sanitizedUrl = sanitizeConnString(process.env.DATABASE_URL!);
        prodSqlInstance = neon(sanitizedUrl);
    }
    return prodSqlInstance;
}
