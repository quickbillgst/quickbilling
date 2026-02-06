'use client';

import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Calculator } from 'lucide-react';
import { calculateLineItemTax } from '@/lib/services/gst-service';
import { toast } from 'sonner';

interface LineItem {
  id: string;
  productId: string;
  productName: string;
  hsn: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountValue?: number;
  discountType?: 'percentage' | 'fixed';
}

interface InvoiceBuilderProps {
  customerId: string;
  supplierState: string;
  customerState: string;
  customerGstin?: string;
}

export function InvoiceBuilder({
  customerId,
  supplierState,
  customerState,
  customerGstin,
}: InvoiceBuilderProps) {
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  // Mock products for demo
  const products = [
    { id: '1', name: 'Wheat Flour', hsn: '1101', defaultPrice: 50, taxRate: 5 },
    { id: '2', name: 'Garment', hsn: '6204', defaultPrice: 500, taxRate: 12 },
    { id: '3', name: 'Computer', hsn: '8471', defaultPrice: 50000, taxRate: 12 },
  ];

  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      productId: '',
      productName: '',
      hsn: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 18,
    };
    setLineItems([...lineItems, newItem]);
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const updateLineItem = (id: string, updates: Partial<LineItem>) => {
    setLineItems(lineItems.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const selectProduct = (itemId: string, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      updateLineItem(itemId, {
        productId,
        productName: product.name,
        hsn: product.hsn,
        unitPrice: product.defaultPrice,
        taxRate: product.taxRate,
      });
    }
  };

  // Calculate tax for all line items
  const taxCalculations = useMemo(() => {
    return lineItems.map(item => {
      const isIntrastate = supplierState === customerState;
      const tax = calculateLineItemTax(
        {
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          hsn: item.hsn,
          taxRate: item.taxRate,
          discountValue: item.discountValue,
          discountType: item.discountType,
        },
        {
          state: customerState,
          isIntrastate,
          isIntegrated: isIntrastate,
        },
        false,
        false
      );
      return tax;
    });
  }, [lineItems, supplierState, customerState]);

  // Calculate totals
  const totals = useMemo(() => {
    const tax = taxCalculations.reduce(
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

    return {
      ...tax,
      totalAmount: tax.lineAmount - tax.discountAmount + tax.taxAmount,
    };
  }, [taxCalculations]);

  const isIntrastate = supplierState === customerState;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invoice Line Items</CardTitle>
          <CardDescription>Add products and configure GST</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead className="text-right">Tax %</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map((item, idx) => {
                  const tax = taxCalculations[idx];
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Select value={item.productId} onValueChange={(val) => selectProduct(item.id, val)}>
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                          className="w-20 text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateLineItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                          className="w-24 text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.discountValue || ''}
                          onChange={(e) => updateLineItem(item.id, { discountValue: parseFloat(e.target.value) || 0 })}
                          className="w-20 text-right"
                          placeholder="0"
                        />
                      </TableCell>
                      <TableCell className="text-right">{item.taxRate}%</TableCell>
                      <TableCell className="text-right font-semibold">
                        ₹{tax.lineAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLineItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <Button onClick={addLineItem} variant="outline" className="w-full bg-transparent">
            <Plus className="h-4 w-4 mr-2" />
            Add Line Item
          </Button>
        </CardContent>
      </Card>

      {/* Tax Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            GST Calculation
          </CardTitle>
          <CardDescription>
            {isIntrastate ? 'Intra-state (CGST + SGST)' : 'Inter-state (IGST)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Line Amount</span>
                <span className="font-mono">₹{totals.lineAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <span className="font-mono text-red-600">-₹{totals.discountAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Taxable Amount</span>
                <span className="font-mono">₹{totals.taxableAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="space-y-3">
              {isIntrastate ? (
                <>
                  <div className="flex justify-between">
                    <span>CGST (9%)</span>
                    <span className="font-mono">₹{totals.cgstAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST (9%)</span>
                    <span className="font-mono">₹{totals.sgstAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span>IGST (18%)</span>
                  <span className="font-mono">₹{totals.igstAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
              )}
              {totals.cessAmount > 0 && (
                <div className="flex justify-between">
                  <span>Cess</span>
                  <span className="font-mono">₹{totals.cessAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between text-lg font-bold">
              <span>Total Amount</span>
              <span className="font-mono text-green-600">
                ₹{totals.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-900">
            <div className="font-semibold mb-2">Tax Compliance:</div>
            <ul className="list-disc list-inside space-y-1">
              <li>{isIntrastate ? 'CGST + SGST applicable' : 'IGST applicable'}</li>
              <li>Place of Supply: {customerState}</li>
              {customerGstin && <li>GST Registered Customer</li>}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
