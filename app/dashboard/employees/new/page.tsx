'use client';

import { useState } from 'react';
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
    CreditCard,
    Calendar,
    FileText,
    Save,
    Loader2,
    IndianRupee,
    Shield,
    Phone,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function NewEmployeePage() {
    const router = useRouter();
    const { token } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

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
            // Only include non-empty fields; convert numeric salary fields
            for (const [key, value] of Object.entries(formData)) {
                if (value !== '' && value !== null && value !== undefined) {
                    payload[key] = value;
                }
            }
            ['basicSalary', 'hra', 'conveyanceAllowance', 'medicalAllowance', 'specialAllowance', 'otherEarnings'].forEach(f => {
                if (f in payload) payload[f] = parseFloat(payload[f]) || 0;
            });

            const res = await fetch('/api/employees', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create employee');

            toast.success('Employee added successfully!');
            router.push('/dashboard/employees');
        } catch (error: any) {
            toast.error(error.message || 'Failed to create employee');
        } finally {
            setIsLoading(false);
        }
    };

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
                    <h1 className="text-2xl font-bold text-gray-900">Add Employee</h1>
                    <p className="text-gray-500">Store employee details — auto-fill across payslips, letters & certificates</p>
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
                            <Input placeholder="e.g. Rahul Sharma" value={formData.employeeName} onChange={(e) => updateField('employeeName', e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Employee ID</Label>
                            <Input placeholder="e.g. EMP-001" value={formData.employeeId} onChange={(e) => updateField('employeeId', e.target.value)} />
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
                            <Input placeholder="e.g. Senior Software Engineer" value={formData.designation} onChange={(e) => updateField('designation', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Department</Label>
                            <Input placeholder="e.g. Engineering" value={formData.department} onChange={(e) => updateField('department', e.target.value)} />
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
                            <Input placeholder="e.g. Mumbai" value={formData.location} onChange={(e) => updateField('location', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Cost Center</Label>
                            <Input placeholder="e.g. CC-001" value={formData.costCenter} onChange={(e) => updateField('costCenter', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Institute (for certificates)</Label>
                            <Input placeholder="e.g. IIT Bombay" value={formData.institute} onChange={(e) => updateField('institute', e.target.value)} />
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
                            <Input type="email" placeholder="e.g. rahul@example.com" value={formData.email} onChange={(e) => updateField('email', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input placeholder="e.g. 9876543210" value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} />
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
                            <Input placeholder="e.g. ABCDE1234F" value={formData.panNumber} onChange={(e) => updateField('panNumber', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>UAN</Label>
                            <Input placeholder="Universal Account Number" value={formData.uan} onChange={(e) => updateField('uan', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>PF Number</Label>
                            <Input placeholder="PF account number" value={formData.pfNumber} onChange={(e) => updateField('pfNumber', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>ESI Number</Label>
                            <Input placeholder="ESI account number" value={formData.esiNumber} onChange={(e) => updateField('esiNumber', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>EPS Number</Label>
                            <Input placeholder="EPS account number" value={formData.epsNumber} onChange={(e) => updateField('epsNumber', e.target.value)} />
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
                            <Input placeholder="e.g. State Bank of India" value={formData.bankName} onChange={(e) => updateField('bankName', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Account Number</Label>
                            <Input placeholder="e.g. 12345678901234" value={formData.bankAccountNumber} onChange={(e) => updateField('bankAccountNumber', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>IFSC Code</Label>
                            <Input placeholder="e.g. SBIN0001234" value={formData.ifscCode} onChange={(e) => updateField('ifscCode', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Branch Name</Label>
                            <Input placeholder="e.g. Andheri West" value={formData.branchName} onChange={(e) => updateField('branchName', e.target.value)} />
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
                            <Input type="number" placeholder="0" value={formData.basicSalary} onChange={(e) => updateField('basicSalary', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>HRA</Label>
                            <Input type="number" placeholder="0" value={formData.hra} onChange={(e) => updateField('hra', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Conveyance Allowance</Label>
                            <Input type="number" placeholder="0" value={formData.conveyanceAllowance} onChange={(e) => updateField('conveyanceAllowance', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Medical Allowance</Label>
                            <Input type="number" placeholder="0" value={formData.medicalAllowance} onChange={(e) => updateField('medicalAllowance', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Special Allowance</Label>
                            <Input type="number" placeholder="0" value={formData.specialAllowance} onChange={(e) => updateField('specialAllowance', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Other Earnings</Label>
                            <Input type="number" placeholder="0" value={formData.otherEarnings} onChange={(e) => updateField('otherEarnings', e.target.value)} />
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
                            placeholder="Any additional notes about this employee..."
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
                                Save Employee
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
