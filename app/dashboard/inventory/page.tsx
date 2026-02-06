'use client';

import React from "react"

import { useState } from 'react';
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
import { AlertCircle, Package, TrendingDown, Plus, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

// Mock inventory data
const mockInventory = [
  {
    id: 'prod_001',
    sku: 'PROD-001',
    name: 'Wheat Flour',
    hsn: '1101',
    currentStock: 245,
    reorderPoint: 50,
    maxStock: 500,
    warehouseLocation: 'A-12-3',
    lastUpdated: '2024-02-03',
    status: 'optimal',
  },
  {
    id: 'prod_002',
    sku: 'PROD-002',
    name: 'Rice (Premium)',
    hsn: '1006',
    currentStock: 38,
    reorderPoint: 100,
    maxStock: 400,
    warehouseLocation: 'B-05-1',
    lastUpdated: '2024-02-02',
    status: 'low',
  },
  {
    id: 'prod_003',
    sku: 'PROD-003',
    name: 'Sugar',
    hsn: '1701',
    currentStock: 650,
    reorderPoint: 200,
    maxStock: 800,
    warehouseLocation: 'C-08-4',
    lastUpdated: '2024-02-03',
    status: 'optimal',
  },
  {
    id: 'prod_004',
    sku: 'PROD-004',
    name: 'Cooking Oil',
    hsn: '1511',
    currentStock: 12,
    reorderPoint: 50,
    maxStock: 200,
    warehouseLocation: 'D-02-2',
    lastUpdated: '2024-02-01',
    status: 'critical',
  },
  {
    id: 'prod_005',
    sku: 'PROD-005',
    name: 'Spices Mix',
    hsn: '0910',
    currentStock: 185,
    reorderPoint: 100,
    maxStock: 300,
    warehouseLocation: 'A-15-5',
    lastUpdated: '2024-02-03',
    status: 'optimal',
  },
];

export default function InventoryPage() {
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const stats = [
    {
      label: 'Total SKUs',
      value: '5',
      icon: Package,
      color: 'text-blue-600',
    },
    {
      label: 'Low Stock Items',
      value: '1',
      icon: AlertCircle,
      color: 'text-orange-600',
    },
    {
      label: 'Critical Items',
      value: '1',
      icon: TrendingDown,
      color: 'text-red-600',
    },
    {
      label: 'Total Value (₹)',
      value: '₹3,24,500',
      icon: Package,
      color: 'text-green-600',
    },
  ];

  const getStockStatus = (current: number, reorder: number, max: number) => {
    if (current <= reorder) {
      return 'critical';
    }
    if (current <= reorder * 1.5) {
      return 'low';
    }
    if (current > max * 0.9) {
      return 'overstock';
    }
    return 'optimal';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal':
        return 'bg-green-100 text-green-800';
      case 'low':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'overstock':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filtered = mockInventory.filter((item) => {
    const matchStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchSearch =
      searchTerm === '' ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Inventory adjusted successfully!');
    setShowAdjustmentForm(false);
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-slate-600 mt-1">
            Track stock levels and manage warehouse inventory
          </p>
        </div>
        <Button
          onClick={() => setShowAdjustmentForm(!showAdjustmentForm)}
          className="gap-2"
        >
          <Plus className="w-5 h-5" />
          Adjust Stock
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

      {/* Stock Adjustment Form */}
      {showAdjustmentForm && (
        <Card>
          <CardHeader>
            <CardTitle>Adjust Stock</CardTitle>
            <CardDescription>Record inventory addition or deduction</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdjustment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Product</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockInventory.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} ({item.sku})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Adjustment Type</Label>
                  <Select defaultValue="add">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="add">Add to Stock</SelectItem>
                      <SelectItem value="remove">Remove from Stock</SelectItem>
                      <SelectItem value="return">Customer Return</SelectItem>
                      <SelectItem value="damage">Damage/Loss</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input type="number" placeholder="0" min="0" />
                </div>

                <div className="space-y-2">
                  <Label>Warehouse Location</Label>
                  <Input placeholder="e.g., A-12-3" type="text" />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Reason/Notes</Label>
                  <Input
                    placeholder="e.g., Purchase from supplier"
                    type="text"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAdjustmentForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Record Adjustment</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Inventory Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Stock Levels</CardTitle>
            <CardDescription>Real-time inventory status</CardDescription>
          </div>
          <div className="flex gap-2 items-center">
            <Input
              type="text"
              placeholder="Search product or SKU..."
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
                <SelectItem value="optimal">Optimal</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Current</TableHead>
                  <TableHead className="text-right">Reorder</TableHead>
                  <TableHead className="text-right">Max</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length > 0 ? (
                  filtered.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {item.currentStock}
                      </TableCell>
                      <TableCell className="text-right text-slate-600">
                        {item.reorderPoint}
                      </TableCell>
                      <TableCell className="text-right text-slate-600">
                        {item.maxStock}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {item.warehouseLocation}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(item.status)}`}
                        >
                          {item.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                      No inventory items found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Stock Alerts */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-900">Stock Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockInventory
            .filter((item) => item.status === 'critical' || item.status === 'low')
            .map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div>
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <p className="text-sm text-slate-600">
                    Current: {item.currentStock} | Reorder: {item.reorderPoint}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Create PO
                </Button>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
