'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Upload, FileJson, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function BulkUploadPage() {
    const { token } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadResults, setUploadResults] = useState<any>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const parseCSV = (text: string) => {
        // Simple CSV parser for the specific format:
        // invoiceNumber,invoiceDate,customerName,customerEmail,customerGstin,productName,quantity,unitPrice,taxRate
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const data: any[] = [];

        // Group line items by invoice number
        const invoiceMap = new Map();

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const values = lines[i].split(',').map(v => v.trim());
            const row: any = {};
            headers.forEach((header, index) => {
                row[header] = values[index];
            });

            const invNum = row.invoiceNumber || 'temp-inv';
            if (!invoiceMap.has(invNum)) {
                invoiceMap.set(invNum, {
                    invoiceNumber: row.invoiceNumber,
                    invoiceDate: row.invoiceDate,
                    customerName: row.customerName,
                    customerEmail: row.customerEmail,
                    customerGstin: row.customerGstin,
                    lineItems: []
                });
            }

            invoiceMap.get(invNum).lineItems.push({
                productName: row.productName,
                quantity: parseFloat(row.quantity) || 0,
                unitPrice: parseFloat(row.unitPrice) || 0,
                taxRate: parseFloat(row.taxRate) || 18
            });
        }

        return Array.from(invoiceMap.values());
    };

    const handleUpload = async () => {
        if (!file || !token) {
            toast.error('Please select a file first');
            return;
        }

        setIsUploading(true);
        setUploadProgress(10);
        setUploadResults(null);

        try {
            let invoices = [];
            const reader = new FileReader();

            const processFile = (content: string) => {
                return new Promise((resolve, reject) => {
                    try {
                        if (file.name.endsWith('.json')) {
                            const parsed = JSON.parse(content);
                            resolve(Array.isArray(parsed) ? parsed : [parsed]);
                        } else if (file.name.endsWith('.csv')) {
                            resolve(parseCSV(content));
                        } else {
                            reject(new Error('Unsupported file format. Please use .json or .csv'));
                        }
                    } catch (e) {
                        reject(e);
                    }
                });
            };

            reader.onload = async (e) => {
                try {
                    const content = e.target?.result as string;
                    invoices = await processFile(content) as any[];

                    setUploadProgress(40);

                    const response = await fetch('/api/invoices/bulk-upload', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ invoices })
                    });

                    const results = await response.json();

                    if (response.ok) {
                        setUploadResults(results);
                        setUploadProgress(100);
                        toast.success(`Successfully uploaded ${results.success} invoices!`);
                    } else {
                        toast.error(results.error || 'Upload failed');
                    }
                } catch (err: any) {
                    toast.error('Error parsing file: ' + err.message);
                } finally {
                    setIsUploading(false);
                }
            };

            reader.readAsText(file);

        } catch (error) {
            console.error('Upload catch:', error);
            toast.error('An unexpected error occurred');
            setIsUploading(false);
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Bulk Upload Invoices</h1>
                    <p className="text-slate-500 mt-1">Import old billing data quickly</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Format Instructions */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Info className="w-5 h-5 text-blue-500" />
                            Proper Data Format
                        </CardTitle>
                        <CardDescription>
                            We support JSON and CSV files. Customers and Products will be created automatically if they don't exist.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <h3 className="font-semibold text-sm mb-2 text-slate-700">Recommended JSON Structure:</h3>
                            <pre className="text-[10px] md:text-xs overflow-x-auto text-slate-600 font-mono p-2">
                                {`[{
  "invoiceNumber": "INV-001",
  "invoiceDate": "2023-10-01",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerGstin": "27AAAAA0000A1Z5",
  "lineItems": [
    {
      "productName": "Widget A",
      "quantity": 10,
      "unitPrice": 100,
      "taxRate": 18
    }
  ],
  "status": "paid"
}]`}
                            </pre>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <h3 className="font-semibold text-sm mb-2 text-slate-700">CSV Column Headers:</h3>
                            <p className="text-xs text-slate-600 mb-2">
                                <code>invoiceNumber, invoiceDate, customerName, customerEmail, customerGstin, productName, quantity, unitPrice, taxRate</code>
                            </p>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="text-xs" onClick={() => {
                                    const csv = "invoiceNumber,invoiceDate,customerName,customerEmail,customerGstin,productName,quantity,unitPrice,taxRate\nINV-OLD-01,2023-01-15,Acme Corp,contact@acme.com,27ABCDE1234F1Z5,Product X,5,550.00,18\nINV-OLD-01,2023-01-15,Acme Corp,contact@acme.com,27ABCDE1234F1Z5,Product Y,2,1200.00,12";
                                    const blob = new Blob([csv], { type: 'text/csv' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = 'invoice_upload_template.csv';
                                    a.click();
                                }}>
                                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                                    Download CSV Template
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Upload Action */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Upload File</CardTitle>
                        <CardDescription>Select your data file to begin processing</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                            <input
                                type="file"
                                id="bulk-file"
                                className="hidden"
                                accept=".json,.csv"
                                onChange={handleFileChange}
                            />
                            <label htmlFor="bulk-file" className="cursor-pointer flex flex-col items-center">
                                <Upload className="w-10 h-10 text-slate-400 mb-2" />
                                <span className="text-sm font-medium text-slate-700">
                                    {file ? file.name : 'Click to select file'}
                                </span>
                                <span className="text-xs text-slate-500 mt-1">.json or .csv only</span>
                            </label>
                        </div>

                        {isUploading && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span>Processing...</span>
                                    <span>{uploadProgress}%</span>
                                </div>
                                <Progress value={uploadProgress} className="h-2" />
                            </div>
                        )}

                        <Button
                            className="w-full"
                            onClick={handleUpload}
                            disabled={!file || isUploading}
                        >
                            {isUploading ? 'Uploading...' : 'Start Bulk Upload'}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {uploadResults && (
                <Card className="border-2 border-slate-100 shadow-lg animate-in fade-in zoom-in duration-300">
                    <CardHeader className="bg-slate-50/50 pb-4">
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                            Upload Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="text-center p-4 bg-green-50 rounded-xl border border-green-100">
                                <div className="text-2xl font-bold text-green-700">{uploadResults.success}</div>
                                <div className="text-xs text-green-600 font-medium">Successful</div>
                            </div>
                            <div className="text-center p-4 bg-red-50 rounded-xl border border-red-100">
                                <div className="text-2xl font-bold text-red-700">{uploadResults.failed}</div>
                                <div className="text-xs text-red-600 font-medium">Failed</div>
                            </div>
                            <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="text-2xl font-bold text-slate-700">{uploadResults.success + uploadResults.failed}</div>
                                <div className="text-xs text-slate-600 font-medium">Total Processed</div>
                            </div>
                        </div>

                        {uploadResults.details && uploadResults.details.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-orange-500" />
                                    Error Details:
                                </h4>
                                <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                                    {uploadResults.details.map((detail: any, idx: number) => (
                                        <div key={idx} className="p-3 bg-red-50/50 border border-red-100 rounded-lg flex items-start gap-3">
                                            <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                            <div>
                                                <div className="text-xs font-bold text-red-900">Invoice: {detail.invoice}</div>
                                                <div className="text-xs text-red-700">{detail.error}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-6 flex justify-end">
                            <Button onClick={() => setUploadResults(null)} variant="outline">Dismiss</Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
