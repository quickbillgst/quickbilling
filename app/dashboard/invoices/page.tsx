'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Search, Filter, Download } from 'lucide-react';
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

const fetcher = (url: string, token: string) =>
  fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  }).then((res) => res.json());

export default function InvoicesPage() {
  const { token } = useAuth();
  const [status, setStatus] = useState<string>('all_status');
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  const { data, isLoading, error } = useSWR(
    token ? [
      `/api/invoices?limit=${limit}&offset=${offset}${status && status !== 'all_status' ? `&status=${status}` : ''}`,
      token
    ] : null,
    ([url, token]) => fetcher(url, token)
  );

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
                        <Link href={`/dashboard/invoices/${invoice._id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
