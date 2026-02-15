
// Patch 'server-only' (simplified)
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function (id) {
    if (id === 'server-only') return {};

    if (id.includes('db') || id.endsWith('db')) {
        return {
            sql: async (strings, ...values) => {
                const query = strings.join("?"); // Crude reconstruction
                // console.log("SQL:", query);

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

    if (id.includes('auth')) return { getCurrentOrgId: async () => 'org1' };
    if (id.includes('security')) return { authorize: async () => { }, audit: async () => { } };
    if (id.includes('next')) return {
        cache: fn => fn,
        unstable_cache: fn => fn,
        revalidatePath: () => { },
        revalidateTag: () => { },
        headers: async => ({ get: () => undefined }),
        cookies: async => ({ get: () => undefined })
    };

    return originalRequire.apply(this, arguments);
};

const { syncDailyReport } = require('../lib/data/reports.ts');

async function testIdor() {
    console.log("🧪 Testing IDOR Fix in syncDailyReport...");
    try {
        await syncDailyReport("2023-01-01", "org1");
        console.log("✅ syncDailyReport executed with org_id constraint.");
    } catch (e) {
        console.error("❌ verification failed:", e.message);
        process.exit(1);
    }
}

testIdor();
