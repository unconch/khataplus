import { NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { sql } from "@/lib/db"
import { mkdir, readFile, writeFile } from "fs/promises"
import { join } from "path"
import { tmpdir } from "os"
import { transformData } from "@/lib/import-intelligence"
import { importCustomers, importExpenses, importInventory, importSales, importSuppliers } from "@/lib/data/migration"
import { groqChat, groqWithRetry, isGroqAvailable, parseGroqJSON } from "@/lib/groq"
import { ensureImportJobsTable, getJob } from "../_shared"
import { requirePlanFeature, PlanFeatureError } from "@/lib/plan-feature-guard"

const BUCKET = "local"
const LOCAL_DIR = join(tmpdir(), "khataplus-migration-temp")
const CHUNK_SIZE = 5000
const TYPE_ORDER = ["inventory", "customers", "suppliers", "sales", "expenses"] as const
type ImportType = typeof TYPE_ORDER[number]
const TARGET_FIELDS_BY_TYPE: Record<ImportType, string[]> = {
  inventory: ["sku", "name", "buy_price", "sell_price", "stock", "hsn_code", "gst_percentage", "min_stock"],
  customers: ["name_contact", "phone", "email", "address", "balance", "credit_limit"],
  sales: ["sku", "quantity", "sale_price", "total_amount", "payment_method", "customer_name", "customer_phone", "sale_date", "invoice_no"],
  suppliers: ["name_contact", "phone", "address", "gstin"],
  expenses: ["category", "amount", "description", "expense_date"],
}

const detectTypeFromName = (sheetName: string): ImportType | null => {
  const norm = sheetName.toLowerCase()
  if (/inventory|product|stock|item|sku|catalog/.test(norm)) return "inventory"
  if (/customer|client|party|profile|buyer/.test(norm)) return "customers"
  if (/sale|invoice|bill|order|txn|transaction/.test(norm)) return "sales"
  if (/supplier|vendor|purchase/.test(norm)) return "suppliers"
  if (/expense|expenditure|cost|payment/.test(norm)) return "expenses"
  return null
}

const detectTypeFromHeaders = (headers: string[]): ImportType | null => {
  const normalized = headers.map((h) => String(h).toLowerCase().replace(/[^a-z0-9]/g, "")).filter(Boolean)
  if (normalized.length === 0) return null

  const score: Record<ImportType, number> = { inventory: 0, customers: 0, sales: 0, suppliers: 0, expenses: 0 }
  const has = (tokens: string[]) => tokens.some((t) => normalized.some((h) => h.includes(t)))

  if (has(["sku", "hsn", "stock", "openingstock", "mrp", "sellingprice", "unitprice"])) score.inventory += 3
  if (has(["productname", "itemname", "itemcode", "category"])) score.inventory += 2
  if (has(["customername", "customer", "mobile", "phone", "gstin", "email", "address"])) score.customers += 3
  if (has(["invoiceno", "invoice", "billno", "qty", "quantity", "amount", "totalamount"])) score.sales += 3
  if (has(["suppliername", "vendorname", "supplier", "vendor", "purchaseprice", "purchase"])) score.suppliers += 3
  if (has(["expensetype", "expense", "expenditure", "paidto", "paidby", "debit", "credit"])) score.expenses += 3

  const ranked = Object.entries(score).sort((a, b) => b[1] - a[1]) as Array<[ImportType, number]>
  const [bestType, bestScore] = ranked[0]
  return bestScore >= 2 ? bestType : null
}

const headerTokenScore = (text: string) => {
  const norm = text.toLowerCase().replace(/[^a-z0-9]/g, "")
  if (!norm) return 0
  if (/(item|product|sku|code|hsn|stock|voucher|invoice|bill|date|qty|quantity|amount|price|rate|customer|supplier|gst)/.test(norm)) return 3
  if (/[a-z]/.test(norm)) return 1
  return 0
}

const chooseHeaderRow = (grid: unknown[][]): number => {
  const limit = Math.min(grid.length, 40)
  let bestIdx = -1
  let bestScore = -1
  for (let i = 0; i < limit; i++) {
    const row = Array.isArray(grid[i]) ? grid[i] : []
    const cells = row.map((c) => String(c ?? "").trim())
    const nonEmpty = cells.filter(Boolean)
    if (nonEmpty.length < 2) continue
    const tokenScore = nonEmpty.reduce((sum, cell) => sum + headerTokenScore(cell), 0)
    const longTextPenalty = nonEmpty.filter((c) => c.length > 45).length
    const score = (nonEmpty.length * 2) + tokenScore - (longTextPenalty * 2)
    if (score > bestScore) {
      bestScore = score
      bestIdx = i
    }
  }
  if (bestIdx >= 0) return bestIdx
  return grid.findIndex((row) => Array.isArray(row) && row.some((c) => String(c ?? "").trim() !== ""))
}

const dedupeHeaders = (headers: string[]) => {
  const seen = new Map<string, number>()
  return headers.map((raw, i) => {
    const base = String(raw || "").trim() || `column_${i + 1}`
    const key = base.toLowerCase()
    const next = (seen.get(key) || 0) + 1
    seen.set(key, next)
    return next > 1 ? `${base}_${next}` : base
  })
}

const parseSheetRows = (sheet: XLSX.WorkSheet): { rows: any[]; headers: string[] } => {
  const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as unknown[][]
  const headerIndex = chooseHeaderRow(grid)
  let rows: any[] = []
  let headers: string[] = []
  if (headerIndex >= 0) {
    const rawHeaders = (grid[headerIndex] || []).map((cell) => String(cell ?? "").trim())
    headers = dedupeHeaders(rawHeaders)
    const dataRows = grid
      .slice(headerIndex + 1)
      .filter((row) => Array.isArray(row) && row.some((c) => String(c ?? "").trim() !== ""))
    rows = dataRows.map((row) => {
      const obj: Record<string, unknown> = {}
      headers.forEach((h, i) => { obj[h] = (row as unknown[])[i] ?? null })
      return obj
    })
  }
  return { rows, headers }
}

const isAggregateSheet = (sheetName: string, rawRows: any[], headers: string[]) => {
  const nameNorm = sheetName.toLowerCase()
  if (/(summary|report|analytics|dashboard)/.test(nameNorm) && !/(register|ledger|voucher|invoice|item|inventory)/.test(nameNorm)) {
    return true
  }
  const headerNorm = headers.map((h) => String(h).toLowerCase().replace(/[^a-z0-9]/g, ""))
  const hasTransactionalColumns = headerNorm.some((h) =>
    /(itemname|itemcode|sku|voucherno|invoice|bill|date|qty|quantity|rate|price|amount|customer|supplier|hsn|gst)/.test(h)
  )

  const keyHints = rawRows.slice(0, 80).map((row) => {
    const first = Object.values(row || {})[0]
    return String(first ?? "").toLowerCase()
  }).join(" | ")
  const hasAggregateHints = /(summary|key metrics|brand-wise|brand wise|total|average|avg|max|min)/.test(keyHints)

  const namedAsSummary = /(summary|report|analytics|dashboard)/.test(nameNorm)
  return (namedAsSummary || hasAggregateHints) && !hasTransactionalColumns
}

/** Returns a categorical type label for a column's sample values — no actual data leaves this function */
function inferValueType(samples: unknown[]): string {
  const nonNull = samples.filter((v) => v !== null && v !== undefined && String(v).trim() !== "")
  if (nonNull.length === 0) return "empty"
  const strs = nonNull.map((v) => String(v).trim())
  const numericCount = strs.filter((s) => /^[\d,.\-()₹$€£¥\s]+$/.test(s)).length
  if (numericCount / strs.length >= 0.8) {
    const dateCount = strs.filter((s) => /\d{1,4}[-/]\d{1,2}[-/]\d{2,4}/.test(s)).length
    if (dateCount / strs.length >= 0.6) return "date"
    return "number"
  }
  const phoneCount = strs.filter((s) => /^\+?[\d\s\-()]{7,15}$/.test(s)).length
  if (phoneCount / strs.length >= 0.7) return "phone"
  const dateCount = strs.filter((s) => /\d{1,4}[-/]\d{1,2}[-/]\d{2,4}/.test(s)).length
  if (dateCount / strs.length >= 0.6) return "date"
  return "text"
}

/** Returns masked sample strings (e.g. "SAL/XXXXX") so Groq sees the pattern but not real values */
function describeSamplePattern(samples: unknown[]): string {
  const nonNull = samples.filter((v) => v !== null && v !== undefined && String(v).trim() !== "")
  if (nonNull.length === 0) return "(empty)"
  return nonNull.slice(0, 3).map((v) => {
    const s = String(v).trim()
    // Replace digits with X, preserve separators and leading chars
    return s.replace(/\d/g, "X").slice(0, 20)
  }).join(", ")
}

const classifySheetWithGroq = async (
  sheetName: string,
  headers: string[],
  rawRows: any[]
): Promise<{ type: ImportType | null; skip: boolean }> => {
  if (!isGroqAvailable()) throw new Error("Groq is required for import routing but is not configured.")

  // Privacy-safe: send only column names + inferred value types, NOT actual cell values
  const columnProfiles = headers.map((h) => ({
    header: h,
    value_type: inferValueType(rawRows.slice(0, 20).map((r) => r?.[h] ?? null)),
  }))

  const prompt = `You are a data migration router.
Classify one spreadsheet sheet into one destination table for KhataPlus.

Allowed sheet_type values:
- inventory
- customers
- sales
- suppliers
- expenses
- skip

Sheet name: ${sheetName}
Column profiles (header + inferred value type): ${JSON.stringify(columnProfiles)}

Rules:
1) If sheet is summary/report/aggregate/KPI, return "skip".
2) Item master, product list, stock catalog -> "inventory".
3) Sales register, invoice transactions, bill rows -> "sales".
4) Use all header columns provided above for decision.
5) Only return JSON.

Return strict JSON:
{ "sheet_type": "inventory|customers|sales|suppliers|expenses|skip", "confidence": 0.0 }`

  type GroqSheetDecision = { sheet_type?: string; confidence?: number }
  const fallback: GroqSheetDecision = { sheet_type: "skip", confidence: 0 }

  try {
    const text = await groqWithRetry(() => groqChat(prompt, "llama-3.3-70b-versatile"))
    const { data } = parseGroqJSON<GroqSheetDecision>(text, fallback)
    const chosen = String(data?.sheet_type || "").toLowerCase()
    if (chosen === "skip") return { type: null, skip: true }
    if (chosen === "inventory" || chosen === "customers" || chosen === "sales" || chosen === "suppliers" || chosen === "expenses") {
      return { type: chosen as ImportType, skip: false }
    }
  } catch { }

  // Groq failed or returned unrecognised type — fall back to header-scoring heuristic
  const fallbackType = detectTypeFromHeaders(headers) || detectTypeFromName(sheetName)
  if (fallbackType) return { type: fallbackType, skip: false }
  return { type: null, skip: false }
}

const mapColumnsWithGroq = async (
  targetType: ImportType,
  sheetName: string,
  headers: string[],
  rawRows: any[]
): Promise<Record<string, string>> => {
  if (!isGroqAvailable()) throw new Error("Groq is required for column mapping but is not configured.")

  // Privacy-safe: send value type + pattern, NOT actual cell values
  const columnProfiles = headers.map((header) => ({
    header,
    value_type: inferValueType(rawRows.slice(0, 20).map((row) => row?.[header] ?? null)),
    sample_pattern: describeSamplePattern(rawRows.slice(0, 5).map((row) => row?.[header] ?? null)),
  }))

  const prompt = `You are a strict database column-mapper for KhataPlus imports.
Map source columns to destination DB fields for one sheet.

Sheet: ${sheetName}
Target table: ${targetType}
Allowed destination fields: ${JSON.stringify(TARGET_FIELDS_BY_TYPE[targetType] || [])}
Columns (header + value type + sample pattern - no real values): ${JSON.stringify(columnProfiles)}

Rules:
1) Only map to allowed destination fields.
2) Use header name + value type to decide where each column maps in DB.
3) Leave uncertain mappings unmapped.
4) For sales.sku, NEVER map UOM/unit/pcs/nos columns.
5) Return JSON only.

Return strict JSON:
{
  "schema": { "db_field": "source_header" },
  "columns": [
    { "header": "source_header", "mapped_field": "db_field_or_null", "confidence": 0.0, "reason": "short" }
  ]
}`

  type GroqMapResponse = {
    schema?: Record<string, string>
    columns?: Array<{ header?: string; mapped_field?: string | null; confidence?: number; reason?: string }>
  }

  const fallback: GroqMapResponse = { schema: {}, columns: [] }
  try {
    const response = await groqWithRetry(() => groqChat(prompt, "llama-3.3-70b-versatile"))
    const { data } = parseGroqJSON<GroqMapResponse>(response, fallback)
    const rawSchema = data?.schema || {}
    const allowedFields = new Set(TARGET_FIELDS_BY_TYPE[targetType] || [])
    const existingHeaders = new Set(headers)
    const cleaned: Record<string, string> = {}

    for (const [field, source] of Object.entries(rawSchema)) {
      const f = String(field || "").trim()
      const s = String(source || "").trim()
      if (!f || !s) continue
      if (!allowedFields.has(f)) continue
      if (!existingHeaders.has(s)) continue
      if (targetType === "sales" && f === "sku" && /(uom|unit|pcs|nos|qty unit|unit name)/i.test(s)) continue
      cleaned[f] = s
    }

    return cleaned
  } catch {
    return {}
  }
}

async function ensureBucket() {
  await mkdir(LOCAL_DIR, { recursive: true })
}

async function buildPayloadFromTempFiles(tempFiles: Array<{ bucket: string; path: string; name: string }>) {
  if (!isGroqAvailable()) {
    throw new Error("Groq is required for import parsing. Configure GROQ_API_KEY and retry.")
  }
  const dataSets: Record<ImportType, any[]> = { inventory: [], customers: [], sales: [], suppliers: [], expenses: [] }

  for (const fileMeta of tempFiles) {
    if (String(fileMeta.bucket || "").toLowerCase() !== BUCKET) {
      throw new Error(`Unsupported temp file bucket: ${fileMeta.bucket}`)
    }
    const bytes = await readFile(fileMeta.path)
    const workbook = XLSX.read(bytes, { type: "buffer" })

    for (const sheetName of workbook.SheetNames) {
      const parsed = parseSheetRows(workbook.Sheets[sheetName])
      const rawData = parsed.rows
      const headers = parsed.headers
      if (!rawData.length) continue
      if (isAggregateSheet(sheetName, rawData, headers)) continue

      const aiRoute = await classifySheetWithGroq(sheetName, headers, rawData)
      if (aiRoute.skip) continue

      const inferredType: ImportType | null = aiRoute.type
      if (!inferredType) {
        // Warn but don't crash — one unclassifiable sheet should not kill the entire job
        console.warn(`[jobs/process] Groq could not classify sheet "${sheetName}" — skipping`)
        continue
      }
      const aiSchema = await mapColumnsWithGroq(inferredType, sheetName, headers, rawData)
      if (!Object.keys(aiSchema).length) {
        // Same: warn and skip rather than crash
        console.warn(`[jobs/process] Groq returned no column mappings for sheet "${sheetName}" (${inferredType}) — skipping`)
        continue
      }
      const transformed = transformData(rawData, aiSchema, inferredType)
      dataSets[inferredType].push(...transformed.transformed)
    }
  }

  return dataSets
}

async function callImporter(type: ImportType, orgId: string, chunk: any[]) {
  if (type === "inventory") return importInventory(orgId, chunk, { skipAuth: true, actorUserId: null })
  if (type === "customers") return importCustomers(orgId, chunk, { skipAuth: true, actorUserId: null })
  if (type === "suppliers") return importSuppliers(orgId, chunk, { skipAuth: true, actorUserId: null })
  if (type === "sales") return importSales(orgId, chunk, { skipAuth: true, actorUserId: null })
  return importExpenses(orgId, chunk, { skipAuth: true, actorUserId: null })
}

async function triggerNext(origin: string, jobId: string) {
  fetch(`${origin}/api/migration/jobs/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId }),
  }).catch(() => { })
}

export async function POST(request: Request) {
  let jobId = ""
  try {
    const body = await request.json()
    jobId = String(body?.jobId || "").trim()
    if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 })

    await ensureImportJobsTable()
    const job = await getJob(jobId)
    if (!job) return NextResponse.json({ error: "job not found" }, { status: 404 })
    if (job.status === "completed" || job.status === "failed") return NextResponse.json({ ok: true, done: true })
    await requirePlanFeature(String(job.org_id), "migration_import")

    const origin = new URL(request.url).origin
    await sql`UPDATE import_jobs SET status = 'running', updated_at = NOW() WHERE id = ${jobId}`

    let payloadBucket = job.payload_bucket as string | null
    let payloadPath = job.payload_path as string | null

    if (!payloadBucket || !payloadPath) {
      await ensureBucket()
      const tempFiles = Array.isArray(job.temp_files) ? job.temp_files : []
      const dataSets = await buildPayloadFromTempFiles(tempFiles)

      const totalSteps = TYPE_ORDER.filter((t) => dataSets[t].length > 0).length
      const totalRecords = TYPE_ORDER.reduce((sum, t) => sum + dataSets[t].length, 0)

      const payloadFilePath = join(LOCAL_DIR, `job-${jobId}-payload.json`)
      await writeFile(payloadFilePath, JSON.stringify({ dataSets }), "utf8")

      payloadBucket = BUCKET
      payloadPath = payloadFilePath
      await sql`
        UPDATE import_jobs
        SET payload_bucket = ${payloadBucket},
            payload_path = ${payloadPath},
            total_steps = ${totalSteps},
            total_records = ${totalRecords},
            updated_at = NOW()
        WHERE id = ${jobId}
      `
    }

    const latest = await getJob(jobId)
    if (String(payloadBucket || "").toLowerCase() !== BUCKET) {
      throw new Error(`Unsupported payload bucket: ${payloadBucket}`)
    }
    const payloadRaw = await readFile(payloadPath!, "utf8")
    const payload = JSON.parse(payloadRaw) as { dataSets: Record<ImportType, any[]> }
    const dataSets = payload.dataSets

    const activeTypes = TYPE_ORDER.filter((t) => Array.isArray(dataSets[t]) && dataSets[t].length > 0)
    let typeIndex = Number(latest.cursor_type_index || 0)
    let offset = Number(latest.cursor_offset || 0)

    if (typeIndex >= activeTypes.length) {
      const result = {
        success: Number(latest.success_rows || 0),
        failed: Number(latest.failed_rows || 0),
        errors: Array.isArray(latest.errors) ? latest.errors : [],
        byType: {},
      }
      await sql`
        UPDATE import_jobs
        SET status = 'completed',
            result = ${JSON.stringify(result)}::jsonb,
            updated_at = NOW()
        WHERE id = ${jobId}
      `
      return NextResponse.json({ ok: true, done: true })
    }

    const type = activeTypes[typeIndex]
    const set = dataSets[type]
    const chunk = set.slice(offset, offset + CHUNK_SIZE)
    const res: any = await callImporter(type, latest.org_id, chunk)

    const processedNext = Number(latest.processed_records || 0) + chunk.length
    const successNext = Number(latest.success_rows || 0) + Number(res?.count || 0)
    const failedNext = Number(latest.failed_rows || 0) + Number(res?.failed || 0)
    const existingErrors = Array.isArray(latest.errors) ? latest.errors : []
    const mergedErrors = [...existingErrors, ...((res?.errors || []).map((e: string) => `[${type}] ${e}`))].slice(0, 500)

    let nextTypeIndex = typeIndex
    let nextOffset = offset + chunk.length
    let completedSteps = Number(latest.completed_steps || 0)
    if (nextOffset >= set.length) {
      nextTypeIndex += 1
      nextOffset = 0
      completedSteps += 1
    }

    await sql`
      UPDATE import_jobs
      SET current_type = ${type},
          cursor_type_index = ${nextTypeIndex},
          cursor_offset = ${nextOffset},
          processed_records = ${processedNext},
          success_rows = ${successNext},
          failed_rows = ${failedNext},
          completed_steps = ${completedSteps},
          errors = ${JSON.stringify(mergedErrors)}::jsonb,
          updated_at = NOW()
      WHERE id = ${jobId}
    `

    triggerNext(origin, jobId)
    return NextResponse.json({ ok: true, done: false })
  } catch (error: any) {
    if (error instanceof PlanFeatureError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }
    try {
      if (jobId) {
        await sql`
          UPDATE import_jobs
          SET status = 'failed',
              error_message = ${error?.message || "Job failed"},
              updated_at = NOW()
          WHERE id = ${jobId}
        `
      }
    } catch { }
    return NextResponse.json({ error: error?.message || "Job processing failed" }, { status: 500 })
  }
}
