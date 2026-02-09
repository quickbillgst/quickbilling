'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Trash2, ArrowLeft, Save, FileText, Download, Loader2 } from 'lucide-react';

interface LineItem {
    id?: string;
    _id?: string;
    productId?: string;
    description: string;
    hsnCode?: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    discount?: number;
    discountValue?: number;
    discountType?: 'percentage' | 'fixed';
    lineAmount?: number;
    lineTax?: number;
}

export default function InvoiceEditPage() {
    const router = useRouter();
    const params = useParams();
    const invoiceId = params.id as string;
    const { token, tenant } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch invoice data
    const fetcher = async (url: string) => {
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch data');
        return response.json();
    };

    const { data: invoiceData, error: invoiceError, isLoading: invoiceLoading } = useSWR(
        token && invoiceId ? `/api/invoices/${invoiceId}` : null,
        fetcher
    );

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

    const { data: signaturesData } = useSWR(
        token ? '/api/settings/signatures' : null,
        fetcher,
        { revalidateOnFocus: false }
    );

    const { data: settingsData } = useSWR(
        token ? '/api/settings' : null,
        fetcher,
        { revalidateOnFocus: false }
    );

    const customers = customersData?.data || [];
    const products = productsData?.data || [];
    const signatures = signaturesData?.data?.signatures || [];
    const bankAccounts = settingsData?.data?.bankAccounts || [];

    // Form state
    const [formData, setFormData] = useState({
        customerId: '',
        invoiceDate: '',
        dueDate: '',
        status: 'draft',
        notes: '',
        terms: '',
        bankAccountId: '',
        enableRoundOff: true,
        signatureIndex: 0,
    });

    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const isInitialized = useRef(false);

    // Initialize form when invoice data loads
    useEffect(() => {
        if (invoiceData?.data && !isInitialized.current) {
            const invoice = invoiceData.data;

            // Extract customer ID - handle both populated object and plain ID
            let customerId = '';
            if (invoice.customerId) {
                if (typeof invoice.customerId === 'object' && (invoice.customerId._id || invoice.customerId.id)) {
                    customerId = String(invoice.customerId._id || invoice.customerId.id);
                } else {
                    customerId = String(invoice.customerId);
                }
            }

            const formatDateForInput = (dateStr: any) => {
                if (!dateStr) return '';
                try {
                    const d = new Date(dateStr);
                    if (isNaN(d.getTime())) return '';
                    return d.toISOString().split('T')[0];
                } catch (e) {
                    return '';
                }
            };

            setFormData({
                customerId: customerId,
                invoiceDate: formatDateForInput(invoice.invoiceDate),
                dueDate: formatDateForInput(invoice.dueDate),
                status: invoice.status || 'draft',
                notes: invoice.notes || '',
                terms: invoice.terms || '',
                bankAccountId: invoice.bankAccountId || '',
                enableRoundOff: invoice.enableRoundOff !== false,
                signatureIndex: invoice.signatureIndex || 0,
            });

            if (invoice.lineItems && Array.isArray(invoice.lineItems)) {
                setLineItems(invoice.lineItems.map((item: any, index: number) => {
                    // We'll match products once they load or if they are already here
                    const currentProducts = productsData?.data || [];
                    let matchedProductId = item.productId;
                    if (!matchedProductId && item.description && currentProducts.length > 0) {
                        const matchedProduct = currentProducts.find((p: any) =>
                            p.name === item.description || p.name.toLowerCase() === item.description.toLowerCase()
                        );
                        if (matchedProduct) {
                            matchedProductId = matchedProduct._id;
                        }
                    }

                    return {
                        id: item._id || String(Date.now() + index),
                        productId: matchedProductId || '',
                        description: item.description || '',
                        hsnCode: item.hsnCode || '',
                        quantity: Number(item.quantity) || 1,
                        unitPrice: item.unitPrice || 0,
                        taxRate: item.taxRate || 0,
                        discount: item.discount || 0,
                        discountValue: item.discountValue !== undefined ? item.discountValue : (item.discount || 0),
                        discountType: item.discountType || 'fixed',
                        lineAmount: item.lineAmount || 0,
                        lineTax: item.lineTax || 0,
                    };
                }));
            }

            isInitialized.current = true;
        }
    }, [invoiceData, productsData]); // Keep productsData in dependencies to trigger re-match if it loads later

    const rawInvoice = invoiceData?.data;
    const populatedCustomer = rawInvoice?.customerId && typeof rawInvoice.customerId === 'object' ? rawInvoice.customerId : null;

    const selectedCustomer = customers.find(
        (c: any) => String(c._id) === String(formData.customerId)
    ) || (formData.customerId && populatedCustomer && String(populatedCustomer._id) === String(formData.customerId) ? populatedCustomer : null);

    // Calculate totals
    const calculateTotals = () => {
        let subtotal = 0;
        let totalTax = 0;
        let totalDiscount = 0;

        lineItems.forEach((item) => {
            const lineAmount = item.quantity * item.unitPrice;
            let discount = 0;
            if (item.discountType === 'percentage') {
                discount = (lineAmount * (item.discountValue || 0)) / 100;
            } else {
                discount = item.discountValue || 0;
            }

            const taxable = lineAmount - discount;
            const tax = taxable * (item.taxRate / 100);

            subtotal += lineAmount;
            totalDiscount += discount;
            totalTax += tax;
        });

        const rawGrandTotal = subtotal - totalDiscount + totalTax;
        const grandTotal = formData.enableRoundOff ? Math.round(rawGrandTotal) : rawGrandTotal;
        const roundOff = grandTotal - rawGrandTotal;

        return {
            subtotal,
            totalDiscount,
            taxable: subtotal - totalDiscount,
            totalTax,
            grandTotal,
            roundOff,
        };
    };

    const totals = calculateTotals();

    const addLineItem = () => {
        const newItem: LineItem = {
            id: Date.now().toString(),
            productId: '',
            description: '',
            quantity: 1,
            unitPrice: 0,
            taxRate: 18,
            discount: 0,
        };
        setLineItems([...lineItems, newItem]);
    };

    const removeLineItem = (id: string) => {
        setLineItems(lineItems.filter((item) => (item.id || item._id) !== id));
    };

    const updateLineItem = (id: string, updates: Partial<LineItem>) => {
        setLineItems(
            lineItems.map((item) =>
                (item.id || item._id) === id ? { ...item, ...updates } : item
            )
        );
    };

    const selectProduct = (itemId: string, productId: string) => {
        const product = products.find((p: any) => p._id === productId);
        if (product) {
            updateLineItem(itemId, {
                productId,
                description: product.name,
                hsnCode: product.hsnCode || product.sacCode,
                unitPrice: product.sellingPrice,
                taxRate: product.gstRate || 18,
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.customerId || lineItems.length === 0) {
            toast.error('Please select a customer and add line items');
            return;
        }

        setIsSaving(true);

        try {
            const res = await fetch(`/api/invoices/${invoiceId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    customerId: formData.customerId,
                    invoiceDate: formData.invoiceDate,
                    dueDate: formData.dueDate || undefined,
                    status: formData.status,
                    notes: formData.notes,
                    terms: formData.terms,
                    bankAccountId: formData.bankAccountId,
                    enableRoundOff: formData.enableRoundOff,
                    signatureIndex: formData.signatureIndex,
                    lineItems: lineItems.map((item) => ({
                        productId: item.productId || undefined,
                        description: item.description,
                        hsnCode: item.hsnCode,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        taxRate: item.taxRate,
                        discountValue: item.discountValue || 0,
                        discountType: item.discountType || 'fixed',
                    })),
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to update invoice');
            }

            toast.success('Invoice updated successfully!');
            router.push('/dashboard/invoices');
        } catch (error: any) {
            toast.error(error.message || 'Failed to update invoice');
        } finally {
            setIsSaving(false);
        }
    };

    if (invoiceLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (invoiceError || !invoiceData?.data) {
        return (
            <div className="p-8">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center py-12">
                            <p className="text-red-600 mb-4">Failed to load invoice</p>
                            <Link href="/dashboard/invoices">
                                <Button variant="outline">Back to Invoices</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const invoice = invoiceData.data;
    const isPaid = invoice.status === 'paid';

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/invoices">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">
                            Edit Invoice: {invoice.invoiceNumber}
                        </h1>
                        <p className="text-slate-600 mt-1">
                            {isPaid ? 'This invoice is paid and cannot be edited' : 'Update invoice details'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Link href={`/api/invoices/${invoiceId}/pdf?token=${token}`} target="_blank">
                        <Button variant="outline" className="gap-2">
                            <Download className="w-4 h-4" />
                            Download PDF
                        </Button>
                    </Link>
                </div>
            </div>

            {isPaid && (
                <Card className="bg-yellow-50 border-yellow-200">
                    <CardContent className="pt-6">
                        <p className="text-yellow-800">
                            ⚠️ This invoice has been marked as paid and cannot be edited.
                            If you need to make changes, please create a credit note.
                        </p>
                    </CardContent>
                </Card>
            )}

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
                                    value={invoice.invoiceNumber}
                                    disabled
                                    className="font-mono bg-slate-50"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Customer *</Label>
                                <Select
                                    value={formData.customerId}
                                    onValueChange={(value) => setFormData({ ...formData, customerId: value })}
                                    disabled={isPaid}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select customer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {customers.map((customer: any) => (
                                            <SelectItem key={String(customer._id)} value={String(customer._id)}>
                                                {customer.name}
                                                {customer.gstin && ` (${customer.gstin})`}
                                            </SelectItem>
                                        ))}
                                        {/* Fallback for selected customer if not in the current list */}
                                        {selectedCustomer && !customers.find((c: any) => String(c._id) === String(selectedCustomer._id)) && (
                                            <SelectItem value={String(selectedCustomer._id)}>
                                                {selectedCustomer.name} {selectedCustomer.gstin && ` (${selectedCustomer.gstin})`}
                                            </SelectItem>
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
                                    disabled={isPaid}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Due Date</Label>
                                <Input
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                    disabled={isPaid}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                                    disabled={isPaid}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="issued">Issued</SelectItem>
                                        <SelectItem value="partially_paid">Partially Paid</SelectItem>
                                        <SelectItem value="paid">Paid</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Signature Selection */}
                            {signatures.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Authorized Signatory</Label>
                                    <Select
                                        value={formData.signatureIndex.toString()}
                                        onValueChange={(value) => setFormData({ ...formData, signatureIndex: parseInt(value) })}
                                        disabled={isPaid}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select signatory" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {signatures.map((sig: any, idx: number) => (
                                                <SelectItem key={idx} value={idx.toString()}>
                                                    {sig.name}{sig.designation ? ` (${sig.designation})` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-slate-500">Signature will appear on the invoice PDF</p>
                                </div>
                            )}
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
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle>Line Items</CardTitle>
                            <CardDescription>Products and services in this invoice</CardDescription>
                        </div>
                        {!isPaid && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addLineItem}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Item
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        {lineItems.length === 0 ? (
                            <div className="text-center py-8 text-slate-600">
                                <p>No items in this invoice</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Product</TableHead>
                                            <TableHead className="w-20 text-right">Qty</TableHead>
                                            <TableHead className="w-28 text-right">Unit Price</TableHead>
                                            <TableHead className="w-24 text-right">Discount</TableHead>
                                            <TableHead className="w-16 text-right">Tax %</TableHead>
                                            <TableHead className="w-28 text-right">Amount</TableHead>
                                            {!isPaid && <TableHead className="w-10"></TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {lineItems.map((item) => {
                                            const itemId = item.id || item._id || '';
                                            const lineAmount = item.quantity * item.unitPrice;
                                            const taxable = lineAmount - (item.discount || 0);
                                            const tax = taxable * (item.taxRate / 100);
                                            const total = taxable + tax;

                                            return (
                                                <TableRow key={itemId}>
                                                    <TableCell>
                                                        {isPaid ? (
                                                            <span className="font-medium">{item.description}</span>
                                                        ) : (
                                                            <div className="space-y-1">
                                                                <Select
                                                                    value={item.productId || ''}
                                                                    onValueChange={(val) => selectProduct(itemId, val)}
                                                                >
                                                                    <SelectTrigger className="w-48">
                                                                        <SelectValue placeholder={item.description || "Select product"} />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {products.map((p: any) => (
                                                                            <SelectItem key={p._id} value={p._id}>
                                                                                {p.name}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                {item.description && !item.productId && (
                                                                    <p className="text-xs text-blue-600">Current: {item.description}</p>
                                                                )}
                                                            </div>
                                                        )}
                                                        {item.hsnCode && (
                                                            <p className="text-xs text-slate-500 mt-1">HSN: {item.hsnCode}</p>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) =>
                                                                updateLineItem(itemId, {
                                                                    quantity: parseFloat(e.target.value) || 0,
                                                                })
                                                            }
                                                            className="w-20 text-right"
                                                            min="1"
                                                            disabled={isPaid}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            value={item.unitPrice}
                                                            onChange={(e) =>
                                                                updateLineItem(itemId, {
                                                                    unitPrice: parseFloat(e.target.value) || 0,
                                                                })
                                                            }
                                                            className="w-28 text-right"
                                                            min="0"
                                                            step="0.01"
                                                            disabled={isPaid}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1">
                                                            <Input
                                                                type="number"
                                                                value={item.discountValue || ''}
                                                                onChange={(e) =>
                                                                    updateLineItem(itemId, {
                                                                        discountValue: parseFloat(e.target.value) || 0,
                                                                    })
                                                                }
                                                                className="w-24 text-right"
                                                                placeholder="0"
                                                                disabled={isPaid}
                                                            />
                                                            <Select
                                                                value={item.discountType || 'fixed'}
                                                                onValueChange={(val: 'percentage' | 'fixed') =>
                                                                    updateLineItem(itemId, { discountType: val })
                                                                }
                                                                disabled={isPaid}
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
                                                        {item.taxRate}%
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold">
                                                        ₹{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                                    </TableCell>
                                                    {!isPaid && (
                                                        <TableCell>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeLineItem(itemId)}
                                                            >
                                                                <Trash2 className="h-4 w-4 text-red-600" />
                                                            </Button>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Totals */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex justify-end">
                            <div className="w-80 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Subtotal</span>
                                    <span className="font-mono">₹{totals.subtotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                                </div>
                                {totals.totalDiscount > 0 && (
                                    <div className="flex justify-between text-sm text-red-600">
                                        <span>Discount</span>
                                        <span className="font-mono">-₹{totals.totalDiscount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Tax</span>
                                    <span className="font-mono">₹{totals.totalTax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                                </div>

                                <div className="flex items-center justify-between py-2 border-t mt-2">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="round-off"
                                            checked={formData.enableRoundOff}
                                            onCheckedChange={(c) => setFormData({ ...formData, enableRoundOff: c })}
                                            disabled={isPaid}
                                        />
                                        <Label htmlFor="round-off" className="text-xs cursor-pointer">Round Off</Label>
                                    </div>
                                    {formData.enableRoundOff && (
                                        <span className="font-mono text-xs text-slate-500">
                                            {totals.roundOff >= 0 ? '+' : ''}
                                            {totals.roundOff.toFixed(2)}
                                        </span>
                                    )}
                                </div>

                                <div className="flex justify-between text-lg font-bold border-t pt-2">
                                    <span>Total Amount</span>
                                    <span className="text-green-600 font-mono">
                                        ₹{totals.grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Notes and Terms */}
                <Card>
                    <CardHeader>
                        <CardTitle>Additional Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Add any notes..."
                                rows={2}
                                disabled={isPaid}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Terms & Conditions</Label>
                            <Textarea
                                value={formData.terms}
                                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                                placeholder="Add terms and conditions..."
                                rows={2}
                                disabled={isPaid}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Select Bank Account (for PDF)</Label>
                            <Select
                                value={formData.bankAccountId}
                                onValueChange={(val) => setFormData({ ...formData, bankAccountId: val })}
                                disabled={isPaid}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Bank Account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {bankAccounts.map((acc: any, i: number) => (
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
                {!isPaid && (
                    <div className="flex justify-end gap-4">
                        <Button variant="outline" onClick={() => router.back()}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSaving || !formData.customerId || lineItems.length === 0}
                            className="gap-2"
                        >
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                )}
            </form>
        </div>
    );
}
