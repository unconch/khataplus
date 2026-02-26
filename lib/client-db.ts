import Dexie, { Table } from 'dexie';
import type { InventoryItem } from "@/lib/types"

export interface SyncAction {
    id?: number;
    url: string;
    method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body: any;
    createdAt: number;
    status: 'pending' | 'processing' | 'failed';
    retryCount: number;
    lastTriedAt?: number;
    error?: string;
    tempId?: string; // If this action created a temp item, track it to replace with real ID later
}

export interface OfflineInventory extends InventoryItem {
    cachedAt: number;
}

// Interface for offline-mirrored data (Read-Only when offline)
export interface OfflineCustomer {
    id: string; // Real or Temp ID
    name: string;
    phone: string;
    balance: number;
    updatedAt: number;
}

export class KhataPlusDB extends Dexie {
    actions!: Table<SyncAction>;
    customers!: Table<OfflineCustomer>;
    inventory!: Table<OfflineInventory>;

    constructor() {
        super('KhataPlusDB');
        this.version(1).stores({
            actions: '++id, status, createdAt', // Indexed by status for fast lookup
            customers: 'id, name, phone',
        });
        this.version(2).stores({
            actions: '++id, status, createdAt',
            customers: 'id, name, phone',
            inventory: 'id, org_id, name, sku, updated_at',
        });
    }
}

export const db = new KhataPlusDB();
