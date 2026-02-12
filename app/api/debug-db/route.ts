import { sql } from '@/lib/db';
import { NextResponse, NextRequest } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const revalidate = searchParams.get('revalidate');

        if (revalidate === 'all') {
            const tags = ['inventory', 'sales', 'reports', 'settings', 'analytics', 'customers', 'inventory-demo', 'sales-demo', 'reports-demo', 'settings-demo', 'analytics-demo', 'customers-demo'];
            for (const tag of tags) {
                // @ts-ignore
                revalidateTag(tag);
            }
            console.log('--- [DEBUG] All tags revalidated via API ---');
        }

        const reports = await sql`SELECT * FROM daily_reports ORDER BY report_date DESC LIMIT 5`;
        // ... rest of the existing GET logic
        const sales = await sql`SELECT * FROM sales ORDER BY created_at DESC LIMIT 5`;
        const user = await sql`SELECT current_user, current_role`;
        const salesCount = await sql`SELECT count(*) FROM sales`;

        // Check a specific aggregation
        const today = new Date().toISOString().split('T')[0];
        const salesAgg = await sql`
            SELECT 
                SUM(total_amount) as total_gross,
                SUM(total_amount - profit) as total_cost_derived,
                SUM(CASE WHEN payment_method = 'Cash' THEN total_amount ELSE 0 END) as cash_total,
                SUM(CASE WHEN payment_method = 'UPI' THEN total_amount ELSE 0 END) as upi_total
            FROM sales
            WHERE sale_date = ${today}
        `;

        return NextResponse.json({
            reports,
            sales,
            salesAgg,
            serverTime: new Date().toISOString(),
            todayStr: today,
            user,
            salesCount
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
