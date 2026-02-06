'use client';

import { usePOS } from '@/lib/context/pos-context';
import { useKeyboardShortcuts, POSShortcuts } from '@/lib/hooks/useKeyboardShortcuts';
import { useEffect, useState } from 'react';
import POSHeader from '@/components/pos/pos-header';
import POSMainArea from '@/components/pos/pos-main-area';
import POSFooter from '@/components/pos/pos-footer';
import PaymentModal from '@/components/pos/modals/payment-modal';
import DiscountModal from '@/components/pos/modals/discount-modal';
import CustomerModal from '@/components/pos/modals/customer-modal';
import { Toaster } from 'sonner';

export default function POSPage() {
  const { state, openModal, closeModal, clearCart, completePayment, holdInvoice } = usePOS();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  // Setup keyboard shortcuts
  useKeyboardShortcuts(
    [
      {
        key: 'F2',
        action: () => openModal('customer'),
        description: 'Barcode Scanner',
      },
      {
        key: 'F3',
        action: () => openModal('customer'),
        description: 'Customer Lookup',
      },
      {
        key: 'F4',
        action: () => openModal('discount'),
        description: 'Apply Discount',
      },
      {
        key: 'F7',
        action: () => clearCart(),
        description: 'Clear Cart',
      },
      {
        key: 'F9',
        action: () => holdInvoice(),
        description: 'Hold Invoice',
      },
      {
        key: 'F10',
        action: () => openModal('held'),
        description: 'View Held Invoices',
      },
      {
        key: 'P',
        ctrl: true,
        action: () => {
          if (state.cart.lineItems.length > 0) {
            openModal('payment');
          }
        },
        description: 'Process Payment',
      },
      {
        key: 'Escape',
        action: () => closeModal(),
        description: 'Close Modal',
      },
    ],
    isReady
  );

  if (!isReady) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      {/* Header */}
      <POSHeader />

      {/* Main Area */}
      <div className="flex-1 overflow-hidden">
        <POSMainArea />
      </div>

      {/* Footer */}
      <POSFooter />

      {/* Modals */}
      {state.ui.activeModal === 'payment' && <PaymentModal />}
      {state.ui.activeModal === 'discount' && <DiscountModal />}
      {state.ui.activeModal === 'customer' && <CustomerModal />}

      {/* Notifications */}
      <Toaster position="bottom-right" />
    </div>
  );
}
