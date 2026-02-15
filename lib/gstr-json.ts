import { Gstr1Summary } from "./gst-reports";

// GSTR-1 JSON Schema Types (Simplified for SaaS)
interface Gstr1Json {
    gstin: string;
    fp: string; // Period "112024" for Nov 2024
    gt: number; // Gross Turnover
    cur_gt: number; // Current Turnover
    b2b: any[];
    b2cl: any[];
    b2cs: any[];
    hsn: { data: any[] };
}

export function generateGstr1Json(orgGstin: string, period: string, summary: Gstr1Summary): Gstr1Json {
    // period format: "MMYYYY" e.g., "112025"

    // 1. Transform B2B
    const b2b = summary.b2b.map(sale => {
        const rate = sale.gst_rate || 18;
        const taxable = sale.taxable_amount || (sale.total_amount - sale.gst_amount);
        const cess = 0; // Placeholder

        return {
            ctin: sale.customer_gstin,
            inv: [{
                // SECURITY: Mask internal DB IDs in public exports
                inum: `INV-${sale.id.substring(0, 8).toUpperCase()}`,
                idt: new Date(sale.created_at).toLocaleDateString('en-IN').replace(/\//g, '-'),
                val: sale.total_amount,
                pos: sale.place_of_supply?.substring(0, 2) || sale.customer_gstin?.substring(0, 2) || "18", // Default Assam
                rchrg: "N",
                inv_typ: "R",
                itms: [{
                    num: 1,
                    itm_det: {
                        rt: rate,
                        txval: taxable,
                        iamt: sale.igst_amount || 0,
                        camt: sale.cgst_amount || (sale.gst_amount / 2),
                        samt: sale.sgst_amount || (sale.gst_amount / 2),
                        csamt: cess
                    }
                }]
            }]
        };
    });

    // 2. Transform B2CS (Small Consumers)
    // Aggregated by State + Rate
    const b2csMap = new Map<string, any>();

    summary.b2c_small.forEach(sale => {
        const stateCode = sale.place_of_supply?.substring(0, 2) || "18"; // Default Assam
        const rate = sale.gst_rate || 18;
        const key = `${stateCode}-${rate}`;

        if (!b2csMap.has(key)) {
            b2csMap.set(key, {
                sply_ty: "INTRA", // Logic needed for Inter-state check (Org State vs POS)
                txval: 0,
                typ: "OE", // Other E-commerce? No, just OE (Other than E-commerce)
                pos: stateCode,
                rt: rate,
                iamt: 0,
                camt: 0,
                samt: 0,
                csamt: 0
            });
        }

        const entry = b2csMap.get(key);
        const taxable = sale.taxable_amount || (sale.total_amount - sale.gst_amount);

        entry.txval += taxable;
        entry.iamt += (sale.igst_amount || 0);
        entry.camt += (sale.cgst_amount || (sale.gst_amount / 2));
        entry.samt += (sale.sgst_amount || (sale.gst_amount / 2));
    });

    return {
        gstin: orgGstin,
        fp: period,
        gt: 0,
        cur_gt: 0,
        b2b: b2b,
        b2cl: [],
        b2cs: Array.from(b2csMap.values()),
        hsn: {
            data: summary.hsn_summary.map(h => ({
                num: 1,
                hsn_sc: h.hsn_code,
                desc: h.description,
                uqc: "NOS",
                qty: 1,
                val: h.total_value,
                txval: h.total_value,
                iamt: 0,
                camt: h.total_tax / 2, // Approximation for HSN summary if split not stored
                samt: h.total_tax / 2,
                csamt: 0
            }))
        }
    };
}
