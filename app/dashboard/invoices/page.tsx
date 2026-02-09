'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Search, Filter, Download, Trash2, Receipt } from 'lucide-react';


const fetcher = (url: string, token: string) =>
  fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  }).then((res) => res.json());

export default function InvoicesPage() {
  const { token } = useAuth();
  const [status, setStatus] = useState<string>('all_status');
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  // Payment Recording States
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    method: 'upi',
    bankName: '',
    paymentReferenceId: '',
    notes: ''
  });

  const { data: settingsData } = useSWR(
    token ? ['/api/settings', token] : null,
    ([url, t]) => fetcher(url, t)
  );

  const bankAccounts = settingsData?.data?.bankAccounts || [];

  const { data, isLoading, error, mutate } = useSWR(
    token ? [
      `/api/invoices?limit=${limit}&offset=${offset}${status && status !== 'all_status' ? `&status=${status}` : ''}`,
      token
    ] : null,
    ([url, token]) => fetcher(url, token)
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    if (!token) return;

    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Failed to delete invoice');
        return;
      }

      toast.success('Invoice deleted successfully');
      mutate(); // Refresh the list
    } catch (error) {
      console.error('Delete error', error);
      toast.error('Failed to delete invoice');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedInvoice) return;

    if (paymentData.amount <= 0) {
      toast.error('Payment amount must be greater than zero');
      return;
    }

    const pendingAmount = selectedInvoice.totalAmount - (selectedInvoice.paidAmount || 0);
    if (paymentData.amount > pendingAmount + 1) { // Allowing minor rounding diff
      toast.error(`Payment amount ₹${paymentData.amount} exceeds pending amount ₹${pendingAmount}`);
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const res = await fetch('/api/payments/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          invoiceId: selectedInvoice._id,
          paymentAmount: paymentData.amount,
          paymentMethod: paymentData.method,
          paymentDate: paymentData.date,
          bankName: paymentData.bankName,
          paymentReferenceId: paymentData.paymentReferenceId,
          notes: paymentData.notes
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record payment');

      toast.success('Payment recorded successfully');
      setIsPaymentDialogOpen(false);
      mutate(); // Refresh invoice list
    } catch (error: any) {
      console.error('Payment recording error', error);
      toast.error(error.message);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const openPaymentDialog = (invoice: any) => {
    setSelectedInvoice(invoice);
    const pending = invoice.totalAmount - (invoice.paidAmount || 0);
    setPaymentData({
      amount: pending,
      date: new Date().toISOString().split('T')[0],
      method: 'upi',
      bankName: bankAccounts.find((b: any) => b.isDefault)?.bankName || bankAccounts[0]?.bankName || '',
      paymentReferenceId: '',
      notes: ''
    });
    setIsPaymentDialogOpen(true);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'issued':
        return 'bg-blue-100 text-blue-700';
      case 'partially_paid':
        return 'bg-yellow-100 text-yellow-700';
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Invoices</h1>
          <p className="text-slate-600 mt-1">Manage and track all your invoices</p>
        </div>
        <Link href="/dashboard/invoices/new">
          <Button className="gap-2">
            <Plus className="w-5 h-5" />
            Create Invoice
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-600">Search</label>
              <Input placeholder="Invoice number or customer..." className="mt-2" />
            </div>
            <div className="w-48">
              <label className="text-sm font-medium text-slate-600">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_status">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="issued">Issued</SelectItem>
                  <SelectItem value="partially_paid">Partially Paid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Filter className="w-4 h-4" />
              More Filters
            </Button>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              Error loading invoices
            </div>
          ) : data?.data && data.data.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right">Tax (CGST/SGST/IGST)</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((invoice: any) => (
                    <TableRow key={invoice._id}>
                      <TableCell className="font-mono font-medium">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{invoice.customerId?.name || 'N/A'}</p>
                          <p className="text-sm text-slate-500">
                            {invoice.customerId?.gstin || 'Unregistered'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        ₹{invoice.subtotalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-sm">
                          {invoice.cgstAmount > 0 && (
                            <p>CGST: ₹{invoice.cgstAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                          )}
                          {invoice.sgstAmount > 0 && (
                            <p>SGST: ₹{invoice.sgstAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                          )}
                          {invoice.igstAmount > 0 && (
                            <p>IGST: ₹{invoice.igstAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        ₹{invoice.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColor(invoice.status)}`}>
                          {invoice.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(invoice.invoiceDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Link href={`/dashboard/invoices/${invoice._id}`}>
                            <Button variant="ghost" size="sm" title="View Details">
                              View
                            </Button>
                          </Link>
                          {invoice.status !== 'paid' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 gap-1"
                              onClick={() => openPaymentDialog(invoice)}
                              title="Record Payment"
                            >
                              <Receipt className="w-4 h-4" />
                              Pay
                            </Button>
                          )}
                          <Link href={`/api/invoices/${invoice._id}/pdf?token=${token}`} target="_blank">
                            <Button variant="ghost" size="sm" className="gap-1" title="Download PDF">
                              <Download className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(invoice._id)}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Payment Dialog */}
              <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                    <DialogDescription>
                      Recording payment for Invoice {selectedInvoice?.invoiceNumber}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleRecordPayment} className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4 text-sm p-3 bg-slate-50 rounded-lg border">
                      <div>
                        <p className="text-slate-500">Total Amount</p>
                        <p className="font-bold text-slate-900">₹{selectedInvoice?.totalAmount.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-500">Amount Pending</p>
                        <p className="font-bold text-red-600">₹{(selectedInvoice?.totalAmount - (selectedInvoice?.paidAmount || 0)).toLocaleString('en-IN')}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Amount to be Recorded (₹)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={paymentData.amount}
                        onChange={e => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Payment Date</Label>
                        <Input
                          type="date"
                          value={paymentData.date}
                          onChange={e => setPaymentData({ ...paymentData, date: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Payment Type</Label>
                        <Select
                          value={paymentData.method}
                          onValueChange={val => setPaymentData({ ...paymentData, method: val })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="upi">UPI</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="net_banking">Net Banking</SelectItem>
                            <SelectItem value="cheque">Cheque</SelectItem>
                            <SelectItem value="emi">EMI</SelectItem>
                            <SelectItem value="tds">TDS</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Bank</Label>
                      <Select
                        value={paymentData.bankName}
                        onValueChange={val => setPaymentData({ ...paymentData, bankName: val })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select bank" />
                        </SelectTrigger>
                        <SelectContent>
                          {bankAccounts.length > 0 ? (
                            bankAccounts.map((acc: any, i: number) => (
                              <SelectItem key={i} value={acc.bankName}>
                                {acc.bankName} ({acc.accountNumber.slice(-4)})
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="None">No bank accounts in settings</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Payment Reference ID (Optional)</Label>
                      <Input
                        placeholder="A unique ID for each payment"
                        value={paymentData.paymentReferenceId}
                        onChange={e => setPaymentData({ ...paymentData, paymentReferenceId: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>More Details (Optional)</Label>
                      <Textarea
                        placeholder="Notes about this payment..."
                        value={paymentData.notes}
                        onChange={e => setPaymentData({ ...paymentData, notes: e.target.value })}
                      />
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={isSubmittingPayment}>
                        {isSubmittingPayment ? 'Recording...' : 'Record Payment'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-600">No invoices found</p>
              <Link href="/dashboard/invoices/new">
                <Button className="mt-4">Create your first invoice</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data?.pagination && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-slate-600">
            Showing {offset + 1} to {Math.min(offset + limit, data.pagination.total)} of {data.pagination.total} invoices
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - limit))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={!data.pagination.hasMore}
              onClick={() => setOffset(offset + limit)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
