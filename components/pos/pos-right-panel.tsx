'use client';

import { usePOS } from '@/lib/context/pos-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { User, Percent, CreditCard } from 'lucide-react';

export default function POSRightPanel() {
  const { state, openModal, setCustomer } = usePOS();

  return (
    <div className="p-4 space-y-4 bg-gradient-to-b from-white to-slate-50 flex flex-col">
      {/* Customer Section */}
      <Card className="p-4 border border-slate-200">
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-600">CUSTOMER</label>
          {state.currentCustomer ? (
            <div className="space-y-2">
              <div>
                <p className="font-medium text-slate-900">
                  {state.currentCustomer.name}
                </p>
                {state.currentCustomer.gstin && (
                  <p className="text-xs text-slate-500">
                    GSTIN: {state.currentCustomer.gstin}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs bg-transparent"
                onClick={() => openModal('customer')}
              >
                Change Customer (F3)
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs gap-2 bg-transparent"
              onClick={() => openModal('customer')}
            >
              <User className="w-4 h-4" />
              Add Customer (F3)
            </Button>
          )}
        </div>
      </Card>

      {/* Totals Section */}
      <Card className="p-4 border border-slate-200 space-y-3">
        <label className="text-xs font-semibold text-slate-600">TOTALS</label>

        {/* Subtotal */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600">Subtotal</span>
          <span className="font-mono text-sm">
            ₹{state.cart.subtotal.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Discount */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600">Discount</span>
          <span className="font-mono text-sm text-red-600">
            -₹{state.cart.discount.amount.toLocaleString('en-IN')}
          </span>
        </div>

        {state.cart.discount.amount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => openModal('discount')}
          >
            Edit Discount (F4)
          </Button>
        )}

        {!state.cart.discount.amount && (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs gap-2 bg-transparent"
            onClick={() => openModal('discount')}
          >
            <Percent className="w-4 h-4" />
            Add Discount (F4)
          </Button>
        )}

        <div className="border-t border-slate-200 pt-3" />

        {/* Tax Breakdown */}
        <div className="space-y-1.5 text-xs">
          <label className="font-semibold text-slate-600">Tax Breakdown</label>
          {state.cart.taxBreakdown.cgst > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-600">CGST (9%)</span>
              <span className="font-mono">₹{state.cart.taxBreakdown.cgst.toFixed(2)}</span>
            </div>
          )}
          {state.cart.taxBreakdown.sgst > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-600">SGST (9%)</span>
              <span className="font-mono">₹{state.cart.taxBreakdown.sgst.toFixed(2)}</span>
            </div>
          )}
          {state.cart.taxBreakdown.igst > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-600">IGST (18%)</span>
              <span className="font-mono">₹{state.cart.taxBreakdown.igst.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 pt-3" />

        {/* Total Amount */}
        <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg">
          <span className="font-bold text-slate-900">TOTAL</span>
          <span className="text-2xl font-bold text-blue-600">
            ₹{state.cart.totalAmount.toLocaleString('en-IN')}
          </span>
        </div>
      </Card>

      {/* Payment Button */}
      <div className="flex-1" />
      <Button
        size="lg"
        className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
        onClick={() => {
          if (state.cart.lineItems.length > 0) {
            openModal('payment');
          }
        }}
        disabled={state.cart.lineItems.length === 0}
      >
        <CreditCard className="w-5 h-5" />
        Process Payment (Ctrl+P)
      </Button>

      {/* Hold Invoice Button */}
      <Button
        variant="outline"
        className="w-full text-xs bg-transparent"
        disabled={state.cart.lineItems.length === 0}
      >
        Hold Invoice (F9)
      </Button>

      {/* Keyboard Hints */}
      <div className="pt-4 border-t border-slate-200 space-y-1 text-xs text-slate-500">
        <p className="font-semibold">Quick Actions:</p>
        <div className="space-y-0.5">
          <p>F2 - Barcode scan</p>
          <p>F3 - Customer</p>
          <p>F4 - Discount</p>
          <p>Ctrl+P - Payment</p>
        </div>
      </div>
    </div>
  );
}
