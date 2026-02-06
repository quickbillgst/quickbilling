'use client';

import React from "react"

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { calculateInvoiceTax, calculateLineItemTax } from '@/lib/services/gst-service';

interface LineItem {
  id: string;
  productId?: string;
  description: string;
  hsn?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountValue?: number;
  discountType?: 'percentage' | 'fixed';
}

export default function NewInvoicePage() {
  const router = useRouter();
  const { token, tenant } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch customers using SWR
  const fetcher = async (url: string) => {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      // Handle 404 or other errors gracefully
      if (response.status === 404) return { success: false, data: [] };
      throw new Error('Failed to fetch data');
    }
    return response.json();
  };

  const { data: customersData } = useSWR(
    token ? '/api/customers' : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: productsData } = useSWR(
    token ? '/api/products' : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const customers = customersData?.data || [];
  const products = productsData?.data || [];

  // Settings for Invoice Number
  const [invoiceSettings, setInvoiceSettings] = useState({
    gstPrefix: 'INV-',
    gstNextNumber: 1,
    nonGstPrefix: 'BILL-',
    nonGstNextNumber: 1
  });
  const [isGstBill, setIsGstBill] = useState(true);

  React.useEffect(() => {
    if (token) {
      fetch('/api/settings', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setInvoiceSettings({
              gstPrefix: data.data.invoicePrefix || 'INV-',
              gstNextNumber: data.data.nextInvoiceNumber || 1,
              nonGstPrefix: data.data.nonGstInvoicePrefix || 'BILL-',
              nonGstNextNumber: data.data.nextNonGstInvoiceNumber || 1
            });
          }
        })
        .catch(err => console.error("Failed to fetch settings", err));
    }
  }, [token]);

  const [formData, setFormData] = useState({
    customerId: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  // ... (keep discountAmount and taxSummary if needed, though mostly derived)

  const selectedCustomer = customers.find(
    (c: any) => c._id === formData.customerId
  );

  // Toggle GST Mode
  const handleGstToggle = (enabled: boolean) => {
    setIsGstBill(enabled);
    setLineItems(items => items.map(item => {
      if (!enabled) {
        // Switch to Non-GST: Set tax to 0
        return { ...item, taxRate: 0 };
      } else {
        // Switch to GST: Restore tax from product or default to 18
        const product = products.find((p: any) => p._id === item.productId);
        return { ...item, taxRate: product ? product.gstRate : 18 };
      }
    }));
  };

  // Calculate tax for all items
  const taxCalculations = lineItems.map((item) => {
    // If Non-GST, force isIntrastate true effectively (or irrelevant) but taxRate is 0 anyway so tax is 0.
    // However, to be clean, let's keep logic standard as calculateLineItemTax handles 0 rate fine.
    const isIntrastate =
      (tenant?.address?.state || 'MH') === (selectedCustomer?.addresses?.[0]?.state || 'MH');

    return calculateLineItemTax(
      {
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        hsn: item.hsn,
        // Ensure taxRate is respected from item (which is updated by toggle)
        taxRate: item.taxRate,
        discountValue: item.discountValue,
        discountType: item.discountType,
      },
      {
        state: selectedCustomer?.addresses?.[0]?.state || 'MH',
        isIntrastate,
        isIntegrated: isIntrastate,
      },
      false,
      false
    );
  });

  const totals = taxCalculations.reduce(
    (acc, t) => ({
      lineAmount: acc.lineAmount + t.lineAmount,
      discountAmount: acc.discountAmount + t.discountAmount,
      taxableAmount: acc.taxableAmount + t.taxableAmount,
      cgstAmount: acc.cgstAmount + t.cgstAmount,
      sgstAmount: acc.sgstAmount + t.sgstAmount,
      igstAmount: acc.igstAmount + t.igstAmount,
      cessAmount: acc.cessAmount + t.cessAmount,
      taxAmount: acc.taxAmount + t.taxAmount,
    }),
    {
      lineAmount: 0,
      discountAmount: 0,
      taxableAmount: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      cessAmount: 0,
      taxAmount: 0,
    }
  );

  const isIntrastate =
    (tenant?.address?.state || 'MH') === (selectedCustomer?.addresses?.[0]?.state || 'MH');

  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      productId: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: isGstBill ? 18 : 0,
    };
    setLineItems([...lineItems, newItem]);
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const updateLineItem = (id: string, updates: Partial<LineItem>) => {
    setLineItems(
      lineItems.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const selectProduct = (itemId: string, productId: string) => {
    const product = products.find((p: any) => p._id === productId);
    if (product) {
      updateLineItem(itemId, {
        productId,
        description: product.name,
        hsn: product.hsnCode || product.sacCode,
        unitPrice: product.sellingPrice,
        taxRate: isGstBill ? product.gstRate : 0,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerId || lineItems.length === 0) {
      toast.error('Please select a customer and add line items');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/invoices/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerId: formData.customerId,
          invoiceDate: formData.invoiceDate,
          dueDate: formData.dueDate || undefined,
          lineItems: lineItems.map((item) => ({
            productId: item.productId || undefined, // Send undefined if empty string to avoid CastError
            description: item.description,
            hsn: item.hsn,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            unitOfMeasure: 'piece',
            discountValue: item.discountValue,
            discountType: item.discountType,
            // Pass the tax rate explicitly from the item, which respects the GST/Non-GST toggle
            taxRate: item.taxRate
          })),
          isExport: false,
          isSez: false,
          isGstBill: isGstBill // Optional: Pass this if backend needs it, but taxRate 0 handling is usually enough
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create invoice');
      }

      const { invoice } = await res.json();
      toast.success(`Invoice ${invoice.invoiceNumber} created successfully!`);
      router.push('/dashboard/invoices');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create invoice');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Create Invoice</h1>
          <p className="text-slate-600 mt-1">Create invoices with automatic tax calculation</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-3 rounded-lg border shadow-sm">
          <span className={`text-sm font-medium ${!isGstBill ? 'text-slate-900' : 'text-slate-500'}`}>Non-GST</span>
          <Switch checked={isGstBill} onCheckedChange={handleGstToggle} />
          <span className={`text-sm font-medium ${isGstBill ? 'text-slate-900' : 'text-slate-500'}`}>GST Bill</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Invoice Header */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Invoice Number</Label>
                <Input
                  value={
                    isGstBill
                      ? `${invoiceSettings.gstPrefix}${String(invoiceSettings.gstNextNumber).padStart(5, '0')}`
                      : `${invoiceSettings.nonGstPrefix}${String(invoiceSettings.nonGstNextNumber).padStart(5, '0')}`
                  }
                  disabled
                  className="font-mono bg-slate-50"
                />
                <p className="text-xs text-slate-500">Auto-generated based on settings</p>
              </div>

              <div className="space-y-2">
                <Label>Customer *</Label>
                <Select
                  value={formData.customerId}
                  onValueChange={(value) => setFormData({ ...formData, customerId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.length === 0 ? (
                      <div className="p-2 text-sm text-slate-600">
                        No customers found. Create one first.
                      </div>
                    ) : (
                      customers.map((customer: any) => (
                        <SelectItem key={customer._id} value={customer._id}>
                          {customer.name}
                          {customer.gstin && ` (${customer.gstin})`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Invoice Date *</Label>
                <Input
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>

            {selectedCustomer && (
              // ... (keep customer info display)
              <div className="border-t pt-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600 font-semibold">Customer Name</p>
                    <p className="text-slate-900">{selectedCustomer.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 font-semibold">GSTIN</p>
                    <p className="font-mono text-slate-900">
                      {selectedCustomer.gstin || 'Unregistered'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 font-semibold">State</p>
                    <p className="text-slate-900">{selectedCustomer.addresses?.[0]?.state}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          {/* ... (keep line items table structure) */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Line Items</CardTitle>
              <CardDescription>Add products and services</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLineItem}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent>
            {lineItems.length === 0 ? (
              <div className="text-center py-8 text-slate-600">
                <p>No items added yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="w-20 text-right">Qty</TableHead>
                      <TableHead className="w-24 text-right">Unit Price</TableHead>
                      <TableHead className="w-24 text-right">Discount</TableHead>
                      <TableHead className="w-16 text-right">Tax %</TableHead>
                      <TableHead className="w-24 text-right">Amount</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((item, idx) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Select
                            value={item.productId || ''}
                            onValueChange={(val) => selectProduct(item.id, val)}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.length === 0 ? (
                                <div className="p-2 text-sm text-slate-500">No products found</div>
                              ) : (
                                products.map((p: any) => (
                                  <SelectItem key={p._id} value={p._id}>
                                    {p.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateLineItem(item.id, {
                                quantity: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-20 text-right"
                            min="1"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateLineItem(item.id, {
                                unitPrice: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-24 text-right"
                            min="0"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.discountValue || ''}
                            onChange={(e) =>
                              updateLineItem(item.id, {
                                discountValue: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-24 text-right"
                            placeholder="0"
                          />
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {isGstBill ? item.taxRate : 0}%
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ₹
                          {taxCalculations[idx]
                            ?.totalAmount.toLocaleString('en-IN', {
                              maximumFractionDigits: 2,
                            })}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLineItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tax Breakdown (Conditional) */}
        {isGstBill && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                GST Tax Calculation
              </CardTitle>
              <CardDescription>
                {isIntrastate
                  ? 'Intra-state transaction (CGST + SGST)'
                  : 'Inter-state transaction (IGST)'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Line Amount</span>
                    <span className="font-mono font-semibold">
                      ₹
                      {totals.lineAmount.toLocaleString('en-IN', {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span className="text-slate-600">Discount</span>
                    <span className="font-mono font-semibold">
                      -₹
                      {totals.discountAmount.toLocaleString('en-IN', {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Taxable Amount</span>
                    <span className="font-mono">
                      ₹
                      {totals.taxableAmount.toLocaleString('en-IN', {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {isIntrastate ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-600">CGST</span>
                        <span className="font-mono font-semibold">
                          ₹
                          {totals.cgstAmount.toLocaleString('en-IN', {
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">SGST</span>
                        <span className="font-mono font-semibold">
                          ₹
                          {totals.sgstAmount.toLocaleString('en-IN', {
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-slate-600">IGST</span>
                      <span className="font-mono font-semibold">
                        ₹
                        {totals.igstAmount.toLocaleString('en-IN', {
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-lg font-bold">Total Amount</span>
                  <span className="text-2xl font-bold text-green-600 font-mono">
                    ₹
                    {(
                      totals.lineAmount -
                      totals.discountAmount +
                      totals.taxAmount
                    ).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex gap-2 text-sm text-blue-900">
                  <CheckCircle className="h-5 w-5 flex-shrink-0 text-blue-600" />
                  <div>
                    <p className="font-semibold mb-1">GST Compliance</p>
                    <ul className="text-xs space-y-1">
                      <li>
                        {isIntrastate
                          ? '✓ CGST + SGST applicable'
                          : '✓ IGST applicable'}
                      </li>
                      {selectedCustomer?.gstin && (
                        <li>✓ GST registered customer</li>
                      )}
                      <li>✓ Place of Supply: {selectedCustomer?.addresses?.[0]?.state}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Total for Non-GST */}
        {!isGstBill && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-baseline">
                <span className="text-lg font-bold">Total Amount</span>
                <span className="text-2xl font-bold text-green-600 font-mono">
                  ₹
                  {(
                    totals.lineAmount -
                    totals.discountAmount
                  ).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions - keep same */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !formData.customerId || lineItems.length === 0}
          >
            {isLoading ? 'Creating Invoice...' : 'Create Invoice'}
          </Button>
        </div>
      </form>
    </div>
  );
}
