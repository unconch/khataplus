
// Patch 'server-only' (simplified)
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function (id: any) {
    if (id === 'server-only') return {};

    if (typeof id === 'string' && (id.includes('db') || id.endsWith('db'))) {
        return {
            sql: async (strings: any, ...values: any[]) => {
                const query = Array.isArray(strings) ? strings.join("?") : String(strings);

                if (query.includes("SUM(total_amount)")) {
                    // Verify the IDOR fix: Check if org_id is in the query structure
                    if (!query.includes("AND org_id =")) {
                        throw new Error("IDOR VULNERABILITY: Query missing org_id filter!");
                    }

                    // values[0] = date
                    // values[1] = orgId
                    if (values[1] !== 'org1') {
                        throw new Error(`IDOR CHECK FAIL: Expected org1, got ${values[1]}`);
                    }

                    return [{ total_gross: 500 }];
                }

                if (query.includes("count")) return [{ count: 1 }]; // sales check
                if (query.includes("insert")) return [];
                if (query.includes("update")) return [];

                return [];
            },
            getProductionSql: () => { },
            getDemoSql: () => { }
        };
    }

    if (typeof id === 'string' && id.includes('auth')) return { getCurrentOrgId: async () => 'org1' };
    if (typeof id === 'string' && id.includes('security')) return { authorize: async () => { }, audit: async () => { } };
    if (typeof id === 'string' && id.includes('next')) return {
        cache: (fn: any) => fn,
        unstable_cache: (fn: any) => fn,
        revalidatePath: () => { },
        revalidateTag: () => { },
        headers: async (_async: any) => ({ get: () => undefined }),
        cookies: async (_async: any) => ({ get: () => undefined })
    };

    return originalRequire.apply(this, arguments as any);
};

const { syncDailyReport } = require('../lib/data/reports.ts');

async function testIdor() {
    console.log("🧪 Testing IDOR Fix in syncDailyReport...");
    try {
        await syncDailyReport("2023-01-01", "org1");
        console.log("✅ syncDailyReport executed with org_id constraint.");
    } catch (e: any) {
        console.error("❌ verification failed:", e?.message || e);
        process.exit(1);
    }
}

testIdor();
