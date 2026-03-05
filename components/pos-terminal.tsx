"use client"

import type { InventoryItem } from "@/lib/types"
import { SalesFormPos } from "./sales-form-pos"

type PosTerminalProps = {
  inventory: InventoryItem[]
  userId: string
  orgId: string
  org: { name: string; gstin?: string; upi_id?: string; plan_type?: string }
  gstInclusive: boolean
  gstEnabled: boolean
  showBuyPrice?: boolean
}

export function PosTerminal(props: PosTerminalProps) {
  return (
    <SalesFormPos
      inventory={props.inventory}
      userId={props.userId}
      orgId={props.orgId}
      org={props.org}
      gstInclusive={props.gstInclusive}
      gstEnabled={props.gstEnabled}
      showBuyPrice={props.showBuyPrice}
    />
  )
}
