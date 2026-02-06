'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { InvoiceRecord, LineItemRecord, TaxBreakdown, ProductRecord, CustomerRecord } from '@/lib/db/indexed-db';
import { SyncEngine } from '@/lib/db/sync-engine';

export interface POSState {
  cart: CartState;
  ui: UIState;
  sync: SyncState;
  offline: boolean;
  currentCustomer?: CustomerRecord;
}

export interface CartState {
  id: string;
  customerId?: string;
  lineItems: LineItemRecord[];
  discount: {
    amount: number;
    type: 'fixed' | 'percentage';
    reason?: string;
  };
  subtotal: number;
  totalTax: number;
  totalAmount: number;
  taxBreakdown: TaxBreakdown;
  paymentMethod?: string;
  status: 'draft' | 'processing' | 'completed';
}

export interface UIState {
  activeModal?: 'payment' | 'discount' | 'customer' | 'held' | null;
  selectedLineItem?: string;
  searchQuery: string;
  barcodeInputFocused: boolean;
  lastAction?: string;
  notification?: {
    type: 'success' | 'error' | 'info';
    message: string;
  };
}

export interface SyncState {
  isSyncing: boolean;
  isOnline: boolean;
  pendingOperations: number;
  failedOperations: number;
  lastSyncTime?: Date;
}

export type POSAction =
  | { type: 'ADD_LINE_ITEM'; payload: LineItemRecord }
  | { type: 'UPDATE_LINE_ITEM'; payload: { id: string; quantity: number } }
  | { type: 'REMOVE_LINE_ITEM'; payload: string }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_CUSTOMER'; payload: CustomerRecord }
  | { type: 'APPLY_DISCOUNT'; payload: { amount: number; type: 'fixed' | 'percentage'; reason?: string } }
  | { type: 'SET_PAYMENT_METHOD'; payload: string }
  | { type: 'COMPLETE_PAYMENT' }
  | { type: 'HOLD_INVOICE' }
  | { type: 'OPEN_MODAL'; payload: UIState['activeModal'] }
  | { type: 'CLOSE_MODAL' }
  | { type: 'SET_BARCODE_FOCUSED'; payload: boolean }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SHOW_NOTIFICATION'; payload: UIState['notification'] }
  | { type: 'SET_SYNC_STATE'; payload: Partial<SyncState> }
  | { type: 'SET_OFFLINE'; payload: boolean }
  | { type: 'RESTORE_DRAFT'; payload: CartState };

const initialState: POSState = {
  cart: {
    id: `draft-${Date.now()}`,
    lineItems: [],
    discount: { amount: 0, type: 'fixed' },
    subtotal: 0,
    totalTax: 0,
    totalAmount: 0,
    taxBreakdown: { cgst: 0, sgst: 0, igst: 0, cess: 0, totalTax: 0 },
    status: 'draft',
  },
  ui: {
    activeModal: null,
    searchQuery: '',
    barcodeInputFocused: true,
  },
  sync: {
    isSyncing: false,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingOperations: 0,
    failedOperations: 0,
  },
  offline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
};

function calculateTotals(lineItems: LineItemRecord[], discount: CartState['discount']): Omit<CartState, 'id' | 'customerId' | 'lineItems' | 'discount' | 'paymentMethod' | 'status'> {
  const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);

  const discountAmount = discount.type === 'percentage'
    ? (subtotal * discount.amount) / 100
    : discount.amount;

  const discountedSubtotal = Math.max(0, subtotal - discountAmount);

  const cgst = lineItems.reduce((sum, item) => sum + (item.cgst || 0), 0);
  const sgst = lineItems.reduce((sum, item) => sum + (item.sgst || 0), 0);
  const igst = lineItems.reduce((sum, item) => sum + (item.igst || 0), 0);
  const cess = 0;

  const totalTax = cgst + sgst + igst + cess;
  const totalAmount = discountedSubtotal + totalTax;

  return {
    subtotal,
    totalTax,
    totalAmount,
    taxBreakdown: { cgst, sgst, igst, cess, totalTax },
  };
}

function posReducer(state: POSState, action: POSAction): POSState {
  switch (action.type) {
    case 'ADD_LINE_ITEM': {
      const newLineItems = [...state.cart.lineItems, action.payload];
      const totals = calculateTotals(newLineItems, state.cart.discount);
      return {
        ...state,
        cart: {
          ...state.cart,
          lineItems: newLineItems,
          ...totals,
        },
      };
    }

    case 'UPDATE_LINE_ITEM': {
      const updatedItems = state.cart.lineItems.map((item) =>
        item.id === action.payload.id
          ? {
              ...item,
              quantity: action.payload.quantity,
              lineTotal: item.unitPrice * action.payload.quantity,
            }
          : item
      );
      const totals = calculateTotals(updatedItems, state.cart.discount);
      return {
        ...state,
        cart: {
          ...state.cart,
          lineItems: updatedItems,
          ...totals,
        },
      };
    }

    case 'REMOVE_LINE_ITEM': {
      const filteredItems = state.cart.lineItems.filter((item) => item.id !== action.payload);
      const totals = calculateTotals(filteredItems, state.cart.discount);
      return {
        ...state,
        cart: {
          ...state.cart,
          lineItems: filteredItems,
          ...totals,
        },
        ui: { ...state.ui, selectedLineItem: undefined },
      };
    }

    case 'CLEAR_CART':
      return {
        ...state,
        cart: {
          ...initialState.cart,
          id: `draft-${Date.now()}`,
        },
      };

    case 'SET_CUSTOMER':
      return {
        ...state,
        currentCustomer: action.payload,
        cart: {
          ...state.cart,
          customerId: action.payload.id,
        },
      };

    case 'APPLY_DISCOUNT': {
      const totals = calculateTotals(state.cart.lineItems, action.payload);
      return {
        ...state,
        cart: {
          ...state.cart,
          discount: action.payload,
          ...totals,
        },
        ui: { ...state.ui, activeModal: null },
      };
    }

    case 'SET_PAYMENT_METHOD':
      return {
        ...state,
        cart: {
          ...state.cart,
          paymentMethod: action.payload,
        },
      };

    case 'COMPLETE_PAYMENT':
      return {
        ...state,
        cart: {
          ...state.cart,
          status: 'completed',
        },
      };

    case 'HOLD_INVOICE':
      return {
        ...state,
        cart: {
          ...state.cart,
          status: 'draft',
        },
      };

    case 'OPEN_MODAL':
      return {
        ...state,
        ui: { ...state.ui, activeModal: action.payload },
      };

    case 'CLOSE_MODAL':
      return {
        ...state,
        ui: { ...state.ui, activeModal: null },
      };

    case 'SET_BARCODE_FOCUSED':
      return {
        ...state,
        ui: { ...state.ui, barcodeInputFocused: action.payload },
      };

    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        ui: { ...state.ui, searchQuery: action.payload },
      };

    case 'SHOW_NOTIFICATION':
      return {
        ...state,
        ui: { ...state.ui, notification: action.payload },
      };

    case 'SET_SYNC_STATE':
      return {
        ...state,
        sync: { ...state.sync, ...action.payload },
      };

    case 'SET_OFFLINE':
      return {
        ...state,
        offline: action.payload,
        sync: { ...state.sync, isOnline: !action.payload },
      };

    case 'RESTORE_DRAFT':
      return {
        ...state,
        cart: action.payload,
      };

    default:
      return state;
  }
}

interface POSContextType {
  state: POSState;
  dispatch: React.Dispatch<POSAction>;
  addLineItem: (product: ProductRecord, quantity: number) => void;
  updateLineItemQuantity: (lineItemId: string, quantity: number) => void;
  removeLineItem: (lineItemId: string) => void;
  clearCart: () => void;
  setCustomer: (customer: CustomerRecord) => void;
  applyDiscount: (amount: number, type: 'fixed' | 'percentage', reason?: string) => void;
  completePayment: () => void;
  holdInvoice: () => void;
  openModal: (modal: UIState['activeModal']) => void;
  closeModal: () => void;
  showNotification: (type: 'success' | 'error' | 'info', message: string) => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export function POSProvider({ children, syncEngine }: { children: React.ReactNode; syncEngine?: SyncEngine }) {
  const [state, dispatch] = useReducer(posReducer, initialState);

  useEffect(() => {
    const handleOnline = () => dispatch({ type: 'SET_OFFLINE', payload: false });
    const handleOffline = () => dispatch({ type: 'SET_OFFLINE', payload: true });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addLineItem = useCallback(
    (product: ProductRecord, quantity: number) => {
      const lineItem: LineItemRecord = {
        id: `line-${Date.now()}`,
        invoiceId: state.cart.id,
        productId: product.id,
        barcode: product.barcode,
        productName: product.name,
        hsnCode: product.hsnCode,
        quantity,
        unitPrice: product.unitPrice,
        discount: 0,
        lineTotal: product.unitPrice * quantity,
        taxRate: product.taxRate,
        taxAmount: (product.unitPrice * quantity * product.taxRate) / 100,
        cgst: (product.unitPrice * quantity * product.taxRate) / 100 / 2,
        sgst: (product.unitPrice * quantity * product.taxRate) / 100 / 2,
      };

      dispatch({ type: 'ADD_LINE_ITEM', payload: lineItem });
      dispatch({
        type: 'SHOW_NOTIFICATION',
        payload: { type: 'success', message: `Added ${product.name}` },
      });
    },
    [state.cart.id]
  );

  const updateLineItemQuantity = useCallback((lineItemId: string, quantity: number) => {
    if (quantity <= 0) {
      dispatch({ type: 'REMOVE_LINE_ITEM', payload: lineItemId });
    } else {
      dispatch({ type: 'UPDATE_LINE_ITEM', payload: { id: lineItemId, quantity } });
    }
  }, []);

  const removeLineItem = useCallback((lineItemId: string) => {
    dispatch({ type: 'REMOVE_LINE_ITEM', payload: lineItemId });
    dispatch({ type: 'SHOW_NOTIFICATION', payload: { type: 'success', message: 'Item removed' } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
    dispatch({ type: 'SHOW_NOTIFICATION', payload: { type: 'success', message: 'Cart cleared' } });
  }, []);

  const setCustomer = useCallback((customer: CustomerRecord) => {
    dispatch({ type: 'SET_CUSTOMER', payload: customer });
  }, []);

  const applyDiscount = useCallback(
    (amount: number, type: 'fixed' | 'percentage', reason?: string) => {
      dispatch({
        type: 'APPLY_DISCOUNT',
        payload: { amount, type, reason },
      });
    },
    []
  );

  const completePayment = useCallback(() => {
    dispatch({ type: 'COMPLETE_PAYMENT' });
  }, []);

  const holdInvoice = useCallback(() => {
    dispatch({ type: 'HOLD_INVOICE' });
  }, []);

  const openModal = useCallback((modal: UIState['activeModal']) => {
    dispatch({ type: 'OPEN_MODAL', payload: modal });
  }, []);

  const closeModal = useCallback(() => {
    dispatch({ type: 'CLOSE_MODAL' });
  }, []);

  const showNotification = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    dispatch({
      type: 'SHOW_NOTIFICATION',
      payload: { type, message },
    });
  }, []);

  const value: POSContextType = {
    state,
    dispatch,
    addLineItem,
    updateLineItemQuantity,
    removeLineItem,
    clearCart,
    setCustomer,
    applyDiscount,
    completePayment,
    holdInvoice,
    openModal,
    closeModal,
    showNotification,
  };

  return <POSContext.Provider value={value}>{children}</POSContext.Provider>;
}

export function usePOS(): POSContextType {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within POSProvider');
  }
  return context;
}
