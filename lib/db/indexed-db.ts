// IndexedDB Schema and Operations for Offline POS

const DB_NAME = 'gst-billing-pos';
const DB_VERSION = 1;

export const DB_STORES = {
  INVOICES: 'invoices',
  LINE_ITEMS: 'lineItems',
  CUSTOMERS: 'customers',
  PRODUCTS: 'products',
  PAYMENTS: 'payments',
  SYNC_QUEUE: 'syncQueue',
  METADATA: 'metadata',
} as const;

export interface InvoiceRecord {
  id: string;
  tenantId: string;
  customerId?: string;
  lineItems: LineItemRecord[];
  subtotal: number;
  discount: number;
  discountReason?: string;
  taxBreakdown: TaxBreakdown;
  totalAmount: number;
  paymentMethod?: string;
  status: 'draft' | 'issued' | 'paid' | 'cancelled';
  invoiceNumber?: string;
  createdAt: Date;
  updatedAt: Date;
  issueDate?: Date;
  syncedAt?: Date;
  isOfflineOnly: boolean;
  deviceId: string;
}

export interface LineItemRecord {
  id: string;
  invoiceId: string;
  productId: string;
  barcode?: string;
  productName: string;
  hsnCode?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
  taxRate: number;
  taxAmount: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
}

export interface TaxBreakdown {
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  totalTax: number;
}

export interface SyncQueueRecord {
  id: string;
  tenantId: string;
  entityType: 'invoice' | 'payment' | 'lineItem';
  operation: 'create' | 'update' | 'delete';
  payload: any;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  createdAt: Date;
  lastSyncAttempt?: Date;
  syncedAt?: Date;
}

export interface CustomerRecord {
  id: string;
  tenantId: string;
  name: string;
  phone?: string;
  email?: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  totalPurchases: number;
  lastPurchaseAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isOnlineOnly?: boolean;
}

export interface ProductRecord {
  id: string;
  tenantId: string;
  barcode?: string;
  name: string;
  description?: string;
  hsnCode?: string;
  category?: string;
  unitPrice: number;
  taxRate: number;
  stock?: number;
  reorderLevel?: number;
  createdAt: Date;
  updatedAt: Date;
  isOnlineOnly?: boolean;
}

export interface MetadataRecord {
  key: string;
  value: any;
  lastUpdated: Date;
}

// Initialize IndexedDB
export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[v0] IndexedDB error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      const db = request.result;
      console.log('[v0] IndexedDB initialized');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      console.log('[v0] Creating IndexedDB stores...');

      // Invoices
      if (!db.objectStoreNames.contains(DB_STORES.INVOICES)) {
        const invoiceStore = db.createObjectStore(DB_STORES.INVOICES, {
          keyPath: 'id',
        });
        invoiceStore.createIndex('tenantId', 'tenantId', { unique: false });
        invoiceStore.createIndex('createdAt', 'createdAt', { unique: false });
        invoiceStore.createIndex('status', 'status', { unique: false });
        invoiceStore.createIndex('syncedAt', 'syncedAt', { unique: false });
      }

      // Line Items
      if (!db.objectStoreNames.contains(DB_STORES.LINE_ITEMS)) {
        const lineItemStore = db.createObjectStore(DB_STORES.LINE_ITEMS, {
          keyPath: 'id',
        });
        lineItemStore.createIndex('invoiceId', 'invoiceId', { unique: false });
        lineItemStore.createIndex('barcode', 'barcode', { unique: false });
      }

      // Customers
      if (!db.objectStoreNames.contains(DB_STORES.CUSTOMERS)) {
        const customerStore = db.createObjectStore(DB_STORES.CUSTOMERS, {
          keyPath: 'id',
        });
        customerStore.createIndex('tenantId', 'tenantId', { unique: false });
        customerStore.createIndex('phone', 'phone', { unique: false });
        customerStore.createIndex('gstin', 'gstin', { unique: false });
      }

      // Products
      if (!db.objectStoreNames.contains(DB_STORES.PRODUCTS)) {
        const productStore = db.createObjectStore(DB_STORES.PRODUCTS, {
          keyPath: 'id',
        });
        productStore.createIndex('tenantId', 'tenantId', { unique: false });
        productStore.createIndex('barcode', 'barcode', { unique: false });
        productStore.createIndex('category', 'category', { unique: false });
      }

      // Payments
      if (!db.objectStoreNames.contains(DB_STORES.PAYMENTS)) {
        const paymentStore = db.createObjectStore(DB_STORES.PAYMENTS, {
          keyPath: 'id',
        });
        paymentStore.createIndex('invoiceId', 'invoiceId', { unique: false });
        paymentStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Sync Queue
      if (!db.objectStoreNames.contains(DB_STORES.SYNC_QUEUE)) {
        const syncStore = db.createObjectStore(DB_STORES.SYNC_QUEUE, {
          keyPath: 'id',
        });
        syncStore.createIndex('status', 'status', { unique: false });
        syncStore.createIndex('tenantId', 'tenantId', { unique: false });
        syncStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Metadata
      if (!db.objectStoreNames.contains(DB_STORES.METADATA)) {
        db.createObjectStore(DB_STORES.METADATA, { keyPath: 'key' });
      }

      console.log('[v0] All stores created successfully');
    };
  });
}

// Generic CRUD operations
export async function saveRecord(
  db: IDBDatabase,
  storeName: string,
  record: any
): Promise<string> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(record);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      console.log(`[v0] Record saved: ${record.id}`);
      resolve(request.result as string);
    };
  });
}

export async function getRecord<T>(
  db: IDBDatabase,
  storeName: string,
  id: string
): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as T | undefined);
  });
}

export async function getAllRecords<T>(
  db: IDBDatabase,
  storeName: string
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as T[]);
  });
}

export async function queryByIndex<T>(
  db: IDBDatabase,
  storeName: string,
  indexName: string,
  value: any
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as T[]);
  });
}

export async function deleteRecord(
  db: IDBDatabase,
  storeName: string,
  id: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      console.log(`[v0] Record deleted: ${id}`);
      resolve();
    };
  });
}

// Metadata helpers
export async function setMetadata(
  db: IDBDatabase,
  key: string,
  value: any
): Promise<void> {
  const metadata: MetadataRecord = {
    key,
    value,
    lastUpdated: new Date(),
  };
  await saveRecord(db, DB_STORES.METADATA, metadata);
}

export async function getMetadata(
  db: IDBDatabase,
  key: string
): Promise<any | undefined> {
  const metadata = await getRecord<MetadataRecord>(
    db,
    DB_STORES.METADATA,
    key
  );
  return metadata?.value;
}

// Batch operations
export async function batchSaveRecords(
  db: IDBDatabase,
  storeName: string,
  records: any[]
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    records.forEach((record) => {
      store.put(record);
    });

    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => {
      console.log(`[v0] Batch saved ${records.length} records`);
      resolve();
    };
  });
}

// Clear all data (for logout)
export async function clearAllData(db: IDBDatabase): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      Object.values(DB_STORES),
      'readwrite'
    );

    Object.values(DB_STORES).forEach((storeName) => {
      const store = tx.objectStore(storeName);
      store.clear();
    });

    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => {
      console.log('[v0] All data cleared from IndexedDB');
      resolve();
    };
  });
}
