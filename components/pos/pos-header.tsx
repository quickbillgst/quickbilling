'use client';

import { usePOS } from '@/lib/context/pos-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Wifi, WifiOff, RefreshCw, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function POSHeader() {
  const { state } = usePOS();
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    setTime(new Date().toLocaleTimeString());
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-slate-900 text-white px-6 py-3 border-b border-slate-700">
      <div className="flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="text-lg font-bold">POS Terminal</div>
            <Badge
              variant={state.offline ? 'destructive' : 'default'}
              className="flex items-center gap-1"
            >
              {state.offline ? (
                <>
                  <WifiOff className="w-3 h-3" />
                  Offline
                </>
              ) : (
                <>
                  <Wifi className="w-3 h-3" />
                  Online
                </>
              )}
            </Badge>
          </div>

          {/* Sync Status */}
          <Badge
            variant="outline"
            className="flex items-center gap-1 bg-slate-800 border-slate-600"
          >
            {state.sync.isSyncing ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                Syncing...
              </>
            ) : state.sync.pendingOperations > 0 ? (
              <>
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                {state.sync.pendingOperations} pending
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                Synced
              </>
            )}
          </Badge>
        </div>

        {/* Center */}
        <div className="flex items-center gap-4 text-sm text-slate-300">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {time}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {state.sync.failedOperations > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              {state.sync.failedOperations} failed
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-slate-700"
            title="Settings (Ctrl+,)"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Keyboard Hints */}
      <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
        <span>Shortcuts:</span>
        <span className="px-2 py-1 bg-slate-800 rounded">F2 Barcode</span>
        <span className="px-2 py-1 bg-slate-800 rounded">F3 Customer</span>
        <span className="px-2 py-1 bg-slate-800 rounded">F4 Discount</span>
        <span className="px-2 py-1 bg-slate-800 rounded">Ctrl+P Pay</span>
        <span className="px-2 py-1 bg-slate-800 rounded">F10 Held</span>
      </div>
    </header>
  );
}
