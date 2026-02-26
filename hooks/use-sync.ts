"use client"

import { useEffect, useState } from "react"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { db, SyncAction } from "@/lib/client-db"
import { toast } from "sonner"

export function useSync() {
    const isOnline = useOnlineStatus()
    const [isSyncing, setIsSyncing] = useState(false)

    // Auto-process queue when coming online
    useEffect(() => {
        if (isOnline) {
            processQueue()
        }
    }, [isOnline])

    const addToQueue = async (action: Omit<SyncAction, "id" | "status" | "retryCount" | "createdAt">) => {
        await db.actions.add({
            ...action,
            status: "pending",
            retryCount: 0,
            createdAt: Date.now(),
        })
        toast.info("Saved offline. Will sync when online.")
    }

    const getRetryBackoffMs = (retryCount: number) => {
        const attempt = Math.max(0, retryCount || 0)
        return Math.min(60_000, Math.pow(2, attempt) * 1500)
    }

    const processQueue = async () => {
        if (!navigator.onLine) {
            return
        }
        if (isSyncing) {
            return
        }
        setIsSyncing(true)

        try {
            // Pick fresh pending + failed actions that are eligible for retry.
            const pendingActions = await db.actions
                .where("status")
                .equals("pending")
                .sortBy("createdAt")

            const failedActions = await db.actions
                .where("status")
                .equals("failed")
                .sortBy("createdAt")

            const now = Date.now()
            const retryableFailed = failedActions.filter((a) => {
                const lastTry = a.lastTriedAt || 0
                return (now - lastTry) >= getRetryBackoffMs(a.retryCount || 0)
            })

            const actionsToProcess = [...pendingActions, ...retryableFailed]
                .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))

            if (actionsToProcess.length === 0) {
                setIsSyncing(false)
                return
            }

            toast.loading("Syncing offline changes...", { id: "sync-toast" })

            for (const action of actionsToProcess) {
                try {
                    // Update status to processing
                    await db.actions.update(action.id!, { status: "processing", lastTriedAt: Date.now(), error: undefined })

                    // Execute API call
                    const response = await fetch(action.url, {
                        method: action.method,
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify(action.body),
                    })

                    if (!response.ok) {
                        throw new Error(`API Error: ${response.statusText}`)
                    }

                    // On success, delete from queue
                    await db.actions.delete(action.id!)
                } catch (error) {
                    console.error("Sync failed for action:", action, error)
                    // Mark as failed and increment retry
                    await db.actions.update(action.id!, {
                        status: "failed",
                        retryCount: (action.retryCount || 0) + 1,
                        lastTriedAt: Date.now(),
                        error: String(error),
                    })
                }
            }

            // Check if any unsynced actions remain.
            const remainingPending = await db.actions.where("status").equals("pending").count()
            const remainingFailed = await db.actions.where("status").equals("failed").count()
            if (remainingPending + remainingFailed === 0) {
                toast.success("All changes synced!", { id: "sync-toast" })
            } else {
                toast.error("Some items failed to sync.", { id: "sync-toast" })
            }

        } catch (err) {
            console.error("Queue processing error:", err)
        } finally {
            setIsSyncing(false)
        }
    }

    return {
        addToQueue,
        processQueue,
        isSyncing
    }
}
