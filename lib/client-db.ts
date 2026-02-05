import Dexie, { Table } from 'dexie';

export interface SyncAction {
    id?: number;
    url: string;
    method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body: any;
    createdAt: number;
    status: 'pending' | 'processing' | 'failed';
    retryCount: number;
    error?: string;
    tempId?: string; // If this action created a temp item, track it to replace with real ID later
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

    constructor() {
        super('KhataPlusDB');
        this.version(1).stores({
            actions: '++id, status, createdAt', // Indexed by status for fast lookup
            customers: 'id, name, phone',
        });
    }
}

export const db = new KhataPlusDB();
