'use client';

import React from "react"

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CreditCard, TrendingUp, AlertCircle, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// Mock payment data
const mockPayments = [
  {
    id: 'pay_001',
    invoiceNumber: 'INV-00124',
    customer: 'ABC Traders',
    amount: 45000,
    status: 'completed',
    method: 'bank_transfer',
    date: '2024-02-03',
    reference: 'NEFT-001',
  },
  {
    id: 'pay_002',
    invoiceNumber: 'INV-00123',
    customer: 'XYZ Manufacturing',
    amount: 31000,
    status: 'pending',
    method: 'upi',
    date: '2024-02-02',
    reference: 'UPI-00456789',
  },
  {
    id: 'pay_003',
    invoiceNumber: 'INV-00122',
    customer: 'Local Retailer',
    amount: 28000,
    status: 'completed',
    method: 'cash',
    date: '2024-02-01',
    reference: 'CASH-001',
  },
  {
    id: 'pay_004',
    invoiceNumber: 'INV-00121',
    customer: 'DEF Services',
    amount: 18500,
    status: 'completed',
    method: 'card',
    date: '2024-01-31',
    reference: 'CARD-9876',
  },
  {
    id: 'pay_005',
    invoiceNumber: 'INV-00120',
    customer: 'GHI Traders',
    amount: 55000,
    status: 'pending',
    method: 'cheque',
    date: '2024-01-30',
    reference: 'CHQ-5678',
  },
];

export default function PaymentsPage() {
  const { token } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    paymentId?: string;
    invoiceNumber?: string;
  }>({ open: false });
  const [isDeleting, setIsDeleting] = useState(false);

  const stats = [
    {
      label: 'Total Collected',
      value: '₹1,46,500',
      icon: CreditCard,
      color: 'text-green-600',
    },
    {
      label: 'Pending Payments',
      value: '₹86,000',
      icon: Clock,
      color: 'text-orange-600',
    },
    {
      label: 'Success Rate',
      value: '98.5%',
      icon: TrendingUp,
      color: 'text-blue-600',
    },
    {
      label: 'Failed Payments',
      value: '0',
      icon: AlertCircle,
      color: 'text-red-600',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodIcon = (method: string) => {
    const icons: Record<string, string> = {
      bank_transfer: '🏦',
      upi: '📱',
      cash: '💵',
      card: '💳',
      cheque: '🧾',
    };
    return icons[method] || '💰';
  };

  const filtered = mockPayments.filter((payment) => {
    const matchStatus = filterStatus === 'all' || payment.status === filterStatus;
    const matchSearch =
      searchTerm === '' ||
      payment.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.customer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Payment recorded successfully!');
    setShowForm(false);
  };

  const handleDeletePayment = async () => {
    if (!deleteDialog.paymentId || !token) {
      toast.error('Authentication required');
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/payments/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentId: deleteDialog.paymentId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Failed to delete payment');
      }

      toast.success(`Payment ${deleteDialog.invoiceNumber} deleted successfully`);
      setDeleteDialog({ open: false });
      // Refresh page data
      window.location.reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete payment';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Payments</h1>
          <p className="text-slate-600 mt-1">
            Track and manage customer payments and reconciliation
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="gap-2"
        >
          <CreditCard className="w-5 h-5" />
          Record Payment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {stat.label}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Record Payment Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Record New Payment</CardTitle>
            <CardDescription>Add a payment against an invoice</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Invoice Number</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select invoice" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockPayments.map((p) => (
                        <SelectItem
                          key={p.id}
                          value={p.invoiceNumber}
                        >
                          {p.invoiceNumber} - {p.customer}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input type="number" placeholder="0.00" min="0" />
                </div>

                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Payment Date</Label>
                  <Input type="date" />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Reference Number</Label>
                  <Input
                    placeholder="NEFT/UPI/Cheque reference"
                    type="text"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Record Payment</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Payments Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>All recorded payments and status</CardDescription>
          </div>
          <div className="flex gap-2 items-center">
            <Input
              type="text"
              placeholder="Search invoice or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length > 0 ? (
                  filtered.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono font-semibold">
                        {payment.invoiceNumber}
                      </TableCell>
                      <TableCell>{payment.customer}</TableCell>
                      <TableCell className="text-right font-mono">
                        ₹{payment.amount.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>
                        {getMethodIcon(payment.method)} {payment.method}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {payment.reference}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {payment.date}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(payment.status)}`}
                        >
                          {payment.status === 'completed' && (
                            <CheckCircle className="w-3 h-3" />
                          )}
                          {payment.status === 'pending' && (
                            <Clock className="w-3 h-3" />
                          )}
                          {payment.status === 'failed' && (
                            <AlertCircle className="w-3 h-3" />
                          )}
                          {payment.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setDeleteDialog({
                              open: true,
                              paymentId: payment.id,
                              invoiceNumber: payment.invoiceNumber,
                            })
                          }
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                      No payments found matching your criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the payment for invoice{' '}
              <strong>{deleteDialog.invoiceNumber}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePayment}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
