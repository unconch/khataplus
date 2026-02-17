import { z } from "zod";

/**
 * Platinum Security Validation Schemas
 */

export const OrganizationSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GSTIN format").optional().nullable(),
    address: z.string().max(500).optional().nullable(),
    phone: z.string().regex(/^\+?[0-9]{10,15}$/, "Invalid phone format").optional().nullable()
});

export const SaleSchema = z.object({
    inventory_id: z.string().uuid(),
    quantity: z.number().positive("Quantity must be positive"),
    sale_price: z.number().nonnegative(),
    total_amount: z.number().nonnegative(),
    gst_amount: z.number().nonnegative(),
    profit: z.number(),
    payment_method: z.enum(["Cash", "UPI", "Card", "Credit"]),
    hsn_code: z.string().optional().nullable(),
    customer_gstin: z.string().optional().nullable(),
    place_of_supply: z.string().optional().nullable()
});

export const BatchSalesSchema = z.array(SaleSchema);

export const ReportQuerySchema = z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/, "Invalid month format (YYYY-MM)"),
    orgId: z.string().uuid()
});

export const ReturnSchema = z.object({
    original_sale_id: z.string().uuid(),
    inventory_id: z.string().uuid(),
    quantity: z.number().positive(),
    refund_amount: z.number().nonnegative(),
    reason: z.string().min(3).max(255)
});
export const InventorySchema = z.object({
    sku: z.string().min(1, "SKU is required").max(50),
    name: z.string().min(2, "Name must be at least 2 characters").max(200),
    buy_price: z.number().nonnegative(),
    sell_price: z.number().nonnegative().optional(),
    gst_percentage: z.number().min(0).max(100),
    stock: z.number(),
    min_stock: z.number().nonnegative().optional(),
    org_id: z.string().uuid()
});

export const CustomerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(200),
    phone: z.string().regex(/^\+?[0-9]{10,15}$/, "Invalid phone format"),
    address: z.string().max(500).optional().nullable(),
    org_id: z.string().uuid()
});

export const SupplierSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(200),
    phone: z.string().regex(/^\+?[0-9]{10,15}$/, "Invalid phone format"),
    address: z.string().max(500).optional().nullable(),
    org_id: z.string().uuid()
});
