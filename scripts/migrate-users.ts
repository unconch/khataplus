import { createClient } from '@supabase/supabase-js'
import { sql } from './db-standalone'
import * as readline from 'readline'
import * as dotenv from 'dotenv'
import path from 'path'

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// Initialize Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

async function confirm(question: string): Promise<boolean> {
    return new Promise(resolve => {
        rl.question(`${question} (y/n): `, answer => {
            resolve(answer.toLowerCase() === 'y')
        })
    })
}

async function migrateUsers() {
    console.log('--- STARTING MIGRATION: Descope -> Supabase ---')

    // 1. Fetch all profiles from Neon
    console.log('Fetching profiles from Neon...')
    const profiles = await sql`SELECT * FROM profiles`
    console.log(`Found ${profiles.length} profiles to process.`)

    if (!await confirm('Proceed with creating Supabase users and updating Neon IDs?')) {
        console.log('Aborted.')
        process.exit(0)
    }

    let successCount = 0
    let errorCount = 0

    for (const profile of profiles) {
        const email = profile.email
        const oldId = profile.id
        const name = profile.name

        console.log(`Processing: ${email} (Old ID: ${oldId})`)

        try {
            // 2. Create User in Supabase
            // Check if user already exists first to avoid duplicates
            const { data: { users }, error: searchError } = await supabase.auth.admin.listUsers()
            let userId = users.find(u => u.email === email)?.id

            if (!userId) {
                const { data, error } = await supabase.auth.admin.createUser({
                    email: email,
                    email_confirm: true,
                    user_metadata: { full_name: name },
                    password: 'TemporaryPassword123!' // Set a default temp password or handle password reset flow
                })

                if (error) throw error
                userId = data.user.id
                console.log(`  -> Created Supabase User: ${userId}`)
            } else {
                console.log(`  -> User already exists in Supabase: ${userId}`)
            }

            // 3. Update ID in Neon (Strategy: Copy -> Update Refs -> Delete Old)
            // This avoids Foreign Key constraint issues since constraints are likely not deferrable.
            if (userId && userId !== oldId) {
                console.log(`  -> Migrating data from ${oldId} to ${userId}...`)

                // A. Insert new profile matching old one but with new ID
                // unique constraints on email must be handled.
                // Wait, email is unique? Yes. So we can't have two profiles with same email.
                // Strategy refinement:
                // 1. Update old profile email to a temp email?
                // 2. Insert new profile?
                // OR
                // 1. Disable FK checks? (Can't easily over http)
                // OR
                // Re-attempt UPDATE but update PROFILES FIRST?
                // If we update profiles first: `UPDATE profiles SET id = NEW WHERE id = OLD`
                // Fails because `organization_members` references OLD.

                // This confirms we are in a bind if we can't defer constraints.
                // But `ON UPDATE CASCADE` might solve it.
                // Let's check if we can alter the constraint? No, that's DDL.

                // Revised Strategy:
                // 1. Create new profile with New ID and TEMP email.
                // 2. Update all references to point to New ID.
                // 3. Delete old profile.
                // 4. Update new profile to correct email.

                // Get full profile data first
                const p = profile

                // Step 1: Insert new profile with temp email
                const tempEmail = `temp_${Date.now()}_${p.email}`
                await sql`
            INSERT INTO profiles (id, email, name, role, status, biometric_required, created_at, updated_at)
            VALUES (${userId}, ${tempEmail}, ${p.name}, ${p.role}, ${p.status}, ${p.biometric_required}, ${p.created_at}, ${p.updated_at}) 
            ON CONFLICT (id) DO NOTHING
        `

                // Step 2: Update References
                await sql`UPDATE organization_members SET user_id = ${userId} WHERE user_id = ${oldId}`
                await sql`UPDATE organizations SET created_by = ${userId} WHERE created_by = ${oldId}`
                await sql`UPDATE audit_logs SET user_id = ${userId} WHERE user_id = ${oldId}`
                await sql`UPDATE sales SET user_id = ${userId} WHERE user_id = ${oldId}`

                // Step 3: Delete old profile
                await sql`DELETE FROM profiles WHERE id = ${oldId}`

                // Step 4: Restore correct email
                await sql`UPDATE profiles SET email = ${email} WHERE id = ${userId}`

                console.log(`  -> Neon ID updated successfully (via Copy-Swap).`)
                successCount++
            } else {
                console.log(`  -> IDs match or invalid. Skipping update.`)
            }


        } catch (err: any) {
            console.error(`  -> ERROR: ${err.message}`)
            errorCount++
        }
    }

    console.log('--- MIGRATION COMPLETE ---')
    console.log(`Success: ${successCount}`)
    console.log(`Errors: ${errorCount}`)

    rl.close()
    process.exit(0)
}

migrateUsers()
