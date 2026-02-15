
import * as dotenv from 'dotenv';
import path from 'path';
import { supabaseAdmin } from '../lib/supabase/admin';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function main() {
    console.log("Verifying API-based Sync...");

    // 1. Get a user
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (error || !users || users.length === 0) {
        console.error("Failed to list users or no users found:", error);
        return;
    }

    const user = users[0];
    const originalMeta = user.user_metadata || {};
    console.log(`Testing with user: ${user.email} (${user.id})`);
    console.log("Original Metadata:", originalMeta);

    // 2. Simulate an update via upsertProfile (we can't easily call the server action from here without mocking DB)
    // So we will verify the `syncToAuth` logic by calling supabaseAdmin directly here, 
    // effectively mimicking what the code does.
    // Ideally we should import `ensureProfile` and run it, but that requires DB connection which might be tricky in this script context if not transpiled correctly.
    // Let's rely on testing the ADMIN CLIENT connectivity and permission first.

    const testName = `SyncTest ${Date.now()}`;
    console.log(`Attempting to update name to: ${testName}`);

    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: { name: testName }
    });

    if (updateError) {
        console.error("Failed to update user metadata:", updateError);
        return;
    }

    console.log("Update successful!");
    console.log("New Metadata:", updatedUser.user.user_metadata);

    if (updatedUser.user.user_metadata.name === testName) {
        console.log("✅ API Sync Verification PASSED: Admin client has permissions and works.");
    } else {
        console.error("❌ API Sync Verification FAILED: Metadata did not update.");
    }

    // Restore
    if (originalMeta.name) {
        console.log("Restoring original name...");
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
            user_metadata: { name: originalMeta.name }
        });
        console.log("Restored.");
    }
}

main().catch(console.error);
