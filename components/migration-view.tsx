"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Upload, FileText, Eye, CheckCircle2, Users, Package,
    Truck, Receipt, BookOpen, Download,
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
    const [selectedType, setSelectedType] = useState<DataType | null>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [parsedData, setParsedData] = useState<any[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const [importResults, setImportResults] = useState<any>(null)
    const [previewStats, setPreviewStats] = useState<any>(null)

    const steps = [
        { number: 1, label: "Choose Data", icon: FileText },
        { number: 2, label: "Upload", icon: Upload },
        { number: 3, label: "Preview", icon: Eye },
        { number: 4, label: "Complete", icon: CheckCircle2 }
    ]

    const handleFileAccepted = async (file: File) => {
        setSelectedFile(file)
        setIsUploading(true)

        try {
            const buffer = await file.arrayBuffer()
            const workbook = XLSX.read(buffer, { type: "array" })

            if (selectedType === "everything") {
                const stats: any = { inventory: 0, customers: 0, sales: 0, suppliers: 0, expenses: 0, details: [], allData: {} }
                let totalConf = 0, sheetsMatched = 0, totalCount = 0, totalCleaned = 0, totalSkipped = 0

                for (const name of workbook.SheetNames) {
                    const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[name])
                    const norm = name.toLowerCase()
                    let sheetType: string | null = null
                    if (/inventory|product|stock|item/.test(norm)) sheetType = "inventory"
                    else if (/customer|client|party|profile|buyer/.test(norm)) sheetType = "customers"
                    else if (/sale|invoice|bill|order/.test(norm)) sheetType = "sales"
                    else if (/supplier|vendor|purchase/.test(norm)) sheetType = "suppliers"
                    else if (/expense|expenditure|cost/.test(norm)) sheetType = "expenses"

                    if (sheetType && rawData.length > 0) {
                        const response = await fetch("/api/analyze-csv", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ dataType: sheetType, data: rawData })
                        })
                        const result = await response.json()

                        stats.allData[sheetType] = result.transformed
                        stats[sheetType] = result.transformed.length
                        totalCount += result.transformed.length
                        totalCleaned += result.cleaned
                        totalSkipped += result.skipped
                        totalConf += result.confidence
                        sheetsMatched++
                        if (stats.details.length < 5) stats.details.push(...result.transformed.slice(0, 1))
                    }
                }

                setPreviewStats({
                    ...stats, count: totalCount, cleaned: totalCleaned, skipped: totalSkipped,
                    confidence: sheetsMatched > 0 ? totalConf / sheetsMatched : 0,
                    schema: { "Multi-sheet": "Active" }
                })
                setParsedData(stats.details)
                toast.success(`Detected ${workbook.SheetNames.length} sheets`)
            } else {
                const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]])
                if (rawData.length === 0) { toast.error("File is empty"); setIsUploading(false); return }

                toast.info("AI Analysis in progress...", { id: "analyzing" })
                const response = await fetch("/api/analyze-csv", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ dataType: selectedType, data: rawData })
                })
                const result = await response.json()
                toast.dismiss("analyzing")

                if (result.usedAI) {
                    toast.success(`AI optimized ${Object.keys(result.schema).length} fields`)
                } else {
                    toast.success(`Processed ${result.transformed.length} records`)
                }

                result.warnings.forEach((w: string) => toast.warning(w, { duration: 5000 }))
                result.suggestions?.forEach((s: string) => toast.info(s, { duration: 4000 }))

                setParsedData(result.transformed)
                setPreviewStats({
                    count: result.transformed.length,
                    skipped: result.skipped,
                    cleaned: result.cleaned,
                    schema: result.schema,
                    confidence: result.confidence,
                    usedAI: result.usedAI,
                    warnings: result.warnings,
                    errors: result.errors
                })
            }

            setCurrentStep(3)
        } catch (error: any) {
            toast.error(`Failed to process: ${error.message}`)
        } finally {
            setIsUploading(false)
        }
    }

    const handleImport = async () => {
        if (!selectedType || !selectedFile) return

        setIsUploading(true)
        try {
            let totalSuccess = 0, totalFailed = 0, allErrors: string[] = []

            const callApi = async (type: string, data: any[]) => {
                const res = await fetch(`/api/migration/${type}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orgId, data })
                })
                if (!res.ok) {
                    const err = await res.json()
                    throw new Error(err.error || `Import of ${type} failed`)
                }
                return await res.json()
            }

            if (selectedType === "everything") {
                // Use the full data sets stored in previewStats or state
                const dataSets = (previewStats as any).allData || {}

                // Import in dependency order: inventory MUST come before sales
                const importOrder = ["inventory", "customers", "suppliers", "sales", "expenses"]
                for (const type of importOrder) {
                    const transformedData = dataSets[type]
                    if (!Array.isArray(transformedData) || transformedData.length === 0) continue

                    const results = await callApi(type, transformedData)
                    if (results?.success) {
                        totalSuccess += results.count
                        totalFailed += (results.failed || 0)
                        if (results.errors) allErrors.push(...results.errors)
                    }
                }
            } else {
                // Single sheet import using pre-processed parsedData
                if (!parsedData || parsedData.length === 0) throw new Error("No data to import")
                const results = await callApi(selectedType, parsedData)
                if (results?.success) {
                    totalSuccess += results.count
                    totalFailed = (results.failed || 0)
                    if (results.errors) allErrors.push(...results.errors)
                }
            }

            setImportResults({ success: totalSuccess, failed: totalFailed, errors: allErrors })
            setCurrentStep(4)

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
            setIsUploading(false)
        }
    }

    const resetWizard = () => {
        setCurrentStep(1)
        setSelectedType(null)
        setSelectedFile(null)
        setParsedData([])
        setImportResults(null)
        setPreviewStats(null)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-emerald-50/30 p-6">
            <div className="max-w-5xl mx-auto">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                        <Sparkles className="h-4 w-4" />
                        Data Migration Wizard
                    </div>
                    <h1 className="text-4xl font-black text-zinc-900 mb-3">Import Your Business Data</h1>
                    <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
                        Seamlessly migrate from your existing system with our guided import wizard
                    </p>
                </motion.div>

                <div className="flex items-center justify-between mb-12 max-w-3xl mx-auto">
                    {steps.map((step, index) => {
                        const isActive = currentStep === step.number
                        const isCompleted = currentStep > step.number
                        const Icon = step.icon
                        return (
                            <div key={step.number} className="flex items-center flex-1">
                                <div className="flex flex-col items-center flex-1">
                                    <motion.div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${isCompleted ? "bg-emerald-500 text-white" : isActive ? "bg-emerald-500 text-white ring-4 ring-emerald-100" : "bg-zinc-200 text-zinc-400"
                                            }`}
                                        animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                                        transition={{ duration: 0.5 }}
                                    >
                                        {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                                    </motion.div>
                                    <p className={`text-xs font-semibold mt-2 text-center ${isActive ? "text-emerald-600" : "text-zinc-500"}`}>{step.label}</p>
                                </div>
                                {index < steps.length - 1 && <div className={`h-1 flex-1 mx-2 rounded-full transition-all ${currentStep > step.number ? "bg-emerald-500" : "bg-zinc-200"}`} />}
                            </div>
                        )
                    })}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white rounded-2xl shadow-xl border border-zinc-200 p-8 md:p-12"
                    >
                        {currentStep === 1 && (
                            <div>
                                <h2 className="text-2xl font-bold text-zinc-900 mb-2">What would you like to import?</h2>
                                <p className="text-zinc-600 mb-8">Select the type of data you want to migrate into KhataPlus</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(dataTypeConfig).map(([key, config]) => {
                                        const Icon = config.icon
                                        const isSelected = selectedType === key
                                        return (
                                            <motion.button
                                                key={key}
                                                onClick={() => setSelectedType(key as DataType)}
                                                className={`p-6 rounded-xl border-2 text-left transition-all ${isSelected ? `border-${config.color}-500 bg-${config.color}-50` : "border-zinc-200 hover:border-zinc-300 bg-white"
                                                    }`}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={`p-3 rounded-lg bg-${config.color}-100`}>
                                                        <Icon className={`h-6 w-6 text-${config.color}-600`} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-bold text-zinc-900 mb-1">{config.label}</h3>
                                                        <p className="text-sm text-zinc-600">{config.description}</p>
                                                    </div>
                                                </div>
                                            </motion.button>
                                        )
                                    })}
                                </div>
                                <div className="flex justify-end mt-8">
                                    <Button onClick={() => setCurrentStep(2)} disabled={!selectedType} size="lg" className="bg-emerald-600 hover:bg-emerald-500">
                                        Continue <ArrowRight className="h-4 w-4 ml-2" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && selectedType && (
                            <div>
                                <h2 className="text-2xl font-bold text-zinc-900 mb-2">Upload your {dataTypeConfig[selectedType].label} file</h2>
                                <p className="text-zinc-600 mb-8">Drag and drop your CSV or Excel file, or click to browse</p>
                                <FileDropzone
                                    onFileAccepted={handleFileAccepted}
                                    onFileRejected={(error) => toast.error(error)}
                                    currentFile={selectedFile}
                                    onRemoveFile={() => { setSelectedFile(null); setParsedData([]) }}
                                    disabled={isUploading}
                                />
                                <div className="flex justify-between mt-8">
                                    <Button onClick={() => setCurrentStep(1)} variant="outline" size="lg" disabled={isUploading}>
                                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                                    </Button>
                                    {selectedFile && (
                                        <Button onClick={() => setCurrentStep(3)} size="lg" className="bg-emerald-600 hover:bg-emerald-500">
                                            Preview Data <ArrowRight className="h-4 w-4 ml-2" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-zinc-900">Review & Confirm</h2>
                                        <p className="text-zinc-500 text-sm mt-1">
                                            {previewStats?.usedAI && <span className="inline-flex items-center gap-1 text-emerald-600 font-medium"><Sparkles className="h-3.5 w-3.5" /> AI Analyzed</span>}
                                            {!previewStats?.usedAI && <span>Pattern-matched</span>}
                                            {' · '}{previewStats?.count || parsedData.length} records ready
                                        </p>
                                    </div>
                                </div>

                                {/* Stats Row */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                                    {/* Confidence */}
                                    <div className="bg-gradient-to-br from-emerald-50 to-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Sparkles className="h-4 w-4 text-emerald-500" />
                                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Confidence</span>
                                        </div>
                                        <div className="text-3xl font-black text-emerald-600">{Math.round((previewStats?.confidence || 0) * 100)}%</div>
                                        <div className="mt-2 h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${(previewStats?.confidence || 0) > 0.8 ? 'bg-emerald-500' : (previewStats?.confidence || 0) > 0.5 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                style={{ width: `${(previewStats?.confidence || 0) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Fields Mapped */}
                                    <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                                        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Fields Mapped</div>
                                        <div className="text-3xl font-black text-zinc-900">{Object.keys(previewStats?.schema || {}).length}</div>
                                        <div className="text-[10px] text-zinc-400 mt-1">database columns</div>
                                    </div>

                                    {/* Auto-Cleaned */}
                                    <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                                        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Auto-Cleaned</div>
                                        <div className="text-3xl font-black text-blue-600">{previewStats?.cleaned || 0}</div>
                                        <div className="text-[10px] text-zinc-400 mt-1">values normalized</div>
                                    </div>

                                    {/* Skipped */}
                                    <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                                        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Skipped</div>
                                        <div className="text-3xl font-black text-zinc-400">{previewStats?.skipped || 0}</div>
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

                                {/* Data Preview Table */}
                                <div className="bg-zinc-50 rounded-xl border border-zinc-200 mb-6 overflow-hidden shadow-sm">
                                    <div className="px-4 py-2.5 bg-zinc-100/80 border-b border-zinc-200 flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Data Preview</span>
                                        <span className="text-[10px] text-zinc-400">{parsedData.length} total records</span>
                                    </div>
                                    <div className="max-h-72 overflow-auto">
                                        <table className="w-full text-xs">
                                            <thead className="sticky top-0 bg-zinc-100 border-b border-zinc-200 z-10">
                                                <tr>
                                                    <th className="text-center py-2.5 px-2 font-bold text-zinc-400 w-10">#</th>
                                                    {Object.keys(parsedData[0] || {}).filter(k => k !== '_rowNumber').map(key => (
                                                        <th key={key} className="text-left py-2.5 px-3 font-bold text-zinc-700 uppercase tracking-wider whitespace-nowrap">
                                                            {key.replace(/_/g, ' ')}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-zinc-100">
                                                {parsedData.slice(0, 20).map((row, i) => (
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
                                    {parsedData.length > 20 && (
                                        <div className="px-4 py-2 bg-zinc-50 text-center text-[10px] text-zinc-400 border-t border-zinc-200">
                                            Showing 20 of {parsedData.length} records
                                        </div>
                                    )}
                                </div>

                                {/* Action Bar */}
                                <div className="flex justify-between items-center bg-white/80 backdrop-blur-sm p-4 border-t border-zinc-100 -mx-8 -mb-8 mt-4 rounded-b-2xl">
                                    <Button onClick={() => setCurrentStep(2)} variant="ghost" size="lg" disabled={isUploading}>
                                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                                    </Button>
                                    <div className="flex items-center gap-4">
                                        {previewStats?.errors?.length > 0 && (
                                            <span className="text-xs text-rose-500 font-medium">{previewStats.errors.length} issue{previewStats.errors.length > 1 ? 's' : ''} found</span>
                                        )}
                                        <Button
                                            onClick={handleImport}
                                            size="lg"
                                            disabled={isUploading || (previewStats?.errors?.length || 0) > 50}
                                            className="bg-emerald-600 hover:bg-emerald-500 min-w-[180px] shadow-lg shadow-emerald-200"
                                        >
                                            {isUploading
                                                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importing...</>
                                                : <>Start Import <ArrowRight className="h-4 w-4 ml-2" /></>}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Complete */}
                        {currentStep === 4 && importResults && (
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-6">
                                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                                </div>
                                <h2 className="text-3xl font-bold text-zinc-900 mb-3">Import Complete!</h2>
                                <p className="text-lg text-zinc-600 mb-8">Successfully imported {importResults.success} records</p>

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

                                <div className="flex gap-4 justify-center">
                                    <Button onClick={resetWizard} variant="outline" size="lg">
                                        Import More Data
                                    </Button>
                                    <Button
                                        onClick={() => window.location.href = `/dashboard`}
                                        size="lg"
                                        className="bg-emerald-600 hover:bg-emerald-500"
                                    >
                                        Go to Dashboard <ArrowRight className="h-4 w-4 ml-2" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}
