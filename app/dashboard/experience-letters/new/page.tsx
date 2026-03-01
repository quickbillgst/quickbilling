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
    Calendar,
    Award,
    Save,
    Loader2,
    PenTool,
    FileText,
    Star,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function NewExperienceLetterPage() {
    const router = useRouter();
    const { token } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        employeeName: '',
        employeeId: '',
        designation: '',
        department: '',
        dateOfJoining: '',
        lastWorkingDate: '',
        letterDate: new Date().toISOString().split('T')[0],
        jobDescription: '',
        conductRating: 'Good',
        signatoryName: '',
        signatoryDesignation: '',
    });

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.employeeName || !formData.dateOfJoining || !formData.lastWorkingDate || !formData.letterDate) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch('/api/experience-letters', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create experience letter');
            }

            toast.success('Experience letter created successfully!');

            // Open PDF in new tab
            if (data.letter?._id) {
                window.open(`/api/experience-letters/${data.letter._id}/pdf?token=${token}`, '_blank');
            }

            router.push('/dashboard/experience-letters');
        } catch (error: any) {
            toast.error(error.message || 'Failed to create experience letter');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/experience-letters">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Create Experience Letter</h1>
                    <p className="text-gray-500">Fill in the details to generate a professional experience letter</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
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
                            <Label htmlFor="letterDate">Letter Date <span className="text-red-500">*</span></Label>
                            <Input
                                id="letterDate"
                                type="date"
                                value={formData.letterDate}
                                onChange={(e) => updateField('letterDate', e.target.value)}
                                required
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Job Description & Rating */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <FileText className="h-5 w-5 text-orange-600" />
                            Job Details & Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="jobDescription">Job Responsibilities / Description</Label>
                            <Textarea
                                id="jobDescription"
                                placeholder="Describe the key responsibilities and duties performed by the employee..."
                                rows={4}
                                value={formData.jobDescription}
                                onChange={(e) => updateField('jobDescription', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2 max-w-sm">
                            <Label htmlFor="conductRating">
                                <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 text-amber-500" />
                                    Conduct & Performance Rating
                                </div>
                            </Label>
                            <Select value={formData.conductRating} onValueChange={(v) => updateField('conductRating', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select rating" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Excellent">Excellent</SelectItem>
                                    <SelectItem value="Good">Good</SelectItem>
                                    <SelectItem value="Satisfactory">Satisfactory</SelectItem>
                                </SelectContent>
                            </Select>
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

                {/* Submit */}
                <div className="flex justify-end gap-4">
                    <Link href="/dashboard/experience-letters">
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
                                Generate Experience Letter
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
