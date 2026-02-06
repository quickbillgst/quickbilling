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
import { useState } from 'react';

export default function PaymentModal() {
  const { state, closeModal, completePayment, showNotification, clearCart } = usePOS();
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState(state.cart.totalAmount.toString());

  const change = Math.max(0, parseFloat(amountPaid) - state.cart.totalAmount);

  const handlePayment = async () => {
    const paid = parseFloat(amountPaid);
    if (isNaN(paid) || paid < state.cart.totalAmount) {
      showNotification('error', 'Invalid payment amount');
      return;
    }

    try {
      // In production, send to API
      console.log('[v0] Processing payment:', {
        total: state.cart.totalAmount,
        paid,
        change,
        method: paymentMethod,
        items: state.cart.lineItems,
      });

      completePayment();
      showNotification('success', 'Payment processed successfully!');

      // Clear cart after 1 second
      setTimeout(() => {
        clearCart();
        closeModal();
      }, 1000);
    } catch (error) {
      showNotification('error', 'Payment failed. Please try again.');
    }
  };

  return (
    <Dialog open onOpenChange={closeModal}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Order Summary */}
          <div className="bg-slate-100 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-mono">
                ₹{state.cart.subtotal.toLocaleString('en-IN')}
              </span>
            </div>
            {state.cart.discount.amount > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Discount</span>
                <span className="font-mono">
                  -₹{state.cart.discount.amount.toLocaleString('en-IN')}
                </span>
              </div>
            )}
            <div className="border-t border-slate-300 pt-2" />
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Tax</span>
              <span className="font-mono">
                ₹{state.cart.totalTax.toFixed(2)}
              </span>
            </div>
            <div className="border-t border-slate-300 pt-2 flex justify-between font-bold">
              <span>TOTAL DUE</span>
              <span className="text-2xl text-blue-600">
                ₹{state.cart.totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount Paid */}
          <div className="space-y-2">
            <Label>Amount Paid</Label>
            <Input
              type="number"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="text-lg font-mono"
              step="0.01"
            />
          </div>

          {/* Change */}
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700">Change Due</span>
              <span className="text-2xl font-bold text-green-600">
                ₹{change.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={closeModal}>
            Cancel
          </Button>
          <Button
            onClick={handlePayment}
            className="bg-green-600 hover:bg-green-700"
            disabled={parseFloat(amountPaid) < state.cart.totalAmount}
          >
            Complete Payment (F8)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
