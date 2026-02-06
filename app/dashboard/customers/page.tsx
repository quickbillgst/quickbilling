'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
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

export default function CustomersPage() {
  const { token } = useAuth();
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [limit] = useState(50);

  const { data, isLoading } = useSWR(
    token ? [
      `/api/customers?limit=${limit}&offset=${offset}${search ? `&search=${search}` : ''}`,
      token
    ] : null,
    ([url, token]) => fetcher(url, token)
  );

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
          <p className="text-slate-600 mt-1">Manage your customer list</p>
        </div>
        <Link href="/dashboard/customers/new">
          <Button className="gap-2">
            <Plus className="w-5 h-5" />
            Add Customer
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <Search className="w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search by name, email, or GSTIN..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setOffset(0);
              }}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : data?.data && data.data.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>GSTIN</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>GST Registered</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((customer: any) => (
                    <TableRow key={customer._id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell className="text-sm">{customer.email || '-'}</TableCell>
                      <TableCell className="text-sm">{customer.phone || '-'}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {customer.gstin || '-'}
                      </TableCell>
                      <TableCell className="text-sm capitalize">
                        {customer.customerType}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          customer.gstRegistered
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {customer.gstRegistered ? 'Yes' : 'No'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {customer.billingAddress?.state || '-'}
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/customers/${customer._id}`}>
                          <Button variant="ghost" size="sm">
                            Edit
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
              <p className="text-slate-600">No customers found</p>
              <Link href="/dashboard/customers/new">
                <Button className="mt-4">Add your first customer</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data?.pagination && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-slate-600">
            Showing {offset + 1} to {Math.min(offset + limit, data.pagination.total)} of {data.pagination.total} customers
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
