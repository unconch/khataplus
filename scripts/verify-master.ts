
const fs = require('fs');
const path = require('path');

function checkFileContains(filePath: string, mustContain: string[], mustNotContain: string[]) {
    if (!fs.existsSync(filePath)) {
        // If file doesn't exist, and we expected something, that's a check.
        // If we verify absence, it's good.
        if (mustContain.length > 0) console.error(`❌ File ${filePath} missing!`);
        return;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    let pass = true;
    for (const s of mustContain) {
        if (!content.includes(s)) {
            console.error(`❌ ${filePath} MISSING: "${s}"`);
            pass = false;
        }
    }
    for (const s of mustNotContain) {
        if (content.includes(s)) {
            console.error(`❌ ${filePath} CONTAINS FORBIDDEN: "${s}"`);
            pass = false;
        }
    }
    if (pass) console.log(`✅ ${path.basename(filePath)} passed audit.`);
}

console.log("🔒 STARTING MASTER SECURITY AUDIT...\n");

// 1. Check Package.json
checkFileContains('package.json', [], ['debug-ocr']);

// 2. Check Sentry Configs
checkFileContains('sentry.server.config.ts', ['sendDefaultPii: false'], ['sendDefaultPii: true']);
checkFileContains('sentry.edge.config.ts', ['sendDefaultPii: false'], ['sendDefaultPii: true']);

// 3. Check Sales Logic (Immutability & Atomicity)
checkFileContains('lib/data/sales.ts', ['INSERT INTO sales', 'is_return', 'true', 'db.transaction'], ['DELETE FROM sales']);

// 4. Check Reports Logic (IDOR)
checkFileContains('lib/data/reports.ts', ['AND org_id = ${actualOrgId}'], []);

// 5. Check Crypto (Entropy)
checkFileContains('lib/data/organizations.ts', ['crypto.randomBytes'], ['Math.random()']);
checkFileContains('lib/crypto.ts', ['authTagLength: 16', 'secureCompare'], []);

console.log("\nAudit Complete.");
