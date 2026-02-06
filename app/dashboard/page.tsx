'use client';

import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

// Empty data - will be populated from API
const monthlyData = [];
const taxBreakdown = [];
const recentInvoices = [];
const stats = [
  { label: 'Total Invoices', value: '0', change: '0%', color: 'blue' },
  { label: 'Monthly Revenue', value: '₹0', change: '0%', color: 'green' },
  { label: 'Tax Collected', value: '₹0', change: '0%', color: 'orange' },
  { label: 'Pending Payments', value: '₹0', change: '0%', color: 'red' },
];

const statusBgColor: Record<string, string> = {
  paid: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  draft: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function DashboardPage() {
  const router = useRouter();
  const { tenant } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-2">
          Welcome back, {tenant?.businessName || 'User'}! Here's your GST billing overview.
        </p>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, idx) => (
          <Card key={idx}>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-slate-600 text-sm font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className={`text-xs font-semibold ${stat.color === 'green' ? 'text-green-600' : stat.color === 'red' ? 'text-red-600' : 'text-slate-600'}`}>
                  {stat.change}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Revenue & Tax Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue & Tax Trend</CardTitle>
            <CardDescription>Monthly invoiced amount and tax collected</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${value}`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#3b82f6"
                  name="Invoice Amount"
                />
                <Line
                  type="monotone"
                  dataKey="tax"
                  stroke="#10b981"
                  name="Tax Collected"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tax Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Tax Breakdown</CardTitle>
            <CardDescription>CGST vs SGST vs IGST</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={taxBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ₹${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {taxBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Count & Tax Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Count by Month</CardTitle>
            <CardDescription>Number of invoices created</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="invoices" fill="#8b5cf6" name="Invoices" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>Last 4 invoices created</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/invoices')}
            >
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{invoice.number}</p>
                    <p className="text-sm text-slate-600">{invoice.customer}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-mono font-semibold text-slate-900">
                      ₹{invoice.amount.toLocaleString('en-IN')}
                    </p>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBgColor[invoice.status as keyof typeof statusBgColor]}`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and workflows</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="w-full h-24 flex flex-col items-center justify-center gap-2 bg-transparent"
              onClick={() => router.push('/dashboard/invoices/new')}
            >
              <span className="text-2xl">📄</span>
              <span>Create Invoice</span>
            </Button>
            <Button
              variant="outline"
              className="w-full h-24 flex flex-col items-center justify-center gap-2 bg-transparent"
              onClick={() => router.push('/dashboard/customers')}
            >
              <span className="text-2xl">👥</span>
              <span>Manage Customers</span>
            </Button>
            <Button
              variant="outline"
              className="w-full h-24 flex flex-col items-center justify-center gap-2 bg-transparent"
              onClick={() => router.push('/dashboard/reports')}
            >
              <span className="text-2xl">📊</span>
              <span>View Reports</span>
            </Button>
            <Button
              variant="outline"
              className="w-full h-24 flex flex-col items-center justify-center gap-2 bg-transparent"
              onClick={() => router.push('/dashboard/settings')}
            >
              <span className="text-2xl">⚙️</span>
              <span>Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feature Showcase */}
      <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle>✨ Key Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: 'Automatic GST Calculation',
                desc: 'CGST/SGST for intra-state and IGST for inter-state',
              },
              {
                title: 'Multiple Tax Rates',
                desc: 'Support for 0%, 5%, 12%, 18%, 28% tax rates',
              },
              {
                title: 'Compliance Ready',
                desc: 'Generate E-invoices and IRN for GST compliance',
              },
              {
                title: 'Discount Management',
                desc: 'Flexible discount handling (fixed or percentage)',
              },
              {
                title: 'Multi-State Transactions',
                desc: 'Automatic tax calculation based on location',
              },
              {
                title: 'Detailed Reports',
                desc: 'GST liability reports and audit trails',
              },
            ].map((feature, idx) => (
              <div key={idx} className="p-4 bg-white rounded-lg border border-blue-100">
                <p className="font-semibold text-slate-900">{feature.title}</p>
                <p className="text-sm text-slate-600 mt-1">{feature.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
