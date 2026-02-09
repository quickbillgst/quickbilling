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
import useSWR from 'swr';
import Link from 'next/link';

const fetcher = (url: string, token: string) =>
  fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  }).then((res) => res.json());

export default function PaymentsPage() {
  const { token } = useAuth();
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    paymentId?: string;
    invoiceNumber?: string;
  }>({ open: false });
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch real payments
  const { data, isLoading, mutate } = useSWR(
    token ? [`/api/payments/list?limit=100&status=${filterStatus}&search=${searchTerm}`, token] : null,
    ([url, t]) => fetcher(url, t)
  );

  const payments = data?.data || [];

  const totalCollected = payments
    .filter((p: any) => p.status === 'completed')
    .reduce((sum: number, p: any) => sum + (p.paymentAmount || 0), 0);

  const pendingCount = payments.filter((p: any) => p.status === 'pending').length;

  const stats = [
    {
      label: 'Total Collected',
      value: `₹${totalCollected.toLocaleString('en-IN')}`,
      icon: CreditCard,
      color: 'text-green-600',
    },
    {
      label: 'Pending Tracking',
      value: pendingCount.toString(),
      icon: Clock,
      color: 'text-orange-600',
    },
    {
      label: 'Avg Payment',
      value: `₹${payments.length ? (totalCollected / payments.length).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0'}`,
      icon: TrendingUp,
      color: 'text-blue-600',
    },
    {
      label: 'Total Records',
      value: payments.length.toString(),
      icon: CheckCircle,
      color: 'text-indigo-600',
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
      net_banking: '💻',
      upi: '📱',
      cash: '💵',
      card: '💳',
      cheque: '🧾',
      emi: '🕒',
      tds: '🏛️'
    };
    return icons[method] || '💰';
  };

  // Filtered logic moved to SWR URL params where possible, 
  // but we can still do local filtering for immediate feedback if needed.
  // const filtered = payments; 

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    // Integrated in Invoices page as per requirement, but this form could be reactive too
    toast.info('Please record payments directly from the Invoices page.');
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

      mutate();
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
        <Link href="/dashboard/invoices">
          <Button className="gap-2">
            <CreditCard className="w-5 h-5" />
            Record Payment
          </Button>
        </Link>
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

      {/* Form removed as it's now in Invoices dialog, but keep space if needed */}

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
                {payments.length > 0 ? (
                  payments.map((payment: any) => (
                    <TableRow key={payment._id}>
                      <TableCell className="font-mono font-semibold">
                        {payment.invoiceId?.invoiceNumber || 'N/A'}
                      </TableCell>
                      <TableCell>{payment.invoiceId?.customerId?.name || 'N/A'}</TableCell>
                      <TableCell className="text-right font-mono">
                        ₹{payment.paymentAmount?.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <span>{getMethodIcon(payment.paymentMethod)}</span>
                          <span className="capitalize">{payment.paymentMethod?.replace('_', ' ')}</span>
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs max-w-[120px] truncate">
                        {payment.paymentReferenceId || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
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
                              paymentId: payment._id,
                              invoiceNumber: payment.invoiceId?.invoiceNumber,
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
                      {isLoading ? 'Loading payments...' : 'No payments found matching your criteria'}
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
