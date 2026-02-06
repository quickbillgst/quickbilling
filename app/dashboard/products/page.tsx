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
      <Card>
        <CardHeader>
          <CardTitle>Product List</CardTitle>
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
                    <TableHead>SKU</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>HSN/SAC Code</TableHead>
                    <TableHead className="text-right">Cost Price</TableHead>
                    <TableHead className="text-right">Selling Price</TableHead>
                    <TableHead>Tax Rate</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((product: any) => (
                    <TableRow key={product._id}>
                      <TableCell className="font-mono font-medium">{product.sku}</TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-sm">{product.hsnCode || product.sacCode || '-'}</TableCell>
                      <TableCell className="text-right font-mono">
                        {product.costPrice ? `₹${product.costPrice}` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        ₹{product.sellingPrice}
                      </TableCell>
                      <TableCell className="text-sm">
                        {product.gstRate}%
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/products/${product._id}`}>
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
              <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No products found</p>
              <Link href="/dashboard/products/new">
                <Button className="mt-4">Add your first product</Button>
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
