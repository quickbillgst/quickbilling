// Offline-First Sync Engine with Conflict Resolution

import {
  InvoiceRecord,
  SyncQueueRecord,
  DB_STORES,
  saveRecord,
  getRecord,
  queryByIndex,
  deleteRecord,
  getAllRecords,
  setMetadata,
  getMetadata,
} from './indexed-db';

export interface SyncConfig {
  maxRetries: number;
  retryDelay: number;
  batchSize: number;
  conflictStrategy: 'server' | 'client' | 'merge';
}

const DEFAULT_CONFIG: SyncConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  batchSize: 50,
  conflictStrategy: 'server',
};

export class SyncEngine {
  private db: IDBDatabase;
  private config: SyncConfig;
  private isSyncing: boolean = false;
  private syncInterval: number | null = null;

  constructor(db: IDBDatabase, config: Partial<SyncConfig> = {}) {
    this.db = db;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Queue an operation for sync
  async queueOperation(
    tenantId: string,
    entityType: 'invoice' | 'payment' | 'lineItem',
    operation: 'create' | 'update' | 'delete',
    payload: any
  ): Promise<string> {
    const queueItem: SyncQueueRecord = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tenantId,
      entityType,
      operation,
      payload,
      status: 'pending',
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      createdAt: new Date(),
    };

    await saveRecord(this.db, DB_STORES.SYNC_QUEUE, queueItem);

    // Auto-sync if online
    if (navigator.onLine) {
      setTimeout(() => this.syncNow(), 500);
    }

    return queueItem.id;
  }

  // Sync pending operations
  async syncNow(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { success: false, synced: 0, failed: 0, message: 'Sync in progress' };
    }

    if (!navigator.onLine) {
      return { success: false, synced: 0, failed: 0, message: 'Offline mode' };
    }

    this.isSyncing = true;

    try {
      const pending = await queryByIndex<SyncQueueRecord>(
        this.db,
        DB_STORES.SYNC_QUEUE,
        'status',
        'pending'
      );

      let synced = 0;
      let failed = 0;

      // Process in batches
      for (let i = 0; i < pending.length; i += this.config.batchSize) {
        const batch = pending.slice(i, i + this.config.batchSize);

        for (const item of batch) {
          try {
            await this.processSyncItem(item);
            synced++;
          } catch (error) {
            failed++;
          }
        }
      }

      const result: SyncResult = {
        success: failed === 0,
        synced,
        failed,
        message: `Synced ${synced} operations`,
      };

      await setMetadata(this.db, 'lastSyncTime', new Date());

      return result;
    } finally {
      this.isSyncing = false;
    }
  }

  // Process individual sync item
  private async processSyncItem(item: SyncQueueRecord): Promise<void> {
    // Mark as syncing
    item.status = 'syncing';
    item.lastSyncAttempt = new Date();
    await saveRecord(this.db, DB_STORES.SYNC_QUEUE, item);

    try {
      const response = await this.sendToServer(item);

      // Handle response
      if (response.ok) {
        const result = await response.json();

        // Update local record with server response
        if (item.entityType === 'invoice') {
          const invoice = await getRecord<InvoiceRecord>(
            this.db,
            DB_STORES.INVOICES,
            item.payload.id
          );

          if (invoice && result.invoiceNumber) {
            invoice.invoiceNumber = result.invoiceNumber;
            invoice.status = 'issued';
            invoice.syncedAt = new Date();
            await saveRecord(this.db, DB_STORES.INVOICES, invoice);
          }
        }

        // Mark as synced
        item.status = 'synced';
        item.syncedAt = new Date();
        await saveRecord(this.db, DB_STORES.SYNC_QUEUE, item);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      item.retryCount++;
      item.lastError = error instanceof Error ? error.message : String(error);

      if (item.retryCount < item.maxRetries) {
        item.status = 'pending';
      } else {
        item.status = 'failed';
      }

      await saveRecord(this.db, DB_STORES.SYNC_QUEUE, item);
      throw error;
    }
  }

  // Send operation to server
  private async sendToServer(item: SyncQueueRecord): Promise<Response> {
    const endpoints: Record<string, string> = {
      invoice: '/api/invoices/create',
      payment: '/api/payments/record',
      lineItem: '/api/invoices/add-item',
    };

    const endpoint = endpoints[item.entityType];
    if (!endpoint) {
      throw new Error(`Unknown entity type: ${item.entityType}`);
    }

    const response = await fetch(endpoint, {
      method: item.operation === 'delete' ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...item.payload,
        operation: item.operation,
        deviceId: await this.getDeviceId(),
      }),
    });

    return response;
  }

  // Get or create device ID
  private async getDeviceId(): Promise<string> {
    let deviceId = await getMetadata(this.db, 'deviceId');
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await setMetadata(this.db, 'deviceId', deviceId);
    }
    return deviceId;
  }

  // Auto-sync on interval
  startAutoSync(intervalMs: number = 30000): void {
    this.syncInterval = window.setInterval(() => {
      if (navigator.onLine) {
        this.syncNow().catch(() => {
          // Silently handle auto-sync errors
        });
      }
    }, intervalMs);
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      window.clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Listen for online/offline changes
  setupNetworkListener(): void {
    window.addEventListener('online', () => {
      this.syncNow().catch(() => {
        // Silently handle sync errors
      });
    });

    window.addEventListener('offline', () => {
      // Offline event handled
    });
  }

  // Conflict resolution
  async resolveConflict(
    local: any,
    server: any,
    strategy: SyncConfig['conflictStrategy'] = this.config.conflictStrategy
  ): Promise<any> {
    switch (strategy) {
      case 'server':
        console.log('[v0] Conflict resolved: using server version');
        return server;

      case 'client':
        console.log('[v0] Conflict resolved: using client version');
        return local;

      case 'merge':
        console.log('[v0] Conflict resolved: merging versions');
        return {
          ...server,
          ...local,
          mergedAt: new Date(),
          conflicts: Object.keys(local).filter(
            (key) => JSON.stringify(local[key]) !== JSON.stringify(server[key])
          ),
        };

      default:
        return server;
    }
  }

  // Get sync status
  async getSyncStatus(): Promise<SyncStatus> {
    const pending = await queryByIndex<SyncQueueRecord>(
      this.db,
      DB_STORES.SYNC_QUEUE,
      'status',
      'pending'
    );

    const failed = await queryByIndex<SyncQueueRecord>(
      this.db,
      DB_STORES.SYNC_QUEUE,
      'status',
      'failed'
    );

    const lastSyncTime = await getMetadata(this.db, 'lastSyncTime');

    return {
      isSyncing: this.isSyncing,
      isOnline: navigator.onLine,
      pendingCount: pending.length,
      failedCount: failed.length,
      lastSyncTime,
    };
  }

  // Retry failed operations
  async retryFailedOperations(): Promise<SyncResult> {
    const failed = await queryByIndex<SyncQueueRecord>(
      this.db,
      DB_STORES.SYNC_QUEUE,
      'status',
      'failed'
    );

    console.log(`[v0] Retrying ${failed.length} failed operations`);

    for (const item of failed) {
      item.status = 'pending';
      item.retryCount = 0;
      await saveRecord(this.db, DB_STORES.SYNC_QUEUE, item);
    }

    return this.syncNow();
  }

  // Clean up old sync records
  async cleanupOldRecords(daysOld: number = 7): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    const synced = await queryByIndex<SyncQueueRecord>(
      this.db,
      DB_STORES.SYNC_QUEUE,
      'status',
      'synced'
    );

    let deleted = 0;
    for (const item of synced) {
      if (item.syncedAt && new Date(item.syncedAt) < cutoffDate) {
        await deleteRecord(this.db, DB_STORES.SYNC_QUEUE, item.id);
        deleted++;
      }
    }

    console.log(`[v0] Cleaned up ${deleted} old sync records`);
    return deleted;
  }
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  message: string;
}

export interface SyncStatus {
  isSyncing: boolean;
  isOnline: boolean;
  pendingCount: number;
  failedCount: number;
  lastSyncTime?: Date;
}
