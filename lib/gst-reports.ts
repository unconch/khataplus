"use server"

import { sql } from "./db"
import { unstable_cache as nextCache } from "next/cache"
import { Sale } from "./types"
import { authorize } from "./security"

export interface Gstr1Summary {
    b2b: Sale[] // Sales with Customer GSTIN
    b2c_large: Sale[] // Inter-state > 2.5L (Simplified logic for now)
    b2c_small: Sale[]
    hsn_summary: { hsn_code: string; description: string; total_value: number; total_tax: number }[]
}

export interface Gstr3bSummary {
    outward_taxable_supplies: number
    total_igst: number
    total_cgst: number
    total_sgst: number
}

export async function getGstr1Data(orgId: string, monthStr: string): Promise<Gstr1Summary> {
    await authorize("View GST Data", undefined, orgId);
    // monthStr format: "YYYY-MM"
    const startDate = `${monthStr}-01`
    const endDate = new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + 1)).toISOString().split('T')[0];

    const sales = await sql`
        SELECT 
            s.id, s.created_at, s.total_amount, s.gst_amount, s.customer_gstin, s.hsn_code,
            s.taxable_amount, s.cgst_amount, s.sgst_amount, s.igst_amount, s.gst_rate,
            i.name as item_name
        FROM sales s
        LEFT JOIN inventory i ON s.inventory_id = i.id
        WHERE s.org_id = ${orgId}
        AND s.created_at >= ${startDate}
        AND s.created_at < ${endDate}
    ` as any[];

    const b2b = sales.filter(s => s.customer_gstin && s.customer_gstin.length >= 15);
    const b2c = sales.filter(s => !s.customer_gstin || s.customer_gstin.length < 15);

    // Group HSN
    const hsnMap = new Map<string, { hsn_code: string; description: string; total_value: number; total_tax: number }>();

    sales.forEach(s => {
        const code = s.hsn_code || "UNKNOWN";
        const entry = hsnMap.get(code) || { hsn_code: code, description: s.item_name || "Item", total_value: 0, total_tax: 0 };

        // Use new columns if available, fallback to calculated
        const taxable = s.taxable_amount ? Number(s.taxable_amount) : (Number(s.total_amount) - Number(s.gst_amount));
        const tax = s.gst_amount ? Number(s.gst_amount) : 0;

        entry.total_value += taxable;
        entry.total_tax += tax;
        hsnMap.set(code, entry);
    });

    return {
        b2b: b2b.map(mapSale),
        b2c_large: [],
        b2c_small: b2c.map(mapSale),
        hsn_summary: Array.from(hsnMap.values())
    }
}

export async function getGstr3bSummary(orgId: string, monthStr: string): Promise<Gstr3bSummary> {
    await authorize("View GST Data", undefined, orgId);
    const startDate = `${monthStr}-01`
    const endDate = new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + 1)).toISOString().split('T')[0];

    const result = await sql`
        SELECT 
            SUM(total_amount - gst_amount) as taxable_value,
            SUM(gst_amount) as total_tax
        FROM sales
        WHERE org_id = ${orgId}
        AND created_at >= ${startDate}
        AND created_at < ${endDate}
    `;

    const taxable = Number(result[0].taxable_value || 0);
    const tax = Number(result[0].total_tax || 0);

    // Simplified Assumption: Intra-state (CGST+SGST) split 50/50. 
    // Real implementation needs State Code check.
    return {
        outward_taxable_supplies: taxable,
        total_igst: 0, // Placeholder
        total_cgst: tax / 2,
        total_sgst: tax / 2
    }
}

function mapSale(row: any): Sale {
    return {
        ...row,
        sale_price: Number(row.sale_price),
        total_amount: Number(row.total_amount),
        gst_amount: Number(row.gst_amount),
        profit: Number(row.profit),
        customer_gstin: row.customer_gstin || undefined,
        hsn_code: row.hsn_code || undefined
    }
}
