"use server"

import { sql } from "../db"
import { authorize } from "../security"

/**
 * Generates GSTR-1 compliant JSON structure for a given period.
 */
export async function generateGstr1Data(orgId: string, month: number, year: number) {
    await authorize("Generate GST Report", "admin", orgId)

    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    // Fetch Organization GSTIN
    const orgResult = await sql`SELECT gstin, name FROM organizations WHERE id = ${orgId}`
    if (orgResult.length === 0 || !orgResult[0].gstin) {
        throw new Error("Organization GSTIN not found. Please update settings.")
    }
    const sellerGstin = orgResult[0].gstin

    // Fetch Sales with GST details
    const sales = await sql`
        SELECT * FROM sales 
        WHERE org_id = ${orgId} 
        AND sale_date BETWEEN ${startDate} AND ${endDate}
        AND gst_amount > 0
    `

    // Grouping into B2B and B2C
    const b2b: any[] = []
    const b2cs: any[] = []

    sales.forEach((s: any) => {
        if (s.customer_gstin) {
            // Standard GSTR-1 B2B structure
            b2b.push({
                ctin: s.customer_gstin,
                inv: [{
                    inum: s.id.substring(0, 16), // Simplified invoice number
                    idt: s.sale_date,
                    val: parseFloat(s.total_amount),
                    pos: s.place_of_supply || "00-Unknown",
                    rchrg: "N",
                    inv_typ: "R",
                    itms: [{
                        num: 1,
                        itm_det: {
                            rt: parseFloat(s.gst_rate || 18),
                            txval: parseFloat(s.taxable_amount),
                            iamt: parseFloat(s.igst_amount || 0),
                            camt: parseFloat(s.cgst_amount || 0),
                            samt: parseFloat(s.sgst_amount || 0),
                            csamt: 0
                        }
                    }]
                }]
            })
        } else {
            // Standard GSTR-1 B2C Small structure
            b2cs.push({
                sply_ty: s.igst_amount > 0 ? "INTER" : "INTRA",
                rt: parseFloat(s.gst_rate || 18),
                typ: "OE",
                pos: s.place_of_supply || "00-Unknown",
                txval: parseFloat(s.taxable_amount),
                iamt: parseFloat(s.igst_amount || 0),
                camt: parseFloat(s.cgst_amount || 0),
                samt: parseFloat(s.sgst_amount || 0),
                csamt: 0
            })
        }
    })

    return {
        gstin: sellerGstin,
        fp: `${month < 10 ? '0' + month : month}${year}`,
        gt: 0,
        cur_gt: 0,
        b2b,
        b2cs
    }
}

export async function getGstLiabilitySummary(orgId: string) {
    await authorize("View Financials", undefined, orgId)

    const result = await sql`
        SELECT 
            SUM(taxable_amount) as total_taxable,
            SUM(cgst_amount) as total_cgst,
            SUM(sgst_amount) as total_sgst,
            SUM(igst_amount) as total_igst,
            SUM(gst_amount) as total_gst
        FROM sales
        WHERE org_id = ${orgId} AND is_return = false
    `

    return {
        taxable: parseFloat(result[0].total_taxable || 0),
        cgst: parseFloat(result[0].total_cgst || 0),
        sgst: parseFloat(result[0].total_sgst || 0),
        igst: parseFloat(result[0].total_igst || 0),
        total_tax: parseFloat(result[0].total_gst || 0)
    }
}
