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
    IndianRupee,
    Calculator,
    FileText,
    Save,
    Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const currentYear = new Date().getFullYear();
const years = [currentYear - 1, currentYear, currentYear + 1];

export default function NewPayslipPage() {
    const router = useRouter();
    const { token } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        // Employee Details
        employeeName: '',
        employeeId: '',
        designation: '',
        department: '',
        bankAccountNumber: '',
        bankName: '',
        ifscCode: '',
        panNumber: '',

        // Pay Period
        payPeriodMonth: months[new Date().getMonth()],
        payPeriodYear: currentYear.toString(),
        payDate: new Date().toISOString().split('T')[0],

        // Earnings
        basicSalary: '',
        hra: '',
        conveyanceAllowance: '',
        medicalAllowance: '',
        specialAllowance: '',
        otherEarnings: '',
        bonus: '',
        overtime: '',

        // Deductions
        providentFund: '',
        professionalTax: '',
        incomeTax: '',
        esi: '',
        loanDeduction: '',
        otherDeductions: '',

        // Attendance
        workingDays: '',
        presentDays: '',
        lop: '',

        // Notes
        notes: '',
    });

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Calculate totals
    const parseNum = (val: string) => parseFloat(val) || 0;

    const grossEarnings =
        parseNum(formData.basicSalary) +
        parseNum(formData.hra) +
        parseNum(formData.conveyanceAllowance) +
        parseNum(formData.medicalAllowance) +
        parseNum(formData.specialAllowance) +
        parseNum(formData.otherEarnings) +
        parseNum(formData.bonus) +
        parseNum(formData.overtime);

    const totalDeductions =
        parseNum(formData.providentFund) +
        parseNum(formData.professionalTax) +
        parseNum(formData.incomeTax) +
        parseNum(formData.esi) +
        parseNum(formData.loanDeduction) +
        parseNum(formData.otherDeductions);

    const netPay = grossEarnings - totalDeductions;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const handleSubmit = async () => {
        if (!formData.employeeName.trim()) {
            toast.error('Employee name is required');
            return;
        }

        if (!formData.basicSalary) {
            toast.error('Basic salary is required');
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                employeeName: formData.employeeName,
                employeeId: formData.employeeId,
                designation: formData.designation,
                department: formData.department,
                bankAccountNumber: formData.bankAccountNumber,
                bankName: formData.bankName,
                ifscCode: formData.ifscCode,
                panNumber: formData.panNumber,
                payPeriod: `${formData.payPeriodMonth} ${formData.payPeriodYear}`,
                payDate: formData.payDate,
                basicSalary: parseNum(formData.basicSalary),
                hra: parseNum(formData.hra),
                conveyanceAllowance: parseNum(formData.conveyanceAllowance),
                medicalAllowance: parseNum(formData.medicalAllowance),
                specialAllowance: parseNum(formData.specialAllowance),
                otherEarnings: parseNum(formData.otherEarnings),
                bonus: parseNum(formData.bonus),
                overtime: parseNum(formData.overtime),
                providentFund: parseNum(formData.providentFund),
                professionalTax: parseNum(formData.professionalTax),
                incomeTax: parseNum(formData.incomeTax),
                esi: parseNum(formData.esi),
                loanDeduction: parseNum(formData.loanDeduction),
                otherDeductions: parseNum(formData.otherDeductions),
                workingDays: parseNum(formData.workingDays),
                presentDays: parseNum(formData.presentDays),
                lop: parseNum(formData.lop),
                notes: formData.notes,
            };

            const res = await fetch('/api/payslips', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create payslip');
            }

            toast.success('Payslip created successfully!');

            // Open PDF in new tab
            if (data.payslip?.id) {
                window.open(`/api/payslips/${data.payslip.id}/pdf?token=${token}`, '_blank');
            }

            router.push('/dashboard/payslips');
        } catch (error: any) {
            toast.error(error.message || 'Failed to create payslip');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/payslips">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Create Payslip</h1>
                    <p className="text-gray-500">Generate a new employee payslip</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Section */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Employee Details */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <User className="h-5 w-5 text-blue-600" />
                                Employee Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="employeeName">Employee Name *</Label>
                                    <Input
                                        id="employeeName"
                                        placeholder="John Doe"
                                        value={formData.employeeName}
                                        onChange={(e) => updateField('employeeName', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="employeeId">Employee ID</Label>
                                    <Input
                                        id="employeeId"
                                        placeholder="EMP001"
                                        value={formData.employeeId}
                                        onChange={(e) => updateField('employeeId', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="designation">Designation</Label>
                                    <Input
                                        id="designation"
                                        placeholder="Software Engineer"
                                        value={formData.designation}
                                        onChange={(e) => updateField('designation', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="department">Department</Label>
                                    <Input
                                        id="department"
                                        placeholder="Engineering"
                                        value={formData.department}
                                        onChange={(e) => updateField('department', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="panNumber">PAN Number</Label>
                                    <Input
                                        id="panNumber"
                                        placeholder="ABCDE1234F"
                                        className="uppercase"
                                        value={formData.panNumber}
                                        onChange={(e) => updateField('panNumber', e.target.value.toUpperCase())}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bank Details */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <CreditCard className="h-5 w-5 text-green-600" />
                                Bank Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="bankName">Bank Name</Label>
                                    <Input
                                        id="bankName"
                                        placeholder="State Bank of India"
                                        value={formData.bankName}
                                        onChange={(e) => updateField('bankName', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bankAccountNumber">Account Number</Label>
                                    <Input
                                        id="bankAccountNumber"
                                        placeholder="1234567890"
                                        value={formData.bankAccountNumber}
                                        onChange={(e) => updateField('bankAccountNumber', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ifscCode">IFSC Code</Label>
                                    <Input
                                        id="ifscCode"
                                        placeholder="SBIN0001234"
                                        className="uppercase"
                                        value={formData.ifscCode}
                                        onChange={(e) => updateField('ifscCode', e.target.value.toUpperCase())}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pay Period */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Building2 className="h-5 w-5 text-purple-600" />
                                Pay Period
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Month</Label>
                                    <Select
                                        value={formData.payPeriodMonth}
                                        onValueChange={(v) => updateField('payPeriodMonth', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {months.map(m => (
                                                <SelectItem key={m} value={m}>{m}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Year</Label>
                                    <Select
                                        value={formData.payPeriodYear}
                                        onValueChange={(v) => updateField('payPeriodYear', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {years.map(y => (
                                                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="payDate">Pay Date</Label>
                                    <Input
                                        id="payDate"
                                        type="date"
                                        value={formData.payDate}
                                        onChange={(e) => updateField('payDate', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="workingDays">Working Days</Label>
                                    <Input
                                        id="workingDays"
                                        type="number"
                                        placeholder="26"
                                        value={formData.workingDays}
                                        onChange={(e) => updateField('workingDays', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="presentDays">Present Days</Label>
                                    <Input
                                        id="presentDays"
                                        type="number"
                                        placeholder="26"
                                        value={formData.presentDays}
                                        onChange={(e) => updateField('presentDays', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lop">Loss of Pay (Days)</Label>
                                    <Input
                                        id="lop"
                                        type="number"
                                        placeholder="0"
                                        value={formData.lop}
                                        onChange={(e) => updateField('lop', e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Earnings */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <IndianRupee className="h-5 w-5 text-green-600" />
                                Earnings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="basicSalary">Basic Salary *</Label>
                                    <Input
                                        id="basicSalary"
                                        type="number"
                                        placeholder="25000"
                                        value={formData.basicSalary}
                                        onChange={(e) => updateField('basicSalary', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="hra">House Rent Allowance (HRA)</Label>
                                    <Input
                                        id="hra"
                                        type="number"
                                        placeholder="10000"
                                        value={formData.hra}
                                        onChange={(e) => updateField('hra', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="conveyanceAllowance">Conveyance Allowance</Label>
                                    <Input
                                        id="conveyanceAllowance"
                                        type="number"
                                        placeholder="1600"
                                        value={formData.conveyanceAllowance}
                                        onChange={(e) => updateField('conveyanceAllowance', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="medicalAllowance">Medical Allowance</Label>
                                    <Input
                                        id="medicalAllowance"
                                        type="number"
                                        placeholder="1250"
                                        value={formData.medicalAllowance}
                                        onChange={(e) => updateField('medicalAllowance', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="specialAllowance">Special Allowance</Label>
                                    <Input
                                        id="specialAllowance"
                                        type="number"
                                        placeholder="5000"
                                        value={formData.specialAllowance}
                                        onChange={(e) => updateField('specialAllowance', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bonus">Bonus</Label>
                                    <Input
                                        id="bonus"
                                        type="number"
                                        placeholder="0"
                                        value={formData.bonus}
                                        onChange={(e) => updateField('bonus', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="overtime">Overtime</Label>
                                    <Input
                                        id="overtime"
                                        type="number"
                                        placeholder="0"
                                        value={formData.overtime}
                                        onChange={(e) => updateField('overtime', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="otherEarnings">Other Earnings</Label>
                                    <Input
                                        id="otherEarnings"
                                        type="number"
                                        placeholder="0"
                                        value={formData.otherEarnings}
                                        onChange={(e) => updateField('otherEarnings', e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Deductions */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Calculator className="h-5 w-5 text-red-600" />
                                Deductions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="providentFund">Provident Fund (PF)</Label>
                                    <Input
                                        id="providentFund"
                                        type="number"
                                        placeholder="3000"
                                        value={formData.providentFund}
                                        onChange={(e) => updateField('providentFund', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="professionalTax">Professional Tax</Label>
                                    <Input
                                        id="professionalTax"
                                        type="number"
                                        placeholder="200"
                                        value={formData.professionalTax}
                                        onChange={(e) => updateField('professionalTax', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="incomeTax">Income Tax (TDS)</Label>
                                    <Input
                                        id="incomeTax"
                                        type="number"
                                        placeholder="0"
                                        value={formData.incomeTax}
                                        onChange={(e) => updateField('incomeTax', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="esi">ESI</Label>
                                    <Input
                                        id="esi"
                                        type="number"
                                        placeholder="0"
                                        value={formData.esi}
                                        onChange={(e) => updateField('esi', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="loanDeduction">Loan Deduction</Label>
                                    <Input
                                        id="loanDeduction"
                                        type="number"
                                        placeholder="0"
                                        value={formData.loanDeduction}
                                        onChange={(e) => updateField('loanDeduction', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="otherDeductions">Other Deductions</Label>
                                    <Input
                                        id="otherDeductions"
                                        type="number"
                                        placeholder="0"
                                        value={formData.otherDeductions}
                                        onChange={(e) => updateField('otherDeductions', e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notes */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <FileText className="h-5 w-5 text-gray-600" />
                                Additional Notes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                placeholder="Any additional notes or remarks..."
                                value={formData.notes}
                                onChange={(e) => updateField('notes', e.target.value)}
                                rows={3}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Summary Sidebar */}
                <div className="space-y-6">
                    <Card className="sticky top-6">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg">Payslip Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Employee Info */}
                            <div className="space-y-2">
                                <p className="text-sm text-gray-500">Employee</p>
                                <p className="font-medium">{formData.employeeName || '—'}</p>
                                <p className="text-sm text-gray-500">{formData.designation || '—'}</p>
                            </div>

                            {/* Pay Period */}
                            <div className="space-y-2">
                                <p className="text-sm text-gray-500">Pay Period</p>
                                <p className="font-medium">{formData.payPeriodMonth} {formData.payPeriodYear}</p>
                            </div>

                            <hr />

                            {/* Earnings */}
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-green-600">Gross Earnings</p>
                                <p className="text-xl font-bold text-green-600">{formatCurrency(grossEarnings)}</p>
                            </div>

                            {/* Deductions */}
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-red-600">Total Deductions</p>
                                <p className="text-xl font-bold text-red-600">- {formatCurrency(totalDeductions)}</p>
                            </div>

                            <hr />

                            {/* Net Pay */}
                            <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
                                <p className="text-sm opacity-90">Net Pay</p>
                                <p className="text-3xl font-bold">{formatCurrency(netPay)}</p>
                            </div>

                            {/* Actions */}
                            <div className="space-y-3">
                                <Button
                                    className="w-full gap-2"
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            Generate Payslip
                                        </>
                                    )}
                                </Button>
                                <Link href="/dashboard/payslips" className="block">
                                    <Button variant="outline" className="w-full">
                                        Cancel
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
