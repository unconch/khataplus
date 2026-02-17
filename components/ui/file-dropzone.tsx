"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, File as FileIcon, X, CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileDropzoneProps {
    onFileAccepted: (file: File) => void
    onFileRejected?: (error: string) => void
    acceptedFileTypes?: Record<string, string[]>
    maxSize?: number
    currentFile?: File | null
    onRemoveFile?: () => void
    disabled?: boolean
}

export function FileDropzone({
    onFileAccepted,
    onFileRejected,
    acceptedFileTypes = {
        "text/csv": [".csv"],
        "application/vnd.ms-excel": [".xls"],
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"]
    },
    maxSize = 10 * 1024 * 1024, // 10MB default
    currentFile,
    onRemoveFile,
    disabled = false
}: FileDropzoneProps) {

    const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
        if (rejectedFiles.length > 0) {
            const error = rejectedFiles[0].errors[0]
            const errorMessage = error.code === "file-too-large"
                ? `File is too large. Maximum size is ${maxSize / 1024 / 1024}MB`
                : error.code === "file-invalid-type"
                    ? "Invalid file type. Please upload a CSV or Excel file"
                    : "File upload failed"

            onFileRejected?.(errorMessage)
            return
        }

        if (acceptedFiles.length > 0) {
            onFileAccepted(acceptedFiles[0])
        }
    }, [onFileAccepted, onFileRejected, maxSize])

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        accept: acceptedFileTypes,
        maxSize,
        maxFiles: 1,
        disabled
    })

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes"
        const k = 1024
        const sizes = ["Bytes", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
    }

    return (
        <div className="w-full">
            {currentFile ? (
                <div className="border-2 border-emerald-200 bg-emerald-50 rounded-xl p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="p-2 bg-emerald-100 rounded-lg shrink-0">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-zinc-900 truncate">{currentFile.name}</p>
                                <p className="text-sm text-zinc-600 mt-1">{formatFileSize(currentFile.size)}</p>
                            </div>
                        </div>
                        {onRemoveFile && !disabled && (
                            <button
                                onClick={onRemoveFile}
                                className="p-2 hover:bg-emerald-100 rounded-lg transition-colors shrink-0"
                                type="button"
                            >
                                <X className="h-4 w-4 text-zinc-600" />
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div
                    {...getRootProps()}
                    className={cn(
                        "border-2 border-dashed rounded-xl p-12 transition-all cursor-pointer",
                        isDragActive && !isDragReject && "border-emerald-500 bg-emerald-50",
                        isDragReject && "border-red-500 bg-red-50",
                        !isDragActive && !isDragReject && "border-zinc-300 hover:border-emerald-400 hover:bg-emerald-50/50",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                >
                    <input {...getInputProps()} />

                    <div className="flex flex-col items-center gap-4 text-center">
                        {isDragReject ? (
                            <>
                                <div className="p-4 bg-red-100 rounded-full">
                                    <AlertCircle className="h-8 w-8 text-red-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-red-900">Invalid file type</p>
                                    <p className="text-sm text-red-700 mt-1">Please upload a CSV or Excel file</p>
                                </div>
                            </>
                        ) : isDragActive ? (
                            <>
                                <div className="p-4 bg-emerald-100 rounded-full animate-bounce">
                                    <Upload className="h-8 w-8 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-emerald-900">Drop your file here</p>
                                    <p className="text-sm text-emerald-700 mt-1">Release to upload</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="p-4 bg-zinc-100 rounded-full">
                                    <FileIcon className="h-8 w-8 text-zinc-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-zinc-900">
                                        Drag and drop your file here
                                    </p>
                                    <p className="text-sm text-zinc-600 mt-1">
                                        or click to browse
                                    </p>
                                    <p className="text-xs text-zinc-500 mt-3">
                                        Supports CSV, XLS, XLSX (max {maxSize / 1024 / 1024}MB)
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
