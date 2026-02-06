'use client';

import React from "react"

import { useEffect, useState } from 'react';

export type KeyboardAction = () => void | Promise<void>;

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: KeyboardAction;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = async (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatch =
          event.key.toUpperCase() === shortcut.key.toUpperCase() ||
          event.code.toUpperCase() === shortcut.key.toUpperCase();

        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : true;
        const shiftMatch = shortcut.shift ? event.shiftKey : true;
        const altMatch = shortcut.alt ? event.altKey : true;
        const metaMatch = shortcut.meta ? event.metaKey : true;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
          event.preventDefault();
          await shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}

// POS-specific shortcuts
export const POSShortcuts = {
  OPEN_BARCODE_SCANNER: 'F2',
  QUICK_CUSTOMER_SEARCH: 'F3',
  APPLY_DISCOUNT: 'F4',
  REFRESH_SYNC: 'F5',
  PRINT_RECEIPT: 'F6',
  CLEAR_CART: 'F7',
  PARTIAL_PAYMENT: 'F8',
  HOLD_INVOICE: 'F9',
  HELD_INVOICES: 'F10',
  FOCUS_SEARCH: 'Ctrl+A',
  DELETE_LINE_ITEM: 'Ctrl+D',
  EDIT_LINE_ITEM: 'Ctrl+E',
  PROCESS_PAYMENT: 'Ctrl+P',
  COMMAND_PALETTE: 'Ctrl+K',
  CANCEL: 'Escape',
} as const;

export interface POSShortcutHints {
  [key: string]: {
    description: string;
    keys: string[];
  };
}

export const POSShortcutHints: POSShortcutHints = {
  barcode: {
    description: 'Open barcode scanner',
    keys: ['F2'],
  },
  customer: {
    description: 'Quick customer lookup',
    keys: ['F3'],
  },
  discount: {
    description: 'Apply discount',
    keys: ['F4'],
  },
  sync: {
    description: 'Refresh and sync',
    keys: ['F5'],
  },
  receipt: {
    description: 'Print receipt',
    keys: ['F6'],
  },
  clearCart: {
    description: 'Clear cart',
    keys: ['F7'],
  },
  partialPayment: {
    description: 'Partial payment',
    keys: ['F8'],
  },
  holdInvoice: {
    description: 'Hold invoice',
    keys: ['F9'],
  },
  heldInvoices: {
    description: 'View held invoices',
    keys: ['F10'],
  },
  search: {
    description: 'Focus search',
    keys: ['Ctrl', 'A'],
  },
  deleteItem: {
    description: 'Delete line item',
    keys: ['Ctrl', 'D'],
  },
  editItem: {
    description: 'Edit line item',
    keys: ['Ctrl', 'E'],
  },
  checkout: {
    description: 'Process payment',
    keys: ['Ctrl', 'P'],
  },
  commandPalette: {
    description: 'Command palette',
    keys: ['Ctrl', 'K'],
  },
  cancel: {
    description: 'Cancel/Close',
    keys: ['Esc'],
  },
  navigation: {
    description: 'Navigate fields',
    keys: ['Tab', 'Shift+Tab'],
  },
  confirm: {
    description: 'Confirm action',
    keys: ['Enter'],
  },
};

// Barcode scanner detection
export function useBarcodeScanner(onBarcodeScanned: (barcode: string) => void) {
  useEffect(() => {
    let barcodeBuffer = '';
    const scannerTimeout = 100; // milliseconds

    const handleKeyPress = (event: KeyboardEvent) => {
      // Detect barcode scanner pattern (fast key presses followed by Enter)
      if (event.key === 'Enter') {
        if (barcodeBuffer.length > 0 && barcodeBuffer.length < 50) {
          console.log(`[v0] Barcode scanned: ${barcodeBuffer}`);
          onBarcodeScanned(barcodeBuffer);
          barcodeBuffer = '';
        }
      } else if (event.key.length === 1) {
        barcodeBuffer += event.key;
        // Reset buffer after timeout of no input
        setTimeout(() => {
          if (barcodeBuffer && !event.timeStamp) {
            barcodeBuffer = '';
          }
        }, scannerTimeout);
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [onBarcodeScanned]);
}

// Number pad utilities for POS
export function useNumericInput(onValue: (value: number) => void) {
  const [input, setInput] = useState('');

  useKeyboardShortcuts(
    [
      ...['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => ({
        key: digit,
        action: () => setInput((prev) => prev + digit),
        description: `Input ${digit}`,
      })),
      {
        key: 'Backspace',
        action: () => setInput((prev) => prev.slice(0, -1)),
        description: 'Delete digit',
      },
      {
        key: '.',
        action: () => {
          if (!input.includes('.')) {
            setInput((prev) => (prev ? prev + '.' : '0.'));
          }
        },
        description: 'Decimal point',
      },
      {
        key: 'Enter',
        action: () => {
          const value = parseFloat(input);
          if (!isNaN(value)) {
            onValue(value);
            setInput('');
          }
        },
        description: 'Confirm input',
      },
    ],
    true
  );

  return { input, setInput };
}
