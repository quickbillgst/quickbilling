'use client';

import { usePOS } from '@/lib/context/pos-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';

export default function POSCartPanel() {
  const { state, updateLineItemQuantity, removeLineItem } = usePOS();

  if (state.cart.lineItems.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-center">
        <div className="space-y-4">
          <ShoppingCart className="w-16 h-16 text-slate-200 mx-auto" />
          <div>
            <p className="text-slate-600 font-medium">Cart is empty</p>
            <p className="text-sm text-slate-500">
              Scan or search for products to add
            </p>
          </div>
          <p className="text-xs text-slate-400">F2: Barcode • F3: Search</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Cart Items */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold text-slate-900">
          Cart ({state.cart.lineItems.length} items)
        </h2>

        {state.cart.lineItems.map((item) => (
          <div
            key={item.id}
            className="p-3 border border-slate-200 rounded-lg hover:border-slate-300 space-y-2"
          >
            {/* Product Info */}
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-medium text-slate-900 text-sm">
                  {item.productName}
                </p>
                <p className="text-xs text-slate-500">
                  ₹{item.unitPrice}/unit
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                {item.taxRate}%
              </Badge>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center border border-slate-300 rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() =>
                    updateLineItemQuantity(item.id, item.quantity - 1)
                  }
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    updateLineItemQuantity(item.id, parseInt(e.target.value) || 1)
                  }
                  className="h-7 w-12 border-0 text-center p-0 text-sm"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() =>
                    updateLineItemQuantity(item.id, item.quantity + 1)
                  }
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>

              <div className="text-right">
                <p className="font-bold text-slate-900">
                  ₹{item.lineTotal.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-slate-500">
                  Tax: ₹{item.taxAmount.toFixed(2)}
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => removeLineItem(item.id)}
                title="Delete (Ctrl+D)"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
