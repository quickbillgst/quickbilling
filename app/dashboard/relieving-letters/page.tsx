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
    FileText,
    Trash2,
    Eye,
    Users,
    Calendar,
    FileCheck,
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

export default function RelievingLettersPage() {
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
        token ? [`/api/relieving-letters?${queryParams}`, token] : null,
        ([url, t]) => fetcher(url, t)
    );

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this relieving letter?')) return;

        try {
            const res = await fetch(`/api/relieving-letters/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error('Failed to delete');

            toast.success('Relieving letter deleted successfully');
            mutate();
        } catch (error) {
            toast.error('Failed to delete relieving letter');
        }
    };

    const handleViewPDF = (id: string) => {
        window.open(`/api/relieving-letters/${id}/pdf?token=${token}`, '_blank');
    };

    const statusColor = (status: string) => {
        switch (status) {
            case 'generated':
                return 'bg-blue-100 text-blue-700';
            case 'sent':
                return 'bg-green-100 text-green-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const formatDate = (date: string) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const letters = data?.letters || [];
    const pagination = data?.pagination || { total: 0, totalPages: 1 };

    const uniqueEmployees = new Set(letters.map((l: any) => l.employeeName)).size;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Relieving Letters</h1>
                    <p className="text-gray-500">Generate and manage employee relieving letters</p>
                </div>
                <Link href="/dashboard/relieving-letters/new">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create Relieving Letter
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-100">
                                <FileCheck className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Letters</p>
                                <p className="text-2xl font-bold">{pagination.total}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-green-100">
                                <Users className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Employees Relieved</p>
                                <p className="text-2xl font-bold">{uniqueEmployees}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-purple-100">
                                <Calendar className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">This Month</p>
                                <p className="text-2xl font-bold">
                                    {letters.filter((l: any) => {
                                        const d = new Date(l.createdAt);
                                        const now = new Date();
                                        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                                    }).length}
                                </p>
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
                                placeholder="Search by employee name, letter number..."
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
                    ) : letters.length === 0 ? (
                        <div className="text-center p-12">
                            <FileCheck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">No relieving letters found</h3>
                            <p className="text-gray-500 mb-4">Get started by creating your first relieving letter</p>
                            <Link href="/dashboard/relieving-letters/new">
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Relieving Letter
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Letter No.</TableHead>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Date of Joining</TableHead>
                                    <TableHead>Last Working Date</TableHead>
                                    <TableHead>Relieving Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {letters.map((letter: any) => (
                                    <TableRow key={letter._id}>
                                        <TableCell className="font-medium">{letter.letterNumber}</TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{letter.employeeName}</div>
                                                <div className="text-sm text-gray-500">{letter.designation || letter.department}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{formatDate(letter.dateOfJoining)}</TableCell>
                                        <TableCell>{formatDate(letter.lastWorkingDate)}</TableCell>
                                        <TableCell>{formatDate(letter.relievingDate)}</TableCell>
                                        <TableCell>
                                            <Badge className={statusColor(letter.status)}>
                                                {letter.status.charAt(0).toUpperCase() + letter.status.slice(1)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleViewPDF(letter._id)}
                                                    title="View / Download"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-700"
                                                    onClick={() => handleDelete(letter._id)}
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
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage(p => p - 1)}
                    >
                        Previous
                    </Button>
                    <span className="flex items-center px-4 text-sm text-gray-600">
                        Page {page} of {pagination.totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= pagination.totalPages}
                        onClick={() => setPage(p => p + 1)}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}
