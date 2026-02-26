"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { Descope } from "@descope/nextjs-sdk"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"

type ViewStatus = "loading" | "confirming" | "success" | "error"

function DeletionApprovalContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const requestId = searchParams.get("requestId")
    const action = searchParams.get("action") // approve | reject

    const [status, setStatus] = useState<ViewStatus>("confirming")
    const [message, setMessage] = useState("")
    const [isApprove, setIsApprove] = useState(action !== "reject")

    const [stepUpChecked, setStepUpChecked] = useState(false)
    const [stepUpVerified, setStepUpVerified] = useState(false)
    const [stepUpFlowId, setStepUpFlowId] = useState<string>("sign-up-or-in")

    const returnTo = useMemo(() => {
        if (!requestId) return "/deletion-approval"
        const requestedAction = action === "reject" ? "reject" : "approve"
        return `/deletion-approval?requestId=${encodeURIComponent(requestId)}&action=${requestedAction}`
    }, [requestId, action])

    useEffect(() => {
        if (!requestId) return

        let active = true
        ; (async () => {
            try {
                const res = await fetch(`/api/auth/step-up/status?requestId=${encodeURIComponent(requestId)}`)
                const data = await res.json().catch(() => ({}))

                if (!active) return

                if (res.status === 401) {
                    router.replace(`/auth/login?next=${encodeURIComponent(returnTo)}`)
                    return
                }

                if (!res.ok && res.status !== 403) {
                    throw new Error(data.error || "Failed to check verification state")
                }

                if (typeof data.flowId === "string" && data.flowId) {
                    setStepUpFlowId(data.flowId)
                }

                if (res.status === 403) {
                    setStatus("error")
                    setMessage("You are not an approver for this deletion request.")
                    setStepUpChecked(true)
                    return
                }

                setStepUpVerified(Boolean(data.verified))
                setStepUpChecked(true)
            } catch (error: any) {
                if (!active) return
                setStatus("error")
                setMessage(error?.message || "Failed to check step-up status")
                setStepUpChecked(true)
            }
        })()

        return () => {
            active = false
        }
    }, [requestId, returnTo, router])

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

            if (!res.ok) {
                if (res.status === 428) {
                    setStepUpVerified(false)
                    setStepUpChecked(true)
                    setStatus("confirming")
                    setMessage("Step-up expired. Verify with OTP again to continue.")
                    return
                }
                throw new Error(data.error || "Failed to record response")
            }

            setStatus("success")
            if (!approve) {
                setMessage("You rejected the deletion. The organization is safe.")
            } else if (data.deleted) {
                setMessage("All owners approved. The organization has been permanently deleted.")
            } else {
                setMessage(`Your approval was recorded. Waiting for ${data.pendingCount} more owner(s).`)
            }
        } catch (error: any) {
            setStatus("error")
            setMessage(error.message)
        }
    }

    if (!stepUpChecked) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mx-auto mb-4" />
                    <p className="text-zinc-600 font-medium">Checking secure verification status...</p>
                </div>
            </div>
        )
    }

    if (!stepUpVerified) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
                <div className="bg-white rounded-2xl shadow-xl border border-zinc-200 p-8 max-w-md w-full">
                    <div className="text-center mb-6">
                        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
                        <h1 className="text-2xl font-bold text-zinc-900">OTP Verification Required</h1>
                        <p className="text-zinc-500 mt-2">
                            Before you approve or reject this organization deletion, complete step-up verification.
                        </p>
                        {message && <p className="text-xs text-amber-700 mt-3">{message}</p>}
                    </div>

                    <div className="rounded-xl border border-zinc-200 overflow-hidden">
                        <Descope
                            flowId={stepUpFlowId}
                            onSuccess={() => {
                                router.replace(`/auth/callback?next=${encodeURIComponent(returnTo)}`)
                            }}
                            onError={() => {
                                setMessage("Step-up verification failed. Please try again.")
                            }}
                            theme="light"
                            debug={false}
                        />
                    </div>

                    <Button variant="outline" className="w-full mt-5" onClick={() => router.push("/dashboard")}>
                        Cancel
                    </Button>
                </div>
            </div>
        )
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

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl border border-zinc-200 p-8 max-w-md w-full text-center">
                {action === "approve" || !action ? (
                    <>
                        <AlertTriangle className="h-14 w-14 text-red-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Confirm Approval</h1>
                        <p className="text-zinc-500 mb-8">
                            Are you sure you want to approve permanent deletion of this organization?
                            This cannot be undone once all owners approve.
                        </p>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => { setIsApprove(false); handleRespond(false) }}
                            >
                                Reject Instead
                            </Button>
                            <Button
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => { setIsApprove(true); handleRespond(true) }}
                            >
                                Approve Deletion
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <XCircle className="h-14 w-14 text-rose-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Reject Deletion</h1>
                        <p className="text-zinc-500 mb-8">
                            Rejecting this request will immediately cancel deletion and keep the organization safe.
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
                                Reject Deletion
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default function DeletionApprovalPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-zinc-50">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
            </div>
        }>
            <DeletionApprovalContent />
        </Suspense>
    )
}

