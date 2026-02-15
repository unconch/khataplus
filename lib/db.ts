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

// Explicit clients for when auto-detection is not desired or unreliable (e.g. inside nextCache)
export const getProductionSql = () => {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");
    return neon(sanitizeConnString(process.env.DATABASE_URL));
};

export const getDemoSql = () => {
    if (!process.env.DEMO_DATABASE_URL) throw new Error("DEMO_DATABASE_URL not set");
    return neon(sanitizeConnString(process.env.DEMO_DATABASE_URL));
};

/**
 * Main SQL Client execution wrapper.
 * Dynamically selects the database based on the 'guest_mode' cookie.
 */
export const sql = async (stringsOrQuery: TemplateStringsArray | string, ...values: any[]) => {
    let connectionUrl = process.env.DATABASE_URL;
    let isGuest = false;

    // We use a try/catch block because cookies() and headers() throw if called outside request context
    let headersList: any = null;
    let cookieStore: any = null;
    let userId: string | null = null;

    try {
        const { getSession } = await import('@/lib/session');
        // If we are inside unstable_cache, this will throw or behave unexpectedly in Next.js 15
        const sessionRes = await getSession();
        userId = (sessionRes?.userId as string) || null;

        const { cookies, headers } = await import('next/headers');

        // This is the critical line that throws inside unstable_cache
        cookieStore = await cookies();
        headersList = await headers();
    } catch (e) {
        // Fallback to PROD if we can't access request context (e.g. build time, scripts, or CACHE SCOPE)
        console.log("[SQL] Request context unavailable (might be cache scope). Falling back to Production DB.");
        const client = getProductionSql();
        if (typeof stringsOrQuery === 'string') {
            return await (client as any).query(stringsOrQuery as string, values);
        } else {
            // @ts-ignore
            return await client(stringsOrQuery, ...values);
        }
    }

    if (headersList && cookieStore) {
        const path = headersList.get('x-invoke-path') || "";
        const isDemoRoute = path.startsWith('/demo');
        const hasGuestCookie = cookieStore.has('guest_mode');
        const hasGuestHeader = headersList.get('x-guest-mode') === 'true';

        if ((!userId && hasGuestCookie) || isDemoRoute || hasGuestHeader) {
            isGuest = true;
            console.log("[SQL] Switching to Sandbox/Demo connection");
            if (!process.env.DEMO_DATABASE_URL) {
                throw new Error('SECURITY ALERT: Demo Database URL not configured. Guest Session terminated.');
            }
            connectionUrl = process.env.DEMO_DATABASE_URL;
        }
    }

    if (!connectionUrl) {
        throw new Error('DATABASE_URL is not defined.');
    }

    const client = getClient(connectionUrl, isGuest);

    console.log(`[SQL] Executing query on ${isGuest ? 'Sandbox' : 'Production'}`);

    if (typeof stringsOrQuery === 'string') {
        return await (client as any).query(stringsOrQuery as string, values);
    } else {
        // @ts-ignore
        return await client(stringsOrQuery, ...values);
    }
};

export const getSql = () => {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set');
    if (!prodSqlInstance) {
        prodSqlInstance = neon(sanitizeConnString(process.env.DATABASE_URL!));
    }
    return prodSqlInstance;
}
