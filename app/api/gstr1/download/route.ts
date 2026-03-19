import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getGstr1Data } from '@/lib/gst-reports';
import { generateGstr1Json } from '@/lib/gstr-json';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const rawMonth = searchParams.get('month');
    const rawOrgId = searchParams.get('orgId');

    const { ReportQuerySchema } = await import('@/lib/validation');
    const validation = ReportQuerySchema.safeParse({ month: rawMonth, orgId: rawOrgId });

    if (!validation.success) {
        return NextResponse.json({
            error: 'Invalid request parameters',
            details: validation.error.format()
        }, { status: 400 });
    }

    const { month, orgId } = validation.data;

    const { getIP, rateLimit } = await import('@/lib/rate-limit');
    const ip = getIP(request.headers);
    await rateLimit(`gstr-download-${ip}`, 5, 60000); // 5 downloads per minute

    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // ANOMALY DETECTION: Detect Bulk Exfiltration (ASVS Level 3)
    try {
        const { trackDataExport } = await import('@/lib/anomaly-detection');
        await trackDataExport(session.userId, orgId, "GSTR-1");
    } catch (err) {
        console.error("[Anomaly] Tracking failed:", err);
    }

    const { authorize } = await import('@/lib/security');

    try {
        // PERIMETER HARDENING: Verify BOLA (Broken Object Level Authorization)
        await authorize("Download GSTR-1", undefined, orgId);

        // Fetch Org Details for GSTIN
        const orgResult = await sql`SELECT gstin FROM organizations WHERE id = ${orgId}`;
        const orgGstin = orgResult[0]?.gstin || "URP";

        // SANITIZATION: Prevent Header Injection / Path Manipulation
        const safeGstin = orgGstin.replace(/[^a-zA-Z0-9]/g, '').substring(0, 15);

        const reportData = await getGstr1Data(orgId, month);

        // Format period MMYYYY
        // Input month is YYYY-MM
        const [year, mon] = month.split('-');
        const period = `${mon}${year}`;

        const gstr1Json = generateGstr1Json(orgGstin, period, reportData);

        // Convert to JSON string
        const jsonString = JSON.stringify(gstr1Json, null, 2);

        return new NextResponse(jsonString, {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="GSTR1_${safeGstin}_${period}.json"`
            }
        });

    } catch (error: any) {
        // SECURITY: Prevent information disclosure in error responses
        console.error(`[API/GSTR1] Error generating report for org ${orgId}:`, error.message);

        // Return generic error to client
        return NextResponse.json({
            error: 'Failed to generate report',
            code: 'REPORTS_ERROR'
        }, { status: 500 });
    }
}
