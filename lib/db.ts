import 'server-only';
import { neon } from '@neondatabase/serverless';

// Cache connections
let prodSqlInstance: any = null;
let demoSqlInstance: any = null;

const sanitizeConnString = (url: string) => {
    if (!url) return url;
    let sanitized = url.trim();
    if (sanitized.startsWith("psql '") && sanitized.endsWith("'")) {
        sanitized = sanitized.substring(6, sanitized.length - 1);
    } else if (sanitized.startsWith("'") && sanitized.endsWith("'")) {
        sanitized = sanitized.substring(1, sanitized.length - 1);
    }
    return sanitized;
}

const getClient = (url: string, isGuest: boolean) => {
    const sanitizedUrl = sanitizeConnString(url);
    if (isGuest) {
        if (!demoSqlInstance) demoSqlInstance = neon(sanitizedUrl);
        return demoSqlInstance;
    } else {
        if (!prodSqlInstance) prodSqlInstance = neon(sanitizedUrl);
        return prodSqlInstance;
    }
}

export const getProductionSql = () => {
    const connectionUrl = process.env.DATABASE_URL;
    if (!connectionUrl) throw new Error('DATABASE_URL not set');
    return getClient(connectionUrl, false);
}

// Backward-compatible alias used by legacy imports.
export const getSql = () => getProductionSql();

export const getDemoSql = () => {
    const connectionUrl = process.env.DEMO_DATABASE_URL || process.env.DATABASE_URL;
    if (!connectionUrl) throw new Error('DEMO_DATABASE_URL or DATABASE_URL not set');
    return getClient(connectionUrl, true);
}

// Tables that should be isolated per organization
const ISOLATED_TABLES = [
    'inventory', 'sales', 'expenses', 'daily_reports', 'audit_logs',
    'customers', 'khata_transactions', 'suppliers', 'supplier_transactions'
];

function prefixIsolatedTables(query: string, schema: string): string {
    let rewritten = query;
    for (const table of ISOLATED_TABLES) {
        const regex = new RegExp(`(?<!\\.)\\b${table}\\b`, 'g');
        rewritten = rewritten.replace(regex, `"${schema}".${table}`);
    }
    return rewritten;
}

export const sql = async (stringsOrQuery: TemplateStringsArray | string, ...values: any[]) => {
    let connectionUrl = process.env.DATABASE_URL;
    let targetSchema: string | null = null;
    let isGuest = false;

    try {
        const { headers, cookies } = await import('next/headers');
        const headersList = await headers();
        const cookieStore = await cookies();
        const orgId = headersList.get('x-org-id');
        if (orgId) targetSchema = `org_${orgId.replace(/-/g, '_')}`;

        const userId = cookieStore.get('userId')?.value || null;
        const path = headersList.get('x-invoke-path') || "";
        if ((!userId && cookieStore.has('guest_mode')) || path.startsWith('/demo') || headersList.get('x-guest-mode') === 'true') {
            isGuest = true;
            connectionUrl = process.env.DEMO_DATABASE_URL;
        }
    } catch (e) { }

    if (!connectionUrl) throw new Error('DATABASE_URL not set');
    const client = getClient(connectionUrl, isGuest);

    if (typeof stringsOrQuery === 'string') {
        const finalQuery = targetSchema && !isGuest ? prefixIsolatedTables(stringsOrQuery, targetSchema) : stringsOrQuery;
        // @ts-ignore
        return await client(finalQuery, values);
    }

    if (targetSchema && !isGuest) {
        const newStrings = stringsOrQuery.map(s => prefixIsolatedTables(s, targetSchema!));
        // @ts-ignore
        return await client(newStrings, ...values);
    }

    // @ts-ignore
    return await client(stringsOrQuery, ...values);
};

(sql as any).withSchema = async (orgId: string, stringsOrQuery: TemplateStringsArray | string, ...values: any[]) => {
    const schemaName = `org_${orgId.replace(/-/g, '_')}`;
    const connectionUrl = process.env.DATABASE_URL;
    if (!connectionUrl) throw new Error('DATABASE_URL not set');
    const client = getClient(connectionUrl, false);

    if (typeof stringsOrQuery === 'string') {
        const isolatedQuery = prefixIsolatedTables(stringsOrQuery, schemaName);
        // @ts-ignore
        return await client(isolatedQuery, values);
    }

    const newStrings = stringsOrQuery.map(s => prefixIsolatedTables(s, schemaName));
    // @ts-ignore
    return await client(newStrings, ...values);
}
