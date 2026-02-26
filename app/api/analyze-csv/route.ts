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

type SourceProfile = {
    id: string
    signals: string[]
    notes: string[]
}

const SOURCE_PROFILES: SourceProfile[] = [
    {
        id: "tally",
        signals: ["voucher", "particulars", "stock item", "vch", "ledger", "gst rate", "uom"],
        notes: [
            "Sales product is usually in 'Stock Item' / 'Particulars'.",
            "Do NOT map UOM/Unit/PCS/NOS as SKU or product.",
            "Voucher date often maps to sale_date."
        ]
    },
    {
        id: "vyapar",
        signals: ["party name", "bill no", "hsn/sac", "opening stock", "sale rate", "purchase rate"],
        notes: [
            "Product code/name columns may be split; map best product identifier to sku.",
            "Party columns are customer/supplier identity."
        ]
    },
    {
        id: "mybillbook",
        signals: ["item name", "invoice no", "customer mobile", "taxable value", "cgst", "sgst"],
        notes: [
            "Item Name generally maps to product name/sku reference in sales.",
            "Prefer invoice date for sale_date."
        ]
    }
]

function detectSource(data: any[]): { source: string; score: number; notes: string[] } {
    const columns = Object.keys(data?.[0] || {}).map((c) => c.toLowerCase())
    if (columns.length === 0) return { source: "generic", score: 0, notes: [] }
    let best = { source: "generic", score: 0, notes: [] as string[] }
    for (const profile of SOURCE_PROFILES) {
        let score = 0
        for (const signal of profile.signals) {
            if (columns.some((c) => c.includes(signal))) score++
        }
        if (score > best.score) {
            best = { source: profile.id, score, notes: profile.notes }
        }
    }
    return best
}

function mapToExistingColumns(schema: Record<string, string>, columns: string[], dataType: string) {
    const result: Record<string, string> = {}
    const lowerColumns = columns.map((c) => ({ raw: c, key: c.toLowerCase().trim() }))
    const findColumn = (candidate: string) => {
        const key = String(candidate || "").toLowerCase().trim()
        if (!key) return null
        const exact = lowerColumns.find((c) => c.key === key)
        if (exact) return exact.raw
        const loose = lowerColumns.find((c) => c.key.replace(/\s+/g, " ") === key.replace(/\s+/g, " "))
        if (loose) return loose.raw
        return null
    }

    for (const [field, candidate] of Object.entries(schema || {})) {
        const mapped = findColumn(candidate)
        if (!mapped) continue
        // Guardrail for universal imports: never allow UOM-like columns as sales sku/product keys.
        if (dataType === "sales" && field === "sku" && /(uom|unit|pcs|nos|qty unit|unit name)/i.test(mapped)) {
            continue
        }
        result[field] = mapped
    }
    return result
}

function pickSalesSkuFallbackColumn(columns: string[]) {
    const blocked = /(uom|unit|pcs|nos|qty unit|unit name|payment|mode|method|date|invoice|bill no|amount|total|qty|quantity)/i
    const strong = /(stock item name|stock item|item name|product name|product|item|particulars|description|sku|item code|product code)/i
    const medium = /(name|code)/i

    const normalized = columns
        .map((c) => ({ raw: c, key: c.toLowerCase().trim() }))
        .filter((c) => !blocked.test(c.key))

    const strongHit = normalized.find((c) => strong.test(c.key))
    if (strongHit) return strongHit.raw

    const mediumHit = normalized.find((c) => medium.test(c.key))
    if (mediumHit) return mediumHit.raw

    return null
}

function isMostlyNumericColumn(data: any[], column: string, sampleSize = 30) {
    const values = data
        .slice(0, sampleSize)
        .map((row) => row?.[column])
        .filter((v) => v !== null && v !== undefined && String(v).trim() !== "")
        .map((v) => String(v).trim())
    if (values.length === 0) return false
    const numericCount = values.filter((v) => /^[\d,.\-()₹$€£¥\s]+$/.test(v)).length
    return (numericCount / values.length) >= 0.8
}

async function runGroqMapping(params: {
    dataType: string
    columns: string[]          // ONLY column names — no actual data sent to Groq
    sampleValues: Record<string, string>  // 1-2 sample values per column for context
    expected: string[]
    requiredFields: string[]
    patternSchema: Record<string, string>
    sourceHint: { source: string; notes: string[] }
    model?: string
}) {
    // Ultra-lean prompt: column names + minimal samples only.
    // Sending raw rows was the main token hog — this cuts usage by ~90%.
    const colContext = params.columns
        .map(c => {
            const sample = params.sampleValues[c]
            return sample ? `"${c}" (e.g. ${sample})` : `"${c}"`
        })
        .join(", ")

    const prompt = `Map CSV columns to KhataPlus ${params.dataType} schema. Reply with strict JSON only.

SOURCE: ${params.sourceHint.source}
HINTS: ${params.sourceHint.notes.slice(0, 2).join(" | ") || "none"}
COLUMNS: ${colContext}
EXPECTED DB FIELDS: ${params.expected.join(", ")}
REQUIRED: ${params.requiredFields.join(", ")}
PATTERN BASELINE (already mapped): ${JSON.stringify(params.patternSchema)}

RULES:
- sales.sku → product/item name column, NEVER UOM/unit/pcs
- Only map columns that exist above
- Leave uncertain fields unmapped

JSON format: {"schema":{"db_field":"csv_column"},"confidence":0.0,"warnings":[]}`

    const model = params.model || "llama-3.3-70b-versatile"
    const responseText = await groqWithRetry(() => groqChat(prompt, model))
    const fallback = {
        schema: {} as Record<string, string>,
        confidence: 0,
        warnings: [] as string[],
        suggestions: [] as string[],
        cleaningHints: {} as Record<string, string>,
    }
    const { data } = parseGroqJSON(responseText, fallback)
    return data as typeof fallback
}

async function runGroqIssueAnalysis(params: {
    dataType: string
    columns: string[]
    schema: Record<string, string>
    issueSummary: Array<{ type: string; sample: string; count: number }>
    sampleRows: any[]
}) {
    const prompt = `You are a data migration quality auditor for KhataPlus.
Analyze migration issues and return short, actionable fixes.

TARGET TABLE: ${params.dataType}
COLUMNS: ${JSON.stringify(params.columns)}
FINAL SCHEMA: ${JSON.stringify(params.schema)}
ISSUES: ${JSON.stringify(params.issueSummary)}
SAMPLE ROWS: ${JSON.stringify(params.sampleRows)}

Return strict JSON:
{
  "analysis": [
    {
      "issue": "short issue",
      "root_cause": "short cause",
      "fix": "short practical fix",
      "risk": "low|medium|high"
    }
  ],
  "overall_recommendation": "one concise recommendation"
}`

    const responseText = await groqWithRetry(() => groqChat(prompt, "llama-3.3-70b-versatile"))
    const fallback = {
        analysis: [] as Array<{ issue: string; root_cause: string; fix: string; risk: "low" | "medium" | "high" }>,
        overall_recommendation: ""
    }
    return parseGroqJSON(responseText, fallback).data
}

function mergeSchemaConsensus(
    baseSchema: Record<string, string>,
    primarySchema: Record<string, string>,
    verifierSchema: Record<string, string>,
    requiredFields: string[]
) {
    const merged = { ...baseSchema, ...primarySchema }
    for (const [field, verifierCol] of Object.entries(verifierSchema || {})) {
        if (!verifierCol) continue
        const primaryCol = primarySchema?.[field]
        if (!primaryCol) {
            // Primary missed it entirely — take verifier
            merged[field] = verifierCol
            continue
        }
        if (primaryCol === verifierCol) {
            // Both agree — perfect
            merged[field] = primaryCol
            continue
        }
        // Disagreement: primary (DeepSeek-R1) ran first and is stronger reasoning model.
        // Only override with verifier if this is a required field AND primary column looks numeric
        // (i.e., primary likely confused a number column with an identifier).
        // Otherwise keep primary's choice.
        if (requiredFields.includes(field) && primaryCol && primaryCol !== verifierCol) {
            // Keep primary — it's the stronger model. Verifier is used to fill gaps, not override.
            merged[field] = primaryCol
        }
    }
    return merged
}

export async function POST(request: Request) {
    try {
        const { dataType, data } = await request.json()

        if (!dataType || !data) {
            return NextResponse.json({ error: "Missing dataType or data" }, { status: 400 })
        }
        if (!Array.isArray(data) || data.length === 0) {
            return NextResponse.json({ error: "No rows provided" }, { status: 400 })
        }
        if (!isGroqAvailable()) {
            return NextResponse.json({ error: "Groq is required for dynamic mapping but is not configured." }, { status: 503 })
        }

        // 1. Initial Analysis (Baseline Pattern Match)
        const patternResult = analyzeCSVStructure(data, dataType)
        const structure = extractStructureOnly(data)
        const sourceHint = detectSource(data)

        let aiResult = {
            source: sourceHint.source,
            schema: {} as Record<string, string>,
            confidence: 0,
            warnings: [] as string[],
            suggestions: [] as string[],
            cleaningHints: {},
            reasoning: "" as string | undefined
        }
        let usedAI = false

        // Skip Groq if pattern matching is already confident and all required fields are mapped.
        // This is the biggest token saver — no AI call at all for clean/standard files.
        const requiredFields = getRequiredFields(dataType)
        const missingRequired = requiredFields.filter((f) => !patternResult.schema[f])
        const patternIsGoodEnough = patternResult.confidence >= 0.7 && missingRequired.length === 0

        if (!patternIsGoodEnough && isGroqAvailable()) {
            try {
                usedAI = true
                const expected = EXPECTED_FIELDS[dataType] || []
                const columns = Object.keys(data[0] || {})

                // Build a per-column sample value map (1 representative value each) instead of sending raw rows.
                // This replaces sampleRows: data.slice(0,20) — massively cheaper token-wise.
                const sampleValues: Record<string, string> = {}
                for (const col of columns) {
                    const val = data.find((r: any) => r[col] !== null && r[col] !== undefined && String(r[col]).trim() !== "")?.[col]
                    if (val !== undefined) sampleValues[col] = String(val).slice(0, 40)
                }

                const primaryAI = await runGroqMapping({
                    dataType,
                    columns,
                    sampleValues,
                    expected,
                    requiredFields,
                    patternSchema: patternResult.schema,
                    sourceHint,
                })
                aiResult = { ...aiResult, ...primaryAI }

                // Boost confidence if AI mapped something
                if (Object.keys(aiResult.schema).length > 0 && aiResult.confidence < 0.8) {
                    aiResult.confidence = 0.85
                }

                console.log(`[analyze-csv] Groq mapped ${dataType} source=${sourceHint.source} confidence=${aiResult.confidence} fields=${Object.keys(aiResult.schema).length}`)
            } catch (aiError: any) {
                // Groq failed (quota, timeout, bad JSON) — fall through to pattern matching.
                console.warn("[analyze-csv] Groq failed, using pattern matching:", aiError.message)
                usedAI = false
            }
        } else if (patternIsGoodEnough) {
            console.log(`[analyze-csv] Pattern confidence ${patternResult.confidence} sufficient — skipping Groq`)
        }

        // 2. Combine and Transform
        // CRITICAL FIX: finalSchema = pattern baseline + AI on top — never discard pattern results
        const columns = Object.keys(data[0] || {})
        const safeAISchema = mapToExistingColumns(aiResult.schema || {}, columns, dataType)
        // Pattern matching is always the floor; AI fills gaps and overrides uncertain matches
        const finalSchema = { ...patternResult.schema, ...safeAISchema }
        if (Object.keys(finalSchema).length === 0) {
            // Both AI and patterns returned nothing — return empty-ish response rather than hard 422
            // so the client can still show "0 records" cleanly instead of an error toast.
            const emptyResults = transformData(data, {}, dataType)
            return NextResponse.json({
                ...emptyResults,
                schema: {},
                confidence: 0,
                warnings: ["Could not map any columns to database fields. Please select the import type manually."],
                errors: [],
                suggestions: ["Try selecting a specific import type from the dropdown."],
                cleaningHints: {},
                detectedSource: sourceHint.source,
                reasoning: "",
                usedAI
            })
        }
        const finalMissingRequired = requiredFields.filter((f) => !finalSchema[f])
        if (finalMissingRequired.length > 0) {
            // Pattern still gets surfaced — log warning but don't hard-error
            console.warn(`[analyze-csv] Missing required after merge: ${finalMissingRequired.join(", ")}. Using pattern schema.`)
        }
        if (dataType === "inventory" && finalSchema.name && isMostlyNumericColumn(data, finalSchema.name)) {
            return NextResponse.json({ error: `Groq mapped inventory name to numeric-heavy column "${finalSchema.name}". Please retry with clearer headers.` }, { status: 422 })
        }
        const results = transformData(data, finalSchema, dataType)

        // 3. Final Validation
        const validation = validateData(results.transformed, dataType)
        const issueSummary = [
            ...validation.errors.slice(0, 20).map((err) => ({ type: "error", sample: err, count: 1 })),
            ...validation.warnings.slice(0, 20).map((warn) => ({ type: "warning", sample: warn, count: 1 })),
        ]

        let aiIssueAnalysis: {
            analysis: Array<{ issue: string; root_cause: string; fix: string; risk: "low" | "medium" | "high" }>
            overall_recommendation: string
        } = { analysis: [], overall_recommendation: "" }
        if (isGroqAvailable() && issueSummary.length > 0) {
            try {
                // Use structure-only (no actual values) to stay privacy-safe
                const structureForIssue = { columns, types: structure.types, samplePatterns: structure.samplePatterns }
                aiIssueAnalysis = await runGroqIssueAnalysis({
                    dataType,
                    columns,
                    schema: finalSchema,
                    issueSummary,
                    sampleRows: [structureForIssue] as any
                })
            } catch (aiIssueErr: any) {
                console.warn("[analyze-csv] Groq issue analysis failed:", aiIssueErr?.message || aiIssueErr)
            }
        }

        const aiFixSuggestions = (aiIssueAnalysis.analysis || [])
            .map((a) => a?.fix)
            .filter((v): v is string => Boolean(v))
            .slice(0, 6)
        const aiIssueWarnings = (aiIssueAnalysis.analysis || [])
            .filter((a) => a?.risk === "high" || a?.risk === "medium")
            .map((a) => `${String(a.risk).toUpperCase()} risk: ${a.issue}`)
            .slice(0, 6)
        const combinedSuggestions = Array.from(
            new Set([...(aiResult.suggestions || []), ...aiFixSuggestions, aiIssueAnalysis.overall_recommendation].filter(Boolean))
        )
        const combinedWarnings = [...patternResult.warnings, ...(aiResult.warnings || []), ...validation.warnings, ...aiIssueWarnings]

        return NextResponse.json({
            ...results,
            schema: finalSchema,
            confidence: Math.max(patternResult.confidence, aiResult.confidence),
            warnings: combinedWarnings,
            errors: validation.errors,
            suggestions: combinedSuggestions,
            cleaningHints: aiResult.cleaningHints || {},
            aiIssueAnalysis,
            detectedSource: aiResult.source || sourceHint.source,
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
