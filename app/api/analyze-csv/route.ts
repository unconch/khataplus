import { NextResponse } from "next/server"
import { groqChat, groqWithRetry, parseGroqJSON, isGroqAvailable } from "@/lib/groq"
import { analyzeCSVStructure, transformData, validateData, extractStructureOnly } from "@/lib/import-intelligence"

const EXPECTED_FIELDS: Record<string, string[]> = {
    inventory: ["sku", "name", "buy_price", "sell_price", "stock", "hsn_code", "gst_percentage", "min_stock"],
    customers: ["name", "phone", "email", "address", "balance"],
    sales: ["sku", "quantity", "sale_price", "total_amount", "payment_method", "customer_name", "sale_date"],
    suppliers: ["name", "phone", "address", "gstin"],
    expenses: ["category", "amount", "description", "expense_date"]
}

export async function POST(request: Request) {
    try {
        const { dataType, data } = await request.json()

        if (!dataType || !data) {
            return NextResponse.json({ error: "Missing dataType or data" }, { status: 400 })
        }

        // 1. Initial Analysis (Baseline Pattern Match)
        const patternResult = analyzeCSVStructure(data, dataType)

        let aiResult = { schema: {} as Record<string, string>, confidence: 0, warnings: [] as string[], suggestions: [] as string[], cleaningHints: {} }
        let usedAI = false

        if (isGroqAvailable()) {
            try {
                usedAI = true
                const structure = extractStructureOnly(data)
                const expected = EXPECTED_FIELDS[dataType] || []
                const requiredFields = getRequiredFields(dataType)
                const missingFields = requiredFields.filter(f => !patternResult.schema[f])

                const prompt = `You are a data intelligence expert for KhataPlus, an Indian business software.
Analyze actual data samples and map CSV columns to database fields. Also suggest data quality fixes.

TARGET TABLE: ${dataType}
EXPECTED FIELDS: ${expected.join(", ")}
ALREADY DETECTED BY PATTERN MATCHING: ${JSON.stringify(patternResult.schema)}
MISSING REQUIRED FIELDS: ${missingFields.join(", ") || "none"}

COLUMN METADATA (types): ${JSON.stringify(structure.types)}
ACTUAL DATA SAMPLES (first 8 rows): ${JSON.stringify(data.slice(0, 8))}

INDIAN BUSINESS CONTEXT:
- MRP/Selling/Rate → sell_price
- Cost/Purchase/CP → buy_price  
- Qty/Stock/Closing → stock
- Party/Ledger/Name → name (for customers/suppliers)
- Ph/WhatsApp/Mobile → phone
- created_at/updated_at → sale_date or expense_date
- inventory_id/product_id → these are UUIDs referencing inventory, map to "sku" 
- user_id/profile_id → ignore these (internal IDs)

RULES:
1. Return a "schema" mapping: { "db_field": "csv_column_name" }
2. Only map columns that ACTUALLY EXIST in the sample data
3. If the pattern matching already correctly mapped a field, keep it
4. If a column contains IDs (UUIDs), note it in warnings
5. Return "cleaningHints" for any data that needs transformation
6. Return data quality "warnings" (missing values, bad formats, etc.)

RESPOND WITH JSON:
{
  "schema": { "db_field": "csv_column" },
  "confidence": 0.0,
  "warnings": ["..."],
  "suggestions": ["..."],
  "cleaningHints": { "field": "instruction" }
}`

                const responseText = await groqWithRetry(() => groqChat(prompt))
                aiResult = parseGroqJSON(responseText, aiResult)
                console.log(`[analyze-csv] Groq returned schema:`, JSON.stringify(aiResult.schema))
            } catch (aiError: any) {
                console.warn("[analyze-csv] Groq failed, using pattern matching only:", aiError.message)
                usedAI = false
            }
        }

        // 2. Combine and Transform
        const finalSchema = { ...patternResult.schema, ...aiResult.schema }
        const results = transformData(data, finalSchema, dataType)

        // 3. Final Validation
        const validation = validateData(results.transformed, dataType)

        return NextResponse.json({
            ...results,
            schema: finalSchema,
            confidence: Math.max(patternResult.confidence, aiResult.confidence),
            warnings: [...patternResult.warnings, ...(aiResult.warnings || []), ...validation.warnings],
            errors: validation.errors,
            suggestions: aiResult.suggestions || [],
            cleaningHints: aiResult.cleaningHints || {},
            usedAI
        })

    } catch (error: any) {
        console.error("[analyze-csv] Processing Error:", error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

function getRequiredFields(type: string): string[] {
    const map: Record<string, string[]> = {
        inventory: ["name"],
        customers: ["name"],
        sales: ["sku"],
        suppliers: ["name"],
        expenses: ["amount"]
    }
    return map[type] || []
}
