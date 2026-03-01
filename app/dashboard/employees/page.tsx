'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import useSWR from 'swr';
import { Card, CardContent } from '@/components/ui/card';
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
    Plus,
    Search,
    Trash2,
    Pencil,
    UserCheck,
    UserX,
    Users,
    Building2,
    Briefcase,
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

export default function EmployeesPage() {
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
        token ? [`/api/employees?${queryParams}`, token] : null,
        ([url, t]) => fetcher(url, t)
    );

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this employee?')) return;

        try {
            const res = await fetch(`/api/employees/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to delete');
            toast.success('Employee deleted successfully');
            mutate();
        } catch (error) {
            toast.error('Failed to delete employee');
        }
    };

    const statusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-700';
            case 'inactive':
                return 'bg-yellow-100 text-yellow-700';
            case 'terminated':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const formatDate = (date: string) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const employees = data?.employees || [];
    const pagination = data?.pagination || { total: 0, totalPages: 1 };

    const activeCount = employees.filter((e: any) => e.status === 'active').length;
    const departments = new Set(employees.map((e: any) => e.department).filter(Boolean)).size;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
                    <p className="text-gray-500">Manage your employee directory — auto-fill details across all documents</p>
                </div>
                <Link href="/dashboard/employees/new">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Employee
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-100">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Employees</p>
                                <p className="text-2xl font-bold">{pagination.total}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-green-100">
                                <UserCheck className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Active (This Page)</p>
                                <p className="text-2xl font-bold">{activeCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-purple-100">
                                <Building2 className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Departments</p>
                                <p className="text-2xl font-bold">{departments}</p>
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
                                placeholder="Search by name, ID, department, designation..."
                                className="pl-10"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            />
                        </div>
                        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="terminated">Terminated</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : employees.length === 0 ? (
                        <div className="text-center p-12">
                            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">No employees found</h3>
                            <p className="text-gray-500 mb-4">Add your first employee to auto-fill details across payslips, letters, and certificates</p>
                            <Link href="/dashboard/employees/new">
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Employee
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Employee ID</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Date of Joining</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {employees.map((emp: any) => (
                                    <TableRow key={emp._id}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{emp.employeeName}</div>
                                                <div className="text-sm text-gray-500">{emp.designation || '-'}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">{emp.employeeId || '-'}</TableCell>
                                        <TableCell>{emp.department || '-'}</TableCell>
                                        <TableCell>{formatDate(emp.dateOfJoining)}</TableCell>
                                        <TableCell>
                                            <Badge className={statusColor(emp.status)}>
                                                {emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/dashboard/employees/${emp._id}/edit`}>
                                                    <Button variant="ghost" size="sm" title="Edit">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-700"
                                                    onClick={() => handleDelete(emp._id)}
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
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                        Previous
                    </Button>
                    <span className="flex items-center px-4 text-sm text-gray-600">
                        Page {page} of {pagination.totalPages}
                    </span>
                    <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}
