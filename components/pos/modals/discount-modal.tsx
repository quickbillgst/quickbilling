'use client';

import { usePOS } from '@/lib/context/pos-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

export default function DiscountModal() {
  const { state, closeModal, applyDiscount } = usePOS();
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [discountValue, setDiscountValue] = useState('0');
  const [reason, setReason] = useState('');

  const discountAmount =
    discountType === 'percentage'
      ? (state.cart.subtotal * parseFloat(discountValue)) / 100
      : parseFloat(discountValue);

  const newTotal = Math.max(0, state.cart.subtotal - discountAmount);

  const handleApply = () => {
    const value = parseFloat(discountValue) || 0;
    if (value < 0) {
      return;
    }

    applyDiscount(value, discountType, reason || undefined);
  };

  return (
    <Dialog open onOpenChange={closeModal}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Apply Discount</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Amount */}
          <div className="bg-slate-100 p-4 rounded-lg">
            <div className="text-xs text-slate-600 mb-2">Subtotal</div>
            <div className="text-2xl font-bold text-slate-900">
              ₹{state.cart.subtotal.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Discount Type */}
          <div className="space-y-2">
            <Label>Discount Type</Label>
            <Select
              value={discountType}
              onValueChange={(val) =>
                setDiscountType(val as 'fixed' | 'percentage')
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fixed Amount</SelectItem>
                <SelectItem value="percentage">Percentage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Discount Value */}
          <div className="space-y-2">
            <Label>
              Discount {discountType === 'percentage' ? '(%)' : '(₹)'}
            </Label>
            <Input
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder="0"
              min="0"
              max={
                discountType === 'percentage'
                  ? '100'
                  : state.cart.subtotal.toString()
              }
              step={discountType === 'percentage' ? '0.01' : '1'}
              className="text-lg font-mono"
            />
          </div>

          {/* Discount Preview */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Discount Amount</span>
              <span className="font-mono font-bold text-red-600">
                -₹{discountAmount.toFixed(2)}
              </span>
            </div>
            <div className="border-t border-blue-200 pt-2 flex justify-between">
              <span className="text-sm font-medium">New Total</span>
              <span className="font-mono font-bold">
                ₹{newTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label>Reason (Optional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Bulk purchase, Loyalty, Damage, etc."
              className="resize-none h-24"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={closeModal}>
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={parseFloat(discountValue) <= 0}
          >
            Apply Discount (F4)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
