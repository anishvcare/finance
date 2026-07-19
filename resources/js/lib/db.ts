import Dexie, { Table } from 'dexie';

/**
 * IndexedDB schema for offline support using Dexie.js
 */

export interface SyncQueueItem {
    id?: number;
    type: 'create' | 'update' | 'delete';
    entity: string;
    uuid: string;
    data: Record<string, unknown>;
    status: 'pending' | 'syncing' | 'synced' | 'failed';
    retryCount: number;
    createdAt: Date;
    syncedAt?: Date;
    error?: string;
}

export interface CachedProduct {
    id: number;
    workspaceId: number;
    name: string;
    code?: string;
    salesPrice: number;
    unit: string;
    taxRate?: number;
    isActive: boolean;
}

export interface CachedCustomer {
    id: number;
    workspaceId: number;
    name: string;
    businessName?: string;
    email?: string;
    phone?: string;
}

export interface CachedTransaction {
    id: number;
    uuid: string;
    workspaceId: number;
    type: string;
    amount: number;
    currency: string;
    date: string;
    description?: string;
}

export interface DraftInvoice {
    localId?: number;
    uuid: string;
    workspaceId: number;
    customerId?: number;
    customerName?: string;
    items: Array<Record<string, unknown>>;
    total: number;
    status: 'draft_offline' | 'pending_sync' | 'synced';
    createdAt: Date;
}

export interface SettingsCache {
    key: string;
    value: unknown;
    updatedAt: Date;
}

class LifeLedgerDB extends Dexie {
    syncQueue!: Table<SyncQueueItem>;
    products!: Table<CachedProduct>;
    customers!: Table<CachedCustomer>;
    transactions!: Table<CachedTransaction>;
    draftInvoices!: Table<DraftInvoice>;
    settings!: Table<SettingsCache>;

    constructor() {
        super('LifeLedgerPro');

        this.version(1).stores({
            syncQueue: '++id, type, entity, status, createdAt',
            products: 'id, workspaceId, name',
            customers: 'id, workspaceId, name',
            transactions: 'id, uuid, workspaceId, date',
            draftInvoices: '++localId, uuid, workspaceId, status',
            settings: 'key',
        });
    }
}

export const db = new LifeLedgerDB();

/**
 * Add item to sync queue for background sync when online.
 */
export async function addToSyncQueue(
    type: SyncQueueItem['type'],
    entity: string,
    uuid: string,
    data: Record<string, unknown>
): Promise<number> {
    return db.syncQueue.add({
        type,
        entity,
        uuid,
        data,
        status: 'pending',
        retryCount: 0,
        createdAt: new Date(),
    });
}

/**
 * Get all pending sync items.
 */
export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
    return db.syncQueue.where('status').equals('pending').toArray();
}

/**
 * Clear all user data on logout.
 */
export async function clearAllData(): Promise<void> {
    await db.syncQueue.clear();
    await db.products.clear();
    await db.customers.clear();
    await db.transactions.clear();
    await db.draftInvoices.clear();
    await db.settings.clear();
}

/**
 * Cache products from API response.
 */
export async function cacheProducts(products: CachedProduct[]): Promise<void> {
    await db.products.bulkPut(products);
}

/**
 * Cache customers from API response.
 */
export async function cacheCustomers(customers: CachedCustomer[]): Promise<void> {
    await db.customers.bulkPut(customers);
}

/**
 * Generate a UUID v4 for offline records.
 */
export function generateUUID(): string {
    return crypto.randomUUID();
}
