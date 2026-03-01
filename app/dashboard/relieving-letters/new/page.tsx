'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    ArrowLeft,
    User,
    Building2,
    Calendar,
    FileCheck,
    Save,
    Loader2,
    PenTool,
    UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function NewRelievingLetterPage() {
    const router = useRouter();
    const { token } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [employees, setEmployees] = useState<any[]>([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await fetch('/api/employees?all=true', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (res.ok) setEmployees(data.employees || []);
            } catch (e) { /* ignore */ }
        };
        if (token) fetchEmployees();
    }, [token]);

    const handleEmployeeSelect = (empId: string) => {
        setSelectedEmployeeId(empId);
        const emp = employees.find((e: any) => e._id === empId);
        if (!emp) return;
        setFormData(prev => ({
            ...prev,
            employeeName: emp.employeeName || '',
            employeeId: emp.employeeId || '',
            designation: emp.designation || '',
            department: emp.department || '',
            dateOfJoining: emp.dateOfJoining ? emp.dateOfJoining.slice(0, 10) : '',
            lastWorkingDate: emp.lastWorkingDate ? emp.lastWorkingDate.slice(0, 10) : '',
        }));
        toast.success(`Loaded details for ${emp.employeeName}`);
    };

    const [formData, setFormData] = useState({
        employeeName: '',
        employeeId: '',
        designation: '',
        department: '',
        dateOfJoining: '',
        lastWorkingDate: '',
        relievingDate: new Date().toISOString().split('T')[0],
        signatoryName: '',
        signatoryDesignation: '',
        remarks: '',
    });

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.employeeName || !formData.dateOfJoining || !formData.lastWorkingDate || !formData.relievingDate) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch('/api/relieving-letters', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create relieving letter');
            }

            toast.success('Relieving letter created successfully!');

            // Open PDF in new tab
            if (data.letter?._id) {
                window.open(`/api/relieving-letters/${data.letter._id}/pdf?token=${token}`, '_blank');
            }

            router.push('/dashboard/relieving-letters');
        } catch (error: any) {
            toast.error(error.message || 'Failed to create relieving letter');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/relieving-letters">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Create Relieving Letter</h1>
                    <p className="text-gray-500">Fill in the details to generate a professional relieving letter</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Employee Picker */}
                {employees.length > 0 && (
                    <Card className="border-blue-200 bg-blue-50/50">
                        <CardContent className="pt-4 pb-4">
                            <div className="flex items-center gap-3">
                                <UserCheck className="h-5 w-5 text-blue-600" />
                                <div className="flex-1">
                                    <Label className="text-sm font-medium text-blue-800">Quick Fill from Employee</Label>
                                    <Select value={selectedEmployeeId} onValueChange={handleEmployeeSelect}>
                                        <SelectTrigger className="mt-1 bg-white">
                                            <SelectValue placeholder="Select an employee to auto-fill details..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {employees.map((emp: any) => (
                                                <SelectItem key={emp._id} value={emp._id}>
                                                    {emp.employeeName} {emp.employeeId ? `(${emp.employeeId})` : ''} {emp.designation ? `— ${emp.designation}` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Employee Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <User className="h-5 w-5 text-blue-600" />
                            Employee Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="employeeName">Employee Name <span className="text-red-500">*</span></Label>
                            <Input
                                id="employeeName"
                                placeholder="e.g. Rahul Sharma"
                                value={formData.employeeName}
                                onChange={(e) => updateField('employeeName', e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="employeeId">Employee ID</Label>
                            <Input
                                id="employeeId"
                                placeholder="e.g. EMP-001"
                                value={formData.employeeId}
                                onChange={(e) => updateField('employeeId', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="designation">Designation</Label>
                            <Input
                                id="designation"
                                placeholder="e.g. Senior Software Engineer"
                                value={formData.designation}
                                onChange={(e) => updateField('designation', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="department">Department</Label>
                            <Input
                                id="department"
                                placeholder="e.g. Engineering"
                                value={formData.department}
                                onChange={(e) => updateField('department', e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Date Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Calendar className="h-5 w-5 text-green-600" />
                            Date Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="dateOfJoining">Date of Joining <span className="text-red-500">*</span></Label>
                            <Input
                                id="dateOfJoining"
                                type="date"
                                value={formData.dateOfJoining}
                                onChange={(e) => updateField('dateOfJoining', e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastWorkingDate">Last Working Date <span className="text-red-500">*</span></Label>
                            <Input
                                id="lastWorkingDate"
                                type="date"
                                value={formData.lastWorkingDate}
                                onChange={(e) => updateField('lastWorkingDate', e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="relievingDate">Relieving Date (Letter Issue Date) <span className="text-red-500">*</span></Label>
                            <Input
                                id="relievingDate"
                                type="date"
                                value={formData.relievingDate}
                                onChange={(e) => updateField('relievingDate', e.target.value)}
                                required
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Company Signatory */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <PenTool className="h-5 w-5 text-purple-600" />
                            Company Signatory
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="signatoryName">Signatory Name</Label>
                            <Input
                                id="signatoryName"
                                placeholder="e.g. Priya Patel"
                                value={formData.signatoryName}
                                onChange={(e) => updateField('signatoryName', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="signatoryDesignation">Signatory Designation</Label>
                            <Input
                                id="signatoryDesignation"
                                placeholder="e.g. HR Manager"
                                value={formData.signatoryDesignation}
                                onChange={(e) => updateField('signatoryDesignation', e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Remarks */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <FileCheck className="h-5 w-5 text-orange-600" />
                            Additional Notes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="remarks">Remarks (optional)</Label>
                            <Textarea
                                id="remarks"
                                placeholder="Any additional remarks to include in the letter..."
                                rows={3}
                                value={formData.remarks}
                                onChange={(e) => updateField('remarks', e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Submit */}
                <div className="flex justify-end gap-4">
                    <Link href="/dashboard/relieving-letters">
                        <Button type="button" variant="outline">Cancel</Button>
                    </Link>
                    <Button type="submit" disabled={isLoading} className="gap-2">
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                Generate Relieving Letter
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
