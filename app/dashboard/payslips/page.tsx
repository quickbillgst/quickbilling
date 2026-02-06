'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Plus,
    Search,
    FileText,
    Download,
    Trash2,
    Eye,
    IndianRupee,
    Users,
    Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

const fetcher = async (url: string, token: string) => {
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
};

export default function PayslipsPage() {
    const { token } = useAuth();
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);

    const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(status && { status }),
    });

    const { data, mutate, isLoading } = useSWR(
        token ? [`/api/payslips?${queryParams}`, token] : null,
        ([url, t]) => fetcher(url, t)
    );

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this payslip?')) return;

        try {
            const res = await fetch(`/api/payslips/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error('Failed to delete');

            toast.success('Payslip deleted successfully');
            mutate();
        } catch (error) {
            toast.error('Failed to delete payslip');
        }
    };

    const handleViewPDF = (id: string) => {
        window.open(`/api/payslips/${id}/pdf?token=${token}`, '_blank');
    };

    const statusColor = (status: string) => {
        switch (status) {
            case 'generated':
                return 'bg-blue-100 text-blue-700';
            case 'sent':
                return 'bg-yellow-100 text-yellow-700';
            case 'paid':
                return 'bg-green-100 text-green-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount || 0);
    };

    const payslips = data?.payslips || [];
    const pagination = data?.pagination || { total: 0, totalPages: 1 };

    // Calculate summary stats
    const totalNetPay = payslips.reduce((sum: number, p: any) => sum + (p.netPay || 0), 0);
    const uniqueEmployees = new Set(payslips.map((p: any) => p.employeeName)).size;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Payslips</h1>
                    <p className="text-gray-500">Generate and manage employee payslips</p>
                </div>
                <Link href="/dashboard/payslips/new">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create Payslip
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-100">
                                <FileText className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Payslips</p>
                                <p className="text-2xl font-bold">{pagination.total}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-green-100">
                                <IndianRupee className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Net Pay (This Page)</p>
                                <p className="text-2xl font-bold">{formatCurrency(totalNetPay)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-purple-100">
                                <Users className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Unique Employees (This Page)</p>
                                <p className="text-2xl font-bold">{uniqueEmployees}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by employee name, payslip number..."
                                className="pl-10"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="generated">Generated</SelectItem>
                                <SelectItem value="sent">Sent</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Payslips Table */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : payslips.length === 0 ? (
                        <div className="text-center p-12">
                            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">No payslips found</h3>
                            <p className="text-gray-500 mb-4">Get started by creating your first payslip</p>
                            <Link href="/dashboard/payslips/new">
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Payslip
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Payslip No.</TableHead>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Pay Period</TableHead>
                                    <TableHead>Net Pay</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payslips.map((payslip: any) => (
                                    <TableRow key={payslip._id}>
                                        <TableCell className="font-medium">{payslip.payslipNumber}</TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{payslip.employeeName}</div>
                                                <div className="text-sm text-gray-500">{payslip.designation || payslip.department}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                {payslip.payPeriod}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-semibold text-green-600">
                                            {formatCurrency(payslip.netPay)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={statusColor(payslip.status)}>
                                                {payslip.status.charAt(0).toUpperCase() + payslip.status.slice(1)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleViewPDF(payslip._id)}
                                                    title="View/Download PDF"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(payslip._id)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    <Button
                        variant="outline"
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                    >
                        Previous
                    </Button>
                    <span className="flex items-center px-4 text-sm text-gray-600">
                        Page {page} of {pagination.totalPages}
                    </span>
                    <Button
                        variant="outline"
                        disabled={page >= pagination.totalPages}
                        onClick={() => setPage(page + 1)}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}
