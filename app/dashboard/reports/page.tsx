'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
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
} from 'recharts';
import {
  CheckCircle,
  AlertCircle,
  FileText,
  Download,
  TrendingUp,
  Calendar,
} from 'lucide-react';

const monthlyData = [
  { month: 'Jan', sales: 450000, tax: 81000, invoices: 25 },
  { month: 'Feb', sales: 620000, tax: 111600, invoices: 35 },
  { month: 'Mar', sales: 580000, tax: 104400, invoices: 30 },
  { month: 'Apr', sales: 950000, tax: 171000, invoices: 52 },
  { month: 'May', sales: 1250000, tax: 225000, invoices: 68 },
  { month: 'Jun', sales: 870000, tax: 156600, invoices: 45 },
];

const taxDetails = {
  cgst: 264750,
  sgst: 264750,
  igst: 0,
  cess: 0,
  total: 529500,
};

const gstrStatus = [
  { period: 'Jun 2024', status: 'filed', filedDate: '2024-07-10' },
  { period: 'May 2024', status: 'filed', filedDate: '2024-06-10' },
  { period: 'Apr 2024', status: 'filed', filedDate: '2024-05-10' },
  { period: 'Mar 2024', status: 'filed', filedDate: '2024-04-10' },
];

const complianceChecks = [
  { check: 'All invoices issued', status: 'passed', description: '156 invoices with proper numbering' },
  { check: 'GSTIN validation', status: 'passed', description: 'All customer GSTINs verified' },
  { check: 'Tax calculation', status: 'passed', description: 'All taxes correctly calculated' },
  { check: 'Place of supply', status: 'passed', description: '100% of B2B supplies documented' },
  { check: 'E-invoice compliance', status: 'attention', description: '8 invoices pending e-invoice generation' },
];

const reports = [
  { title: 'GSTR-1', period: 'Jun 2024', description: 'Sales summary for submission to GSTN', status: 'Available' },
  { title: 'GSTR-3B', period: 'Jun 2024', description: 'Tax reconciliation and ITC', status: 'Not Applicable' },
];

export default function ReportsPage() {
  const { token } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState('Jun');
  const [reportType, setReportType] = useState('gstr-1');
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExport = (format: string) => {
    toast.success(`Report exported as ${format.toUpperCase()}`);
  };

  const handleClearDatabase = async () => {
    if (!token) {
      toast.error('Authentication required');
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/admin/delete-tenant-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ confirmDelete: true }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Failed to clear database');
      }

      toast.success('All user data cleared successfully');
      setDeleteDialog(false);
      // Refresh page
      window.location.reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to clear database';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reports & Compliance</h1>
          <p className="text-slate-600 mt-1">GST filing, sales analysis, and compliance verification</p>
        </div>
        <Button
          variant="destructive"
          onClick={() => setDeleteDialog(true)}
          className="gap-2"
        >
          Clear All Data
        </Button>
      </div>

      {/* Report Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 items-end">
          <div className="space-y-2 flex-1">
            <Label>Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gstr-1">GSTR-1 (Outward Supplies)</SelectItem>
                <SelectItem value="sales-register">Sales Register</SelectItem>
                <SelectItem value="tax-summary">Tax Summary</SelectItem>
                <SelectItem value="compliance">Compliance Checklist</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 flex-1">
            <Label>Month</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Jan">January 2024</SelectItem>
                <SelectItem value="Feb">February 2024</SelectItem>
                <SelectItem value="Mar">March 2024</SelectItem>
                <SelectItem value="Apr">April 2024</SelectItem>
                <SelectItem value="May">May 2024</SelectItem>
                <SelectItem value="Jun">June 2024</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleExport('pdf')}
            >
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport('excel')}
            >
              <Download className="w-4 h-4 mr-2" />
              Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sales Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Sales & Tax Trend</CardTitle>
          <CardDescription>6-month revenue and tax collected</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
              <Legend />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#3b82f6"
                name="Sales Amount"
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tax Summary */}
        <Card>
          <CardHeader>
            <CardTitle>GST Collected (Jun 2024)</CardTitle>
            <CardDescription>Breakdown by component</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">CGST (9%)</span>
                <span className="text-2xl font-bold">₹{taxDetails.cgst.toLocaleString('en-IN')}</span>
              </div>
              <div className="border-b" />
              <div className="flex justify-between items-center">
                <span className="text-slate-600">SGST (9%)</span>
                <span className="text-2xl font-bold">₹{taxDetails.sgst.toLocaleString('en-IN')}</span>
              </div>
              <div className="border-b" />
              <div className="flex justify-between items-center">
                <span className="text-slate-600">IGST (18%)</span>
                <span className="text-2xl font-bold">₹{taxDetails.igst.toLocaleString('en-IN')}</span>
              </div>
              <div className="border-b" />
              <div className="flex justify-between items-center pt-2">
                <span className="font-bold">Total GST</span>
                <span className="text-2xl font-bold text-green-600">
                  ₹{taxDetails.total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GST Filing Status */}
        <Card>
          <CardHeader>
            <CardTitle>GSTR-1 Filing History</CardTitle>
            <CardDescription>Recent GST returns filed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {gstrStatus.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-semibold">{item.period}</p>
                    <p className="text-xs text-slate-500">
                      Filed on {item.filedDate}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                    <CheckCircle className="w-4 h-4" />
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Checks */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Verification</CardTitle>
          <CardDescription>Pre-filing compliance checks for GSTR-1</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {complianceChecks.map((check, idx) => (
              <div key={idx} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="pt-0.5">
                  {check.status === 'passed' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{check.check}</p>
                  <p className="text-sm text-slate-600 mt-1">{check.description}</p>
                </div>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${
                    check.status === 'passed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {check.status === 'passed' ? 'Passed' : 'Attention'}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filing Reminder */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-blue-900">
                GSTR-1 Filing Deadline: 11th of next month
              </p>
              <p className="text-sm text-blue-700 mt-1">
                File your GST returns on GSTN portal before the deadline to avoid penalties.
              </p>
              <Button
                className="mt-3 bg-transparent"
                size="sm"
                variant="outline"
              >
                Open GSTN Portal
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clear Database Confirmation Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Data</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all your business data including invoices, payments,
              customers, products, and reports? This action cannot be undone and will permanently
              remove all records associated with your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearDatabase}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Clearing...' : 'Clear All Data'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
