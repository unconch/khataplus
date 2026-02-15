
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
  pos: string
}

export interface Gstr3bSummary {
  total_taxable: number
  total_igst: number
  total_cgst: number
  total_sgst: number
  total_tax: number
}

// B2B: Sales where customer has a GSTIN
export async function getGstr1B2B(orgId: string, startDate: string, endDate: string): Promise<Gstr1B2BRow[]> {
  const sql = getSql()

  const rows = await sql`
    SELECT 
      substring(id::text, 0, 16) as invoice_no, 
      created_at as invoice_date,
      customer_gstin as gstin,
      total_amount as total_value,
      gst_amount as total_tax,
      taxable_amount,
      cgst_amount,
      sgst_amount,
      igst_amount,
      place_of_supply
    FROM sales 
    WHERE 
      org_id = ${orgId}
      AND created_at >= ${startDate} 
      AND created_at <= ${endDate}
      AND customer_gstin IS NOT NULL
      AND length(customer_gstin) > 5 
    ORDER BY created_at DESC
  `

  return rows.map((row: any) => {
    return {
      gstin: row.gstin,
      customer_name: 'Business Customer', // Future: Join with customers table
      invoice_no: row.invoice_no,
      invoice_date: new Date(row.invoice_date).toLocaleDateString("en-IN"),
      taxable_value: parseFloat(row.taxable_amount || "0"),
      igst: parseFloat(row.igst_amount || "0"),
      cgst: parseFloat(row.cgst_amount || "0"),
      sgst: parseFloat(row.sgst_amount || "0"),
      total_value: parseFloat(row.total_value || "0"),
      pos: row.place_of_supply || "18"
    }
  })
}

export async function getGstr3bStats(orgId: string, startDate: string, endDate: string): Promise<Gstr3bSummary> {
  const sql = getSql()

  const result = await sql`
     SELECT 
       SUM(total_amount) as total_revenue,
       SUM(gst_amount) as total_tax,
       SUM(taxable_amount) as total_taxable,
       SUM(igst_amount) as total_igst,
       SUM(cgst_amount) as total_cgst,
       SUM(sgst_amount) as total_sgst
     FROM sales
     WHERE 
       org_id = ${orgId}
       AND created_at >= ${startDate} 
       AND created_at <= ${endDate}
  `

  const r = result[0]

  return {
    total_taxable: parseFloat(r.total_taxable || "0"),
    total_tax: parseFloat(r.total_tax || "0"),
    total_igst: parseFloat(r.total_igst || "0"),
    total_cgst: parseFloat(r.total_cgst || "0"),
    total_sgst: parseFloat(r.total_sgst || "0")
  }
}
