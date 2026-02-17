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

        let aiResult = {
            schema: {} as Record<string, string>,
            confidence: 0,
            warnings: [] as string[],
            suggestions: [] as string[],
            cleaningHints: {},
            reasoning: "" as string | undefined
        }
        let usedAI = false

        if (isGroqAvailable()) {
            try {
                usedAI = true
                const structure = extractStructureOnly(data)
                const expected = EXPECTED_FIELDS[dataType] || []
                const requiredFields = getRequiredFields(dataType)
                const missingFields = requiredFields.filter(f => !patternResult.schema[f])

                // Using DeepSeek-R1 for Maximum Accuracy
                const prompt = `You are a data intelligence expert for KhataPlus. 
Analyze the provided data samples and map CSV columns to database fields with 100% precision.

TARGET TABLE: ${dataType}
EXPECTED FIELDS: ${expected.join(", ")}
ALREADY DETECTED: ${JSON.stringify(patternResult.schema)}
MISSING REQUIRED: ${missingFields.join(", ") || "none"}

DATA SAMPLES: ${JSON.stringify(data.slice(0, 15))}

INSTRUCTIONS:
1. Reason through the data types and values in each column.
2. If a column name is ambiguous (e.g. "VAR1"), look at the row values to identify if it's a price, name, or phone number.
3. Return a JSON mapping of db_field to csv_column.
4. Set "confidence" to 0.95 if you are certain, or lower if data is messy.

RESPOND WITH JSON:
{
  "schema": { "db_field": "csv_column" },
  "confidence": 0.0,
  "warnings": ["..."],
  "suggestions": ["..."],
  "cleaningHints": { "field": "instruction" }
}`

                const responseText = await groqWithRetry(() => groqChat(prompt, "deepseek-r1-distill-llama-70b"))
                const { data: parsedAI, reasoning } = parseGroqJSON(responseText, aiResult)
                aiResult = parsedAI as any
                aiResult.reasoning = reasoning

                // If R1 mapped anything, it's highly likely correct
                if (Object.keys(aiResult.schema).length > 0 && aiResult.confidence < 0.8) {
                    aiResult.confidence = 0.92
                }

                console.log(`[analyze-csv] R1 analyzed ${dataType}. Confidence: ${aiResult.confidence}`)
            } catch (aiError: any) {
                console.warn("[analyze-csv] Groq failed:", aiError.message)
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
            reasoning: aiResult.reasoning,
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
