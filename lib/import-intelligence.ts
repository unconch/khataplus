

// ============================================================
// FIELD PATTERNS - Exhaustive Indian business software coverage
// Tally, Vyapar, Busy, Marg, Zoho, QuickBooks, Giddh, Recon
// ============================================================

const FIELD_PATTERNS: Record<string, string[]> = {
    sku: [
        "sku", "code", "item code", "product code", "article code", "part no",
        "part number", "barcode", "ean", "upc", "stock code", "stock id",
        "product id", "item id", "item no", "product no", "cat no", "catalog no",
        "catalogue no", "ref", "reference", "p code", "i code", "prod code",
        "article no", "style code", "model no", "model number", "sku code",
        "inventory code", "goods code", "item_code", "product_code", "sku_code",
        "alias", "short name", "stock keeping unit", "product identifier"
    ],
    name: [
        "name", "product", "item", "product name", "item name", "title",
        "description", "product description", "item description", "goods",
        "goods name", "article", "article name", "product title", "item title",
        "particulars", "stock name", "inventory name", "commodity", "material",
        "material name", "stock item", "stock_name", "product_name", "item_name",
        "goods_name", "prod name", "prod_name", "full name", "display name"
    ],
    buy_price: [
        "buy", "cost", "purchase", "buy price", "cost price", "purchase price",
        "buying price", "cp", "buying", "landed cost", "purchase rate",
        "cost rate", "buy rate", "purchase value", "cost value", "base price",
        "trade price", "dealer price", "wholesale price", "net price",
        "buy_price", "cost_price", "purchase_price", "buying_price", "pp",
        "standard cost", "avg cost", "average cost", "last purchase price"
    ],
    sell_price: [
        "sell", "mrp", "price", "selling", "sale price", "selling price",
        "retail", "sp", "rate", "unit price", "list price", "marked price",
        "retail price", "selling rate", "sale rate", "offer price",
        "market price", "customer price", "billing rate", "invoice rate",
        "sell_price", "selling_price", "sale_price", "retail_price",
        "sales rate", "basic price", "basic rate", "default price"
    ],
    stock: [
        "stock", "quantity", "qty", "available", "inventory", "units",
        "balance", "on hand", "in stock", "closing stock", "current stock",
        "opening stock", "stock qty", "available qty", "stock balance",
        "total stock", "physical stock", "actual stock", "warehouse qty",
        "stock_qty", "available_qty", "closing_stock", "opening_stock",
        "current qty", "net qty", "remaining stock", "stock in hand"
    ],
    hsn_code: [
        "hsn", "hsn code", "hsn_code", "hsncode", "tax code", "hsn no",
        "hs code", "tariff code", "commodity code", "hsn/sac", "sac",
        "sac code", "hsnsac", "hsn sac code", "service code", "chapter"
    ],
    gst_percentage: [
        "gst", "tax", "gst%", "tax%", "gst rate", "tax rate", "vat",
        "gst percentage", "tax percentage", "igst", "cgst", "sgst",
        "gst slab", "tax slab", "duty", "cess", "gst_rate", "tax_rate",
        "gst_percentage", "taxrate", "gst applicable", "tax type"
    ],
    min_stock: [
        "min", "minimum", "reorder", "min stock", "minimum stock",
        "reorder level", "reorder point", "safety stock", "buffer stock",
        "min qty", "minimum qty", "min_stock", "reorder_level", "min_qty",
        "alert qty", "low stock alert", "minimum level"
    ],
    name_contact: [
        "name", "customer name", "supplier name", "party name", "company",
        "company name", "business name", "firm", "firm name", "client",
        "client name", "account", "account name", "ledger", "ledger name",
        "vendor", "vendor name", "contact name", "full name", "person",
        "trade name", "trading name", "registered name", "proprietor"
    ],
    phone: [
        "phone", "mobile", "contact", "phone no", "mobile no", "whatsapp",
        "cell", "telephone", "ph", "mob", "phone number", "mobile number",
        "contact number", "contact no", "cell no", "tel", "ph no",
        "primary phone", "primary mobile", "main phone", "contact_number",
        "phone_number", "mobile_number", "tele", "mobi", "phone1", "mobile1",
        "contact1", "primary contact", "wa", "wp"
    ],
    email: [
        "email", "mail", "email id", "email address", "e-mail", "e mail",
        "email_id", "email_address", "email1", "contact email"
    ],
    address: [
        "address", "location", "addr", "address line", "street", "full address",
        "billing address", "shipping address", "city", "area", "locality",
        "pincode", "zip", "state", "district", "complete address",
        "delivery address", "registered address", "address_line",
        "address1", "address2", "town", "village", "taluk", "mandal"
    ],
    gstin: [
        "gstin", "gst no", "gst number", "tin", "tax id", "gst id",
        "gstn", "gst reg no", "gst registration", "gstin number",
        "vat no", "vat number", "cst no", "pan", "pan no", "gst_no"
    ],
    credit_limit: [
        "credit limit", "credit", "limit", "credit_limit", "max credit",
        "credit days", "payment terms", "credit period", "credit amount"
    ],
    balance: [
        "balance", "outstanding", "due", "amount due", "pending",
        "credit balance", "debit balance", "opening balance", "closing balance",
        "net balance", "receivable", "payable"
    ],
    quantity: [
        "quantity", "qty", "units", "count", "no", "number", "pieces",
        "pcs", "nos", "unit", "sold qty", "sale qty", "invoice qty",
        "billed qty", "dispatched qty", "nos.", "unit sold"
    ],
    sale_price: [
        "sale price", "price", "rate", "amount", "selling price", "unit price",
        "billing rate", "invoice rate", "charge", "value", "per unit",
        "unit rate", "actual rate", "net rate"
    ],
    total_amount: [
        "total", "total amount", "net amount", "invoice amount", "bill amount",
        "net total", "grand total", "total value", "subtotal", "sub total",
        "total_amount", "net_amount", "invoice total", "bill total", "net payable"
    ],
    discount: [
        "discount", "disc", "rebate", "reduction", "discount amount",
        "discount%", "disc%", "discount rate", "trade discount", "cash discount"
    ],
    payment_method: [
        "payment", "method", "payment method", "payment_method", "pay mode",
        "mode", "payment mode", "pay type", "payment type", "tender",
        "paid by", "payment by", "settlement mode", "payment via", "pay via",
        "medium", "channel", "transaction mode"
    ],
    customer_name: [
        "customer", "customer name", "client", "buyer", "party", "party name",
        "sold to", "bill to", "billed to", "purchaser"
    ],
    customer_phone: [
        "customer phone", "customer mobile", "client phone", "buyer phone",
        "customer contact", "party mobile", "party phone"
    ],
    sale_date: [
        "date", "sale date", "invoice date", "bill date", "transaction date",
        "order date", "booking date", "created", "timestamp", "sale_date",
        "invoice_date", "voucher date", "doc date", "entry date"
    ],
    invoice_no: [
        "invoice", "invoice no", "bill no", "receipt no", "voucher no",
        "order no", "ref no", "transaction id", "bill number", "invoice_no",
        "challan no", "doc no", "document number", "series"
    ],
    category: [
        "category", "type", "expense type", "head", "expense head",
        "account head", "ledger head", "expense category", "cost head",
        "nature", "nature of expense", "group", "sub group", "class"
    ],
    amount: [
        "amount", "value", "expense", "cost", "total", "sum", "paid",
        "expense amount", "payment amount", "debit", "credit", "net"
    ],
    description: [
        "description", "details", "note", "remarks", "narration",
        "particulars", "memo", "purpose", "reason", "notes", "comments",
        "info", "detail", "annotation"
    ],
    expense_date: [
        "date", "expense date", "transaction date", "bill date", "created",
        "voucher date", "payment date", "entry date", "doc date"
    ],
}

// ============================================================
// PRIVACY-SAFE STRUCTURE EXTRACTION (for AI analysis)
// ============================================================

export function extractStructureOnly(rows: any[]): {
    columns: string[]
    types: Record<string, string>
    rowCount: number
    samplePatterns: Record<string, string>
} {
    if (rows.length === 0) return { columns: [], types: {}, rowCount: 0, samplePatterns: {} }

    const columns = Object.keys(rows[0])
    const types: Record<string, string> = {}
    const samplePatterns: Record<string, string> = {}

    columns.forEach(col => {
        const samples = rows
            .slice(0, 30)
            .map(r => r[col])
            .filter(v => v !== null && v !== undefined && v !== "")

        if (samples.length === 0) {
            types[col] = "empty"
            samplePatterns[col] = "empty"
            return
        }

        // Detect type - NEVER include actual values
        const allNumeric = samples.every(v =>
            !isNaN(parseFloat(v?.toString().replace(/[₹$,\s]/g, "")))
        )
        const hasPhone = samples.some(v => {
            const digits = v?.toString().replace(/\D/g, "")
            return digits?.length >= 10 && /^[6-9]/.test(digits.slice(-10))
        })
        const hasDate = samples.some(v =>
            /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(v?.toString()) ||
            /^\d{4}-\d{2}-\d{2}/.test(v?.toString())
        )
        const hasGSTIN = samples.some(v =>
            /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(v?.toString())
        )
        const allCodes = samples.every(v =>
            /^[A-Z0-9_\-/]+$/i.test(v?.toString()) && v?.toString().length <= 30
        )
        const avgLength = samples.reduce((s, v) => s + v?.toString().length, 0) / samples.length

        if (hasGSTIN) { types[col] = "gstin"; samplePatterns[col] = "XX_XXXXX_XXXX_X_XX_Z_X" }
        else if (hasDate) { types[col] = "date"; samplePatterns[col] = "DD/MM/YYYY" }
        else if (hasPhone) { types[col] = "phone"; samplePatterns[col] = "10_digit_number" }
        else if (allNumeric && avgLength < 10) { types[col] = "number"; samplePatterns[col] = "numeric" }
        else if (allCodes) { types[col] = "code"; samplePatterns[col] = "alphanumeric_code" }
        else if (avgLength > 30) { types[col] = "long_text"; samplePatterns[col] = "long_text" }
        else { types[col] = "text"; samplePatterns[col] = "short_text" }
    })

    return { columns, types, rowCount: rows.length, samplePatterns }
}

// ============================================================
// DATA TYPE INFERENCE (local, for pattern matching)
// ============================================================

function inferColumnType(values: any[]): string {
    const samples = values.filter(v => v !== null && v !== undefined && v !== "").slice(0, 30)
    if (samples.length === 0) return "empty"

    let numericCount = 0, phoneCount = 0, dateCount = 0, codeCount = 0, gstinCount = 0

    const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i
    const datePatterns = [
        /^\d{4}-\d{2}-\d{2}/, /^\d{2}\/\d{2}\/\d{4}/,
        /^\d{2}-\d{2}-\d{4}/, /^\d{2}-[A-Za-z]{3}-\d{4}/
    ]
    const codePattern = /^[A-Z0-9_\-/\\]+$/i

    samples.forEach(v => {
        const str = v.toString().trim()
        if (!isNaN(parseFloat(str.replace(/[₹$,\s]/g, "")))) numericCount++
        const digits = str.replace(/\D/g, "")
        if (digits.length >= 10 && /^[6-9]/.test(digits.slice(-10))) phoneCount++
        if (datePatterns.some(p => p.test(str))) dateCount++
        if (codePattern.test(str) && str.length <= 30) codeCount++
        if (gstinPattern.test(str)) gstinCount++
    })

    const r = (n: number) => n / samples.length
    if (r(gstinCount) > 0.5) return "gstin"
    if (r(dateCount) > 0.5) return "date"
    if (r(phoneCount) > 0.4 && r(numericCount) < 0.8) return "phone"
    if (r(numericCount) > 0.7) return "number"
    if (r(codeCount) > 0.7) return "code"
    return "text"
}

// ============================================================
// FUZZY MATCHING
// ============================================================

function levenshtein(a: string, b: string): number {
    const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i])
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            matrix[i][j] = b[i - 1] === a[j - 1]
                ? matrix[i - 1][j - 1]
                : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        }
    }
    return matrix[b.length][a.length]
}

function fuzzyMatchScore(csvColumn: string, pattern: string): number {
    const col = csvColumn.toLowerCase().trim()
    const pat = pattern.toLowerCase().trim()

    if (col === pat) return 1.0
    if (col.includes(pat) || pat.includes(col)) return 0.85

    const colWords = col.split(/[\s_\-/]+/)
    const patWords = pat.split(/[\s_\-/]+/)
    const allMatch = patWords.every(w => colWords.some(cw => cw.includes(w) || w.includes(cw)))
    if (allMatch && patWords.length > 1) return 0.78

    const anyMatch = patWords.some(w => colWords.some(cw => cw === w))
    if (anyMatch && patWords.length === 1 && pat.length > 3) return 0.65

    const distance = levenshtein(col, pat)
    const similarity = 1 - distance / Math.max(col.length, pat.length)
    if (similarity > 0.75) return similarity * 0.55

    return 0
}

function getTypeMatchBonus(field: string, dataType: string): number {
    const expected: Record<string, string[]> = {
        buy_price: ["number"], sell_price: ["number"], stock: ["number"],
        quantity: ["number"], amount: ["number"], gst_percentage: ["number"],
        total_amount: ["number"], sale_price: ["number"], balance: ["number"],
        credit_limit: ["number"], discount: ["number"],
        phone: ["phone", "number"], gstin: ["gstin", "code", "text"],
        sku: ["code", "text"], hsn_code: ["code", "number", "text"],
        expense_date: ["date"], sale_date: ["date"],
    }
    const exp = expected[field]
    if (!exp) return 0
    return exp.includes(dataType) ? 0.15 : -0.15
}

function findBestColumnMatch(
    columns: string[],
    field: string,
    usedColumns: Set<string>,
    columnTypes: Record<string, string>
): { column: string; score: number } | null {
    const patterns = FIELD_PATTERNS[field] || [field]
    let best: { column: string; score: number } | null = null

    for (const column of columns) {
        if (usedColumns.has(column)) continue

        let topScore = 0
        for (const pattern of patterns) {
            const score = fuzzyMatchScore(column, pattern)
            if (score > topScore) topScore = score
        }

        if (topScore > 0) {
            const bonus = getTypeMatchBonus(field, columnTypes[column] || "text")
            topScore = Math.min(1.0, topScore + bonus)
        }

        if (topScore > 0.4 && (!best || topScore > best.score)) {
            best = { column, score: topScore }
        }
    }

    return best
}

// ============================================================
// MAIN ANALYSIS (pattern matching - always works offline)
// ============================================================

export function analyzeCSVStructure(data: any[], targetType: string) {
    if (data.length === 0) {
        return { schema: {}, warnings: ["No data found in file"], confidence: 0, columnTypes: {}, unmappedColumns: [], totalRows: 0 }
    }

    const columns = Object.keys(data[0])
    const schema: Record<string, string> = {}
    const warnings: string[] = []
    const usedColumns = new Set<string>()

    const columnTypes: Record<string, string> = {}
    columns.forEach(col => {
        columnTypes[col] = inferColumnType(data.slice(0, 50).map(r => r[col]))
    })

    const expectedFields = getExpectedFields(targetType)
    const requiredFields = getRequiredFields(targetType)
    let matchedRequired = 0

    const sorted = [...expectedFields].sort((a, b) =>
        (requiredFields.includes(a) ? 0 : 1) - (requiredFields.includes(b) ? 0 : 1)
    )

    sorted.forEach(field => {
        const match = findBestColumnMatch(columns, field, usedColumns, columnTypes)
        if (match && match.score >= 0.4) {
            schema[field] = match.column
            usedColumns.add(match.column)
            if (requiredFields.includes(field)) matchedRequired++
            if (match.score < 0.65) {
                warnings.push(`Low confidence: "${match.column}" → "${field}" (${Math.round(match.score * 100)}%) — please verify`)
            }
        } else if (requiredFields.includes(field)) {
            warnings.push(`⚠️ "${field}" not detected — will be auto-generated`)
        }
    })

    const unmapped = columns.filter(c => !usedColumns.has(c))
    if (unmapped.length > 0 && unmapped.length <= 5) {
        warnings.push(`Unmapped columns (ignored): ${unmapped.join(", ")}`)
    } else if (unmapped.length > 5) {
        warnings.push(`${unmapped.length} unmapped columns ignored`)
    }

    const confidence = requiredFields.length > 0
        ? matchedRequired / requiredFields.length
        : expectedFields.length > 0 ? Object.keys(schema).length / expectedFields.length : 1

    return { schema, warnings, confidence, columnTypes, unmappedColumns: unmapped, totalRows: data.length }
}

// ============================================================
// AI-ENHANCED ANALYSIS (merges AI + pattern matching)
// ============================================================

export async function analyzeWithAI(
    data: any[],
    targetType: string
): Promise<{
    schema: Record<string, string>
    warnings: string[]
    confidence: number
    usedAI: boolean
    suggestions: string[]
}> {
    // Always run pattern matching as baseline
    const patternResult = analyzeCSVStructure(data, targetType)

    // Only call AI if pattern matching confidence is low OR key fields are missing
    const requiredFields = getRequiredFields(targetType)
    const missingRequired = requiredFields.filter(f => !patternResult.schema[f])
    const shouldUseAI = patternResult.confidence < 0.7 || missingRequired.length > 0

    if (!shouldUseAI) {
        return {
            ...patternResult,
            usedAI: false,
            suggestions: []
        }
    }

    try {
        // PRIVACY: Send only structure metadata - ZERO actual data
        const structure = extractStructureOnly(data)

        const response = await fetch("/api/analyze-csv", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                dataType: targetType,
                structure, // Only column names + types - NO actual values
                existingSchema: patternResult.schema, // What we already detected
                missingFields: missingRequired // What we need help with
            })
        })

        if (!response.ok) throw new Error("AI API unavailable")

        const aiResult = await response.json()

        if (!aiResult.schema || Object.keys(aiResult.schema).length === 0) {
            throw new Error("Empty AI response")
        }

        // Validate AI schema - ensure columns actually exist in CSV
        const columns = Object.keys(data[0] || {})
        const validAISchema: Record<string, string> = {}

        Object.entries(aiResult.schema).forEach(([dbField, csvCol]: [string, any]) => {
            // Exact match
            if (columns.includes(csvCol)) {
                validAISchema[dbField] = csvCol
                return
            }
            // Case-insensitive match
            const caseMatch = columns.find(c => c.toLowerCase().trim() === csvCol?.toLowerCase()?.trim())
            if (caseMatch) {
                validAISchema[dbField] = caseMatch
                return
            }
            // Fuzzy match as last resort
            const fuzzyMatch = columns.find(c => fuzzyMatchScore(c, csvCol) > 0.7)
            if (fuzzyMatch) validAISchema[dbField] = fuzzyMatch
        })

        // Merge: pattern matching fills gaps AI missed, AI fills gaps patterns missed
        const mergedSchema = {
            ...patternResult.schema, // Pattern matching base
            ...validAISchema          // AI overrides where it's more confident
        }

        const mergedConfidence = Math.max(patternResult.confidence, aiResult.confidence || 0)

        console.log(`[Import] AI enhanced: ${Object.keys(validAISchema).length} fields, confidence: ${Math.round(mergedConfidence * 100)}%`)

        return {
            schema: mergedSchema,
            warnings: [...(patternResult.warnings || []), ...(aiResult.warnings || [])],
            confidence: mergedConfidence,
            usedAI: true,
            suggestions: aiResult.suggestions || []
        }
    } catch (error: any) {
        console.warn("[Import] AI unavailable, using pattern matching:", error.message)
        return {
            ...patternResult,
            usedAI: false,
            suggestions: ["Using automatic pattern matching (AI analysis unavailable)"]
        }
    }
}

// ============================================================
// DATA CLEANING
// ============================================================

function cleanValue(value: any, field: string): any {
    if (value === null || value === undefined) return null
    const str = value.toString().trim()

    const nullValues = ["", "-", "n/a", "na", "nil", "null", "none", "undefined", "0.00", "--", "---"]
    if (nullValues.includes(str.toLowerCase())) return null

    // Numeric fields
    const numericFields = [
        "buy_price", "sell_price", "stock", "quantity", "amount",
        "total_amount", "gst_percentage", "discount", "balance",
        "credit_limit", "sale_price", "min_stock"
    ]
    if (numericFields.includes(field)) {
        const cleaned = str.replace(/[₹$€£¥,\s]/g, "").replace(/\((.+)\)/, "-$1")
        const num = parseFloat(cleaned)
        if (isNaN(num)) return 0
        return field === "stock" || field === "quantity" || field === "min_stock"
            ? Math.max(0, Math.round(num))
            : Math.abs(Math.round(num * 100) / 100)
    }

    // Phone - normalize to 10 digits
    if (field === "phone" || field === "customer_phone") {
        const digits = str.replace(/\D/g, "")
        if (digits.length >= 12 && digits.startsWith("91")) return digits.slice(2, 12)
        if (digits.length >= 10) return digits.slice(-10)
        if (digits.length >= 7) return digits
        return null
    }

    // SKU - uppercase, clean
    if (field === "sku") {
        const clean = str.toUpperCase().replace(/\s+/g, "-").replace(/[^A-Z0-9_\-/]/g, "")
        return clean.length > 0 ? clean : null
    }

    // HSN code - digits and basic chars
    if (field === "hsn_code") {
        return str.replace(/\s/g, "").replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 8)
    }

    // GSTIN - validate format
    if (field === "gstin") {
        const cleaned = str.toUpperCase().replace(/\s/g, "")
        const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
        if (!gstinPattern.test(cleaned)) return cleaned // Store as-is even if invalid
        return cleaned
    }

    // Dates
    if (["expense_date", "sale_date", "date"].includes(field)) {
        return parseDate(str)
    }

    // Payment method normalization
    if (field === "payment_method") {
        const lower = str.toLowerCase()
        if (/cash|hand|nakit|naqd/.test(lower) || lower === "c") return "Cash"
        if (/upi|gpay|google pay|paytm|phonepe|phone pe|bhim|razorpay|whatsapp pay/.test(lower)) return "UPI"
        if (/debit card|credit card|card/.test(lower)) return "Card"
        if (/credit|khata|due|udhar|baaki|baki|credit note/.test(lower)) return "Credit"
        if (/bank|neft|rtgs|imps|transfer|cheque|check|dd|draft/.test(lower)) return "Bank Transfer"
        if (/online|net banking|internet/.test(lower)) return "UPI"
        return "Cash"
    }

    // Expense category normalization
    if (field === "category") {
        const lower = str.toLowerCase()
        if (/rent|lease|property/.test(lower)) return "Rent"
        if (/salary|wage|staff|employee|labour|labor|payroll/.test(lower)) return "Salary"
        if (/electric|power|light|util|water|internet|broadband|wifi/.test(lower)) return "Utilities"
        if (/transport|freight|deliver|logistics|courier|shipping/.test(lower)) return "Transport"
        if (/market|advertis|promo|campaign|social media|print/.test(lower)) return "Marketing"
        if (/repair|maintenance|maint|service|amc/.test(lower)) return "Maintenance"
        if (/food|tea|meal|pantry|canteen|refreshment/.test(lower)) return "Food & Beverage"
        if (/purchase|procurement|buying|stock purchase/.test(lower)) return "Purchase"
        if (/bank|interest|loan|finance|charge/.test(lower)) return "Finance Charges"
        if (/tax|gst|tds|tcs|duty/.test(lower)) return "Taxes"
        return str.split(" ").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")
    }

    return str
}

function parseDate(str: string): string {
    if (!str) return new Date().toISOString()

    try {
        const s = str.toString().trim()

        // DD/MM/YYYY or D/M/YYYY
        const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
        if (dmy) {
            const d = new Date(`${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`)
            if (!isNaN(d.getTime())) return d.toISOString()
        }

        // DD-MMM-YYYY (01-Jan-2024)
        const dMonY = s.match(/^(\d{1,2})[- ]([A-Za-z]{3,9})[- ](\d{4})$/)
        if (dMonY) {
            const d = new Date(`${dMonY[1]} ${dMonY[2]} ${dMonY[3]}`)
            if (!isNaN(d.getTime())) return d.toISOString()
        }

        // YYYY/MM/DD
        const ymd = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/)
        if (ymd) {
            const d = new Date(`${ymd[1]}-${ymd[2].padStart(2, "0")}-${ymd[3].padStart(2, "0")}`)
            if (!isNaN(d.getTime())) return d.toISOString()
        }

        // Excel serial number (40000-60000)
        const serial = parseInt(s)
        if (!isNaN(serial) && serial > 40000 && serial < 60000) {
            return new Date((serial - 25569) * 86400 * 1000).toISOString()
        }

        // ISO or other parseable formats
        const parsed = new Date(s)
        if (!isNaN(parsed.getTime())) return parsed.toISOString()
    } catch { }

    return new Date().toISOString()
}

// ============================================================
// AUTO-GENERATION RULES
// ============================================================

function applyAutoGenerationRules(row: any, type: string, index: number): any {
    const r = { ...row }

    if (type === "inventory") {
        if (!r.name || r.name === "null") r.name = `Product ${index + 1}`
        if (!r.sku) {
            r.sku = r.name
                ? `SKU-${r.name.substring(0, 8).toUpperCase().replace(/[^A-Z0-9]/g, "")}-${String(index + 1).padStart(4, "0")}`
                : `SKU-AUTO-${String(index + 1).padStart(4, "0")}`
        }
        if (r.buy_price === null || r.buy_price === undefined) r.buy_price = 0
        if (!r.sell_price || r.sell_price === 0) r.sell_price = r.buy_price > 0 ? r.buy_price : 0
        if (r.stock === null || r.stock === undefined) r.stock = 0
        if (r.gst_percentage === null || r.gst_percentage === undefined) r.gst_percentage = 0
        if (r.min_stock === null || r.min_stock === undefined) r.min_stock = 5
        if (!r.hsn_code) r.hsn_code = ""
    }

    if (type === "customers" || type === "suppliers") {
        if (!r.name || r.name === "null") {
            r.name = r.phone
                ? `${type === "customers" ? "Customer" : "Supplier"}-${r.phone.slice(-4)}`
                : `${type === "customers" ? "Customer" : "Supplier"} ${index + 1}`
        }
        if (!r.address) r.address = ""
        if (!r.email) r.email = null
    }

    if (type === "sales") {
        if (!r.payment_method) r.payment_method = "Cash"
        if (!r.quantity || r.quantity === 0) r.quantity = 1
        if (!r.sale_date) r.sale_date = new Date().toISOString()
        if (r.sale_price === null || r.sale_price === undefined) r.sale_price = 0
        if (!r.customer_name) r.customer_name = null
        if (!r.customer_phone) r.customer_phone = null
    }

    if (type === "expenses") {
        if (!r.category) r.category = "Miscellaneous"
        if (!r.expense_date) r.expense_date = new Date().toISOString()
        if (!r.description) r.description = r.category || "Expense"
        if (!r.amount || r.amount <= 0) r._skip = true
    }

    return r
}

// ============================================================
// TRANSFORM
// ============================================================

export function transformData(rawData: any[], schema: Record<string, string>, targetType: string) {
    const results = { transformed: [] as any[], skipped: 0, cleaned: 0 }

    rawData.forEach((row, index) => {
        const transformed: any = { _rowNumber: index + 2 }
        let wasCleaned = false

        Object.entries(schema).forEach(([targetField, sourceColumn]) => {
            const raw = row[sourceColumn]
            const cleaned = cleanValue(raw, targetField)
            if (raw !== null && raw !== undefined && cleaned !== raw?.toString()?.trim()) wasCleaned = true
            transformed[targetField] = cleaned
        })

        // Carry over migration-critical fields not in schema (IDs, foreign keys)
        const passthroughFields = ["id", "ID", "inventory_id", "product_id", "user_id", "org_id", "created_at", "updated_at"]
        passthroughFields.forEach(field => {
            if (row[field] !== undefined && row[field] !== null && !(field in transformed)) {
                transformed[field] = row[field]
            }
        })

        const finalized = applyAutoGenerationRules(transformed, targetType, index)

        if (finalized._skip) { results.skipped++; return }

        const meaningfulValues = Object.entries(finalized)
            .filter(([k]) => k !== "_rowNumber" && k !== "_skip")
            .filter(([, v]) => v !== null && v !== undefined && v !== "")

        if (meaningfulValues.length === 0) { results.skipped++; return }

        if (wasCleaned) results.cleaned++
        results.transformed.push(finalized)
    })

    return results
}

// ============================================================
// VALIDATION
// ============================================================

export function validateData(data: any[], targetType: string) {
    const errors: string[] = []
    const warnings: string[] = []
    const skus = new Set<string>()
    const phones = new Set<string>()

    data.forEach((row, i) => {
        const rowNum = row._rowNumber || i + 2

        if (targetType === "inventory") {
            if (!row.name) errors.push(`Row ${rowNum}: Missing product name`)
            if (!row.sku) errors.push(`Row ${rowNum}: Missing SKU`)
            if (row.sku) {
                if (skus.has(row.sku)) warnings.push(`Row ${rowNum}: Duplicate SKU "${row.sku}" → will update`)
                else skus.add(row.sku)
            }
            if (row.buy_price > 0 && row.sell_price > 0 && row.sell_price < row.buy_price) {
                warnings.push(`Row ${rowNum}: Sell price ₹${row.sell_price} < buy price ₹${row.buy_price}`)
            }
            if (row.gst_percentage > 0 && ![0, 0.1, 0.25, 1, 1.5, 3, 5, 6, 7.5, 9, 12, 14, 18, 28].includes(row.gst_percentage)) {
                warnings.push(`Row ${rowNum}: Unusual GST rate ${row.gst_percentage}% — verify`)
            }
        }

        if (targetType === "customers" || targetType === "suppliers") {
            const phone = row.phone || row.customer_phone
            if (!phone) errors.push(`Row ${rowNum}: Missing phone number`)
            if (phone) {
                if (phone.length !== 10) warnings.push(`Row ${rowNum}: Phone "${phone}" may be invalid`)
                if (phones.has(phone)) warnings.push(`Row ${rowNum}: Duplicate phone → will update`)
                else phones.add(phone)
            }
        }

        if (targetType === "sales") {
            if (!row.sku) errors.push(`Row ${rowNum}: Missing SKU (required to link to inventory)`)
            if (row.quantity <= 0) warnings.push(`Row ${rowNum}: Zero/negative quantity`)
            if (row.sale_price === 0) warnings.push(`Row ${rowNum}: Sale price is ₹0`)
        }

        if (targetType === "expenses") {
            if (!row.amount || row.amount <= 0) errors.push(`Row ${rowNum}: Invalid expense amount`)
        }
    })

    return { errors, warnings }
}

// ============================================================
// HELPERS
// ============================================================

function getExpectedFields(type: string): string[] {
    const map: Record<string, string[]> = {
        inventory: ["sku", "name", "buy_price", "sell_price", "stock", "hsn_code", "gst_percentage", "min_stock"],
        customers: ["name_contact", "phone", "email", "address", "balance", "credit_limit"],
        sales: ["sku", "quantity", "sale_price", "total_amount", "payment_method", "customer_name", "sale_date", "invoice_no"],
        suppliers: ["name_contact", "phone", "address", "gstin"],
        expenses: ["category", "amount", "description", "expense_date"]
    }
    return map[type] || []
}

function getRequiredFields(type: string): string[] {
    const map: Record<string, string[]> = {
        inventory: ["name"],
        customers: ["phone"],
        sales: ["sku"],
        suppliers: ["name_contact", "phone"],
        expenses: ["amount"]
    }
    return map[type] || []
}

