import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const reports = await sql`SELECT * FROM daily_reports ORDER BY report_date DESC LIMIT 5`;
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
