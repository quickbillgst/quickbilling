'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Plus, Search, Package } from 'lucide-react';
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

export default function ProductsPage() {
  const { token } = useAuth();
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [limit] = useState(50);

  const { data, isLoading } = useSWR(
    token ? [
      `/api/products?limit=${limit}&offset=${offset}${search ? `&search=${search}` : ''}`,
      token
    ] : null,
    ([url, token]) => fetcher(url, token)
  );

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Products</h1>
          <p className="text-slate-600 mt-1">Manage your product catalog</p>
        </div>
        <Link href="/dashboard/products/new">
          <Button className="gap-2">
            <Plus className="w-5 h-5" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <Search className="w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search by product name, SKU, or barcode..."
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

      {/* Products Table */}
      <Card className="border-none shadow-lg bg-white/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="border-b bg-slate-50/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-slate-800">Product Inventory</CardTitle>
            <div className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
              {data?.pagination?.total || 0} Total Items
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="h-10 w-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              <p className="text-slate-500 font-medium animate-pulse">Loading products...</p>
            </div>
          ) : data?.data && data.data.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[100px] font-semibold text-slate-700">SKU</TableHead>
                    <TableHead className="min-w-[200px] font-semibold text-slate-700">Name & Type</TableHead>
                    <TableHead className="font-semibold text-slate-700">HSN/SAC</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Selling Price</TableHead>
                    <TableHead className="font-semibold text-slate-700">Tax</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Status</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700 px-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((product: any) => {
                    const taxRate = product.gstRate || 0;
                    const basePrice = product.sellingPrice || 0;
                    const finalPrice = basePrice * (1 + taxRate / 100);
                    const margin = product.costPrice > 0 ? ((basePrice - product.costPrice) / basePrice) * 100 : null;
                    const isActive = product.isActive !== false;

                    return (
                      <TableRow key={product._id} className="group transition-colors hover:bg-slate-50/80">
                        <TableCell className="py-4 font-mono font-medium text-xs">
                          {product.sku}
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 leading-none">
                              {product.name}
                            </span>
                            <div className="flex items-center gap-2 mt-2">
                              {product.isService ? (
                                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                                  Service
                                </span>
                              ) : (
                                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                                  Product
                                </span>
                              )}
                              {margin !== null && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${margin >= 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                  {margin.toFixed(0)}% Margin
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-sm text-slate-500 font-medium tracking-tight">
                          {product.hsnCode || product.sacCode || '—'}
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-mono font-bold text-slate-900">
                              ₹{finalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              Base: ₹{basePrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                            {taxRate}%
                          </span>
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          <div className="flex justify-end">
                            {isActive ? (
                              <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-[10px] font-bold uppercase tracking-tight">Active</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-slate-400 bg-slate-50 px-2 py-1 rounded-full border border-slate-200">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                <span className="text-[10px] font-bold uppercase tracking-tight">Inactive</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-right px-6">
                          <Link href={`/dashboard/products/${product._id}`}>
                            <Button variant="outline" size="sm" className="h-8 border-slate-200 hover:border-primary hover:text-primary transition-all font-bold text-xs uppercase tracking-wider">
                              Edit Details
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-24 bg-slate-50/50">
              <div className="bg-white p-6 rounded-full inline-block shadow-sm mb-4">
                <Package className="w-12 h-12 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No products found</h3>
              <p className="text-slate-500 mb-6 font-medium">Get started by creating your first product or service.</p>
              <Link href="/dashboard/products/new">
                <Button className="shadow-lg shadow-primary/20 hover:scale-105 transition-transform px-8">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data?.pagination && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-slate-600">
            Showing {offset + 1} to {Math.min(offset + limit, data.pagination.total)} of {data.pagination.total} products
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
