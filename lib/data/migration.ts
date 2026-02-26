"use server"

import { sql } from "../db";
import { authorize, audit } from "../security";
import { decrypt, encrypt } from "../crypto";
import { getTenantDEK, initializeTenantDEKs } from "../key-management";
import { triggerSync } from "../sync-notifier";
import { syncDailyReport } from "./reports";
import { revalidatePath, revalidateTag } from "next/cache";

type ImportOptions = {
    skipAuth?: boolean
    actorUserId?: string | null
}

async function writeFailedSalesCsv(rows: Array<{
    row_number: number
    inventory_id: string
    product_ref: string
    reason: string
}>) {
    if (!rows.length) return null
    const { writeFile } = await import("fs/promises")
    const { join } = await import("path")
    const out = join(process.cwd(), "failed_sales.csv")
    const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`
    const header = ["row_number", "inventory_id", "product_ref", "reason"].join(",")
    const body = rows
        .map((r) => [r.row_number, r.inventory_id, r.product_ref, r.reason].map(escape).join(","))
        .join("\n")
    await writeFile(out, `${header}\n${body}\n`, "utf8")
    return out
}

const tableColumnsCache = new Map<string, Set<string>>()
const tableColumnTypesCache = new Map<string, Map<string, string>>()
// TTL: cache schema for 5 minutes — prevents stale column sets after DB migrations
const tableColumnsCacheAt = new Map<string, number>()
const SCHEMA_CACHE_TTL_MS = 5 * 60 * 1000
const DEFAULT_BULK_CHUNK = 2000

async function getTableColumns(tableName: string): Promise<Set<string>> {
    const cacheKey = tableName.toLowerCase()
    const cachedAt = tableColumnsCacheAt.get(cacheKey) || 0
    if (tableColumnsCache.has(cacheKey) && Date.now() - cachedAt < SCHEMA_CACHE_TTL_MS) {
        return tableColumnsCache.get(cacheKey)!
    }

    const rows = await sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = ${cacheKey}
    `
    const set = new Set((rows as any[]).map((r) => String(r.column_name)))
    tableColumnsCache.set(cacheKey, set)
    tableColumnsCacheAt.set(cacheKey, Date.now())
    return set
}

async function getTableColumnTypes(tableName: string): Promise<Map<string, string>> {
    const cacheKey = tableName.toLowerCase()
    const cached = tableColumnTypesCache.get(cacheKey)
    if (cached) return cached

    const rows = await sql`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = ${cacheKey}
    `
    const map = new Map<string, string>()
    for (const row of rows as any[]) {
        map.set(String(row.column_name), String(row.data_type || "").toLowerCase())
    }
    tableColumnTypesCache.set(cacheKey, map)
    return map
}

function getBulkChunkSize() {
    const raw = Number(process.env.MIGRATION_DB_BULK_CHUNK || DEFAULT_BULK_CHUNK)
    return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_BULK_CHUNK
}

function chunkArray<T>(items: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < items.length; i += chunkSize) {
        chunks.push(items.slice(i, i + chunkSize))
    }
    return chunks
}

function toNumber(value: unknown, fallback = 0): number {
    if (value === null || value === undefined) return fallback
    const text = String(value).trim()
    if (!text) return fallback
    const cleaned = text.replace(/[,\s₹$€£¥]/g, "").replace(/\((.+)\)/, "-$1")
    const parsed = parseFloat(cleaned)
    return Number.isFinite(parsed) ? parsed : fallback
}

function parseImportedDateTime(rawDate: unknown, rawTime?: unknown): { saleDate: string; createdAtIso: string } {
    const fallback = new Date()
    const asText = (v: unknown) => String(v ?? "").trim()
    const dateText = asText(rawDate)
    const timeText = asText(rawTime)

    const parseDateOnly = (text: string): Date | null => {
        if (!text) return null
        // Excel serial number (e.g. 45000)
        if (/^\d{4,5}(\.\d+)?$/.test(text)) {
            const excelEpoch = new Date(Date.UTC(1899, 11, 30))
            const days = parseFloat(text)
            const d = new Date(excelEpoch.getTime() + days * 86400000)
            return Number.isNaN(d.getTime()) ? null : d
        }
        // DD/MM/YYYY or DD-MM-YYYY (Tally / Indian format)
        const dmy = text.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
        if (dmy) {
            // Build as UTC to avoid IST timezone shift causing off-by-one dates
            const d = new Date(`${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}T00:00:00Z`)
            return Number.isNaN(d.getTime()) ? null : d
        }
        // YYYY-MM-DD (ISO-like)
        const ymd = text.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/)
        if (ymd) {
            const d = new Date(`${ymd[1]}-${ymd[2].padStart(2, "0")}-${ymd[3].padStart(2, "0")}T00:00:00Z`)
            return Number.isNaN(d.getTime()) ? null : d
        }
        // DD-Mon-YYYY (e.g. 22-Feb-2024)
        const dMonY = text.match(/^(\d{1,2})[- ]([A-Za-z]{3,9})[- ](\d{4})$/)
        if (dMonY) {
            const d = new Date(`${dMonY[1]} ${dMonY[2]} ${dMonY[3]} UTC`)
            return Number.isNaN(d.getTime()) ? null : d
        }
        const parsed = new Date(text)
        return Number.isNaN(parsed.getTime()) ? null : parsed
    }

    const parseTime = (text: string) => {
        if (!text) return null

        // Excel serial time fraction: time-only cells are stored as a decimal
        // between 0 and 1 representing the fraction of a 24-hour day.
        // e.g. 0.4375 = 10:30 AM, 0.75 = 18:00, 0.5 = 12:00
        // Also handle values slightly above 1.0 (e.g. 1.25 from datetime serials)
        if (/^\d*\.\d+$/.test(text)) {
            const frac = parseFloat(text)
            if (!isNaN(frac) && frac >= 0 && frac < 1.5) {
                const dayFraction = frac % 1 // keep only the fractional part
                const totalSeconds = Math.round(dayFraction * 86400)
                const hh = Math.floor(totalSeconds / 3600) % 24
                const mm = Math.floor((totalSeconds % 3600) / 60)
                const ss = totalSeconds % 60
                return { hh, mm, ss }
            }
        }

        const m = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i)
        if (!m) return null
        let hh = Number(m[1])
        const mm = Number(m[2])
        const ss = Number(m[3] || 0)
        const ampm = String(m[4] || "").toUpperCase()
        if (ampm === "PM" && hh < 12) hh += 12
        if (ampm === "AM" && hh === 12) hh = 0
        if (hh > 23 || mm > 59 || ss > 59) return null
        return { hh, mm, ss }
    }

    const dateObj = parseDateOnly(dateText) || fallback
    const timeObj = parseTime(timeText)
    if (timeObj) {
        dateObj.setHours(timeObj.hh, timeObj.mm, timeObj.ss, 0)
    }

    const saleDate = dateObj.toISOString().split("T")[0]
    return { saleDate, createdAtIso: dateObj.toISOString() }
}

function castValueToDbType(value: unknown, dbType: string): unknown {
    if (value === null || value === undefined || value === "") return null
    const text = String(value).trim()
    if (!text) return null

    if (dbType.includes("uuid")) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)
        return isUuid ? text : null
    }

    if (dbType.includes("integer") || dbType.includes("smallint") || dbType.includes("bigint")) {
        const n = parseInt(text, 10)
        return Number.isFinite(n) ? n : null
    }

    if (dbType.includes("numeric") || dbType.includes("decimal") || dbType.includes("real") || dbType.includes("double")) {
        const n = parseFloat(text.replace(/,/g, ""))
        return Number.isFinite(n) ? n : null
    }

    if (dbType.includes("boolean")) {
        const v = text.toLowerCase()
        if (["true", "1", "yes", "y"].includes(v)) return true
        if (["false", "0", "no", "n"].includes(v)) return false
        return null
    }

    if (dbType.includes("date") || dbType.includes("time")) {
        // Must append T00:00:00Z for date-only strings to avoid IST timezone shifting the date back by 1 day
        const normalized = /^\d{4}-\d{2}-\d{2}$/.test(text) ? `${text}T00:00:00Z` : text
        const d = new Date(normalized)
        return Number.isNaN(d.getTime()) ? null : d.toISOString()
    }

    return value
}

async function castRowsForTable<T extends Record<string, unknown>>(tableName: string, rows: T[]): Promise<T[]> {
    if (!rows.length) return rows
    const types = await getTableColumnTypes(tableName)
    return rows.map((row) => {
        const out: Record<string, unknown> = { ...row }
        for (const [key, val] of Object.entries(out)) {
            const dbType = types.get(key)
            if (!dbType) continue
            out[key] = castValueToDbType(val, dbType)
        }
        return out as T
    })
}

async function stripRowsToTableColumns<T extends Record<string, unknown>>(tableName: string, rows: T[]): Promise<T[]> {
    if (!rows.length) return rows
    const allowed = await getTableColumns(tableName)
    return rows.map((row) => {
        const out: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(row)) {
            if (allowed.has(key)) out[key] = value
        }
        return out as T
    })
}

async function resolveImportDEK(orgId: string, label: "Customers" | "Suppliers"): Promise<string | null> {
    try {
        return await getTenantDEK(orgId);
    } catch {
        try {
            console.log(`[Import/${label}] No DEK found, initializing...`);
            await initializeTenantDEKs();
            return await getTenantDEK(orgId);
        } catch (error) {
            console.warn(`[Import/${label}] Proceeding without encryption for org ${orgId}:`, error);
            return null;
        }
    }
}

export async function exportData(orgId: string, type: string) {
    await authorize(`Export ${type}`, "manager", orgId);

    let data: any[] = [];

    switch (type) {
        case "inventory":
            data = await sql`SELECT * FROM inventory WHERE org_id = ${orgId} ORDER BY name ASC`;
            break;
        case "customers":
            data = await sql`SELECT * FROM customers WHERE org_id = ${orgId} ORDER BY name ASC`;
            data = await decryptList(data, orgId);
            break;
        case "suppliers":
            data = await sql`SELECT * FROM suppliers WHERE org_id = ${orgId} ORDER BY name ASC`;
            data = await decryptList(data, orgId);
            break;
        case "sales":
            data = await sql`SELECT * FROM sales WHERE org_id = ${orgId} ORDER BY created_at DESC LIMIT 1000`;
            break;
        case "expenses":
            data = await sql`SELECT * FROM expenses WHERE org_id = ${orgId} ORDER BY created_at DESC LIMIT 1000`;
            break;
        default:
            throw new Error(`Unsupported export type: ${type}`);
    }

    return data;
}

async function decryptList(list: any[], orgId: string) {
    let dek: string | undefined;
    try {
        dek = await getTenantDEK(orgId);
    } catch (e) {
        console.warn(`[exportData] No DEK for org ${orgId}, assuming unencrypted data`);
        return list;
    }

    if (!dek) return list;

    return Promise.all(list.map(async (row: any) => {
        let name = row.name;
        let phone = row.phone;
        let address = row.address;

        if (row.name && row.name.startsWith('{')) {
            try {
                name = await decrypt(row.name, orgId, dek);
                phone = row.phone && row.phone.startsWith('{') ? await decrypt(row.phone, orgId, dek) : row.phone;
                address = row.address && row.address.startsWith('{') ? await decrypt(row.address, orgId, dek) : row.address;
            } catch (e) {
                console.error(`[exportData] Decryption failed for row ${row.id}:`, e);
            }
        }

        return {
            ...row,
            name,
            phone,
            address
        };
    }));
}

export async function importInventory(orgId: string, items: any[], options?: ImportOptions) {
    try {
        console.log(`[Import/Inventory] Starting import for org ${orgId} with ${items.length} items...`)
        if (!options?.skipAuth) {
            await authorize("Import Inventory", "manager", orgId)
        }

        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[]
        }



        const isUUID = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)
        const looksLikeOpaqueId = (val: unknown) => {
            const text = String(val || "").trim()
            if (!text) return false
            if (isUUID(text)) return true
            return /^[A-Z0-9-]{24,}$/i.test(text)
        }
        const normalizedRowsRaw = items.map((item, i) => {
            const sku = item.sku || item.SKU || item.code || item.product_id || item.item_id || item["Product ID"] || item["Item ID"] || item["Item Code"] || `AUTO-${Date.now()}-${i}`
            const rawName =
                item.name ||
                item.Name ||
                item.product_name ||
                item["product_name"] ||
                item["Product Name"] ||
                item["Item Name"] ||
                item["Stock Item Name"] ||
                item.item_name ||
                item.product ||
                item.description ||
                ""
            const name = rawName && !looksLikeOpaqueId(rawName) ? rawName : `Product ${i + 1}`
            let buy_price = toNumber(item.buy_price ?? item.unit_cost ?? item.UnitCost ?? item.Cost ?? item.cost ?? item["Cost Price"] ?? 0, 0)
            let sell_price = toNumber(item.sell_price ?? item["MRP (₹)"] ?? item.MRP ?? item.mrp ?? item["Rate (₹)"] ?? item.price ?? item.selling_price ?? buy_price ?? 0, 0)
            const stock = Math.max(0, Math.round(toNumber(item.stock ?? item.stock_qty ?? item.Stock ?? item["Opening Stock"] ?? item["Available Stock"] ?? item.Quantity ?? item.quantity ?? item.qty ?? item["Qty"] ?? 0, 0)))
            const gst_percentage = toNumber(item.gst_percentage ?? item["GST Rate %"] ?? item.GST ?? item.gst ?? item.tax ?? item.Tax ?? 0, 0)
            const min_stock = parseInt(item.min_stock || item.reorder_level || item.minimum || "5") || 5
            const hsn_code = item.hsn_code || item["HSN Code"] || item.HSN || item.hsn || ""
            if (buy_price <= 0 && sell_price > 0) buy_price = sell_price
            if (sell_price <= 0 && buy_price > 0) sell_price = buy_price
            const originalId = item.id || item.ID
            const id_text = (originalId && isUUID(originalId)) ? String(originalId) : ""
            return { id_text, org_id: orgId, sku, name, buy_price, sell_price, stock, hsn_code, gst_percentage, min_stock }
        })
        const normalizedRows = await castRowsForTable("inventory", normalizedRowsRaw)

        // Prevent duplicate products with different SKUs when the logical product name is the same.
        // This commonly happens when placeholder SKUs were auto-created during sales import.
        const canonicalName = (v: unknown) => String(v || "").toLowerCase().replace(/[^a-z0-9]/g, "")
        const existingInventory = await sql`SELECT sku, name FROM inventory WHERE org_id = ${orgId}`
        const existingSkuSet = new Set<string>()
        const existingByName = new Map<string, string>()
        for (const row of existingInventory as any[]) {
            const sku = String(row.sku || "")
            const nameKey = canonicalName(row.name)
            if (sku) existingSkuSet.add(sku)
            if (nameKey && sku && !existingByName.has(nameKey)) existingByName.set(nameKey, sku)
        }
        for (const row of normalizedRows as any[]) {
            const currentSku = String(row.sku || "")
            const nameKey = canonicalName(row.name)
            if (!nameKey) continue
            const existingSku = existingByName.get(nameKey)
            if (!existingSku) continue
            if (currentSku && currentSku !== existingSku && !existingSkuSet.has(currentSku)) {
                row.sku = existingSku
            }
        }

        const runBulkUpsert = async (mode: "org_sku" | "sku", rows: typeof normalizedRows) => {
            if (mode === "org_sku") {
                await sql`
                    WITH src AS (
                        SELECT * FROM jsonb_to_recordset(${JSON.stringify(rows)}::jsonb)
                        AS x(
                            id_text text,
                            org_id text,
                            sku text,
                            name text,
                            buy_price numeric,
                            sell_price numeric,
                            stock integer,
                            hsn_code text,
                            gst_percentage numeric,
                            min_stock integer
                        )
                    )
                    INSERT INTO inventory (
                        id, org_id, sku, name, buy_price, sell_price,
                        stock, hsn_code, gst_percentage, min_stock
                    )
                    SELECT
                        CASE
                            WHEN id_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                            THEN id_text::uuid
                            ELSE gen_random_uuid()
                        END,
                        org_id,
                        sku,
                        name,
                        buy_price,
                        sell_price,
                        stock,
                        hsn_code,
                        gst_percentage,
                        min_stock
                    FROM src
                    ON CONFLICT (org_id, sku) DO UPDATE SET
                        name = EXCLUDED.name,
                        buy_price = EXCLUDED.buy_price,
                        sell_price = EXCLUDED.sell_price,
                        stock = EXCLUDED.stock,
                        hsn_code = EXCLUDED.hsn_code,
                        gst_percentage = EXCLUDED.gst_percentage,
                        min_stock = EXCLUDED.min_stock,
                        updated_at = NOW()
                `
                return
            }

            await sql`
                WITH src AS (
                    SELECT * FROM jsonb_to_recordset(${JSON.stringify(rows)}::jsonb)
                    AS x(
                        id_text text,
                        org_id text,
                        sku text,
                        name text,
                        buy_price numeric,
                        sell_price numeric,
                        stock integer,
                        hsn_code text,
                        gst_percentage numeric,
                        min_stock integer
                    )
                )
                INSERT INTO inventory (
                    id, org_id, sku, name, buy_price, sell_price,
                    stock, hsn_code, gst_percentage, min_stock
                )
                SELECT
                    CASE
                        WHEN id_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                        THEN id_text::uuid
                        ELSE gen_random_uuid()
                    END,
                    org_id,
                    sku,
                    name,
                    buy_price,
                    sell_price,
                    stock,
                    hsn_code,
                    gst_percentage,
                    min_stock
                FROM src
                ON CONFLICT (sku) DO UPDATE SET
                    name = EXCLUDED.name,
                    buy_price = EXCLUDED.buy_price,
                    sell_price = EXCLUDED.sell_price,
                    stock = EXCLUDED.stock,
                    hsn_code = EXCLUDED.hsn_code,
                    gst_percentage = EXCLUDED.gst_percentage,
                    min_stock = EXCLUDED.min_stock,
                    updated_at = NOW()
            `
        }

        let rowUpsertMode: "org_sku" | "sku" = "org_sku"
        try {
            const chunks = chunkArray(normalizedRows, getBulkChunkSize())
            try {
                for (const chunk of chunks) {
                    await runBulkUpsert("org_sku", chunk)
                }
            } catch (bulkErrOrg: any) {
                const msg = String(bulkErrOrg?.message || "")
                if (/constraint .* does not exist|no unique or exclusion constraint/i.test(msg)) {
                    for (const chunk of chunks) {
                        await runBulkUpsert("sku", chunk)
                    }
                    rowUpsertMode = "sku"
                } else {
                    throw bulkErrOrg
                }
            }
            results.success = normalizedRows.length
        } catch (bulkError: any) {
            // Fallback to row-level insert for better fault tolerance.
            for (let i = 0; i < normalizedRows.length; i++) {
                const r = normalizedRows[i]
                try {
                    const id = r.id_text || null
                    if (rowUpsertMode === "org_sku") {
                        await sql`
                            INSERT INTO inventory (
                                id, org_id, sku, name, buy_price, sell_price, 
                                stock, hsn_code, gst_percentage, min_stock
                            ) VALUES (
                                COALESCE(${id}::uuid, gen_random_uuid()), ${r.org_id}, ${r.sku}, ${r.name}, ${r.buy_price},
                                ${r.sell_price}, ${r.stock}, ${r.hsn_code},
                                ${r.gst_percentage}, ${r.min_stock}
                            )
                            ON CONFLICT (org_id, sku) DO UPDATE SET
                                name = EXCLUDED.name,
                                buy_price = EXCLUDED.buy_price,
                                sell_price = EXCLUDED.sell_price,
                                stock = EXCLUDED.stock,
                                hsn_code = EXCLUDED.hsn_code,
                                gst_percentage = EXCLUDED.gst_percentage,
                                min_stock = EXCLUDED.min_stock,
                                updated_at = NOW()
                        `
                    } else {
                        await sql`
                            INSERT INTO inventory (
                                id, org_id, sku, name, buy_price, sell_price, 
                                stock, hsn_code, gst_percentage, min_stock
                            ) VALUES (
                                COALESCE(${id}::uuid, gen_random_uuid()), ${r.org_id}, ${r.sku}, ${r.name}, ${r.buy_price},
                                ${r.sell_price}, ${r.stock}, ${r.hsn_code},
                                ${r.gst_percentage}, ${r.min_stock}
                            )
                            ON CONFLICT (sku) DO UPDATE SET
                                name = EXCLUDED.name,
                                buy_price = EXCLUDED.buy_price,
                                sell_price = EXCLUDED.sell_price,
                                stock = EXCLUDED.stock,
                                hsn_code = EXCLUDED.hsn_code,
                                gst_percentage = EXCLUDED.gst_percentage,
                                min_stock = EXCLUDED.min_stock,
                                updated_at = NOW()
                        `
                    }
                    results.success++
                } catch (itemError: any) {
                    results.failed++
                    results.errors.push(`Row ${i + 1}: ${itemError.message}`)
                }
            }
        }

        try {
            await audit("Imported Inventory", "inventory", undefined, { count: results.success }, orgId)
        } catch (auditError) {
            console.error("[Import/Inventory] Audit logging failed (non-fatal):", auditError)
        }

        try {
            (revalidateTag as any)("inventory");
            (revalidateTag as any)(`inventory-${orgId}`);
            revalidatePath("/dashboard/inventory", "page");
            await triggerSync(orgId, "inventory");
        } catch (e) {
            console.warn("[Import/Inventory] Cache revalidation or sync failed:", e)
        }

        return {
            success: true,
            count: results.success,
            failed: results.failed,
            errors: results.errors
        }

    } catch (error: any) {
        console.error("FATAL: importInventory crashed:", error)
        throw new Error(`Import failed: ${error.message}`)
    }
}

export async function importCustomers(orgId: string, items: any[], options?: ImportOptions) {
    try {
        console.log(`[Import/Customers] Starting import for org ${orgId} with ${items.length} items...`)
        if (!options?.skipAuth) {
            await authorize("Import Customers", "manager", orgId)
        }

        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[]
        }

        const dek = await resolveImportDEK(orgId, "Customers")

        const preparedRowsRaw = await Promise.all(items.map(async (item, i) => {
            // ROBUST: Generate name if missing
            const name = item.name || item.Name || item.customer || item.Customer || item.name_contact || `Customer ${i + 1}`
            // ROBUST: Phone - try multiple fields, auto-generate placeholder if missing
            const rawPhone = item.phone || item.Phone || item.Mobile || item.mobile || item.contact || item.number
            const phone = rawPhone || `AUTO-${Date.now()}-${i + 1}`
            const address = item.address || item.Address || item.location || ""
            const email = item.email || item.Email || item.email_id || item["Email ID"] || null
            const balance = toNumber(item.balance ?? item.Balance ?? item.outstanding ?? item.Outstanding ?? 0, 0)

            const safePhone = String(phone)
            const storedName = dek ? await encrypt(name, orgId, dek) : name
            const storedPhone = dek ? await encrypt(safePhone, orgId, dek) : safePhone
            const storedAddress = address
                ? (dek ? await encrypt(address, orgId, dek) : address)
                : null

            return {
                name: storedName,
                phone: storedPhone,
                address: storedAddress,
                email: email || null,
                balance: balance || 0,
                org_id: orgId
            }
        }))
        const preparedRowsStripped = await stripRowsToTableColumns("customers", preparedRowsRaw)
        const preparedRows = await castRowsForTable("customers", preparedRowsStripped)

        try {
            let insertedCount = 0
            const chunks = chunkArray(preparedRows, getBulkChunkSize())
            for (const chunk of chunks) {
                const inserted = await sql`
                    WITH src AS (
                        SELECT * FROM jsonb_to_recordset(${JSON.stringify(chunk)}::jsonb)
                        AS x(name text, phone text, address text, org_id text)
                    )
                    INSERT INTO customers (id, name, phone, address, org_id)
                    SELECT gen_random_uuid(), name, phone, NULLIF(address, ''), org_id
                    FROM src
                    ON CONFLICT DO NOTHING
                    RETURNING id
                `
                insertedCount += Number((inserted as any[])?.length || 0)
            }
            results.success = insertedCount
            results.failed = Math.max(0, preparedRows.length - insertedCount)
        } catch (bulkError: any) {
            // Fallback for row-level diagnostics.
            for (let i = 0; i < preparedRows.length; i++) {
                const r = preparedRows[i]
                try {
                    const row = await sql`
                        INSERT INTO customers (id, name, phone, address, org_id)
                        VALUES (gen_random_uuid(), ${r.name}, ${r.phone}, ${r.address}, ${r.org_id})
                        ON CONFLICT DO NOTHING
                        RETURNING id
                    `
                    if ((row as any[]).length > 0) {
                        results.success++
                    } else {
                        results.failed++
                    }
                } catch (itemError: any) {
                    results.failed++
                    results.errors.push(`Row ${i + 1}: ${itemError.message}`)
                }
            }
        }

        try {
            await audit("Imported Customers", "customer", undefined, { count: results.success }, orgId);
            (revalidateTag as any)(`customers-${orgId}`);
            revalidatePath("/dashboard/customers", "page");
            await triggerSync(orgId, "customer");
        } catch (e) {
            console.warn("[Import/Customers] Non-fatal cleanup error:", e)
        }

        return { success: true, count: results.success, failed: results.failed, errors: results.errors }
    } catch (error: any) {
        console.error("FATAL: importCustomers crashed:", error)
        throw new Error(`Import failed: ${error.message}`)
    }
}

export async function importSales(orgId: string, items: any[], options?: ImportOptions) {
    try {
        console.log(`[Import/Sales] Starting import for org ${orgId} with ${items.length} items...`)
        const user = options?.skipAuth ? { id: options.actorUserId || null } : await authorize("Import Sales", "manager", orgId)
        const { isGuestMode } = await import("./auth")
        const isGuest = await isGuestMode()
        const actorUserId = isGuest ? null : user.id

        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[]
        }
        const fkStrategy = String(process.env.MIGRATION_SALES_FK_STRATEGY || "skip").toLowerCase()
        const salesCols = await sql`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'sales'
        `
        const hasPaymentMethod = (salesCols as any[]).some((r) => String(r.column_name) === "payment_method")
        const uniqueDates = new Set<string>()
        const isUUID = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)
        const canonical = (val: unknown) => String(val || "").toLowerCase().replace(/[^a-z0-9]/g, "")
        const UNIT_TOKENS = new Set([
            "pcs", "pc", "nos", "no", "unit", "units", "kg", "g", "gm", "ltr", "liter", "litre",
            "ml", "box", "pkt", "pack", "doz", "dozen", "pair", "set"
        ])
        const cleanToken = (value: unknown) => String(value ?? "").trim()
        const isUnitToken = (value: unknown) => {
            const normalized = cleanToken(value).toLowerCase().replace(/[.\s_-]+/g, "")
            return !!normalized && UNIT_TOKENS.has(normalized)
        }
        const pickFirstMeaningful = (...values: unknown[]) => {
            for (const value of values) {
                const text = cleanToken(value)
                if (!text) continue
                if (isUnitToken(text)) continue
                return text
            }
            return ""
        }

        const inventoryRows = await sql`SELECT id, sku, name, buy_price FROM inventory WHERE org_id = ${orgId}`
        const byId = new Map<string, any>()
        const bySku = new Map<string, any>()
        const byName = new Map<string, any>()
        const allowAutoPlaceholderProducts = String(process.env.MIGRATION_AUTO_CREATE_PLACEHOLDERS || "").toLowerCase() === "true"
        const pendingPlaceholders = new Map<string, { key: string; sku: string; name: string; sell_price: number }>()
        for (const row of inventoryRows as any[]) {
            byId.set(String(row.id), row)
            bySku.set(String(row.sku || "").toLowerCase(), row)
            byName.set(String(row.name || "").toLowerCase(), row)
            const skuKey = canonical(row.sku)
            const nameKey = canonical(row.name)
            if (skuKey) bySku.set(skuKey, row)
            if (nameKey) byName.set(nameKey, row)
        }
        const looksLikeOpaqueId = (val: unknown) => {
            const text = String(val || "").trim()
            if (!text) return false
            if (isUUID(text)) return true
            return /^[A-Z0-9-]{24,}$/i.test(text)
        }

        const preparedRaw: Array<{
            inventory_id: string
            user_id: string | null
            org_id: string
            quantity: number
            sale_price: number
            total_amount: number
            gst_amount: number
            profit: number
            payment_method: string
            sale_date: string
            created_at: string
            row_number: number
            product_ref: string
        }> = []

        for (let i = 0; i < items.length; i++) {
            const item = items[i]
            try {
                // Tally exports often include UOM values (e.g. PCS) that must not be treated as product keys.
                const sku = pickFirstMeaningful(
                    item.sku, item.SKU, item.code, item.product_code, item.item_code, item["Stock Item Code"], item["Item Code"]
                )
                const productName = pickFirstMeaningful(
                    item.name, item.product, item.item, item.product_name, item.item_name,
                    item["Item Name"], item["Stock Item"], item["Stock Item Name"], item["Particulars"], item.customer_name
                )
                const inventoryId = cleanToken(item.inventory_id || item.product_id || item["Inventory ID"])

                let inv: any | undefined
                if (inventoryId && isUUID(inventoryId)) inv = byId.get(inventoryId)
                if (!inv && sku && isUUID(sku)) inv = byId.get(sku)
                if (!inv && sku) inv = bySku.get(sku.toLowerCase())
                if (!inv && productName) inv = byName.get(productName.toLowerCase())
                if (!inv && sku) inv = bySku.get(canonical(sku))
                if (!inv && productName) inv = byName.get(canonical(productName))

                if (!inv && allowAutoPlaceholderProducts) {
                    // Queue lightweight placeholders and create them in bulk after parsing for speed.
                    const fallbackName =
                        (productName && !looksLikeOpaqueId(productName) ? productName : "") ||
                        (sku && !looksLikeOpaqueId(sku) ? sku : "") ||
                        `Unmapped Product ${i + 1}`

                    const fallbackSku = (sku || productName || `AUTO-${Date.now()}-${i + 1}`)
                        .toString()
                        .trim()
                        .toUpperCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^A-Z0-9_\-/]/g, "") || `AUTO-${Date.now()}-${i + 1}`

                    const salePriceGuess = toNumber(item.sale_price ?? item["Rate (₹)"] ?? item.Price ?? item.price ?? item.amount ?? item["Total Amount (₹)"] ?? 0, 0)
                    const key = canonical(fallbackSku || fallbackName)
                    if (key && !pendingPlaceholders.has(key)) {
                        pendingPlaceholders.set(key, { key, sku: fallbackSku, name: fallbackName, sell_price: salePriceGuess })
                    }
                    inv = { id: `__PENDING__:${key}`, sku: fallbackSku, name: fallbackName, buy_price: 0 }
                }

                if (!inv) {
                    results.failed++
                    results.errors.push(`Row ${i + 1}: Product "${sku || inventoryId || productName || "unknown"}" not found in inventory`)
                    continue
                }

                const quantity = toNumber(item.quantity ?? item.Quantity ?? item.qty ?? item["Qty"] ?? 1, 1) || 1
                const total_amount = toNumber(item.total_amount ?? item["Total Amount (₹)"] ?? item.total ?? 0, 0)
                const sale_price =
                    toNumber(item.sale_price ?? item["Rate (₹)"] ?? item.Price ?? item.price ?? 0, 0) ||
                    (quantity > 0 && total_amount > 0 ? (total_amount / quantity) : 0)
                const computedTotal = total_amount > 0 ? total_amount : (sale_price * quantity)
                // Sum all GST components: CGST + SGST + IGST + Cess (Tally splits them)
                const gst_amount =
                    toNumber(item.gst_amount ?? item.GST ?? item.gst ?? null, -1) >= 0
                        ? toNumber(item.gst_amount ?? item.GST ?? item.gst, 0)
                        : toNumber(item["CGST @6% (₹)"] ?? item["CGST"] ?? item.cgst ?? 0, 0)
                        + toNumber(item["SGST @6% (₹)"] ?? item["SGST"] ?? item.sgst ?? 0, 0)
                        + toNumber(item["IGST"] ?? item.igst ?? item["IGST Amount"] ?? 0, 0)
                        + toNumber(item["Cess"] ?? item.cess ?? 0, 0)

                const paymentRaw = String(item.payment_method || item["Payment Mode"] || item.payment_status || item.payment || "Cash")
                const paymentNorm = paymentRaw.toLowerCase().trim()
                const payment_method =
                    /\bemi\b/.test(paymentNorm) ? "EMI" :
                        /credit\s*card/.test(paymentNorm) ? "Card" :
                            /debit\s*card/.test(paymentNorm) ? "Card" :
                                /\bcard\b/.test(paymentNorm) ? "Card" :
                                    /upi|gpay|google\s*pay|paytm|phonepe|bhim|phone\s*pe/.test(paymentNorm) ? "UPI" :
                                        /net\s*banking|internet\s*banking|online/.test(paymentNorm) ? "UPI" :
                                            /neft|rtgs|imps|bank\s*transfer|wire/.test(paymentNorm) ? "Bank Transfer" :
                                                /cheque|check|\bdd\b|demand\s*draft/.test(paymentNorm) ? "Cheque" :
                                                    /credit|khata|due|udhar/.test(paymentNorm) ? "Credit" :
                                                        /cash|hand/.test(paymentNorm) ? "Cash" : "Cash"

                const { saleDate, createdAtIso } = parseImportedDateTime(
                    item.sale_date || item.date || item.Date || item.created_at || null,
                    item.time || item.Time || item["Invoice Time"] || item["Voucher Time"] || null
                )
                const dateOnly = saleDate
                uniqueDates.add(dateOnly)
                const buy_price = parseFloat(inv.buy_price) || 0
                // Use toNumber() like all other fields — bare parseFloat("₹1,200") = NaN so
                // items with a pre-computed profit from Tally fell through to formula incorrectly
                const exportedProfit = toNumber(item.profit ?? item.Profit ?? null, NaN)
                const profit = !isNaN(exportedProfit) ? exportedProfit : (sale_price - buy_price) * quantity

                preparedRaw.push({
                    inventory_id: String(inv.id),
                    user_id: actorUserId,
                    org_id: orgId,
                    quantity,
                    sale_price,
                    total_amount: computedTotal,
                    gst_amount,
                    profit,
                    payment_method,
                    sale_date: dateOnly,
                    created_at: createdAtIso,
                    row_number: i + 1,
                    product_ref: sku || productName || inventoryId || "unknown",
                })
            } catch (itemError: any) {
                results.failed++
                results.errors.push(`Row ${i + 1}: ${itemError.message}`)
            }
        }

        if (pendingPlaceholders.size > 0) {
            const placeholders = Array.from(pendingPlaceholders.values()).map((p) => ({
                org_id: orgId,
                sku: p.sku,
                name: p.name,
                buy_price: 0,
                sell_price: p.sell_price,
                stock: 0,
                hsn_code: "",
                gst_percentage: 0,
                min_stock: 0,
            }))

            const runPlaceholderUpsert = async (mode: "org_sku" | "sku", rows: typeof placeholders) => {
                if (mode === "org_sku") {
                    await sql`
                        WITH src AS (
                            SELECT * FROM jsonb_to_recordset(${JSON.stringify(rows)}::jsonb)
                            AS x(
                                org_id text,
                                sku text,
                                name text,
                                buy_price numeric,
                                sell_price numeric,
                                stock integer,
                                hsn_code text,
                                gst_percentage numeric,
                                min_stock integer
                            )
                        )
                        INSERT INTO inventory (
                            id, org_id, sku, name, buy_price, sell_price, stock, hsn_code, gst_percentage, min_stock
                        )
                        SELECT gen_random_uuid(), org_id, sku, name, buy_price, sell_price, stock, hsn_code, gst_percentage, min_stock
                        FROM src
                        ON CONFLICT (org_id, sku) DO UPDATE SET
                            name = EXCLUDED.name,
                            sell_price = EXCLUDED.sell_price,
                            updated_at = NOW()
                    `
                    return
                }
                await sql`
                    WITH src AS (
                        SELECT * FROM jsonb_to_recordset(${JSON.stringify(rows)}::jsonb)
                        AS x(
                            org_id text,
                            sku text,
                            name text,
                            buy_price numeric,
                            sell_price numeric,
                            stock integer,
                            hsn_code text,
                            gst_percentage numeric,
                            min_stock integer
                        )
                    )
                    INSERT INTO inventory (
                        id, org_id, sku, name, buy_price, sell_price, stock, hsn_code, gst_percentage, min_stock
                    )
                    SELECT gen_random_uuid(), org_id, sku, name, buy_price, sell_price, stock, hsn_code, gst_percentage, min_stock
                    FROM src
                    ON CONFLICT (sku) DO UPDATE SET
                        name = EXCLUDED.name,
                        sell_price = EXCLUDED.sell_price,
                        updated_at = NOW()
                `
            }

            try {
                const chunks = chunkArray(placeholders, getBulkChunkSize())
                try {
                    for (const chunk of chunks) await runPlaceholderUpsert("org_sku", chunk)
                } catch (e: any) {
                    const msg = String(e?.message || "")
                    if (/constraint .* does not exist|no unique or exclusion constraint/i.test(msg)) {
                        for (const chunk of chunks) await runPlaceholderUpsert("sku", chunk)
                    } else {
                        throw e
                    }
                }
            } catch (autoCreateErr: any) {
                results.errors.push(`[sales] Auto-create placeholder inventory failed: ${autoCreateErr?.message || "unknown"}`)
            }

            const placeholderSkus = placeholders.map((p) => p.sku)
            const createdRows = await sql`
                SELECT id, sku, name, buy_price
                FROM inventory
                WHERE org_id = ${orgId}
                  AND sku = ANY(${placeholderSkus}::text[])
            `
            for (const row of createdRows as any[]) {
                byId.set(String(row.id), row)
                bySku.set(String(row.sku || "").toLowerCase(), row)
                byName.set(String(row.name || "").toLowerCase(), row)
                const skuKey = canonical(row.sku)
                const nameKey = canonical(row.name)
                if (skuKey) bySku.set(skuKey, row)
                if (nameKey) byName.set(nameKey, row)
            }
        }

        for (const row of preparedRaw) {
            if (!String(row.inventory_id || "").startsWith("__PENDING__:")) continue
            const key = String(row.inventory_id).replace("__PENDING__:", "")
            const ref = (key ? bySku.get(key) : null) || (key ? byName.get(key) : null)
            if (ref?.id) {
                row.inventory_id = String(ref.id)
            }
        }

        const preparedCasted = await castRowsForTable("sales", preparedRaw as unknown as Array<Record<string, unknown>>)
        const prepared = preparedCasted as Array<{
            inventory_id: string
            user_id: string | null
            org_id: string
            quantity: number
            sale_price: number
            total_amount: number
            gst_amount: number
            profit: number
            payment_method: string
            sale_date: string
            created_at: string
            row_number: number
            product_ref: string
        }>

        if (prepared.length > 0) {
            const inventoryIds = Array.from(new Set(prepared.map((r) => r.inventory_id).filter(Boolean)))
            if (inventoryIds.length > 0) {
                const existingRows = await sql`
                    SELECT id
                    FROM inventory
                    WHERE org_id = ${orgId}
                      AND id::text = ANY(${inventoryIds}::text[])
                `
                const existingIds = new Set((existingRows as any[]).map((r) => String(r.id)))
                const missingRows = prepared.filter((r) => !existingIds.has(String(r.inventory_id)))

                if (missingRows.length > 0) {
                    if (fkStrategy === "insert_anyway") {
                        results.errors.push(`[sales] FK precheck: ${missingRows.length} row(s) reference missing inventory_id; insert_anyway enabled.`)
                    } else {
                        const strategy = fkStrategy === "nullify" ? "skip" : "skip"
                        if (fkStrategy === "nullify") {
                            results.errors.push(`[sales] FK strategy 'nullify' is unsupported because sales.inventory_id is NOT NULL; falling back to 'skip'.`)
                        }

                        if (strategy === "skip") {
                            const missingIdSet = new Set(missingRows.map((r) => String(r.inventory_id)))
                            const skippedDetails = missingRows.slice(0, 2000).map((r) => ({
                                row_number: r.row_number,
                                inventory_id: r.inventory_id,
                                product_ref: r.product_ref,
                                reason: "inventory_id not found in inventory",
                            }))
                            const csvPath = await writeFailedSalesCsv(skippedDetails)

                            const filtered = prepared.filter((r) => !missingIdSet.has(String(r.inventory_id)))
                            const skippedCount = prepared.length - filtered.length
                            prepared.length = 0
                            prepared.push(...filtered)
                            results.failed += skippedCount
                            results.errors.push(`[sales] FK precheck skipped ${skippedCount} row(s) with missing inventory reference.`)
                            if (csvPath) {
                                results.errors.push(`[sales] Failed rows exported to ${csvPath}`)
                            }
                        }
                    }
                }
            }
        }

        if (prepared.length > 0) {
            const chunks = chunkArray(prepared, getBulkChunkSize())
            if (hasPaymentMethod) {
                for (const chunk of chunks) {
                    await sql`
                        WITH src AS (
                            SELECT * FROM jsonb_to_recordset(${JSON.stringify(chunk)}::jsonb)
                            AS x(
                                inventory_id uuid,
                                user_id text,
                                org_id text,
                                quantity numeric,
                                sale_price numeric,
                                total_amount numeric,
                                gst_amount numeric,
                                profit numeric,
                                payment_method text,
                                sale_date date,
                                created_at timestamptz,
                                row_number integer,
                                product_ref text
                            )
                        )
                        INSERT INTO sales (
                            id, inventory_id, user_id, org_id, quantity, sale_price,
                            total_amount, gst_amount, profit, payment_method, sale_date, created_at
                        )
                        SELECT
                            gen_random_uuid(),
                            inventory_id,
                            NULLIF(user_id, '')::text,
                            org_id,
                            quantity,
                            sale_price,
                            total_amount,
                            gst_amount,
                            profit,
                            payment_method,
                            sale_date,
                            created_at
                        FROM src
                    `
                }
            } else {
                for (const chunk of chunks) {
                    await sql`
                        WITH src AS (
                            SELECT * FROM jsonb_to_recordset(${JSON.stringify(chunk)}::jsonb)
                            AS x(
                                inventory_id uuid,
                                user_id text,
                                org_id text,
                                quantity numeric,
                                sale_price numeric,
                                total_amount numeric,
                                gst_amount numeric,
                                profit numeric,
                                payment_method text,
                                sale_date date,
                                created_at timestamptz,
                                row_number integer,
                                product_ref text
                            )
                        )
                        INSERT INTO sales (
                            id, inventory_id, user_id, org_id, quantity, sale_price,
                            total_amount, gst_amount, profit, sale_date, created_at
                        )
                        SELECT
                            gen_random_uuid(),
                            inventory_id,
                            NULLIF(user_id, '')::text,
                            org_id,
                            quantity,
                            sale_price,
                            total_amount,
                            gst_amount,
                            profit,
                            sale_date,
                            created_at
                        FROM src
                    `
                }
            }
            results.success += prepared.length
        }

        try {
            await audit("Imported Sales", "sale", undefined, { count: results.success }, orgId)

            // Sync Daily Reports for all affected dates
            console.log(`[Import/Sales] Syncing daily reports for ${uniqueDates.size} dates...`)
            await Promise.allSettled(Array.from(uniqueDates).map((date) => syncDailyReport(date, orgId)))

            revalidatePath("/dashboard/sales", "page");
            revalidatePath("/dashboard/reports", "page");
            (revalidateTag as any)("sales");
            (revalidateTag as any)(`sales-${orgId}`);
            (revalidateTag as any)(`reports-${orgId}`);
            await triggerSync(orgId, "sale");
            await triggerSync(orgId, "report");
        } catch (e) {
            console.warn("[Import/Sales] Non-fatal cleanup error:", e)
        }

        return { success: true, count: results.success, failed: results.failed, errors: results.errors }
    } catch (error: any) {
        console.error("FATAL: importSales crashed:", error)
        throw new Error(`Import failed: ${error.message}`)
    }
}

export async function importSuppliers(orgId: string, items: any[], options?: ImportOptions) {
    try {
        console.log(`[Import/Suppliers] Starting import for org ${orgId} with ${items.length} items...`)
        if (!options?.skipAuth) {
            await authorize("Import Suppliers", "manager", orgId)
        }

        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[]
        }

        const dek = await resolveImportDEK(orgId, "Suppliers")

        const preparedRowsRaw = await Promise.all(items.map(async (item, i) => {
            const name = item.name || item.Name || item.supplier || item.Supplier || item.name_contact || `Supplier ${i + 1}`
            const rawPhone = item.phone || item.Phone || item.Mobile || item.mobile || item.contact || item.number
            const phone = rawPhone || `AUTO-${Date.now()}-${i + 1}`
            const address = item.address || item.Address || item.location || ""
            // Tally exports include GSTIN — ensure it's captured
            const gstin = item.gstin || item.GSTIN || item.gst_no || item["GST No"] || item["GSTIN/UIN"] || null

            const safePhone = String(phone)
            const storedName = dek ? await encrypt(name, orgId, dek) : name
            const storedPhone = dek ? await encrypt(safePhone, orgId, dek) : safePhone
            const storedAddress = address
                ? (dek ? await encrypt(address, orgId, dek) : address)
                : null

            return {
                name: storedName,
                phone: storedPhone,
                address: storedAddress,
                gstin: gstin || null,
                org_id: orgId
            }
        }))
        const preparedRowsStripped = await stripRowsToTableColumns("suppliers", preparedRowsRaw)
        const preparedRows = await castRowsForTable("suppliers", preparedRowsStripped)

        try {
            let insertedCount = 0
            const chunks = chunkArray(preparedRows, getBulkChunkSize())
            for (const chunk of chunks) {
                const inserted = await sql`
                    WITH src AS (
                        SELECT * FROM jsonb_to_recordset(${JSON.stringify(chunk)}::jsonb)
                        AS x(name text, phone text, address text, org_id text)
                    )
                    INSERT INTO suppliers (id, name, phone, address, org_id)
                    SELECT gen_random_uuid(), name, phone, NULLIF(address, ''), org_id
                    FROM src
                    ON CONFLICT DO NOTHING
                    RETURNING id
                `
                insertedCount += Number((inserted as any[])?.length || 0)
            }
            results.success = insertedCount
            results.failed = Math.max(0, preparedRows.length - insertedCount)
        } catch (bulkError: any) {
            for (let i = 0; i < preparedRows.length; i++) {
                const r = preparedRows[i]
                try {
                    const row = await sql`
                        INSERT INTO suppliers (id, name, phone, address, org_id)
                        VALUES (gen_random_uuid(), ${r.name}, ${r.phone}, ${r.address}, ${r.org_id})
                        ON CONFLICT DO NOTHING
                        RETURNING id
                    `
                    if ((row as any[]).length > 0) {
                        results.success++
                    } else {
                        results.failed++
                    }
                } catch (itemError: any) {
                    results.failed++
                    results.errors.push(`Row ${i + 1}: ${itemError.message}`)
                }
            }
        }

        try {
            await audit("Imported Suppliers", "supplier", undefined, { count: results.success }, orgId)
            revalidatePath("/dashboard/suppliers", "page");
            (revalidateTag as any)(`suppliers-${orgId}`);
            await triggerSync(orgId, "khata");
        } catch (e) {
            console.warn("[Import/Suppliers] Non-fatal cleanup error:", e)
        }

        return { success: true, count: results.success, failed: results.failed, errors: results.errors }
    } catch (error: any) {
        console.error("FATAL: importSuppliers crashed:", error)
        throw new Error(`Import failed: ${error.message}`)
    }
}

export async function importExpenses(orgId: string, items: any[], options?: ImportOptions) {
    try {
        console.log(`[Import/Expenses] Starting import for org ${orgId} with ${items.length} items...`)
        const user = options?.skipAuth ? { id: options.actorUserId || null } : await authorize("Import Expenses", "manager", orgId)
        const { isGuestMode } = await import("./auth")
        const isGuest = await isGuestMode()
        const actorUserId = isGuest ? null : user.id

        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[]
        }

        const validRowsRaw: Array<{
            category: string
            amount: number
            description: string
            expense_date: string
            created_by: string | null
            org_id: string
        }> = []

        for (let i = 0; i < items.length; i++) {
            const item = items[i]
            try {
                const category = item.category || item.Category || item.type || item.Type || item.head || "Miscellaneous"
                // Strip currency symbols and commas before parsing — bare parseFloat('₹1,200') = NaN
                const rawAmount = String(item.amount ?? item.Amount ?? item.value ?? item.Value ?? item.total ?? item.Total ?? "0")
                const amount = parseFloat(rawAmount.replace(/[₹$€£¥,\s]/g, "").replace(/\((.+)\)/, "-$1")) || 0
                const description = item.description || item.Description || item.narration || item.Narration ||
                    item.particulars || item.Particulars || item.note || item.details || item.remarks || ""
                // Parse date through the same robust parser used for sales (handles DD/MM/YYYY, serial, etc.)
                const { saleDate: parsedDate } = parseImportedDateTime(
                    item.expense_date || item.date || item.Date || item.voucher_date || item["Voucher Date"] || null
                )
                const expense_date = parsedDate || new Date().toISOString().split("T")[0]

                if (amount <= 0) {
                    results.failed++
                    results.errors.push(`Row ${i + 1}: Invalid amount (${rawAmount}) for expense: ${description || category}`)
                    continue
                }

                validRowsRaw.push({
                    category,
                    amount,
                    description,
                    expense_date,
                    created_by: actorUserId,
                    org_id: orgId
                })
            } catch (itemError: any) {
                results.failed++
                results.errors.push(`Row ${i + 1}: ${itemError.message}`)
            }
        }

        const validRowsStripped = await stripRowsToTableColumns("expenses", validRowsRaw)
        const validRows = await castRowsForTable("expenses", validRowsStripped)
        if (validRows.length > 0) {
            try {
                const chunks = chunkArray(validRows, getBulkChunkSize())
                for (const chunk of chunks) {
                    await sql`
                        WITH src AS (
                            SELECT * FROM jsonb_to_recordset(${JSON.stringify(chunk)}::jsonb)
                            AS x(
                                category text,
                                amount numeric,
                                description text,
                                expense_date timestamptz,
                                created_by text,
                                org_id text
                            )
                        )
                        INSERT INTO expenses (id, category, amount, description, expense_date, created_by, org_id)
                        SELECT
                            gen_random_uuid(),
                            category,
                            amount,
                            description,
                            expense_date,
                            NULLIF(created_by, ''),
                            org_id
                        FROM src
                    `
                    results.success += chunk.length
                }
            } catch (bulkError: any) {
                for (let i = 0; i < validRows.length; i++) {
                    const r = validRows[i]
                    try {
                        await sql`
                            INSERT INTO expenses (id, category, amount, description, expense_date, created_by, org_id)
                            VALUES (gen_random_uuid(), ${r.category}, ${r.amount}, ${r.description}, ${r.expense_date}, ${r.created_by}, ${r.org_id})
                        `
                        results.success++
                    } catch (itemError: any) {
                        results.failed++
                        results.errors.push(`Row ${i + 1}: ${itemError.message}`)
                    }
                }
            }
        }

        try {
            await audit("Imported Expenses", "expense", undefined, { count: results.success }, orgId)
            revalidatePath("/dashboard/reports", "page");
            (revalidateTag as any)(`reports-${orgId}`);
            await triggerSync(orgId, "report");
        } catch (e) {
            console.warn("[Import/Expenses] Non-fatal cleanup error:", e)
        }

        return { success: true, count: results.success, failed: results.failed, errors: results.errors }
    } catch (error: any) {
        console.error("FATAL: importExpenses crashed:", error)
        throw new Error(`Import failed: ${error.message}`)
    }
}
