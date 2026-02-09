'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';


import { Calendar as CalendarIcon, Loader2, Download, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/lib/auth-context';

export default function CertificatePage() {
    const { token } = useAuth();
    const [isGenerating, setIsGenerating] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        gender: '',
        institute: '',
        domain: '',
        startDate: undefined as Date | undefined,
        duration: '',
        internshipPeriod: '',
        projectName: ''
    });
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDateSelect = (date: Date | undefined) => {
        setFormData(prev => ({ ...prev, startDate: date }));
    };

    const handleGenerateClick = () => {
        if (!formData.name || !formData.gender || !formData.institute || !formData.domain || !formData.startDate || !formData.duration || !formData.internshipPeriod || !formData.projectName) {
            toast.error('Please fill in all fields including Project Name');
            return;
        }
        setIsConfirmOpen(true);
    };

    const generateCertificate = async () => {
        setIsConfirmOpen(false); // Close dialog
        setIsGenerating(true);

        try {
            const response = await fetch('/api/certificates/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    startDate: formData.startDate?.toISOString()
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate certificate');
            }

            // Convert response to blob and download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Internship_Certificate_${formData.name.replace(/\s+/g, '_')}.pdf`; // The API returns HTML, but we can save as HTML or pretend PDF for now if we use a converter. 
            // Actually, based on payslips, it returns HTML that users PRINT to PDF. 
            // Let's open it in a new tab for printing.

            window.open(url, '_blank');

            toast.success('Certificate generated successfully!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to generate certificate');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Internship Certificate</h1>
                <p className="text-slate-600 mt-1">
                    Generate internship completion certificates for interns
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Intern Details</CardTitle>
                    <CardDescription>Enter the details of the intern to generate the certificate</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="e.g. John Doe"
                                value={formData.name}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="gender">Gender</Label>
                            <Select
                                value={formData.gender}
                                onValueChange={(val) => handleSelectChange('gender', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Gender" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="institute">Institute / College</Label>
                            <Input
                                id="institute"
                                name="institute"
                                placeholder="e.g. University of Technology"
                                value={formData.institute}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="domain">Internship Domain</Label>
                            <Input
                                id="domain"
                                name="domain"
                                placeholder="e.g. Web Development"
                                value={formData.domain}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="projectName">Project Name</Label>
                            <Input
                                id="projectName"
                                name="projectName"
                                placeholder="e.g. AI Chatbot Development"
                                value={formData.projectName}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !formData.startDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.startDate ? formData.startDate.toLocaleDateString() : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={formData.startDate}
                                        onSelect={handleDateSelect}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="duration">Duration</Label>
                            <Input
                                id="duration"
                                name="duration"
                                placeholder="e.g. 3 Months"
                                value={formData.duration}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="internshipPeriod">Internship Period (Text)</Label>
                            <Input
                                id="internshipPeriod"
                                name="internshipPeriod"
                                placeholder="e.g. Jan 2026 to Mar 2026"
                                value={formData.internshipPeriod}
                                onChange={handleInputChange}
                            />
                            <p className="text-xs text-muted-foreground">This will appear in the certificate body text.</p>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button
                            onClick={handleGenerateClick}
                            disabled={isGenerating}
                            className="gap-2"
                            size="lg"
                        >
                            {isGenerating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <FileText className="h-4 w-4" />
                            )}
                            Generate Certificate
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            We are using this information to generate a certificate using AI. Please confirm the details are correct.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={generateCertificate}>Confirm & Generate</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800 text-sm">
                <h4 className="font-semibold mb-1 flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Note
                </h4>
                <p>
                    The certificate will be generated in a new tab. You can save it as PDF using the browser's print function (Ctrl+P / Cmd+P) and selecting "Save as PDF".
                </p>
            </div>
        </div >
    );
}
