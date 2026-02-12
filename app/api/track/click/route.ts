import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const cid = searchParams.get('cid'); // Campaign ID
    const src = searchParams.get('src'); // Platform Source
    const geo = searchParams.get('geo'); // Optional City

    if (!cid) {
        return NextResponse.redirect(new URL('/', req.url));
    }

    try {
        const sql = neon(process.env.DATABASE_URL!);

        // Update campaign metrics in JSONB
        // We assume the ID is passed correctly from the Admin dashboard
        await sql`
            UPDATE marketing_campaigns 
            SET metrics = COALESCE(metrics, '{}'::jsonb) || 
                jsonb_build_object(
                    'clicks', (COALESCE((metrics->>'clicks')::int, 0) + 1),
                    'last_click_at', CURRENT_TIMESTAMP,
                    'last_source', ${src || 'unknown'}
                )
            WHERE id = ${parseInt(cid)}
        `;

        // If a geo is provided, we could track city-wise clicks here too
        if (geo) {
            await sql`
                UPDATE marketing_campaigns 
                SET metrics = metrics || 
                    jsonb_build_object(
                        'geo_clusters', (COALESCE(metrics->'geo_clusters', '{}'::jsonb) || 
                        jsonb_build_object(${geo}, (COALESCE((metrics->'geo_clusters'->>${geo})::int, 0) + 1)))
                    )
                WHERE id = ${parseInt(cid)}
            `;
        }
    } catch (err) {
        console.error('Click tracking failed:', err);
    }

    // Redirect to the actual landing page
    return NextResponse.redirect(new URL('/', req.url));
}
