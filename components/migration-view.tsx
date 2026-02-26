"use client"

import { useCallback, useEffect, useState } from "react"
import {
    Upload, FileText, Eye, CheckCircle2, Users, Package,
    Truck, Receipt, BookOpen,
    ArrowRight, ArrowLeft, Loader2, AlertCircle, Sparkles,
    Layers, ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { FileDropzone } from "@/components/ui/file-dropzone"
import { toast } from "sonner"
import confetti from "canvas-confetti"
import * as XLSX from "xlsx"

type DataType = "customers" | "inventory" | "suppliers" | "sales" | "expenses" | "everything"

interface MigrationViewProps {
    orgId: string
    role: string
    settings: any
}

const dataTypeConfig = {
    inventory: {
        icon: Package,
        label: "Products & Inventory",
        description: "Import products with SKU, pricing, stock levels, HSN codes, and GST rates",
        color: "blue",
        templateId: "inventory"
    },
    customers: {
        icon: Users,
        label: "Customers",
        description: "Import your customer directory with names, phone numbers, and addresses",
        color: "emerald",
        templateId: "customer"
    },
    sales: {
        icon: Receipt,
        label: "Sales History",
        description: "Import historical sales transactions with complete payment details",
        color: "orange",
        templateId: "sales"
    },
    suppliers: {
        icon: Truck,
        label: "Suppliers",
        description: "Import supplier information including GSTIN and contact details",
        color: "purple",
        templateId: "supplier"
    },
    everything: {
        icon: Layers,
        label: "Full Migration (Everything)",
        description: "Recommended for Gauhati/Vyapar. Automatically detects all sheets in your file.",
        color: "rose",
        templateId: "everything"
    },
    expenses: {
        icon: BookOpen,
        label: "Expenses",
        description: "Import operational expenses for taxation and reporting",
        color: "slate",
        templateId: "expenses"
    }
}

export function MigrationView({ orgId, role, settings }: MigrationViewProps) {
    const [currentStep, setCurrentStep] = useState(1)
    const [selectedType, setSelectedType] = useState<DataType>("everything")
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const [parsedData, setParsedData] = useState<any[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const [importResults, setImportResults] = useState<any>(null)
    const [previewStats, setPreviewStats] = useState<any>(null)
    const [activeImportType, setActiveImportType] = useState<string | null>(null)
    const [clarificationQuestions, setClarificationQuestions] = useState<Array<{
        id: string
        field: string
        question: string
        reason: string
        options: string[]
        required: boolean
    }>>([])
    const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, string>>({})
    const [rawUploadData, setRawUploadData] = useState<any[]>([])
    const [baseSchema, setBaseSchema] = useState<Record<string, string>>({})
    const [isResolvingClarifications, setIsResolvingClarifications] = useState(false)
    const [everythingPreviewType, setEverythingPreviewType] = useState<Exclude<DataType, "everything">>("inventory")
    const [importProgress, setImportProgress] = useState({
        totalSteps: 0,
        completedSteps: 0,
        processedRecords: 0,
        totalRecords: 0
    })
    const [importStartedAt, setImportStartedAt] = useState<number | null>(null)
    const [statusIndex, setStatusIndex] = useState(0)
    const [isDiscardingImport, setIsDiscardingImport] = useState(false)

    const steps = [
        { number: 1, label: "Upload", icon: Upload },
        { number: 2, label: "Preview", icon: Eye },
        { number: 3, label: "Complete", icon: CheckCircle2 }
    ]
    const importStatusMessages = [
        "Parsing and validating records...",
        "Matching rows with target schema...",
        "Applying cleanup and normalization...",
        "Writing batches to secure ledger...",
        "Finalizing import checkpoints..."
    ]
    const inflightKey = `migration-inflight:${orgId}`
    const completionKey = `migration-complete:${orgId}`

    const discardIncompleteImport = useCallback(() => {
        if (typeof window === "undefined") return
        if (window.localStorage.getItem(inflightKey) !== "1") return

        const body = JSON.stringify({ orgId })
        try {
            if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
                const blob = new Blob([body], { type: "application/json" })
                navigator.sendBeacon("/api/migration/discard-incomplete", blob)
                return
            }
        } catch {
            // Fall through to fetch keepalive.
        }

        void fetch("/api/migration/discard-incomplete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
            keepalive: true,
        }).catch(() => { })
    }, [inflightKey, orgId])

    useEffect(() => {
        if (!(isUploading && selectedType === "everything" && importProgress.totalSteps > 0)) {
            setStatusIndex(0)
            return
        }
        const id = window.setInterval(() => {
            setStatusIndex((prev) => (prev + 1) % importStatusMessages.length)
        }, 1400)
        return () => window.clearInterval(id)
    }, [isUploading, selectedType, importProgress.totalSteps])

    useEffect(() => {
        if (typeof window === "undefined") return
        if (window.localStorage.getItem(inflightKey) !== "1") return

        const recover = async () => {
            try {
                const res = await fetch("/api/migration/discard-incomplete", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orgId }),
                })
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}))
                    throw new Error(err?.error || "Could not discard incomplete import")
                }
                toast.warning("Previous incomplete import was discarded.")
                setCurrentStep(1)
                setSelectedFiles([])
                setParsedData([])
                setPreviewStats(null)
                setImportResults(null)
                setActiveImportType(null)
                setImportProgress({ totalSteps: 0, completedSteps: 0, processedRecords: 0, totalRecords: 0 })
            } catch (error: any) {
                toast.error(error?.message || "Failed to clean incomplete import")
            } finally {
                window.localStorage.removeItem(inflightKey)
            }
        }

        void recover()
    }, [inflightKey, orgId])

    useEffect(() => {
        if (typeof window === "undefined") return
        if (window.localStorage.getItem(inflightKey) === "1") return
        const raw = window.localStorage.getItem(completionKey)
        if (!raw) return
        try {
            const saved = JSON.parse(raw)
            if (!saved || typeof saved !== "object") return
            if (!saved.importResults) return
            setImportResults(saved.importResults)
            setCurrentStep(3)
        } catch {
            // ignore malformed cache
        }
    }, [completionKey, inflightKey])

    useEffect(() => {
        if (!(isUploading && currentStep !== 3)) return
        const handlePageExit = () => discardIncompleteImport()
        window.addEventListener("beforeunload", handlePageExit)
        window.addEventListener("pagehide", handlePageExit)
        return () => {
            window.removeEventListener("beforeunload", handlePageExit)
            window.removeEventListener("pagehide", handlePageExit)
            handlePageExit()
        }
    }, [isUploading, currentStep, discardIncompleteImport])

    const detectTypeFromName = (sheetName: string): Exclude<DataType, "everything"> | null => {
        const norm = sheetName.toLowerCase()
        if (/inventory|product|stock|item|sku|catalog/.test(norm)) return "inventory"
        if (/customer|client|party|profile|buyer/.test(norm)) return "customers"
        if (/sale|invoice|bill|order|txn|transaction/.test(norm)) return "sales"
        if (/supplier|vendor|purchase/.test(norm)) return "suppliers"
        if (/expense|expenditure|cost|payment/.test(norm)) return "expenses"
        return null
    }

    const detectTypeFromHeaders = (headers: string[]): Exclude<DataType, "everything"> | null => {
        const normalized = headers
            .map((h) => String(h).toLowerCase().replace(/[^a-z0-9]/g, ""))
            .filter(Boolean)

        if (normalized.length === 0) return null

        const score: Record<Exclude<DataType, "everything">, number> = {
            inventory: 0,
            customers: 0,
            sales: 0,
            suppliers: 0,
            expenses: 0
        }

        const has = (tokens: string[]) => tokens.some((t) => normalized.some((h) => h.includes(t)))

        if (has(["sku", "hsn", "stock", "openingstock", "mrp", "sellingprice", "unitprice"])) score.inventory += 3
        if (has(["productname", "itemname", "itemcode", "category"])) score.inventory += 2

        if (has(["customername", "customer", "mobile", "phone", "gstin", "email", "address"])) score.customers += 3
        if (has(["buyer", "client"])) score.customers += 2

        if (has(["invoiceno", "invoice", "billno", "qty", "quantity", "amount", "totalamount"])) score.sales += 3
        if (has(["sale", "selling", "paymentmode", "paymentmethod", "date"])) score.sales += 2

        if (has(["suppliername", "vendorname", "supplier", "vendor", "purchaseprice", "purchase"])) score.suppliers += 3
        if (has(["contactperson", "suppliergstin"])) score.suppliers += 2

        if (has(["expensetype", "expense", "expenditure", "paidto", "paidby", "debit", "credit"])) score.expenses += 3
        if (has(["costcenter", "ledger", "narration"])) score.expenses += 2

        const ranked = Object.entries(score).sort((a, b) => b[1] - a[1]) as Array<[Exclude<DataType, "everything">, number]>
        const [bestType, bestScore] = ranked[0]

        // Require minimum confidence to avoid misrouting random sheets.
        if (bestScore < 2) return null
        return bestType
    }

    const parseSheetRows = (sheet: XLSX.WorkSheet): { rows: any[]; headers: string[] } => {
        // Primary parse path
        let rows = XLSX.utils.sheet_to_json(sheet, { defval: null }) as any[]
        let headers = rows.length > 0 ? Object.keys(rows[0] || {}) : []

        // Fallback: handle files with leading blank rows / odd header placement
        if (rows.length === 0 || headers.length === 0) {
            const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as unknown[][]
            const headerIndex = grid.findIndex((row) => Array.isArray(row) && row.some((cell) => String(cell ?? "").trim() !== ""))
            if (headerIndex >= 0) {
                headers = (grid[headerIndex] || []).map((cell) => String(cell ?? "").trim())
                const validHeaders = headers.map((h, i) => h || `column_${i + 1}`)
                const dataRows = grid.slice(headerIndex + 1).filter((row) =>
                    Array.isArray(row) && row.some((cell) => String(cell ?? "").trim() !== "")
                )
                rows = dataRows.map((row) => {
                    const obj: Record<string, unknown> = {}
                    validHeaders.forEach((h, i) => {
                        obj[h] = (row as unknown[])[i] ?? null
                    })
                    return obj
                })
                headers = validHeaders
            }
        }

        return { rows, headers }
    }

    const handleFilesAccepted = async (files: File[]) => {
        setSelectedFiles(files)
        setIsUploading(true)
        setClarificationQuestions([])
        setClarificationAnswers({})

        try {
            if (selectedType === "everything") {
                const stats: any = { inventory: 0, customers: 0, sales: 0, suppliers: 0, expenses: 0, details: [], allData: {}, reasoning: [] }
                let totalConf = 0, sheetsMatched = 0, totalCount = 0, totalCleaned = 0, totalSkipped = 0, totalFieldsMapped = 0, anyAI = false
                const unmatchedSheets: string[] = []
                const importTypes: Exclude<DataType, "everything">[] = ["inventory", "customers", "sales", "suppliers", "expenses"]
                for (const file of files) {
                    const buffer = await file.arrayBuffer()
                    const workbook = XLSX.read(buffer, { type: "array" })
                    for (const name of workbook.SheetNames) {
                        const parsed = parseSheetRows(workbook.Sheets[name])
                        const rawData = parsed.rows
                        const headers = parsed.headers

                        let sheetType: Exclude<DataType, "everything"> | null = detectTypeFromName(name)
                        let detectionMode: "name" | "headers" = "name"
                        if (!sheetType) {
                            sheetType = detectTypeFromHeaders(headers)
                            detectionMode = "headers"
                        }

                        let result: any = null

                        const analyzeForType = async (type: Exclude<DataType, "everything">) => {
                            const response = await fetch("/api/analyze-csv", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ dataType: type, data: rawData })
                            })
                            if (!response.ok) return null
                            return await response.json()
                        }

                        if (rawData.length > 0 && sheetType) {
                            result = await analyzeForType(sheetType)
                        } else if (rawData.length > 0) {
                            // Last fallback: probe all types and pick the strongest match.
                            let best: { type: Exclude<DataType, "everything">; score: number; result: any } | null = null
                            for (const candidate of importTypes) {
                                const candidateResult = await analyzeForType(candidate)
                                if (!candidateResult) continue
                                const mapped = Object.keys(candidateResult.schema || {}).length
                                const transformedCount = Number(candidateResult.transformed?.length || 0)
                                const errorPenalty = Math.min(20, Number(candidateResult.errors?.length || 0))
                                const score = (Number(candidateResult.confidence || 0) * 100) + mapped * 3 + transformedCount - errorPenalty
                                if (!best || score > best.score) {
                                    best = { type: candidate, score, result: candidateResult }
                                }
                            }
                            if (best && (best.result?.transformed?.length || 0) > 0) {
                                sheetType = best.type
                                detectionMode = "headers"
                                result = best.result
                            }
                        }

                        if (sheetType && result) {
                            if (!Array.isArray(stats.allData[sheetType])) {
                                stats.allData[sheetType] = []
                            }
                            stats.allData[sheetType].push(...result.transformed)
                            stats[sheetType] += result.transformed.length
                            totalCount += result.transformed.length
                            totalCleaned += result.cleaned
                            totalSkipped += result.skipped
                            totalConf += result.confidence
                            totalFieldsMapped += Object.keys(result.schema || {}).length
                            if (result.usedAI) anyAI = true
                            sheetsMatched++
                            if (result.reasoning) stats.reasoning.push(`[${file.name} > ${name}] (${detectionMode}) ${result.reasoning}`)
                            if (stats.details.length < 5) stats.details.push(...result.transformed.slice(0, 1))
                        } else if (rawData.length > 0 || headers.length > 0) {
                            unmatchedSheets.push(`${file.name} > ${name}`)
                        }
                    }
                }

                setPreviewStats({
                    ...stats,
                    count: totalCount,
                    cleaned: totalCleaned,
                    skipped: totalSkipped,
                    confidence: sheetsMatched > 0 ? totalConf / sheetsMatched : 0,
                    schema: { "Aggregated": totalFieldsMapped }, // Use a dummy key or just a count indicator
                    totalFieldsMapped,
                    usedAI: anyAI,
                    reasoning: stats.reasoning.join("\n\n---\n\n")
                })
                setParsedData(stats.details)
                const firstTypeWithData = (["inventory", "customers", "sales", "suppliers", "expenses"] as const)
                    .find((type) => Array.isArray(stats.allData?.[type]) && stats.allData[type].length > 0)
                if (firstTypeWithData) setEverythingPreviewType(firstTypeWithData)
                if (totalCount === 0) {
                    if (unmatchedSheets.length > 0) {
                        throw new Error(`Could not auto-detect usable data. Unmatched sheet(s): ${unmatchedSheets.slice(0, 3).join(", ")}${unmatchedSheets.length > 3 ? "..." : ""}. Try selecting a specific import type.`)
                    }
                    throw new Error("No supported sheets with usable data were detected in this file")
                }
                if (unmatchedSheets.length > 0) {
                    toast.warning(`Skipped ${unmatchedSheets.length} sheet(s): ${unmatchedSheets.slice(0, 3).join(", ")}${unmatchedSheets.length > 3 ? "..." : ""}`)
                }
                toast.success(`Detected ${files.length} file(s)`)
            } else {
                const file = files[0]
                if (!file) throw new Error("No file selected")
                const buffer = await file.arrayBuffer()
                const workbook = XLSX.read(buffer, { type: "array" })
                const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]])
                if (rawData.length === 0) { toast.error("File is empty"); setIsUploading(false); return }
                setRawUploadData(rawData as any[])

                toast.info("AI Analysis in progress...", { id: "analyzing" })
                const response = await fetch("/api/analyze-csv", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ dataType: selectedType, data: rawData })
                })
                if (!response.ok) {
                    const err = await response.json()
                    throw new Error(err.error || "Failed to analyze uploaded file")
                }
                const result = await response.json()
                toast.dismiss("analyzing")

                if (result.usedAI) {
                    toast.success(`AI optimized ${Object.keys(result.schema).length} fields`)
                } else {
                    toast.success(`Processed ${result.transformed.length} records`)
                }

                result.warnings.forEach((w: string) => toast.warning(w, { duration: 5000 }))
                result.suggestions?.forEach((s: string) => toast.info(s, { duration: 4000 }))

                setBaseSchema(result.schema || {})
                setParsedData(result.transformed)
                setPreviewStats({
                    count: result.transformed.length,
                    skipped: result.skipped,
                    cleaned: result.cleaned,
                    schema: result.schema,
                    confidence: result.confidence,
                    usedAI: result.usedAI,
                    detectedSource: result.detectedSource || "generic",
                    warnings: result.warnings,
                    errors: result.errors,
                    reasoning: result.reasoning
                })

                // Ask targeted Groq-powered clarification questions when needed.
                try {
                    const qRes = await fetch("/api/migration/clarify/questions", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            dataType: selectedType,
                            data: rawData,
                            schema: result.schema || {}
                        })
                    })
                    if (qRes.ok) {
                        const qPayload = await qRes.json()
                        const questions = Array.isArray(qPayload?.questions) ? qPayload.questions : []
                        if (questions.length > 0) {
                            setClarificationQuestions(questions)
                            const defaults: Record<string, string> = {}
                            questions.forEach((q: any) => {
                                if (q?.field && result?.schema?.[q.field]) defaults[q.field] = result.schema[q.field]
                            })
                            setClarificationAnswers(defaults)
                            toast.info(`Need ${questions.length} quick clarification${questions.length > 1 ? "s" : ""} to improve mapping`)
                        } else {
                            setClarificationQuestions([])
                            setClarificationAnswers({})
                        }
                    }
                } catch {
                    // Clarification is optional; ignore failures.
                    setClarificationQuestions([])
                    setClarificationAnswers({})
                }
            }

            // Keep user on upload step; move forward via explicit "Next" button.
        } catch (error: any) {
            toast.error(`Failed to process: ${error.message}`)
        } finally {
            setIsUploading(false)
        }
    }

    const handleImport = async () => {
        if (selectedFiles.length === 0) return

        setIsUploading(true)
        setActiveImportType(null)
        setImportProgress({ totalSteps: 0, completedSteps: 0, processedRecords: 0, totalRecords: 0 })
        setImportStartedAt(Date.now())
        if (typeof window !== "undefined") {
            window.localStorage.removeItem(completionKey)
            window.localStorage.setItem(`migration-inflight:${orgId}`, "1")
        }
        try {
            let totalSuccess = 0, totalFailed = 0, allErrors: string[] = []
            const byType: Record<string, { success: number; failed: number }> = {}

            const callApi = async (
                type: string,
                data: any[],
                onChunkComplete?: (processedInChunk: number, chunkIndex: number, totalChunks: number) => void
            ) => {
                if (!Array.isArray(data) || data.length === 0) {
                    return { success: true, count: 0, failed: 0, errors: [] }
                }

                // Backend enforces max 10000 rows/request; batch large imports.
                const chunkSize = 10000
                let totalCount = 0
                let totalFailed = 0
                const allErrors: string[] = []

                const totalChunks = Math.ceil(data.length / chunkSize)
                for (let i = 0; i < data.length; i += chunkSize) {
                    const chunk = data.slice(i, i + chunkSize)
                    const chunkIndex = Math.floor(i / chunkSize) + 1
                    const res = await fetch(`/api/migration/${type}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ orgId, data: chunk })
                    })
                    if (!res.ok) {
                        let message = `Import of ${type} failed`
                        try {
                            const err = await res.json()
                            message = err.error || message
                        } catch { }
                        throw new Error(message)
                    }
                    const batch = await res.json()
                    totalCount += Number(batch?.count || 0)
                    totalFailed += Number(batch?.failed || 0)
                    if (Array.isArray(batch?.errors) && batch.errors.length > 0) {
                        allErrors.push(...batch.errors)
                    }
                    onChunkComplete?.(chunk.length, chunkIndex, totalChunks)
                }

                return { success: totalFailed === 0, count: totalCount, failed: totalFailed, errors: allErrors }
            }

            if (selectedType === "everything") {
                // Groq-dynamic server pipeline: temp upload -> start job -> poll status.
                const uploaded: Array<{ bucket: string; path: string; name: string }> = []
                for (const file of selectedFiles) {
                    setActiveImportType(`Uploading ${file.name}`)
                    const form = new FormData()
                    form.append("orgId", orgId)
                    form.append("file", file)
                    const upRes = await fetch("/api/migration/temp-upload", { method: "POST", body: form })
                    if (!upRes.ok) {
                        const err = await upRes.json().catch(() => ({}))
                        throw new Error(err?.error || `Failed to upload ${file.name}`)
                    }
                    const up = await upRes.json()
                    uploaded.push({ bucket: up.bucket, path: up.path, name: up.name })
                }

                setActiveImportType("Starting Groq import job")
                const startRes = await fetch("/api/migration/jobs/start", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orgId, tempFiles: uploaded }),
                })
                if (!startRes.ok) {
                    const err = await startRes.json().catch(() => ({}))
                    throw new Error(err?.error || "Failed to start import job")
                }
                const started = await startRes.json()
                const jobId = String(started?.jobId || "")
                if (!jobId) throw new Error("Import job id missing")

                const maxPolls = 1200 // ~30 minutes at 1.5s interval
                for (let poll = 0; poll < maxPolls; poll++) {
                    await new Promise((resolve) => setTimeout(resolve, 1500))
                    const stRes = await fetch(`/api/migration/jobs/status?jobId=${encodeURIComponent(jobId)}`, { cache: "no-store" })
                    if (!stRes.ok) {
                        const err = await stRes.json().catch(() => ({}))
                        throw new Error(err?.error || "Failed to read import status")
                    }
                    const status = await stRes.json()
                    setActiveImportType(status?.currentType || "Processing with Groq")
                    setImportProgress({
                        totalSteps: Number(status?.totalSteps || 0),
                        completedSteps: Number(status?.completedSteps || 0),
                        processedRecords: Number(status?.processedRecords || 0),
                        totalRecords: Number(status?.totalRecords || 0),
                    })

                    if (status?.status === "completed") {
                        const result = status?.result || {}
                        totalSuccess += Number(result?.success || status?.successRows || 0)
                        totalFailed += Number(result?.failed || status?.failedRows || 0)
                        allErrors.push(...(Array.isArray(result?.errors) ? result.errors : []))
                        const jobByType = result?.byType && typeof result.byType === "object" ? result.byType : {}
                        Object.assign(byType, jobByType)
                        break
                    }

                    if (status?.status === "failed") {
                        const errMsg = String(status?.errorMessage || "Import job failed")
                        const errLines = Array.isArray(status?.errors) ? status.errors : []
                        throw new Error([errMsg, ...errLines].filter(Boolean).join(" | "))
                    }

                    if (poll === maxPolls - 1) {
                        throw new Error("Import timed out while waiting for job completion")
                    }
                }
            } else {
                // Single sheet import using pre-processed parsedData
                if (!parsedData || parsedData.length === 0) throw new Error("No data to import")
                setActiveImportType(selectedType)
                const results = await callApi(selectedType, parsedData)
                if (results?.success) {
                    totalSuccess += results.count
                    totalFailed = (results.failed || 0)
                    if (results.errors) allErrors.push(...results.errors)
                }
                byType[selectedType] = {
                    success: Number(results?.count || 0),
                    failed: Number(results?.failed || 0)
                }
            }

            setImportResults({ success: totalSuccess, failed: totalFailed, errors: allErrors, byType })
            setCurrentStep(3)
            if (typeof window !== "undefined") {
                window.localStorage.removeItem(`migration-inflight:${orgId}`)
                window.localStorage.setItem(completionKey, JSON.stringify({
                    importResults: { success: totalSuccess, failed: totalFailed, errors: allErrors, byType }
                }))
            }

            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ["#10b981", "#ffffff", "#34d399"]
            })

        } catch (error: any) {
            toast.error(error.message)
            console.error("Import error:", error)
        } finally {
            setActiveImportType(null)
            setIsUploading(false)
            setImportProgress({ totalSteps: 0, completedSteps: 0, processedRecords: 0, totalRecords: 0 })
            setImportStartedAt(null)
        }
    }

    const resetWizard = () => {
        setCurrentStep(1)
        setSelectedType("everything")
        setSelectedFiles([])
        setParsedData([])
        setImportResults(null)
        setPreviewStats(null)
        setClarificationQuestions([])
        setClarificationAnswers({})
        setRawUploadData([])
        setBaseSchema({})
        if (typeof window !== "undefined") {
            window.localStorage.removeItem(`migration-inflight:${orgId}`)
            window.localStorage.removeItem(completionKey)
        }
    }

    const handleDiscardImport = async () => {
        setIsDiscardingImport(true)
        try {
            const res = await fetch("/api/migration/discard-incomplete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orgId }),
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err?.error || "Failed to discard imported data")
            }
            toast.success("Imported data discarded.")
            resetWizard()
        } catch (error: any) {
            toast.error(error?.message || "Could not discard imported data")
        } finally {
            setIsDiscardingImport(false)
        }
    }

    const resolveClarifications = async () => {
        if (selectedType === "everything" || clarificationQuestions.length === 0) return
        const unanswered = clarificationQuestions.filter((q) => q.required && !clarificationAnswers[q.field])
        if (unanswered.length > 0) {
            toast.error("Please answer all required clarification questions")
            return
        }

        setIsResolvingClarifications(true)
        try {
            const response = await fetch("/api/migration/clarify/resolve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    dataType: selectedType,
                    data: rawUploadData,
                    schema: baseSchema,
                    answers: clarificationAnswers
                })
            })

            if (!response.ok) {
                const err = await response.json()
                throw new Error(err.error || "Failed to resolve clarifications")
            }

            const result = await response.json()
            setBaseSchema(result.schema || baseSchema)
            setParsedData(result.transformed || [])
            setPreviewStats({
                count: result.transformed?.length || 0,
                skipped: result.skipped || 0,
                cleaned: result.cleaned || 0,
                schema: result.schema || baseSchema,
                confidence: result.confidence || 0,
                usedAI: true,
                warnings: result.warnings || [],
                errors: result.errors || [],
                reasoning: "Groq clarification answers applied."
            })
            setClarificationQuestions([])
            toast.success("Mappings updated from your answers")
        } catch (error: any) {
            toast.error(error.message || "Could not apply clarification answers")
        } finally {
            setIsResolvingClarifications(false)
        }
    }

    return (
        <div className="h-auto overflow-visible bg-gradient-to-br from-zinc-50 via-white to-emerald-50/30 dark:from-zinc-950 dark:via-zinc-950 dark:to-emerald-950/20 p-2 lg:p-2.5">
            <div className="w-full">

                <div className="flex items-center justify-between mb-3 w-full max-w-5xl mx-auto shrink-0 px-2 md:px-4 animate-in fade-in">
                    {steps.map((step, index) => {
                        const isActive = currentStep === step.number
                        const isCompleted = currentStep > step.number
                        const canNavigateToStep = step.number < currentStep && !isUploading && !isResolvingClarifications
                        const Icon = step.icon
                        return (
                            <div key={step.number} className="flex items-center flex-1">
                                <button
                                    type="button"
                                    onClick={() => canNavigateToStep && setCurrentStep(step.number)}
                                    disabled={!canNavigateToStep}
                                    className={`flex flex-col items-center flex-1 ${canNavigateToStep ? "cursor-pointer" : "cursor-default"}`}
                                >
                                    <div
                                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${isCompleted ? "bg-emerald-500 text-white" : isActive ? "bg-emerald-500 text-white ring-2 ring-emerald-100 dark:ring-emerald-500/30 animate-in scale-in" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500"
                                            }`}
                                    >
                                        {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                                    </div>
                                    <p className={`text-[11px] font-semibold mt-1.5 text-center transition-colors duration-300 ${isActive ? "text-emerald-600" : "text-zinc-500 dark:text-zinc-400"}`}>{step.label}</p>
                                </button>
                                {index < steps.length - 1 && <div className={`h-1 flex-1 mx-2 rounded-full transition-all duration-500 ${currentStep > step.number ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-800"}`} />}
                            </div>
                        )
                    })}
                </div>

                <div
                    key={currentStep}
                    className={`animate-in fade-in slide-up p-4 md:p-5 ${currentStep === 3
                        ? "bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-white/10"
                        : "bg-transparent border-0 shadow-none rounded-none"
                        }`}
                >
                    {false && currentStep === 1 && (
                        <div className="flex flex-col">
                            <h2 className="text-xl font-bold text-zinc-900 mb-1">What would you like to import?</h2>
                            <p className="text-sm text-zinc-600 mb-3">Select the type of data you want to migrate into KhataPlus</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 content-start">
                                {Object.entries(dataTypeConfig).map(([key, config], index) => {
                                    const Icon = config.icon
                                    const isSelected = selectedType === key
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedType(key as DataType)}
                                            className={`group relative overflow-hidden rounded-2xl border text-left transition-all duration-300 active-scale animate-in fade-in slide-up ${isSelected ? `border-${config.color}-500 shadow-lg shadow-zinc-200/70` : "border-zinc-200 hover:border-zinc-300 hover:shadow-md"
                                                }`}
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <div className={`absolute inset-y-0 left-0 w-1.5 rounded-l-2xl transition-all duration-300 ${isSelected ? `bg-${config.color}-500` : "bg-transparent group-hover:bg-zinc-200"}`} />
                                            <div className={`relative flex items-start gap-4 px-4 py-4 rounded-2xl transition-colors duration-300 ${isSelected ? `bg-${config.color}-50/40` : "bg-white group-hover:bg-zinc-50/80"}`}>
                                                <div className={`p-2.5 rounded-xl border ${isSelected ? `bg-${config.color}-100 border-${config.color}-200` : "bg-zinc-100 border-zinc-200"} transition-all duration-300`}>
                                                    <Icon className={`h-5 w-5 ${isSelected ? `text-${config.color}-600` : "text-zinc-600"} transition-colors duration-300`} />
                                                </div>
                                                <div className="flex-1 pr-6">
                                                    <h3 className="font-bold text-sm text-zinc-900 mb-1">{config.label}</h3>
                                                    <p className="text-xs text-zinc-600">{config.description}</p>
                                                </div>
                                                <ArrowRight className={`h-4 w-4 mt-1 transition-all duration-300 ${isSelected ? `text-${config.color}-600 translate-x-0` : "text-zinc-300 -translate-x-1 group-hover:translate-x-0 group-hover:text-zinc-500"}`} />
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                            <div className="flex justify-end mt-3 pt-2 shrink-0">
                                <Button onClick={() => setCurrentStep(2)} disabled={!selectedType} className="h-9 bg-emerald-600 hover:bg-emerald-500 hover-scale active-scale">
                                    Continue <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {currentStep === 1 && selectedType && (
                        <div className="flex flex-col">
                            <div className="shrink-0">
                                <h2 className="text-xl font-bold text-zinc-900 mb-1.5">Upload your {dataTypeConfig[selectedType].label} file</h2>
                                <p className="text-sm text-zinc-600 mb-4">Drag and drop your CSV or Excel file, or click to browse</p>
                            </div>

                            <div>
                                <div className="w-full">
                                    <FileDropzone
                                        onFileAccepted={(file) => handleFilesAccepted([file])}
                                        onFilesAccepted={handleFilesAccepted}
                                        onFileRejected={(error) => toast.error(error)}
                                        currentFiles={selectedFiles}
                                        maxFiles={10}
                                        onRemoveFileAt={(index) => {
                                            const remaining = selectedFiles.filter((_, i) => i !== index)
                                            if (remaining.length === 0) {
                                                setSelectedFiles([])
                                                setParsedData([])
                                                setPreviewStats(null)
                                                setClarificationQuestions([])
                                                setClarificationAnswers({})
                                                return
                                            }
                                            void handleFilesAccepted(remaining)
                                        }}
                                        disabled={isUploading}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end mt-5">
                                <Button
                                    onClick={() => setCurrentStep(2)}
                                    disabled={isUploading || selectedFiles.length === 0 || !previewStats}
                                    className="h-9 bg-emerald-600 hover:bg-emerald-500"
                                >
                                    {isUploading
                                        ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                                        : <>Next <ArrowRight className="h-4 w-4 ml-2" /></>}
                                </Button>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="w-full min-w-0">
                            {clarificationQuestions.length > 0 && (
                                <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                                    <div className="flex items-center justify-between gap-4 mb-3">
                                        <div>
                                            <h3 className="text-sm font-bold text-emerald-800">Quick Clarifications</h3>
                                            <p className="text-xs text-emerald-700">Answer these so Groq can fix mapping before import.</p>
                                        </div>
                                        <Button
                                            onClick={resolveClarifications}
                                            disabled={isResolvingClarifications}
                                            className="h-8 bg-emerald-600 hover:bg-emerald-500"
                                        >
                                            {isResolvingClarifications
                                                ? <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Applying...</>
                                                : "Apply Answers"}
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {clarificationQuestions.map((q) => (
                                            <div key={q.id} className="rounded-lg border border-emerald-100 bg-white p-3">
                                                <p className="text-xs font-semibold text-zinc-900 mb-1">{q.question}</p>
                                                <p className="text-[11px] text-zinc-500 mb-2">{q.reason}</p>
                                                <select
                                                    className="w-full h-9 rounded-md border border-zinc-200 bg-white px-2 text-xs"
                                                    value={clarificationAnswers[q.field] || ""}
                                                    onChange={(e) => setClarificationAnswers((prev) => ({ ...prev, [q.field]: e.target.value }))}
                                                >
                                                    <option value="">Select column...</option>
                                                    {q.options.map((opt) => (
                                                        <option key={`${q.id}-${opt}`} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-zinc-900">Review & Confirm</h2>
                                    <p className="text-zinc-500 text-sm mt-1">
                                        {previewStats?.usedAI && <span className="inline-flex items-center gap-1 text-emerald-600 font-medium"><Sparkles className="h-3.5 w-3.5" /> AI Analyzed</span>}
                                        {!previewStats?.usedAI && <span>Pattern-matched</span>}
                                        {' - '}{previewStats?.count || parsedData.length} records ready
                                        {previewStats?.detectedSource && (
                                            <span className="ml-2 text-xs text-zinc-400">
                                                Source: {String(previewStats.detectedSource).toUpperCase()}
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                                {/* Confidence */}
                                <div className="bg-gradient-to-br from-emerald-50 to-white p-3 rounded-xl border border-emerald-100 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sparkles className="h-4 w-4 text-emerald-500" />
                                        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Confidence</span>
                                    </div>
                                    <div className="text-2xl font-black text-emerald-600">{Math.round((previewStats?.confidence || 0) * 100)}%</div>
                                    <div className="mt-2 h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${(previewStats?.confidence || 0) > 0.8 ? 'bg-emerald-500' : (previewStats?.confidence || 0) > 0.5 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                            style={{ width: `${(previewStats?.confidence || 0) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Fields Mapped */}
                                <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-sm">
                                    <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Fields Mapped</div>
                                    <div className="text-2xl font-black text-zinc-900">
                                        {(previewStats as any)?.totalFieldsMapped ?? Object.keys(previewStats?.schema || {}).length}
                                    </div>
                                    <div className="text-[10px] text-zinc-400 mt-1">database columns</div>
                                </div>

                                {/* Auto-Cleaned */}
                                <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-sm">
                                    <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Auto-Cleaned</div>
                                    <div className="text-2xl font-black text-blue-600">{previewStats?.cleaned || 0}</div>
                                    <div className="text-[10px] text-zinc-400 mt-1">values normalized</div>
                                </div>

                                {/* Skipped */}
                                <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-sm">
                                    <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Skipped</div>
                                    <div className="text-2xl font-black text-zinc-400">{previewStats?.skipped || 0}</div>
                                    <div className="text-[10px] text-zinc-400 mt-1">empty rows</div>
                                </div>
                            </div>

                            {/* Data Health Bar */}
                            {(() => {
                                const total = (previewStats?.count || 0) + (previewStats?.skipped || 0)
                                if (total === 0) return null
                                const validPct = ((previewStats?.count || 0) / total) * 100
                                const skippedPct = ((previewStats?.skipped || 0) / total) * 100
                                return (
                                    <div className="mb-6">
                                        <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-400 mb-1.5">
                                            <span>Data Quality Distribution</span>
                                            <span>{Math.round(validPct)}% usable</span>
                                        </div>
                                        <div className="h-2.5 bg-zinc-100 rounded-full flex overflow-hidden">
                                            <div className="bg-emerald-500 transition-all duration-700" style={{ width: `${validPct}%` }} />
                                            {skippedPct > 0 && <div className="bg-zinc-300 transition-all duration-700" style={{ width: `${skippedPct}%` }} />}
                                        </div>
                                        <div className="flex gap-4 mt-1.5">
                                            <span className="flex items-center gap-1 text-[10px] text-zinc-500"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Valid ({previewStats?.count || 0})</span>
                                            <span className="flex items-center gap-1 text-[10px] text-zinc-500"><span className="w-2 h-2 rounded-full bg-zinc-300" /> Skipped ({previewStats?.skipped || 0})</span>
                                        </div>
                                    </div>
                                )
                            })()}

                            {/* Multi-Sheet Summary (Everything mode) */}
                            {selectedType === "everything" && previewStats && (
                                <div className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-2">
                                    {["inventory", "customers", "sales", "suppliers", "expenses"].map(type => {
                                        const count = previewStats[type] || 0
                                        const config = dataTypeConfig[type as keyof typeof dataTypeConfig]
                                        if (!config) return null
                                        const Icon = config.icon
                                        return (
                                            <div key={type} className={`p-3 rounded-lg border ${count > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-zinc-50 border-zinc-200 opacity-50'}`}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Icon className={`h-3.5 w-3.5 ${count > 0 ? 'text-emerald-600' : 'text-zinc-400'}`} />
                                                    <span className="text-xs font-semibold text-zinc-700">{config.label}</span>
                                                </div>
                                                <div className={`text-lg font-black ${count > 0 ? 'text-emerald-700' : 'text-zinc-400'}`}>{count}</div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            {/* Field Mapping Review */}
                            {previewStats?.schema && Object.keys(previewStats.schema).length > 0 && selectedType !== "everything" && (
                                <details className="mb-6 group">
                                    <summary className="cursor-pointer flex items-center gap-2 text-sm font-semibold text-zinc-700 hover:text-zinc-900 select-none">
                                        <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                                        Field Mapping ({Object.keys(previewStats.schema).length} mappings)
                                    </summary>
                                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-1.5">
                                        {Object.entries(previewStats.schema).map(([dbField, csvCol]) => (
                                            <div key={dbField} className="flex items-center gap-2 py-1.5 px-3 bg-zinc-50 rounded-lg text-xs">
                                                <span className="font-mono font-bold text-emerald-700 min-w-[100px]">{dbField}</span>
                                                <ArrowRight className="h-3 w-3 text-zinc-300 shrink-0" />
                                                <span className="text-zinc-600 truncate">{csvCol as string}</span>
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            )}

                            {/* Warnings & Errors */}
                            {(previewStats?.warnings?.length > 0 || previewStats?.errors?.length > 0) && (
                                <div className="mb-6 space-y-1.5">
                                    {previewStats.errors?.slice(0, 3).map((err: string, i: number) => (
                                        <div key={`e${i}`} className="flex items-center gap-2 p-2 px-3 bg-rose-50 border border-rose-100 rounded-lg text-xs text-rose-700">
                                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                            <span className="font-semibold">Blocker:</span> <span className="truncate">{err}</span>
                                        </div>
                                    ))}
                                    {previewStats.warnings?.slice(0, 3).map((warn: string, i: number) => (
                                        <div key={`w${i}`} className="flex items-center gap-2 p-2 px-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
                                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                            <span className="font-semibold">Warning:</span> <span className="truncate">{warn}</span>
                                        </div>
                                    ))}
                                    {((previewStats.warnings?.length || 0) > 3 || (previewStats.errors?.length || 0) > 3) && (
                                        <p className="text-[10px] text-zinc-400 px-2 italic">...and {Math.max(0, (previewStats.warnings?.length || 0) - 3) + Math.max(0, (previewStats.errors?.length || 0) - 3)} more</p>
                                    )}
                                </div>
                            )}

                            {/* Reasoning Breakdown */}
                            {previewStats?.reasoning && (
                                <div className="mb-6 bg-zinc-900 rounded-xl p-4 shadow-2xl border border-white/5 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Sparkles className="h-24 w-24 text-primary" />
                                    </div>

                                    <h3 className="text-primary font-black text-xs uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                        Deep Reasoning (R1 Thinking Process)
                                    </h3>

                                    <div className="text-zinc-400 font-mono text-[11px] leading-relaxed max-h-40 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                                        {previewStats.reasoning}
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                        <span className="text-[10px] text-zinc-500 font-medium">Model: deepseek-r1-distill-llama-70b</span>
                                        <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Analysis Verified</span>
                                    </div>
                                </div>
                            )}

                            {/* Data Preview Table */}
                            <div className="bg-zinc-50 rounded-xl border border-zinc-200 mb-6 overflow-hidden shadow-sm text-xs">
                                <div className="px-4 py-2.5 bg-zinc-100/80 border-b border-zinc-200 flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Data Preview</span>
                                    <span className="text-[10px] text-zinc-400">
                                        {selectedType === "everything"
                                            ? `${((previewStats as any)?.allData?.[everythingPreviewType] || []).length} records (${everythingPreviewType})`
                                            : `${parsedData.length} total records`}
                                    </span>
                                </div>
                                {selectedType === "everything" && previewStats?.allData && (
                                    <div className="px-3 py-2 border-b border-zinc-200 bg-white flex flex-wrap gap-2">
                                        {(["inventory", "customers", "sales", "suppliers", "expenses"] as const).map((type) => {
                                            const count = Number((previewStats as any)?.[type] || 0)
                                            if (count === 0) return null
                                            const isActive = everythingPreviewType === type
                                            return (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setEverythingPreviewType(type)}
                                                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${isActive ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-zinc-100 text-zinc-600 border border-zinc-200 hover:bg-zinc-200"}`}
                                                >
                                                    {dataTypeConfig[type].label} ({count})
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                                <div className="max-h-60 overflow-auto">
                                    <table className="w-full text-xs">
                                        <thead className="sticky top-0 bg-zinc-100 border-b border-zinc-200 z-10">
                                            <tr>
                                                <th className="text-center py-2.5 px-2 font-bold text-zinc-400 w-10">#</th>
                                                {Object.keys(
                                                    selectedType === "everything"
                                                        ? (((previewStats as any)?.allData?.[everythingPreviewType] || [])[0] || {})
                                                        : (parsedData[0] || {})
                                                ).filter(k => k !== '_rowNumber').map(key => (
                                                    <th key={key} className="text-left py-2.5 px-3 font-bold text-zinc-700 uppercase tracking-wider whitespace-nowrap">
                                                        {key.replace(/_/g, ' ')}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-zinc-100">
                                            {(selectedType === "everything"
                                                ? ((previewStats as any)?.allData?.[everythingPreviewType] || [])
                                                : parsedData
                                            ).slice(0, 20).map((row: any, i: number) => (
                                                <tr key={i} className="hover:bg-emerald-50/30 transition-colors">
                                                    <td className="text-center py-2 px-2 text-zinc-400 font-mono text-[10px]">{i + 1}</td>
                                                    {Object.entries(row).filter(([k]) => k !== '_rowNumber').map(([k, val]: [string, any], j) => (
                                                        <td key={j} className="py-2 px-3 text-zinc-600 max-w-[200px] truncate">
                                                            {val === null || val === undefined || val === ''
                                                                ? <span className="text-zinc-300 italic text-[10px]">—</span>
                                                                : <span className="font-medium">{val.toString()}</span>}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {(selectedType === "everything"
                                    ? (((previewStats as any)?.allData?.[everythingPreviewType] || []).length > 20)
                                    : (parsedData.length > 20)
                                ) && (
                                    <div className="px-4 py-2 bg-zinc-50 text-center text-[10px] text-zinc-400 border-t border-zinc-200">
                                        Showing 20 of {selectedType === "everything"
                                            ? ((previewStats as any)?.allData?.[everythingPreviewType] || []).length
                                            : parsedData.length} records
                                    </div>
                                )}
                            </div>

                            {/* Action Bar */}
                            {isUploading && selectedType === "everything" && importProgress.totalSteps > 0 && (
                                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                                    <div className="flex items-center justify-between text-xs mb-2">
                                        <span className="font-semibold text-emerald-700">
                                            Importing {activeImportType || "data"}...
                                        </span>
                                        <span className="text-emerald-700">
                                            Step {Math.min(importProgress.completedSteps + 1, importProgress.totalSteps)} / {importProgress.totalSteps}
                                        </span>
                                    </div>
                                    <div className="h-2 rounded-full bg-emerald-100 overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500 transition-all duration-500"
                                            style={{
                                                width: `${importProgress.totalRecords > 0
                                                    ? Math.round((importProgress.processedRecords / importProgress.totalRecords) * 100)
                                                    : 0}%`
                                            }}
                                        />
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-[11px]">
                                        <span className="text-emerald-800">
                                            {importStatusMessages[statusIndex]}
                                        </span>
                                        <span className="text-emerald-700">
                                            {(() => {
                                                if (!importStartedAt || importProgress.processedRecords <= 0 || importProgress.totalRecords <= 0) return "ETA: calculating..."
                                                const elapsedSec = Math.max(1, (Date.now() - importStartedAt) / 1000)
                                                const rate = importProgress.processedRecords / elapsedSec
                                                if (rate <= 0.05) return "ETA: estimating..."
                                                const remaining = Math.max(0, importProgress.totalRecords - importProgress.processedRecords)
                                                const etaSec = Math.ceil(remaining / rate)
                                                const min = Math.floor(etaSec / 60)
                                                const sec = etaSec % 60
                                                return min > 0 ? `ETA: ${min}m ${sec}s` : `ETA: ${sec}s`
                                            })()}
                                        </span>
                                    </div>
                                    <div className="mt-1 text-[11px] text-emerald-800">
                                        Processed {importProgress.processedRecords} / {importProgress.totalRecords} records
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-between items-center bg-white/80 backdrop-blur-sm p-3 border-t border-zinc-100 mt-4 rounded-b-2xl">
                                <Button onClick={() => setCurrentStep(1)} variant="ghost" className="h-9" disabled={isUploading}>
                                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                                </Button>
                                <div className="flex items-center gap-4">
                                    {previewStats?.errors?.length > 0 && (
                                        <span className="text-xs text-rose-500 font-medium">{previewStats.errors.length} issue{previewStats.errors.length > 1 ? 's' : ''} found</span>
                                    )}
                                    <Button
                                        onClick={handleImport}
                                        className="h-9 bg-emerald-600 hover:bg-emerald-500 min-w-[170px] shadow-lg shadow-emerald-200"
                                        disabled={isUploading || clarificationQuestions.length > 0 || (previewStats?.errors?.length || 0) > 50 || (previewStats?.count || 0) === 0}
                                    >
                                        {isUploading
                                            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importing{activeImportType ? ` ${activeImportType}` : ""}...</>
                                            : <>Start Import <ArrowRight className="h-4 w-4 ml-2" /></>}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Complete */}
                    {currentStep === 3 && importResults && (
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-full mb-4">
                                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Import Complete!</h2>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">Successfully imported {importResults.success} records</p>

                            {importResults.byType && Object.keys(importResults.byType).length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8 max-w-2xl mx-auto text-left">
                                    {Object.entries(importResults.byType).map(([type, result]: [string, any]) => (
                                        <div key={type} className="rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900 p-3">
                                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 capitalize">{type}</p>
                                            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                                                Imported {result.success || 0}, Failed {result.failed || 0}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {importResults.failed > 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 max-w-2xl mx-auto text-left">
                                    <div className="flex items-start gap-3 mb-3">
                                        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                                        <div className="flex-1">
                                            <p className="font-semibold text-amber-900 mb-1">{importResults.failed} records failed</p>
                                            <p className="text-sm text-amber-700 mb-3">Some records couldn't be imported due to validation errors</p>

                                            {/* Show first 20 errors */}
                                            {importResults.errors && importResults.errors.length > 0 && (
                                                <details className="mt-3">
                                                    <summary className="text-sm font-semibold text-amber-800 cursor-pointer hover:text-amber-900">
                                                        View error details ({importResults.errors.length} errors)
                                                    </summary>
                                                    <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                                                        {importResults.errors.slice(0, 20).map((error: string, i: number) => (
                                                            <div key={i} className="text-xs bg-white rounded p-2 border border-amber-200 text-amber-900 font-mono text-wrap break-all">
                                                                {error}
                                                            </div>
                                                        ))}
                                                        {importResults.errors.length > 20 && (
                                                            <p className="text-xs text-amber-700 italic">
                                                                + {importResults.errors.length - 20} more errors...
                                                            </p>
                                                        )}
                                                    </div>
                                                </details>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 justify-center">
                                <Button onClick={resetWizard} variant="outline" className="h-9 border-zinc-300 dark:border-white/10 dark:text-zinc-100 dark:hover:bg-zinc-900">
                                    Import More Data
                                </Button>
                                {importResults?.failed > 0 && (
                                    <Button
                                        onClick={handleDiscardImport}
                                        variant="outline"
                                        className="h-9 border-rose-300 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                        disabled={isDiscardingImport}
                                    >
                                        {isDiscardingImport
                                            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Discarding...</>
                                            : "Discard This Import"}
                                    </Button>
                                )}
                                <Button
                                    onClick={() => window.location.href = `/dashboard`}
                                    className="h-9 bg-emerald-600 hover:bg-emerald-500 text-white"
                                >
                                    Go to Dashboard <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
