// ============================================================
// FILE 5: app/deletion-approval/page.tsx
// (Email link landing page for other owners to approve/reject)
// ============================================================

"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DeletionApprovalPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const requestId = searchParams.get("requestId")
    const action = searchParams.get("action") // "approve" | "reject"

    const [status, setStatus] = useState<"loading" | "confirming" | "success" | "error">("confirming")
    const [message, setMessage] = useState("")
    const [isApprove, setIsApprove] = useState(action === "approve")

    if (!requestId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50">
                <div className="text-center p-8">
                    <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-zinc-900">Invalid Link</h1>
                    <p className="text-zinc-500 mt-2">This deletion approval link is invalid or has expired.</p>
                    <Button className="mt-6" onClick={() => router.push("/dashboard")}>
                        Go to Dashboard
                    </Button>
                </div>
            </div>
        )
    }

    const handleRespond = async (approve: boolean) => {
        setStatus("loading")
        try {
            const res = await fetch("/api/organizations/deletion/respond", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requestId, approve })
            })
            const data = await res.json()

            if (!res.ok) throw new Error(data.error)

            setStatus("success")
            if (!approve) {
                setMessage("You rejected the deletion. The organization is safe.")
            } else if (data.deleted) {
                setMessage("All owners approved. The organization has been permanently deleted.")
            } else {
                setMessage(`Your approval recorded. Waiting for ${data.pendingCount} more owner(s).`)
            }
        } catch (error: any) {
            setStatus("error")
            setMessage(error.message)
        }
    }

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mx-auto mb-4" />
                    <p className="text-zinc-600 font-medium">Processing your response...</p>
                </div>
            </div>
        )
    }

    if (status === "success") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50">
                <div className="text-center p-8 max-w-md">
                    {isApprove ? (
                        <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto mb-4" />
                    ) : (
                        <XCircle className="h-14 w-14 text-rose-500 mx-auto mb-4" />
                    )}
                    <h1 className="text-2xl font-bold text-zinc-900 mb-2">
                        {isApprove ? "Approval Recorded" : "Deletion Rejected"}
                    </h1>
                    <p className="text-zinc-500">{message}</p>
                    <Button className="mt-8" onClick={() => router.push("/dashboard")}>
                        Go to Dashboard
                    </Button>
                </div>
            </div>
        )
    }

    if (status === "error") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50">
                <div className="text-center p-8 max-w-md">
                    <AlertTriangle className="h-14 w-14 text-amber-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-zinc-900 mb-2">Something went wrong</h1>
                    <p className="text-zinc-500">{message}</p>
                    <Button className="mt-8" onClick={() => router.push("/dashboard")}>
                        Go to Dashboard
                    </Button>
                </div>
            </div>
        )
    }

    // Confirmation screen
    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl border border-zinc-200 p-8 max-w-md w-full text-center">
                {action === "approve" ? (
                    <>
                        <AlertTriangle className="h-14 w-14 text-red-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Confirm Approval</h1>
                        <p className="text-zinc-500 mb-8">
                            Are you sure you want to approve the permanent deletion of this organization?
                            This cannot be undone once all owners approve.
                        </p>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => { setIsApprove(false); handleRespond(false) }}
                            >
                                🚫 Reject Instead
                            </Button>
                            <Button
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => { setIsApprove(true); handleRespond(true) }}
                            >
                                ✓ Approve Deletion
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <XCircle className="h-14 w-14 text-rose-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Reject Deletion</h1>
                        <p className="text-zinc-500 mb-8">
                            Rejecting this request will immediately cancel the deletion and keep the organization safe.
                        </p>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => { setIsApprove(true); handleRespond(true) }}
                            >
                                Approve Instead
                            </Button>
                            <Button
                                className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white"
                                onClick={() => { setIsApprove(false); handleRespond(false) }}
                            >
                                🚫 Reject Deletion
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
