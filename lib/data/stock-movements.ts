"use server"

import { sql } from "../db"

export type StockMovementType =
  | "sale"
  | "return"
  | "adjustment"
  | "purchase"
  | "transfer_in"
  | "transfer_out"
  | "opening"

interface StockMovementInput {
  orgId: string
  inventoryId: string
  quantityDelta: number
  movementType: StockMovementType
  referenceType?: string | null
  referenceId?: string | null
  note?: string | null
  createdBy?: string | null
}

let tableEnsured = false

async function ensureStockMovementsTable() {
  if (tableEnsured) return
  await sql`
    CREATE TABLE IF NOT EXISTS stock_movements (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id text NOT NULL,
      inventory_id uuid NOT NULL,
      quantity_delta integer NOT NULL,
      movement_type text NOT NULL,
      reference_type text,
      reference_id text,
      note text,
      created_by text,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_stock_movements_org_created ON stock_movements(org_id, created_at DESC)`
  await sql`CREATE INDEX IF NOT EXISTS idx_stock_movements_inventory_created ON stock_movements(inventory_id, created_at DESC)`
  tableEnsured = true
}

export async function recordStockMovement(input: StockMovementInput): Promise<void> {
  if (!input.orgId || !input.inventoryId || !input.quantityDelta || !input.movementType) return
  await ensureStockMovementsTable()

  await sql`
    INSERT INTO stock_movements(
      org_id, inventory_id, quantity_delta, movement_type, reference_type, reference_id, note, created_by
    ) VALUES (
      ${input.orgId},
      ${input.inventoryId},
      ${input.quantityDelta},
      ${input.movementType},
      ${input.referenceType || null},
      ${input.referenceId || null},
      ${input.note || null},
      ${input.createdBy || null}
    )
  `
}

