import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { exportData } from '@/lib/data/migration';
import { authorize } from '@/lib/security';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const orgId = searchParams.get('orgId');

    if (!type || !orgId) {
        return NextResponse.json({ error: 'Missing type or orgId' }, { status: 400 });
    }

    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        await authorize(`Export ${type}`, "admin", orgId);

        const data = await exportData(orgId, type);

        // Convert to JSON string
        const jsonString = JSON.stringify(data, null, 2);
        const fileName = `KhataPlus_${type}_${new Date().toISOString().split('T')[0]}.json`;

        return new NextResponse(jsonString, {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="${fileName}"`
            }
        });

    } catch (error: any) {
        console.error(`[API/Migration] Export failed:`, error.message);
        return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
    }
}
