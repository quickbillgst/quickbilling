'use client';

import { usePOS } from '@/lib/context/pos-context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

export default function POSFooter() {
  const { state } = usePOS();

  if (!state.ui.notification) {
    return null;
  }

  const icons = {
    success: <CheckCircle className="w-4 h-4 text-green-600" />,
    error: <AlertCircle className="w-4 h-4 text-red-600" />,
    info: <Info className="w-4 h-4 text-blue-600" />,
  };

  const colors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
  };

  return (
    <div className={`p-4 border-t ${colors[state.ui.notification.type]}`}>
      <div className="flex items-center gap-3">
        {icons[state.ui.notification.type]}
        <p className="text-sm font-medium text-slate-900">
          {state.ui.notification.message}
        </p>
      </div>
    </div>
  );
}
