"use client"

import { useEffect, useMemo, useState } from "react"
import type { InventoryItem } from "@/lib/types"
import { db } from "@/lib/client-db"
import { useOnlineStatus } from "@/hooks/use-online-status"

interface SaleLike {
  inventory_id: string
  quantity: number
}

export function useInventoryCache(liveInventory: InventoryItem[], orgId: string) {
  const isOnline = useOnlineStatus()
  const [cachedInventory, setCachedInventory] = useState<InventoryItem[]>(liveInventory || [])

  useEffect(() => {
    if (!orgId) return
    let active = true

    const loadCache = async () => {
      const items = await db.inventory.where("org_id").equals(orgId).toArray()
      if (active) {
        setCachedInventory(items)
      }
    }

    loadCache().catch(() => undefined)

    return () => {
      active = false
    }
  }, [orgId])

  useEffect(() => {
    if (!orgId) return
    if (!isOnline) return
    if (!liveInventory || liveInventory.length === 0) return

    const persist = async () => {
      await db.inventory.bulkPut(
        liveInventory.map((item) => ({
          ...item,
          org_id: orgId,
          cachedAt: Date.now(),
        }))
      )
      setCachedInventory(liveInventory)
    }

    persist().catch(() => undefined)
  }, [isOnline, liveInventory, orgId])

  const applyLocalSale = async (sales: SaleLike[]) => {
    if (!orgId || sales.length === 0) return

    const deltas = new Map<string, number>()
    sales.forEach((sale) => {
      deltas.set(sale.inventory_id, (deltas.get(sale.inventory_id) || 0) + sale.quantity)
    })

    const updated = cachedInventory.map((item) => {
      const delta = deltas.get(item.id) || 0
      if (!delta) return item
      return { ...item, stock: Math.max(0, (item.stock || 0) - delta), updated_at: new Date().toISOString() }
    })

    setCachedInventory(updated)

    await db.transaction("rw", db.inventory, async () => {
      for (const [id, delta] of deltas.entries()) {
        const item = await db.inventory.get(id)
        if (!item) continue
        const nextStock = Math.max(0, (item.stock || 0) - delta)
        await db.inventory.update(id, { stock: nextStock, updated_at: new Date().toISOString() })
      }
    })
  }

  const inventory = useMemo(() => {
    if (isOnline && liveInventory && liveInventory.length > 0) {
      return liveInventory
    }
    return cachedInventory
  }, [isOnline, liveInventory, cachedInventory])

  return { inventory, isOnline, applyLocalSale }
}
