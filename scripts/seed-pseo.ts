import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { PSEO_CATEGORIES, PSEO_CITIES } from '../lib/pseo-data';

// Load env vars
dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not defined in .env.local");
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
    console.log(`Seeding pSEO data: ${PSEO_CITIES.length} cities, ${PSEO_CATEGORIES.length} categories...`);

    try {
        let citiesAdded = 0;
        let catsAdded = 0;

        // Seed Cities
        for (const city of PSEO_CITIES) {
            const slug = city.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
            await sql`
                INSERT INTO pseo_cities (name, slug, tier, enabled)
                VALUES (${city}, ${slug}, '2', true)
                ON CONFLICT (slug) DO NOTHING
            `;
            citiesAdded++;
        }

        // Seed Categories
        for (const cat of PSEO_CATEGORIES) {
            const slug = cat.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
            await sql`
                INSERT INTO pseo_categories (name, slug, priority, enabled)
                VALUES (${cat}, ${slug}, 0, true)
                ON CONFLICT (slug) DO NOTHING
            `;
            catsAdded++;
        }

        console.log(`✅ Seed complete.`);
        console.log(`Cities processed: ${citiesAdded}`);
        console.log(`Categories processed: ${catsAdded}`);

    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
}

main();
