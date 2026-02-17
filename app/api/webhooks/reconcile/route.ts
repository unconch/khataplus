import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { updateSale } from '@/lib/data/sales';
import { audit } from '@/lib/security';

/**
 * MOCK WEBHOOK HANDLER
 * In a real app, this would be secured with a secret token and handle 
 * events from Razorpay, PhonePe, or a bank aggregator.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { transactionId, status, amount, externalRef } = body;

        // 1. Find the sale associated with this transactionId (externalRef or batch_id)
        // For our simulation, we'll use batch_id as the externalRef.
        const saleId = externalRef;

        console.log(`[Webhook] Received payment notification for ${saleId}: ${status}`);

        if (status === 'success') {
            // 2. Update the sale status to 'paid'
            // We use the first sale's orgId for auth context in audit
            const salesResult = await sql`SELECT org_id FROM sales WHERE batch_id = ${saleId} OR id = ${saleId} LIMIT 1`;
            if (salesResult.length === 0) {
                return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
            }
            const orgId = salesResult[0].org_id;

            // Update all sales in the batch
            await sql`
                UPDATE sales 
                SET payment_status = 'paid', updated_at = CURRENT_TIMESTAMP 
                WHERE batch_id = ${saleId} OR id = ${saleId}
            `;

            await audit("Webhook: Payment Reconciled", "payment", saleId, { amount, status }, orgId);

            return NextResponse.json({ message: 'Payment reconciled successfully' });
        }

        return NextResponse.json({ message: 'Webhook received' });

    } catch (err: any) {
        console.error('[Webhook] Error:', err.message);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
