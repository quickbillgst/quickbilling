'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
    CreditCard,
    Calendar,
    FileText,
    Save,
    Loader2,
    IndianRupee,
    Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function EditEmployeePage() {
    const router = useRouter();
    const { id } = useParams();
    const { token } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    const [formData, setFormData] = useState({
        employeeName: '',
        employeeId: '',
        designation: '',
        department: '',
        gender: '',
        dateOfBirth: '',
        dateOfJoining: '',
        lastWorkingDate: '',
        location: '',
        costCenter: '',
        email: '',
        phone: '',
        panNumber: '',
        uan: '',
        pfNumber: '',
        esiNumber: '',
        epsNumber: '',
        bankAccountNumber: '',
        bankName: '',
        ifscCode: '',
        branchName: '',
        basicSalary: '',
        hra: '',
        conveyanceAllowance: '',
        medicalAllowance: '',
        specialAllowance: '',
        otherEarnings: '',
        institute: '',
        status: 'active',
        notes: '',
    });

    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                const res = await fetch(`/api/employees/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);

                const emp = data.employee;
                setFormData({
                    employeeName: emp.employeeName || '',
                    employeeId: emp.employeeId || '',
                    designation: emp.designation || '',
                    department: emp.department || '',
                    gender: emp.gender || '',
                    dateOfBirth: emp.dateOfBirth ? emp.dateOfBirth.slice(0, 10) : '',
                    dateOfJoining: emp.dateOfJoining ? emp.dateOfJoining.slice(0, 10) : '',
                    lastWorkingDate: emp.lastWorkingDate ? emp.lastWorkingDate.slice(0, 10) : '',
                    location: emp.location || '',
                    costCenter: emp.costCenter || '',
                    email: emp.email || '',
                    phone: emp.phone || '',
                    panNumber: emp.panNumber || '',
                    uan: emp.uan || '',
                    pfNumber: emp.pfNumber || '',
                    esiNumber: emp.esiNumber || '',
                    epsNumber: emp.epsNumber || '',
                    bankAccountNumber: emp.bankAccountNumber || '',
                    bankName: emp.bankName || '',
                    ifscCode: emp.ifscCode || '',
                    branchName: emp.branchName || '',
                    basicSalary: emp.basicSalary?.toString() || '',
                    hra: emp.hra?.toString() || '',
                    conveyanceAllowance: emp.conveyanceAllowance?.toString() || '',
                    medicalAllowance: emp.medicalAllowance?.toString() || '',
                    specialAllowance: emp.specialAllowance?.toString() || '',
                    otherEarnings: emp.otherEarnings?.toString() || '',
                    institute: emp.institute || '',
                    status: emp.status || 'active',
                    notes: emp.notes || '',
                });
            } catch (error: any) {
                toast.error(error.message || 'Failed to load employee');
            } finally {
                setIsFetching(false);
            }
        };

        if (token && id) fetchEmployee();
    }, [token, id]);

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.employeeName) {
            toast.error('Employee name is required');
            return;
        }

        setIsLoading(true);
        try {
            const payload: any = {};
            for (const [key, value] of Object.entries(formData)) {
                if (value !== '' && value !== null && value !== undefined) {
                    payload[key] = value;
                }
            }
            ['basicSalary', 'hra', 'conveyanceAllowance', 'medicalAllowance', 'specialAllowance', 'otherEarnings'].forEach(f => {
                if (f in payload) payload[f] = parseFloat(payload[f]) || 0;
            });

            const res = await fetch(`/api/employees/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update employee');

            toast.success('Employee updated successfully!');
            router.push('/dashboard/employees');
        } catch (error: any) {
            toast.error(error.message || 'Failed to update employee');
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/employees">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Employee</h1>
                    <p className="text-gray-500">{formData.employeeName} {formData.employeeId ? `(${formData.employeeId})` : ''}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <User className="h-5 w-5 text-blue-600" />
                            Basic Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Employee Name <span className="text-red-500">*</span></Label>
                            <Input value={formData.employeeName} onChange={(e) => updateField('employeeName', e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Employee ID</Label>
                            <Input value={formData.employeeId} onChange={(e) => updateField('employeeId', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Gender</Label>
                            <Select value={formData.gender} onValueChange={(v) => updateField('gender', v)}>
                                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="M">Male</SelectItem>
                                    <SelectItem value="F">Female</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Designation</Label>
                            <Input value={formData.designation} onChange={(e) => updateField('designation', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Department</Label>
                            <Input value={formData.department} onChange={(e) => updateField('department', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={formData.status} onValueChange={(v) => updateField('status', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="terminated">Terminated</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Location</Label>
                            <Input value={formData.location} onChange={(e) => updateField('location', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Cost Center</Label>
                            <Input value={formData.costCenter} onChange={(e) => updateField('costCenter', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Institute (for certificates)</Label>
                            <Input value={formData.institute} onChange={(e) => updateField('institute', e.target.value)} />
                        </div>
                    </CardContent>
                </Card>

                {/* Contact & Dates */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Calendar className="h-5 w-5 text-green-600" />
                            Contact & Dates
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Date of Birth</Label>
                            <Input type="date" value={formData.dateOfBirth} onChange={(e) => updateField('dateOfBirth', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Date of Joining</Label>
                            <Input type="date" value={formData.dateOfJoining} onChange={(e) => updateField('dateOfJoining', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Last Working Date</Label>
                            <Input type="date" value={formData.lastWorkingDate} onChange={(e) => updateField('lastWorkingDate', e.target.value)} />
                        </div>
                    </CardContent>
                </Card>

                {/* Statutory */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Shield className="h-5 w-5 text-orange-600" />
                            Statutory Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>PAN Number</Label>
                            <Input value={formData.panNumber} onChange={(e) => updateField('panNumber', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>UAN</Label>
                            <Input value={formData.uan} onChange={(e) => updateField('uan', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>PF Number</Label>
                            <Input value={formData.pfNumber} onChange={(e) => updateField('pfNumber', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>ESI Number</Label>
                            <Input value={formData.esiNumber} onChange={(e) => updateField('esiNumber', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>EPS Number</Label>
                            <Input value={formData.epsNumber} onChange={(e) => updateField('epsNumber', e.target.value)} />
                        </div>
                    </CardContent>
                </Card>

                {/* Bank Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <CreditCard className="h-5 w-5 text-purple-600" />
                            Bank Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Bank Name</Label>
                            <Input value={formData.bankName} onChange={(e) => updateField('bankName', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Account Number</Label>
                            <Input value={formData.bankAccountNumber} onChange={(e) => updateField('bankAccountNumber', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>IFSC Code</Label>
                            <Input value={formData.ifscCode} onChange={(e) => updateField('ifscCode', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Branch Name</Label>
                            <Input value={formData.branchName} onChange={(e) => updateField('branchName', e.target.value)} />
                        </div>
                    </CardContent>
                </Card>

                {/* Salary */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <IndianRupee className="h-5 w-5 text-green-600" />
                            Default Salary Structure
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Basic Salary</Label>
                            <Input type="number" value={formData.basicSalary} onChange={(e) => updateField('basicSalary', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>HRA</Label>
                            <Input type="number" value={formData.hra} onChange={(e) => updateField('hra', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Conveyance Allowance</Label>
                            <Input type="number" value={formData.conveyanceAllowance} onChange={(e) => updateField('conveyanceAllowance', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Medical Allowance</Label>
                            <Input type="number" value={formData.medicalAllowance} onChange={(e) => updateField('medicalAllowance', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Special Allowance</Label>
                            <Input type="number" value={formData.specialAllowance} onChange={(e) => updateField('specialAllowance', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Other Earnings</Label>
                            <Input type="number" value={formData.otherEarnings} onChange={(e) => updateField('otherEarnings', e.target.value)} />
                        </div>
                    </CardContent>
                </Card>

                {/* Notes */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <FileText className="h-5 w-5 text-gray-600" />
                            Notes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            rows={3}
                            value={formData.notes}
                            onChange={(e) => updateField('notes', e.target.value)}
                        />
                    </CardContent>
                </Card>

                {/* Submit */}
                <div className="flex justify-end gap-4">
                    <Link href="/dashboard/employees">
                        <Button type="button" variant="outline">Cancel</Button>
                    </Link>
                    <Button type="submit" disabled={isLoading} className="gap-2">
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                Update Employee
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
