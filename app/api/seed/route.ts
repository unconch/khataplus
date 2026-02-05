import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const items = [
            { sku: 'CLTH-001', name: 'Cotton Check Shirt (L)', buy_price: 850.00, gst_percentage: 12, stock: 45 },
            { sku: 'CLTH-002', name: 'Slim Fit Denim Jeans', buy_price: 1450.00, gst_percentage: 12, stock: 30 },
            { sku: 'CLTH-003', name: 'Banarasi Silk Saree', buy_price: 4200.00, gst_percentage: 5, stock: 12 },
            { sku: 'CLTH-004', name: 'Linen Kurta (White)', buy_price: 1100.00, gst_percentage: 5, stock: 25 },
            { sku: 'CLTH-005', name: 'Printed T-Shirt (M)', buy_price: 450.00, gst_percentage: 12, stock: 60 },
            { sku: 'CLTH-006', name: 'Formal Trousers (Black)', buy_price: 1200.00, gst_percentage: 12, stock: 20 },
            { sku: 'CLTH-007', name: 'Winter Woolen Jacket', buy_price: 2800.00, gst_percentage: 18, stock: 8 },
        ];

        for (const item of items) {
            // Upsert to avoid duplicates causing errors if run twice
            await sql`
            INSERT INTO inventory (sku, name, buy_price, gst_percentage, stock)
            VALUES (${item.sku}, ${item.name}, ${item.buy_price}, ${item.gst_percentage}, ${item.stock})
            ON CONFLICT (sku) DO NOTHING
        `;
        }

        return NextResponse.json({ message: 'Seeding complete', count: items.length });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
