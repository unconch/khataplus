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

    async function addToQueue(action: Omit<SyncAction, "id" | "status" | "retryCount" | "createdAt">) {
        await db.actions.add({
            ...action,
            status: "pending",
            retryCount: 0,
            createdAt: Date.now(),
        })
        toast.info("Saved offline. Will sync when online.")
    }

    async function processQueue() {
        if (isSyncing) return
        setIsSyncing(true)

        try {
            // Get all pending actions
            const pendingActions = await db.actions
                .where("status")
                .equals("pending")
                .sortBy("createdAt")

            if (pendingActions.length === 0) {
                setIsSyncing(false)
                return
            }

            toast.loading("Syncing offline changes...", { id: "sync-toast" })

            for (const action of pendingActions) {
                try {
                    // Update status to processing
                    await db.actions.update(action.id!, { status: "processing" })

                    // Execute API call
                    const response = await fetch(action.url, {
                        method: action.method,
                        headers: { "Content-Type": "application/json" },
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
                        error: String(error),
                    })
                }
            }

            // Check if any remain
            const remaining = await db.actions.where("status").equals("pending").count()
            if (remaining === 0) {
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
