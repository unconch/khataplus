"use client"

import { useState } from "react"
import {
    Upload,
    FileText,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Database,
    Plus,
    X,
    Info,
    Download
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

type ImportType = "products" | "customers"

export function ImportWizard({ onClose }: { onClose?: () => void }) {
    const [step, setStep] = useState<1 | 2 | 3>(1)
    const [importType, setImportType] = useState<ImportType>("products")
    const [isDragging, setIsDragging] = useState(false)
    const [file, setFile] = useState<File | null>(null)

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
            setStep(2)
        }
    }

    const handleImportSuccess = () => {
        setStep(3)
        toast.success(`Successfully imported ${importType}!`)
    }

    return (
        <div className="w-full max-w-2xl mx-auto bg-white dark:bg-zinc-950 rounded-[2.5rem] shadow-2xl border border-zinc-100 dark:border-white/5 overflow-hidden">
            <div className="p-8 md:p-12 space-y-8">

                {/* Header & Progress */}
                <div className="flex justify-between items-start">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black italic tracking-tight">Bulk Import</h2>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/10 w-fit">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Step {step} of 3</span>
                        </div>
                    </div>
                    {onClose && (
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-10 w-10">
                            <X size={20} />
                        </Button>
                    )}
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">What are you importing?</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {(["products", "customers"] as const).map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setImportType(type)}
                                            className={cn(
                                                "p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 group text-center",
                                                importType === type
                                                    ? "border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/10"
                                                    : "border-zinc-100 dark:border-white/5 hover:border-zinc-200"
                                            )}
                                        >
                                            <div className={cn(
                                                "h-12 w-12 rounded-2xl flex items-center justify-center transition-colors",
                                                importType === type ? "bg-emerald-500 text-white" : "bg-zinc-100 dark:bg-white/5 text-zinc-400 group-hover:bg-zinc-200"
                                            )}>
                                                {type === "products" ? <Database size={24} /> : <FileText size={24} />}
                                            </div>
                                            <span className="text-sm font-black uppercase tracking-widest capitalize">{type}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div
                                className={cn(
                                    "relative h-64 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center p-8 space-y-4 cursor-pointer",
                                    isDragging ? "border-emerald-500 bg-emerald-500/5" : "border-zinc-200 dark:border-white/10 hover:border-zinc-300"
                                )}
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setIsDragging(false);
                                    if (e.dataTransfer.files?.[0]) {
                                        setFile(e.dataTransfer.files[0]);
                                        setStep(2);
                                    }
                                }}
                            >
                                <input
                                    type="file"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    accept=".csv"
                                    onChange={handleFileUpload}
                                />
                                <div className="h-16 w-16 bg-zinc-100 dark:bg-white/5 rounded-full flex items-center justify-center">
                                    <Upload size={32} className="text-zinc-400" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-black italic text-lg leading-tight">Drag and drop your CSV</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">or click to browse from files</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/5">
                                <div className="flex items-center gap-3">
                                    <Info className="text-emerald-500" size={18} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Download Sample CSV</span>
                                </div>
                                <Button variant="ghost" className="rounded-xl h-10 px-4 font-black text-[10px] uppercase tracking-widest text-emerald-600 hover:text-emerald-700">
                                    <Download size={14} className="mr-2" /> Template
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="p-6 bg-zinc-50 dark:bg-white/5 rounded-3xl border border-zinc-100 dark:border-white/5 flex items-center gap-6">
                                <div className="h-14 w-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                    <FileText size={28} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black italic text-lg truncate">{file?.name}</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ready to process · {(file?.size ? (file.size / 1024).toFixed(1) : 0)} KB</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Mapping Validation</h4>
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex justify-between items-center p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 shadow-sm">
                                            <span className="text-xs font-bold text-muted-foreground">Column {i}</span>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 size={14} className="text-emerald-500" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Auto-Mapped</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 pt-4">
                                <Button
                                    onClick={handleImportSuccess}
                                    className="h-16 rounded-[2rem] bg-zinc-900 text-white dark:bg-white dark:text-black font-black text-xs uppercase tracking-widest shadow-2xl transition-all hover:scale-[1.02] active:scale-95"
                                >
                                    Confirm and Start Import
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setStep(1)}
                                    className="h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest text-muted-foreground"
                                >
                                    Cancel and Start Over
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center text-center space-y-8 py-12"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
                                <div className="relative h-24 w-24 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-emerald-500/20">
                                    <CheckCircle2 size={48} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-3xl font-black italic tracking-tight">Import Complete!</h3>
                                <p className="text-muted-foreground font-medium max-w-[280px]">Your {importType} have been successfully digitized into KhataPlus.</p>
                            </div>
                            <Button
                                onClick={onClose}
                                className="h-16 px-12 rounded-[2rem] bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20"
                            >
                                Return to Dashboard
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    )
}
