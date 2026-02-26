import { NextResponse } from "next/server"
import { analyzeCSVStructure, extractStructureOnly } from "@/lib/import-intelligence"
import { groqChat, groqWithRetry, isGroqAvailable, parseGroqJSON } from "@/lib/groq"

type SupportedType = "inventory" | "customers" | "sales" | "suppliers" | "expenses"

type ClarificationQuestion = {
  id: string
  field: string
  question: string
  reason: string
  options: string[]
  required: boolean
}

const REQUIRED_FIELDS: Record<SupportedType, string[]> = {
  inventory: ["name"],
  customers: ["phone"],
  sales: ["sku"],
  suppliers: ["name_contact", "phone"],
  expenses: ["amount"],
}

const NICE_LABELS: Record<string, string> = {
  name: "Product Name",
  name_contact: "Name",
  phone: "Phone Number",
  sku: "SKU / Item Code",
  amount: "Amount",
  sale_date: "Sale Date",
  payment_method: "Payment Method",
  customer_name: "Customer Name",
  total_amount: "Total Amount",
}

function sanitizeType(value: string): SupportedType | null {
  if (value === "inventory" || value === "customers" || value === "sales" || value === "suppliers" || value === "expenses") {
    return value
  }
  return null
}

function makeFallbackQuestions(
  dataType: SupportedType,
  columns: string[],
  schema: Record<string, string>
): ClarificationQuestion[] {
  const missingRequired = REQUIRED_FIELDS[dataType].filter((f) => !schema[f])
  return missingRequired.slice(0, 3).map((field, idx) => ({
    id: `fallback-${field}-${idx}`,
    field,
    question: `Which column contains ${NICE_LABELS[field] || field}?`,
    reason: `${NICE_LABELS[field] || field} is required for ${dataType} import.`,
    options: columns.slice(0, 12),
    required: true,
  }))
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const dataType = sanitizeType(body?.dataType)
    const data = Array.isArray(body?.data) ? body.data : []
    const schema = (body?.schema || {}) as Record<string, string>

    if (!dataType || data.length === 0) {
      return NextResponse.json({ questions: [] })
    }

    const columns = Object.keys(data[0] || {})
    if (columns.length === 0) {
      return NextResponse.json({ questions: [] })
    }

    const pattern = analyzeCSVStructure(data, dataType)
    const fallback = makeFallbackQuestions(dataType, columns, schema)

    let questions: ClarificationQuestion[] = []

    if (isGroqAvailable()) {
      const structure = extractStructureOnly(data)
      const prompt = `You are a migration copilot for business Excel imports.
Generate at most 3 targeted clarification questions that help map CSV columns correctly.

DATA TYPE: ${dataType}
COLUMNS: ${JSON.stringify(columns)}
COLUMN TYPES: ${JSON.stringify(structure.types)}
CURRENT SCHEMA: ${JSON.stringify(schema)}
PATTERN WARNINGS: ${JSON.stringify((pattern.warnings || []).slice(0, 6))}

Rules:
- Ask only high-impact questions.
- Prefer required fields first.
- options must be column names from COLUMNS.
- field should be db field names (e.g. sku, phone, name, amount, sale_date, payment_method).
- Keep question text short and clear.

Return strict JSON:
{
  "questions": [
    {
      "field": "sku",
      "question": "Which column is SKU / item code?",
      "reason": "SKU is required to link sales to inventory.",
      "options": ["Item Code", "SKU", "Product"],
      "required": true
    }
  ]
}`

      const response = await groqWithRetry(() => groqChat(prompt, "llama-3.3-70b-versatile"))
      const parsed = parseGroqJSON<{ questions?: ClarificationQuestion[] }>(response, { questions: [] }).data
      const aiQuestions = Array.isArray(parsed.questions) ? parsed.questions : []

      questions = aiQuestions
        .slice(0, 3)
        .map((q, idx) => ({
          id: `ai-${q.field || "field"}-${idx}`,
          field: q.field,
          question: q.question || `Which column maps to ${q.field}?`,
          reason: q.reason || "Needed for reliable migration.",
          options: Array.from(new Set((q.options || []).filter((c) => columns.includes(c)))).slice(0, 8),
          required: Boolean(q.required),
        }))
        .filter((q) => q.field && q.options.length > 1)
    }

    if (questions.length === 0) {
      questions = fallback
    }

    return NextResponse.json({
      questions,
      shouldAsk: questions.length > 0,
      confidence: pattern.confidence || 0,
    })
  } catch (error: any) {
    console.error("[migration/clarify/questions] error", error?.message || error)
    return NextResponse.json({ questions: [] })
  }
}

