'use client';

import React from "react"

import { useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Trash2, AlertCircle, CheckCircle, Loader2, ArrowLeft, Save, Package, IndianRupee, Layers, FileText, Barcode, RefreshCw } from 'lucide-react';
import { calculateInvoiceTax, calculateLineItemTax } from '@/lib/services/gst-service';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Schema for Product (Copied from product page)
const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(2, 'Product Name must be at least 2 characters'),
  description: z.string().optional(),
  hsnCode: z.string().optional(),
  sacCode: z.string().optional(),
  taxRate: z.coerce.number(),
  gstType: z.enum(['cgst_sgst', 'igst', 'exempt']),
  costPrice: z.coerce.number().optional().default(0),
  sellingPrice: z.coerce.number().min(0.01, 'Selling Price must be greater than 0'),
  trackInventory: z.boolean().default(true),
  reorderPoint: z.coerce.number().optional().default(10),
  barcodeValue: z.string().optional(),
  barcodeType: z.enum(['ean13', 'code128', 'qr']).default('ean13'),
  isService: z.boolean().default(false)
});
type ProductFormData = z.infer<typeof productSchema>;

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

  const { data: customersData, mutate: mutateCustomers } = useSWR(
    token ? '/api/customers' : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: productsData, mutate: mutateProducts } = useSWR(
    token ? '/api/products' : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const customers = customersData?.data || [];
  const products = productsData?.data || [];

  // Dialog States
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  // New Customer Form State
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    customerType: 'business',
    gstRegistered: false,
    gstin: '',
    pan: '',
    tdsApplicable: false,
    tdsRate: 2.5,
    creditLimit: 0,
    billingAddress: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      pincode: ''
    }
  });

  // New Product Form Hook
  const {
    register: registerProduct,
    handleSubmit: handleProductSubmit,
    watch: watchProduct,
    setValue: setValueProduct,
    formState: { errors: productErrors },
    reset: resetProductForm
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: '',
      name: '',
      description: '',
      hsnCode: '',
      sacCode: '',
      taxRate: 18,
      gstType: 'cgst_sgst',
      costPrice: 0,
      sellingPrice: 0,
      trackInventory: true,
      reorderPoint: 10,
      barcodeValue: '',
      barcodeType: 'ean13',
      isService: false
    },
  });

  const isService = watchProduct('isService');
  const sellingPrice = watchProduct('sellingPrice');

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingCustomer(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newCustomerData)
      });
      if (!res.ok) throw new Error('Failed to create customer');

      const { data } = await res.json();
      toast.success('Customer created!');
      await mutateCustomers(); // Refresh list
      setFormData(prev => ({ ...prev, customerId: data._id })); // Auto-select
      setIsCustomerDialogOpen(false);
      // Reset form
      setNewCustomerData({
        name: '', email: '', phone: '', customerType: 'business', gstRegistered: false, gstin: '', pan: '', tdsApplicable: false, tdsRate: 2.5, creditLimit: 0, billingAddress: { line1: '', line2: '', city: '', state: '', pincode: '' }
      });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const onProductSubmit = async (data: ProductFormData) => {
    try {
      // Calculate base price (excluding GST) from inclusive price
      const basePrice = data.sellingPrice / (1 + (data.taxRate / 100));

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...data,
          sellingPrice: parseFloat(basePrice.toFixed(2)) // Store exclusive price
        })
      });
      if (!res.ok) throw new Error('Failed to create product');

      toast.success('Product created!');
      await mutateProducts();
      setIsProductDialogOpen(false);
      resetProductForm();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsCreatingProduct(false);
    }
  };

  const generateSku = async () => {
    try {
      const res = await fetch('/api/products/generate-sku', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to generate SKU');
      const data = await res.json();
      setValueProduct('sku', data.sku, { shouldValidate: true });
      toast.success('SKU generated');
    } catch (error) {
      toast.error('Could not auto-generate SKU');
    }
  };

  // Settings for Invoice Number
  const [invoiceSettings, setInvoiceSettings] = useState({
    gstPrefix: 'INV-',
    gstNextNumber: 1,
    nonGstPrefix: 'BILL-',
    nonGstNextNumber: 1,
    gstSeries: [] as Array<{ prefix: string, nextNumber: number }>,
    nonGstSeries: [] as Array<{ prefix: string, nextNumber: number }>,
    bankAccounts: [] as any[]
  });
  const [isGstBill, setIsGstBill] = useState(true);
  const [selectedPrefix, setSelectedPrefix] = useState(''); // To store the user's choice

  React.useEffect(() => {
    if (token) {
      fetch('/api/settings', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            // Ensure we have at least one default if arrays are empty
            const gstSeries = data.data.gstInvoiceSeries?.length ? data.data.gstInvoiceSeries : [{ prefix: data.data.invoicePrefix || 'INV-', nextNumber: data.data.nextInvoiceNumber || 1 }];
            const nonGstSeries = data.data.nonGstInvoiceSeries?.length ? data.data.nonGstInvoiceSeries : [{ prefix: data.data.nonGstInvoicePrefix || 'BILL-', nextNumber: data.data.nextNonGstInvoiceNumber || 1 }];

            // Bank Accounts Logic
            const bankAccounts = data.data.bankAccounts && data.data.bankAccounts.length > 0
              ? data.data.bankAccounts
              : (data.data.bankDetails?.accountNumber ? [{ ...data.data.bankDetails, isDefault: true, _id: 'legacy' }] : []);

            setInvoiceSettings({
              gstPrefix: gstSeries[0].prefix,
              gstNextNumber: gstSeries[0].nextNumber,
              nonGstPrefix: nonGstSeries[0].prefix,
              nonGstNextNumber: nonGstSeries[0].nextNumber,
              gstSeries,
              nonGstSeries,
              bankAccounts
            });

            // Set initial selected prefix
            setSelectedPrefix(isGstBill ? gstSeries[0].prefix : nonGstSeries[0].prefix);

            // Set default bank account if available
            const defaultBank = bankAccounts.find((b: any) => b.isDefault) || bankAccounts[0];
            if (defaultBank) {
              setFormData(prev => ({ ...prev, bankAccountId: defaultBank._id || defaultBank.accountNumber })); // Use account number as ID if ID missing (legacy)
            }
          }
        })
        .catch(err => console.error("Failed to fetch settings", err));
    }
  }, [token]);

  // Effect to update selected prefix when GST toggle changes
  React.useEffect(() => {
    if (invoiceSettings.gstSeries.length && invoiceSettings.nonGstSeries.length) {
      setSelectedPrefix(isGstBill ? invoiceSettings.gstSeries[0].prefix : invoiceSettings.nonGstSeries[0].prefix);
    }
  }, [isGstBill, invoiceSettings.gstSeries, invoiceSettings.nonGstSeries]);

  // Signatures state
  const [signatures, setSignatures] = useState<Array<{ name: string; designation: string; image: string }>>([]);

  React.useEffect(() => {
    if (token) {
      fetch('/api/settings/signatures', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          console.log('Fetched signatures:', data);
          if (data.success && data.data) {
            setSignatures(data.data.signatures || []);
          }
        })
        .catch(err => console.error("Failed to fetch signatures", err));
    }
  }, [token]);

  const [formData, setFormData] = useState({
    customerId: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    signatureIndex: 0,
    notes: '',
    terms: '',
    bankAccountId: '',
    enableRoundOff: true
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  // ... (keep discountAmount and taxSummary if needed, though mostly derived)

  const selectedCustomer = customers.find(
    (c: any) => String(c._id) === String(formData.customerId)
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
      (tenant?.address?.state || 'MH') === (selectedCustomer?.billingAddress?.state || 'MH');

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
        state: selectedCustomer?.billingAddress?.state || 'MH',
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
    (tenant?.address?.state || 'MH') === (selectedCustomer?.billingAddress?.state || 'MH');

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
          isGstBill: isGstBill,
          prefix: selectedPrefix, // Pass the selected prefix so backend knows which series to increment
          signatureIndex: formData.signatureIndex, // Selected signature for PDF
          notes: formData.notes,
          terms: formData.terms,
          bankAccountId: formData.bankAccountId,
          enableRoundOff: formData.enableRoundOff,
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
                <Label>Invoice Series</Label>
                <div className="flex gap-2">
                  <Select
                    value={selectedPrefix}
                    onValueChange={setSelectedPrefix}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(isGstBill ? invoiceSettings.gstSeries : invoiceSettings.nonGstSeries).map((s, idx) => (
                        <SelectItem key={idx} value={s.prefix}>
                          {s.prefix}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center px-3 border rounded-md bg-slate-50 text-slate-500 font-mono">
                    {(isGstBill ? invoiceSettings.gstSeries : invoiceSettings.nonGstSeries).find(s => s.prefix === selectedPrefix)?.nextNumber || 1}
                  </div>
                </div>
                <p className="text-xs text-slate-500">Auto-generated sequence</p>
              </div>

              <div className="space-y-2">
                <Label>Customer *</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.customerId}
                    onValueChange={(value) => setFormData({ ...formData, customerId: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.length === 0 ? (
                        <div className="p-2 text-sm text-slate-600">
                          No customers found. Create one first.
                        </div>
                      ) : (
                        customers.map((customer: any) => (
                          <SelectItem key={String(customer._id)} value={String(customer._id)}>
                            {customer.name}
                            {customer.gstin && ` (${customer.gstin})`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>

                  <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" title="Add New Customer">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add New Customer</DialogTitle>
                        <DialogDescription>Create a new customer profile instantly.</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateCustomer} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Customer Name *</Label>
                            <Input required value={newCustomerData.name} onChange={e => setNewCustomerData({ ...newCustomerData, name: e.target.value })} placeholder="e.g. John Doe" />
                          </div>
                          <div className="space-y-2">
                            <Label>Customer Type</Label>
                            <Select value={newCustomerData.customerType} onValueChange={(value) => setNewCustomerData({ ...newCustomerData, customerType: value })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="individual">Individual</SelectItem>
                                <SelectItem value="business">Business</SelectItem>
                                <SelectItem value="government">Government</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Email</Label>
                            <Input type="email" value={newCustomerData.email} onChange={e => setNewCustomerData({ ...newCustomerData, email: e.target.value })} placeholder="email@example.com" />
                          </div>
                          <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input value={newCustomerData.phone} onChange={e => setNewCustomerData({ ...newCustomerData, phone: e.target.value })} placeholder="9876543210" />
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 border p-3 rounded-md">
                          <Checkbox id="nc_gst" checked={newCustomerData.gstRegistered} onCheckedChange={(c) => setNewCustomerData({ ...newCustomerData, gstRegistered: c as boolean })} />
                          <Label htmlFor="nc_gst" className="cursor-pointer">GST Registered</Label>
                        </div>

                        {newCustomerData.gstRegistered && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>GSTIN</Label>
                              <Input value={newCustomerData.gstin} onChange={e => setNewCustomerData({ ...newCustomerData, gstin: e.target.value })} placeholder="29XXXXX..." />
                            </div>
                            <div className="space-y-2">
                              <Label>PAN</Label>
                              <Input value={newCustomerData.pan} onChange={e => setNewCustomerData({ ...newCustomerData, pan: e.target.value })} placeholder="ABCDE1234F" />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center space-x-2 border p-3 rounded-md">
                          <Checkbox id="nc_tds" checked={newCustomerData.tdsApplicable} onCheckedChange={(c) => setNewCustomerData({ ...newCustomerData, tdsApplicable: c as boolean })} />
                          <Label htmlFor="nc_tds" className="cursor-pointer">TDS Applicable</Label>
                        </div>

                        {newCustomerData.tdsApplicable && (
                          <div className="space-y-2 pl-2">
                            <Label>TDS Rate (%)</Label>
                            <Input type="number" step="0.1" value={newCustomerData.tdsRate} onChange={e => setNewCustomerData({ ...newCustomerData, tdsRate: parseFloat(e.target.value) })} />
                          </div>
                        )}

                        <div className="space-y-3 border-t pt-3">
                          <Label className="font-semibold">Billing Address</Label>
                          <Input placeholder="Address Line 1" value={newCustomerData.billingAddress.line1} onChange={e => setNewCustomerData({ ...newCustomerData, billingAddress: { ...newCustomerData.billingAddress, line1: e.target.value } })} />
                          <div className="grid grid-cols-2 gap-2">
                            <Input placeholder="City" value={newCustomerData.billingAddress.city} onChange={e => setNewCustomerData({ ...newCustomerData, billingAddress: { ...newCustomerData.billingAddress, city: e.target.value } })} />
                            <Select value={newCustomerData.billingAddress.state} onValueChange={v => setNewCustomerData({ ...newCustomerData, billingAddress: { ...newCustomerData.billingAddress, state: v } })}>
                              <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="MH">Maharashtra</SelectItem>
                                <SelectItem value="DL">Delhi</SelectItem>
                                <SelectItem value="KA">Karnataka</SelectItem>
                                <SelectItem value="TN">Tamil Nadu</SelectItem>
                                <SelectItem value="GJ">Gujarat</SelectItem>
                                <SelectItem value="WB">West Bengal</SelectItem>
                                <SelectItem value="UP">Uttar Pradesh</SelectItem>
                                <SelectItem value="RJ">Rajasthan</SelectItem>
                                <SelectItem value="MP">Madhya Pradesh</SelectItem>
                                <SelectItem value="TG">Telangana</SelectItem>
                                <SelectItem value="AP">Andhra Pradesh</SelectItem>
                                <SelectItem value="KL">Kerala</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Input placeholder="Pincode" value={newCustomerData.billingAddress.pincode} onChange={e => setNewCustomerData({ ...newCustomerData, billingAddress: { ...newCustomerData.billingAddress, pincode: e.target.value } })} />
                        </div>

                        <DialogFooter className="pt-4">
                          <Button type="button" variant="outline" onClick={() => setIsCustomerDialogOpen(false)}>Cancel</Button>
                          <Button type="submit" disabled={isCreatingCustomer}>
                            {isCreatingCustomer && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Create Customer
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
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

              {/* Signature Selection */}
              <div className="space-y-2">
                <Label>Authorized Signatory</Label>
                {signatures.length > 0 ? (
                  <>
                    <Select
                      value={formData.signatureIndex.toString()}
                      onValueChange={(value) => setFormData({ ...formData, signatureIndex: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select signatory" />
                      </SelectTrigger>
                      <SelectContent>
                        {signatures.map((sig, idx) => (
                          <SelectItem key={idx} value={idx.toString()}>
                            {sig.name}{sig.designation ? ` (${sig.designation})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">Signature will appear on the invoice PDF</p>
                  </>
                ) : (
                  <div className="text-sm p-3 border rounded-md bg-slate-50 text-slate-600">
                    No signatures configured.
                    <Link href="/dashboard/settings" className="text-blue-600 hover:underline ml-1">
                      Add signatures in Settings
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {selectedCustomer && (
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600 font-semibold text-xs mb-1 uppercase tracking-wider">Customer Name</p>
                    <p className="text-slate-900 font-medium">{selectedCustomer.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 font-semibold text-xs mb-1 uppercase tracking-wider">Email</p>
                    <p className="text-slate-900">{selectedCustomer.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 font-semibold text-xs mb-1 uppercase tracking-wider">Phone</p>
                    <p className="text-slate-900">{selectedCustomer.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 font-semibold text-xs mb-1 uppercase tracking-wider">GSTIN</p>
                    <p className="font-mono text-slate-900">
                      {selectedCustomer.gstin || 'Unregistered'}
                    </p>
                  </div>
                  <div className="md:col-span-4">
                    <p className="text-slate-600 font-semibold text-xs mb-1 uppercase tracking-wider">State (Place of Supply)</p>
                    <p className="text-slate-900">{selectedCustomer.billingAddress?.state || 'N/A'}</p>
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
                          <div className="flex gap-2 items-center">
                            <Select
                              value={item.productId || ''}
                              onValueChange={(val) => selectProduct(item.id, val)}
                            >
                              <SelectTrigger className="w-full min-w-[150px]">
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
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 border shrink-0"
                              onClick={() => {
                                resetProductForm();
                                setIsProductDialogOpen(true);
                              }}
                              title="Add New Product"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
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
                            step="0.01"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
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
                            <Select
                              value={item.discountType || 'fixed'}
                              onValueChange={(val: 'percentage' | 'fixed') =>
                                updateLineItem(item.id, { discountType: val })
                              }
                            >
                              <SelectTrigger className="w-24 h-7 text-[10px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percentage">% Percent</SelectItem>
                                <SelectItem value="fixed">₹ Fixed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
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

              <div className="border-t pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch id="round-off-gst" checked={formData.enableRoundOff} onCheckedChange={(c) => setFormData({ ...formData, enableRoundOff: c })} />
                    <Label htmlFor="round-off-gst" className="cursor-pointer">Round Off</Label>
                  </div>
                  {formData.enableRoundOff && (
                    <span className="text-slate-600 font-mono text-sm">
                      {(Math.round(totals.lineAmount - totals.discountAmount + totals.taxAmount) - (totals.lineAmount - totals.discountAmount + totals.taxAmount)) > 0 ? '+' : ''}
                      {(Math.round(totals.lineAmount - totals.discountAmount + totals.taxAmount) - (totals.lineAmount - totals.discountAmount + totals.taxAmount)).toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-lg font-bold">Total Amount</span>
                  <span className="text-2xl font-bold text-green-600 font-mono">
                    ₹
                    {(formData.enableRoundOff
                      ? Math.round(totals.lineAmount - totals.discountAmount + totals.taxAmount)
                      : (totals.lineAmount - totals.discountAmount + totals.taxAmount)
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
                      <li>✓ Place of Supply: {selectedCustomer?.billingAddress?.state || 'N/A'}</li>
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
            <CardContent className="pt-6 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch id="round-off-nongst" checked={formData.enableRoundOff} onCheckedChange={(c) => setFormData({ ...formData, enableRoundOff: c })} />
                  <Label htmlFor="round-off-nongst" className="cursor-pointer">Round Off</Label>
                </div>
                {formData.enableRoundOff && (
                  <span className="text-slate-600 font-mono text-sm">
                    {(Math.round(totals.lineAmount - totals.discountAmount) - (totals.lineAmount - totals.discountAmount)) > 0 ? '+' : ''}
                    {(Math.round(totals.lineAmount - totals.discountAmount) - (totals.lineAmount - totals.discountAmount)).toFixed(2)}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-lg font-bold">Total Amount</span>
                <span className="text-2xl font-bold text-green-600 font-mono">
                  ₹
                  {(formData.enableRoundOff
                    ? Math.round(totals.lineAmount - totals.discountAmount)
                    : (totals.lineAmount - totals.discountAmount)
                  ).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mt-6 border shadow-sm">
          <CardHeader><CardTitle className="text-lg">Additional Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inv-notes">Notes</Label>
              <Textarea
                id="inv-notes"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Thank you for your business..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-terms">Terms & Conditions</Label>
              <Textarea
                id="inv-terms"
                value={formData.terms}
                onChange={e => setFormData({ ...formData, terms: e.target.value })}
                placeholder="Payment due in 30 days..."
              />
            </div>

            <div className="space-y-2">
              <Label>Select Bank Account (for PDF)</Label>
              <Select value={formData.bankAccountId} onValueChange={(val) => setFormData({ ...formData, bankAccountId: val })}>
                <SelectTrigger><SelectValue placeholder="Select Bank Account" /></SelectTrigger>
                <SelectContent>
                  {invoiceSettings.bankAccounts?.map((acc: any, i: number) => (
                    <SelectItem key={i} value={acc._id || acc.accountNumber}>
                      {acc.bankName} - {acc.accountNumber} {acc.isDefault ? '(Default)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-8">
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

      {/* Product Creation Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-full">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>Add a product to your catalog and invoice immediately.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleProductSubmit(onProductSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Product Name *</Label>
                  <Input {...registerProduct('name')} placeholder="Product Name" />
                  {productErrors.name && <p className="text-red-500 text-xs">{productErrors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>SKU *</Label>
                  <div className="flex gap-2">
                    <Input {...registerProduct('sku')} placeholder="SKU" />
                    <Button type="button" variant="outline" size="icon" onClick={generateSku} title="Generate SKU">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                  {productErrors.sku && <p className="text-red-500 text-xs">{productErrors.sku.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea {...registerProduct('description')} placeholder="Description" />
                </div>

                <div className="flex items-center space-x-2 border p-3 rounded-md">
                  <Switch id="np_service" checked={isService} onCheckedChange={(c) => setValueProduct('isService', c)} />
                  <Label htmlFor="np_service">Is Service?</Label>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Selling Price (Incl. GST) *</Label>
                    <Input type="number" step="0.01" {...registerProduct('sellingPrice')} />
                    {productErrors.sellingPrice && <p className="text-red-500 text-xs">{productErrors.sellingPrice.message}</p>}
                    {watchProduct('sellingPrice') > 0 && (
                      <p className="text-[10px] text-blue-600 font-medium mt-1">
                        Excl. GST: ₹{(watchProduct('sellingPrice') / (1 + (watchProduct('taxRate') / 100))).toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Cost Price</Label>
                    <Input type="number" step="0.01" {...registerProduct('costPrice')} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>GST Rate (%)</Label>
                    <Select value={watchProduct('taxRate')?.toString()} onValueChange={(val) => setValueProduct('taxRate', Number(val))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="5">5%</SelectItem>
                        <SelectItem value="12">12%</SelectItem>
                        <SelectItem value="18">18%</SelectItem>
                        <SelectItem value="28">28%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tax Preference</Label>
                    <Select value={watchProduct('gstType')} onValueChange={(val: any) => setValueProduct('gstType', val)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cgst_sgst">Taxable (Intra-state)</SelectItem>
                        <SelectItem value="igst">Taxable (Inter-state)</SelectItem>
                        <SelectItem value="exempt">Tax Exempt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>HSN/SAC</Label>
                    <Input {...registerProduct('hsnCode')} placeholder={isService ? "SAC" : "HSN"} />
                  </div>
                </div>

                {!isService && (
                  <div className="space-y-2 border p-3 rounded-md">
                    <div className="flex items-center space-x-2 mb-2">
                      <Switch checked={watchProduct('trackInventory')} onCheckedChange={(c) => setValueProduct('trackInventory', c)} />
                      <Label>Track Inventory</Label>
                    </div>
                    {watchProduct('trackInventory') && (
                      <div className="space-y-2">
                        <Label>Reorder Point</Label>
                        <Input type="number" {...registerProduct('reorderPoint')} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsProductDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isCreatingProduct}>
                {isCreatingProduct && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Product
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
