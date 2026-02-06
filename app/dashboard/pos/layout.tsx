'use client';

import React, { useEffect, useState } from 'react';
import { POSProvider } from '@/lib/context/pos-context';
import { initDB } from '@/lib/db/indexed-db';
import { SyncEngine } from '@/lib/db/sync-engine';

export default function POSLayout({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [syncEngine, setSyncEngine] = useState<SyncEngine | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initializeDB() {
      try {
        const db = await initDB();
        
        // Create sync engine
        const engine = new SyncEngine(db, {
          maxRetries: 3,
          retryDelay: 1000,
          batchSize: 50,
          conflictStrategy: 'server',
        });

        // Setup network listeners
        engine.setupNetworkListener();

        // Start auto-sync every 30 seconds
        engine.startAutoSync(30000);

        setSyncEngine(engine);
      } catch (err) {
        // Continue in online mode if DB initialization fails
        const errorMsg = err instanceof Error ? err.message : 'Failed to initialize local database';
        setError(errorMsg);
      } finally {
        setIsReady(true);
      }
    }

    initializeDB();
  }, []);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto" />
          <p className="text-white">Initializing POS System...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center space-y-4">
          <p className="text-white">Running in online mode</p>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <POSProvider syncEngine={syncEngine || undefined}>
      {children}
    </POSProvider>
  );
}
