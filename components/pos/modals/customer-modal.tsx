'use client';

import { usePOS } from '@/lib/context/pos-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, User } from 'lucide-react';
import { useState } from 'react';

// Mock customers
const DEMO_CUSTOMERS = [
  {
    id: '1',
    tenantId: 'demo',
    name: 'ABC Traders',
    phone: '9876543210',
    gstin: '27AABCT1234C1Z5',
    address: 'Hyderabad',
    city: 'Hyderabad',
    state: 'TG',
    totalPurchases: 45000,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    tenantId: 'demo',
    name: 'XYZ Retail',
    phone: '9876543211',
    gstin: '27XYZRT5678R2Z9',
    address: 'Mumbai',
    city: 'Mumbai',
    state: 'MH',
    totalPurchases: 32000,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    tenantId: 'demo',
    name: 'Local Vendor',
    phone: '9876543212',
    gstin: '',
    address: 'Bangalore',
    city: 'Bangalore',
    state: 'KA',
    totalPurchases: 15000,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function CustomerModal() {
  const { closeModal, setCustomer, currentCustomer } = usePOS();
  const [searchQuery, setSearchQuery] = useState('');
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    gstin: '',
  });

  const filteredCustomers = DEMO_CUSTOMERS.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.gstin.includes(searchQuery)
  );

  return (
    <Dialog open onOpenChange={closeModal}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select or Add Customer</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">Find Customer</TabsTrigger>
            <TabsTrigger value="new">New Customer</TabsTrigger>
          </TabsList>

          {/* Search Customers */}
          <TabsContent value="search" className="space-y-4">
            <div className="relative">
              <Input
                placeholder="Search by name, phone, or GSTIN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>

            {currentCustomer && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-900">
                    Current Customer: {currentCustomer.name}
                  </p>
                  <p className="text-sm text-blue-700">{currentCustomer.phone}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCustomer({} as any);
                    closeModal();
                  }}
                >
                  Clear
                </Button>
              </div>
            )}

            <div className="space-y-2">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => {
                      setCustomer(customer);
                      closeModal();
                    }}
                    className="w-full text-left p-4 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-slate-900">
                          {customer.name}
                        </p>
                        <p className="text-sm text-slate-600">
                          {customer.phone}
                        </p>
                        {customer.gstin && (
                          <p className="text-xs text-slate-500">
                            GSTIN: {customer.gstin}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">
                          ₹{customer.totalPurchases.toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-slate-500">Total</p>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <User className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                  <p>No customers found</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* New Customer */}
          <TabsContent value="new" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Customer Name *</Label>
                <Input
                  placeholder="e.g., ABC Traders"
                  value={newCustomer.name}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, name: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Phone Number</Label>
                <Input
                  placeholder="10 digit number"
                  value={newCustomer.phone}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, phone: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>GSTIN</Label>
                <Input
                  placeholder="Optional"
                  value={newCustomer.gstin}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, gstin: e.target.value })
                  }
                />
              </div>

              <Button
                className="w-full"
                disabled={!newCustomer.name}
                onClick={() => {
                  // In production, create customer via API
                  console.log('[v0] Creating customer:', newCustomer);
                  closeModal();
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Customer
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
