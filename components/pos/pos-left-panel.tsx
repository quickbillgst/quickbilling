'use client';

import { usePOS } from '@/lib/context/pos-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Barcode } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useBarcodeScanner } from '@/lib/hooks/useKeyboardShortcuts';

// Mock products for demo
const DEMO_PRODUCTS = [
  {
    id: '1',
    tenantId: 'demo',
    barcode: '8901234567890',
    name: 'Sugar 1kg',
    unitPrice: 45,
    taxRate: 5,
    category: 'Groceries',
  },
  {
    id: '2',
    tenantId: 'demo',
    barcode: '8901234567891',
    name: 'Rice 2kg',
    unitPrice: 120,
    taxRate: 5,
    category: 'Groceries',
  },
  {
    id: '3',
    tenantId: 'demo',
    barcode: '8901234567892',
    name: 'Wheat Flour 1kg',
    unitPrice: 35,
    taxRate: 5,
    category: 'Groceries',
  },
  {
    id: '4',
    tenantId: 'demo',
    barcode: '8901234567893',
    name: 'Oil 500ml',
    unitPrice: 95,
    taxRate: 5,
    category: 'Oils',
  },
  {
    id: '5',
    tenantId: 'demo',
    barcode: '8901234567894',
    name: 'Milk 1L',
    unitPrice: 60,
    taxRate: 5,
    category: 'Dairy',
  },
  {
    id: '6',
    tenantId: 'demo',
    barcode: '8901234567895',
    name: 'Bread 400g',
    unitPrice: 40,
    taxRate: 5,
    category: 'Bakery',
  },
];

export default function POSLeftPanel() {
  const { state, addLineItem, showNotification } = usePOS();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentProducts, setRecentProducts] = useState<typeof DEMO_PRODUCTS>([]);

  useEffect(() => {
    // Initialize recent products
    setRecentProducts(DEMO_PRODUCTS.slice(0, 3));
  }, []);

  // Handle barcode scans
  useBarcodeScanner((barcode) => {
    const product = DEMO_PRODUCTS.find((p) => p.barcode === barcode);
    if (product) {
      addLineItem(product, 1);
      showNotification('success', `Scanned: ${product.name}`);
      // Add to recent
      setRecentProducts((prev) => [
        product,
        ...prev.filter((p) => p.id !== product.id),
      ].slice(0, 5));
    } else {
      showNotification('error', `Product not found: ${barcode}`);
    }
  });

  const filteredProducts = DEMO_PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayProducts = searchQuery ? filteredProducts : recentProducts;

  return (
    <div className="p-4 space-y-4 h-full flex flex-col">
      {/* Search Input */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-600">
          Quick Search / Barcode
        </label>
        <div className="relative">
          <Input
            placeholder="Scan barcode or search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            className="pl-9"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>
        <p className="text-xs text-slate-500">Press F2 to focus • Enter barcode</p>
      </div>

      {/* Categories */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-600">Categories</label>
        <div className="flex flex-wrap gap-1">
          {['All', 'Groceries', 'Oils', 'Dairy', 'Bakery'].map((category) => (
            <Badge
              key={category}
              variant={
                category === 'All' || searchQuery === category.toLowerCase()
                  ? 'default'
                  : 'outline'
              }
              className="cursor-pointer text-xs"
              onClick={() =>
                setSearchQuery(category === 'All' ? '' : category.toLowerCase())
              }
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>

      {/* Products List */}
      <div className="space-y-2 flex-1 overflow-y-auto">
        <label className="text-xs font-semibold text-slate-600">
          {searchQuery ? 'Search Results' : 'Recent Products'}
        </label>

        {displayProducts.length > 0 ? (
          <div className="space-y-1">
            {displayProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => {
                  addLineItem(product, 1);
                  setSearchQuery('');
                }}
                className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-colors group"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {product.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {product.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">
                      ₹{product.unitPrice}
                    </p>
                    <p className="text-xs text-slate-500">
                      {product.taxRate}% tax
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  {product.barcode}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Barcode className="w-12 h-12 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No products found</p>
          </div>
        )}
      </div>
    </div>
  );
}
