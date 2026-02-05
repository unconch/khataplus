
import { getSql } from "@/lib/db"

export interface Gstr1B2BRow {
    gstin: string
    customer_name: string
    invoice_no: string
    invoice_date: string
    taxable_value: number
    igst: number
    cgst: number
    sgst: number
    total_value: number
    pos: string // Place of Supply
}

export interface Gstr3bSummary {
    total_taxable: number
    total_igst: number
    total_cgst: number
    total_sgst: number
    total_tax: number
}

// B2B: Sales where customer has a GSTIN
export async function getGstr1B2B(orgId: string, startDate: string, endDate: string) {
    const sql = getSql()

    // Note: This relies on the new customer_gstin column
    // We aggregate grouping by invoice could be done here or in UI. 
    // For GSTR-1, we list invoices.

    // Checking if columns exist effectively by trying to query them. 
    // If migration failed, this will error, which is good feedback.

    const rows = await sql`
    SELECT 
      substring(id::text, 0, 8) as invoice_no, -- using ID snippet as invoice no for now
      created_at as invoice_date,
      customer_gstin as gstin,
      sale_data->>'customerName' as customer_name,
      (sale_data->>'totalAmount')::numeric as total_value,
      (sale_data->>'gstAmount')::numeric as total_tax,
      sale_data
    FROM sales 
    WHERE 
      organization_id = ${orgId}
      AND created_at >= ${startDate} 
      AND created_at <= ${endDate}
      AND customer_gstin IS NOT NULL
      AND length(customer_gstin) > 5 -- Basic filter for valid-ish GSTIN
    ORDER BY created_at DESC
  `

    // Transform to flat rows with tax components
    // Assuming 18% standard for now or extracting from sale_data if detailed

    return rows.map(row => {
        const total = parseFloat(row.total_value)
        const tax = parseFloat(row.total_tax)
        const taxable = total - tax

        // Simple state logic: If GSTIN starts with '18' (Assam) and Org is '18', it's Intra-state (CGST+SGST)
        // For now assuming all Intra-state (CGST+SGST) as local business focus
        // TODO: Add Org State Logic

        return {
            gstin: row.gstin,
            customer_name: row.customer_name || 'Business Customer',
            invoice_no: row.invoice_no,
            invoice_date: new Date(row.invoice_date).toISOString().split('T')[0],
            taxable_value: taxable,
            igst: 0,
            cgst: tax / 2,
            sgst: tax / 2,
            total_value: total,
            pos: '18-Assam'
        }
    })
}

export async function getGstr3bStats(orgId: string, startDate: string, endDate: string) {
    const sql = getSql()

    const result = await sql`
     SELECT 
       SUM((sale_data->>'totalAmount')::numeric) as total_revenue,
       SUM((sale_data->>'gstAmount')::numeric) as total_tax
     FROM sales
     WHERE 
       organization_id = ${orgId}
       AND created_at >= ${startDate} 
       AND created_at <= ${endDate}
  `

    const tax = result[0].total_tax || 0
    const rev = result[0].total_revenue || 0

    return {
        total_taxable: rev - tax,
        total_tax: tax,
        total_igst: 0,
        total_cgst: tax / 2,
        total_sgst: tax / 2
    }
}
