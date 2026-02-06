'use client';

import { usePOS } from '@/lib/context/pos-context';
import POSLeftPanel from './pos-left-panel';
import POSCartPanel from './pos-cart-panel';
import POSRightPanel from './pos-right-panel';

export default function POSMainArea() {
  const { state } = usePOS();

  return (
    <div className="flex gap-0 h-full">
      {/* Left Panel: Product Search */}
      <div className="w-1/4 border-r border-slate-200 overflow-y-auto">
        <POSLeftPanel />
      </div>

      {/* Center Panel: Cart */}
      <div className="flex-1 border-r border-slate-200 overflow-y-auto flex flex-col">
        <POSCartPanel />
      </div>

      {/* Right Panel: Payment & Totals */}
      <div className="w-96 overflow-y-auto flex flex-col">
        <POSRightPanel />
      </div>
    </div>
  );
}
