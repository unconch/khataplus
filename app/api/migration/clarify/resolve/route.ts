import { NextResponse } from "next/server"
import { transformData, validateData } from "@/lib/import-intelligence"

type SupportedType = "inventory" | "customers" | "sales" | "suppliers" | "expenses"

const REQUIRED_FIELDS: Record<SupportedType, string[]> = {
  inventory: ["name"],
  customers: ["phone"],
  sales: ["sku"],
  suppliers: ["name_contact", "phone"],
  expenses: ["amount"],
}

function sanitizeType(value: string): SupportedType | null {
  if (value === "inventory" || value === "customers" || value === "sales" || value === "suppliers" || value === "expenses") {
    return value
  }
  return null
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const dataType = sanitizeType(body?.dataType)
    const data = Array.isArray(body?.data) ? body.data : []
    const baseSchema = (body?.schema || {}) as Record<string, string>
    const answers = (body?.answers || {}) as Record<string, string>

    if (!dataType || data.length === 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const columns = Object.keys(data[0] || {})
    const finalSchema = { ...baseSchema }

    Object.entries(answers).forEach(([field, column]) => {
      if (typeof field === "string" && typeof column === "string" && columns.includes(column)) {
        finalSchema[field] = column
      }
    })

    const results = transformData(data, finalSchema, dataType)
    const validation = validateData(results.transformed, dataType)
    const matchedRequired = REQUIRED_FIELDS[dataType].filter((f) => Boolean(finalSchema[f])).length
    const confidence = REQUIRED_FIELDS[dataType].length > 0 ? matchedRequired / REQUIRED_FIELDS[dataType].length : 1

    return NextResponse.json({
      ...results,
      schema: finalSchema,
      confidence,
      warnings: validation.warnings,
      errors: validation.errors,
      suggestions: [],
      cleaningHints: {},
      usedAI: true,
    })
  } catch (error: any) {
    console.error("[migration/clarify/resolve] error", error?.message || error)
    return NextResponse.json({ error: "Failed to resolve clarifications" }, { status: 500 })
  }
}

