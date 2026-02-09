'use client';

import React, { useState, useEffect } from "react"
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
    Loader2,
    Package,
    Barcode,
    IndianRupee,
    Tags,
    Layers,
    FileText,
    Save,
    ArrowLeft,
    AlertCircle,
    RefreshCw
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const productSchema = z.object({
    sku: z.string().min(1, 'SKU is required'),
    name: z.string().min(2, 'Product Name must be at least 2 characters'),
    description: z.string().optional(),
    hsnCode: z.string().optional(),
    sacCode: z.string().optional(),
    taxRate: z.coerce.number(),
    gstType: z.enum(['cgst_sgst', 'igst', 'exempt']),
    costPrice: z.coerce.number().optional().default(0),
    sellingPrice: z.coerce.number().min(0.01, 'Selling Price must be greater than 0'),
    trackInventory: z.boolean().default(true),
    reorderPoint: z.coerce.number().optional().default(10),
    barcodeValue: z.string().optional(),
    barcodeType: z.enum(['ean13', 'code128', 'qr']).default('ean13'),
    isService: z.boolean().default(false),
    isActive: z.boolean().default(true)
});

type ProductFormData = z.infer<typeof productSchema>;

export default function EditProductPage() {
    const router = useRouter();
    const params = useParams();
    const { token } = useAuth();

    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [isGeneratingSku, setIsGeneratingSku] = useState(false);
    const [margin, setMargin] = useState<number | null>(null);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors }
    } = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            sku: '',
            name: '',
            description: '',
            hsnCode: '',
            sacCode: '',
            taxRate: 18,
            gstType: 'cgst_sgst',
            costPrice: 0,
            sellingPrice: 0,
            trackInventory: true,
            reorderPoint: 10,
            barcodeValue: '',
            barcodeType: 'ean13',
            isService: false,
            isActive: true
        },
    });

    const costPrice = watch('costPrice');
    const sellingPrice = watch('sellingPrice');
    const isService = watch('isService');

    // Fetch product data
    useEffect(() => {
        async function fetchProduct() {
            if (!token || !params.id) return;

            try {
                const res = await fetch(`/api/products/${params.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!res.ok) throw new Error('Failed to load product');

                const { data } = await res.json();

                // Map backend data to form structure
                // Calculate inclusive selling price
                const inclusivePrice = data.sellingPrice * (1 + (data.gstRate / 100));

                reset({
                    sku: data.sku,
                    name: data.name,
                    description: data.description || '',
                    hsnCode: data.hsnCode || '',
                    sacCode: data.sacCode || '',
                    taxRate: data.gstRate, // Note mapping: gstRate -> taxRate
                    gstType: data.gstType || 'cgst_sgst',
                    costPrice: data.costPrice || 0,
                    sellingPrice: parseFloat(inclusivePrice.toFixed(2)),
                    trackInventory: data.trackInventory !== false,
                    reorderPoint: data.reorderPoint || 10,
                    barcodeValue: data.barcodeValue || '',
                    barcodeType: data.barcodeType || 'ean13',
                    isService: data.isService || false,
                    isActive: data.isActive !== false
                });
            } catch (error) {
                toast.error('Could not fetch product details');
                router.push('/dashboard/products');
            } finally {
                setIsFetching(false);
            }
        }

        fetchProduct();
    }, [token, params.id, reset, router]);


    const generateSku = async () => {
        setIsGeneratingSku(true);
        try {
            const res = await fetch('/api/products/generate-sku', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error('Failed to generate SKU');
            const data = await res.json();
            setValue('sku', data.sku, { shouldValidate: true });
            toast.success('SKU generated successfully');
        } catch (error) {
            toast.error('Could not auto-generate SKU');
        } finally {
            setIsGeneratingSku(false);
        }
    };

    // Calculate margin and unit price whenever prices change
    const [unitPrice, setUnitPrice] = useState<number>(0);
    const taxRate = watch('taxRate');

    useEffect(() => {
        if (sellingPrice && sellingPrice > 0) {
            // Calculate unit price (excluding GST) from selling price (including GST)
            const basePrice = sellingPrice / (1 + (taxRate / 100));
            setUnitPrice(parseFloat(basePrice.toFixed(2)));

            const cp = costPrice || 0;
            // Margin calculation based on base price vs cost price
            const calculatedMargin = basePrice > 0 ? ((basePrice - cp) / basePrice) * 100 : 0;
            setMargin(parseFloat(calculatedMargin.toFixed(2)));
        } else {
            setUnitPrice(0);
            setMargin(null);
        }
    }, [costPrice, sellingPrice, taxRate]);

    const onSubmit = async (data: ProductFormData) => {
        setIsLoading(true);

        try {
            // Convert inclusive selling price back to exclusive base price for storage
            const basePrice = data.sellingPrice / (1 + (data.taxRate / 100));

            const res = await fetch(`/api/products/${params.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...data,
                    sellingPrice: parseFloat(basePrice.toFixed(2)) // Store price EXCLUDING GST
                })
            });

            const result = await res.json();

            if (!res.ok) {
                if (res.status === 409) {
                    throw new Error('SKU collision. Please use a unique SKU.');
                }
                throw new Error(result.error || 'Failed to update product');
            }

            toast.success('Product updated successfully!');
            router.push('/dashboard/products');
        } catch (error: any) {
            toast.error(error.message || 'Failed to update product');
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-6 max-w-5xl mx-auto p-4 sm:p-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-sm font-medium">Back to Products</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Edit Product</h1>
                    <p className="text-muted-foreground">
                        Update details for <span className="font-mono text-foreground">{watch('sku')}</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button size="sm" onClick={handleSubmit(onSubmit)} disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Update Product
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Main Info */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Basic Info Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5 text-primary" />
                                    Basic Information
                                </CardTitle>
                                <CardDescription>
                                    Core details about your product or service
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="sku">SKU (Stock Keeping Unit) <span className="text-destructive">*</span></Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="sku"
                                                placeholder="e.g. PROD-001"
                                                className={errors.sku ? "border-destructive focus-visible:ring-destructive" : ""}
                                                {...register('sku')}
                                                disabled={isLoading}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                title="Auto-generate SKU"
                                                onClick={generateSku}
                                                disabled={isLoading || isGeneratingSku}
                                            >
                                                {isGeneratingSku ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <RefreshCw className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                        {errors.sku && <p className="text-xs text-destructive">{errors.sku.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="name">Product Name <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="name"
                                            placeholder="e.g. Wireless Mouse"
                                            className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                                            {...register('name')}
                                            disabled={isLoading}
                                        />
                                        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Enter detailed product description..."
                                        className="min-h-[100px]"
                                        {...register('description')}
                                        disabled={isLoading}
                                    />
                                </div>

                                <div className="flex items-center space-x-2 pt-2">
                                    <Switch
                                        id="isService"
                                        checked={isService}
                                        onCheckedChange={(checked) => setValue('isService', checked)}
                                        disabled={isLoading}
                                    />
                                    <Label htmlFor="isService" className="font-normal cursor-pointer">
                                        This is a service (not a physical product)
                                    </Label>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pricing Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <IndianRupee className="h-5 w-5 text-primary" />
                                    Pricing & Cost
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="sellingPrice">Selling Price (Incl. GST) (₹) <span className="text-destructive">*</span></Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                                            <Input
                                                id="sellingPrice"
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                className={`pl-7 ${errors.sellingPrice ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                                {...register('sellingPrice')}
                                                disabled={isLoading}
                                            />
                                        </div>
                                        {errors.sellingPrice && <p className="text-xs text-destructive">{errors.sellingPrice.message}</p>}
                                        {sellingPrice > 0 && (
                                            <p className="text-xs text-primary font-medium">
                                                Unit Price (Excl. GST): ₹{unitPrice}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="costPrice">Cost Price (₹)</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                                            <Input
                                                id="costPrice"
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                className="pl-7"
                                                {...register('costPrice')}
                                                disabled={isLoading}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">Used to calculate profit margins.</p>
                                    </div>
                                </div>

                                {margin !== null && (
                                    <Alert variant={margin < 0 ? "destructive" : "default"} className={margin < 0 ? "bg-destructive/10" : "bg-primary/10 border-primary/20"}>
                                        {margin < 0 ? <AlertCircle className="h-4 w-4" /> : <Tags className="h-4 w-4 text-primary" />}
                                        <AlertTitle className={margin < 0 ? "text-destructive" : "text-primary"}>
                                            {margin < 0 ? "Negative Margin Warning" : "Profit Margin"}
                                        </AlertTitle>
                                        <AlertDescription className={margin < 0 ? "text-destructive" : "text-primary/90"}>
                                            You are selling this product at a <strong>{margin < 0 ? "loss" : "profit"}</strong> of <strong>{Math.abs(margin)}%</strong>.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>

                        {/* Inventory Card (Conditional) */}
                        {!isService && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Layers className="h-5 w-5 text-primary" />
                                        Inventory Management
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center space-x-2 pb-4">
                                        <Switch
                                            id="trackInventory"
                                            checked={watch('trackInventory')}
                                            onCheckedChange={(checked) => setValue('trackInventory', checked)}
                                            disabled={isLoading}
                                        />
                                        <Label htmlFor="trackInventory">Track Stock Quantity</Label>
                                    </div>

                                    {watch('trackInventory') && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                                            <div className="space-y-2">
                                                <Label htmlFor="reorderPoint">Low Stock Alert Level</Label>
                                                <Input
                                                    id="reorderPoint"
                                                    type="number"
                                                    {...register('reorderPoint')}
                                                    disabled={isLoading}
                                                />
                                                <p className="text-xs text-muted-foreground">Get notified when stock falls below this.</p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Column: Sidebar Info */}
                    <div className="space-y-6 lg:sticky lg:top-8 h-fit">
                        {/* Product Status */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <RefreshCw className="h-4 w-4" />
                                    Product Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between p-3 rounded-lg border bg-slate-50/50">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-bold">Active Status</Label>
                                        <p className="text-[10px] text-muted-foreground whitespace-pre-wrap">
                                            {watch('isActive')
                                                ? "Product is visible in invoices and sales"
                                                : "Product is hidden from list but kept in records"}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={watch('isActive')}
                                        onCheckedChange={(checked) => setValue('isActive', checked)}
                                        disabled={isLoading}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tax Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Taxation (GST)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="taxRate">GST Rate (%)</Label>
                                    <Select
                                        value={watch('taxRate')?.toString()}
                                        onValueChange={(val) => setValue('taxRate', Number(val))}
                                        disabled={isLoading}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Rate" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0">0% (Exempt)</SelectItem>
                                            <SelectItem value="5">5%</SelectItem>
                                            <SelectItem value="12">12%</SelectItem>
                                            <SelectItem value="18">18% (Standard)</SelectItem>
                                            <SelectItem value="28">28% (Luxury)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="gstType">Tax Preference</Label>
                                    <Select
                                        value={watch('gstType')}
                                        onValueChange={(val: any) => setValue('gstType', val)}
                                        disabled={isLoading}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cgst_sgst">Taxable (Intra-state)</SelectItem>
                                            <SelectItem value="igst">Taxable (Inter-state)</SelectItem>
                                            <SelectItem value="exempt">Tax Exempt</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <Label>Classification Code</Label>
                                    <Tabs
                                        value={isService ? "sac" : "hsn"}
                                        onValueChange={(val) => setValue('isService', val === 'sac')}
                                        className="w-full"
                                    >
                                        <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger value="hsn">HSN (Goods)</TabsTrigger>
                                            <TabsTrigger value="sac">SAC (Services)</TabsTrigger>
                                        </TabsList>
                                    </Tabs>

                                    <div className="space-y-2">
                                        <Input
                                            id={isService ? "sacCode" : "hsnCode"}
                                            placeholder={isService ? "e.g. 9983 (IT Services)" : "e.g. 8517 (Mobile Phone)"}
                                            {...register(isService ? 'sacCode' : 'hsnCode')}
                                            disabled={isLoading}
                                        />
                                        <p className="text-xs text-muted-foreground">{isService ? "Service Accounting Code" : "Harmonized System of Nomenclature Code"}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Barcode */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Barcode className="h-4 w-4" />
                                    Barcoding
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="barcodeValue">Barcode / UPC / EAN</Label>
                                    <Input
                                        id="barcodeValue"
                                        placeholder="Scan or enter code"
                                        {...register('barcodeValue')}
                                        disabled={isLoading}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="barcodeType">Format</Label>
                                    <Select
                                        value={watch('barcodeType')}
                                        onValueChange={(val: any) => setValue('barcodeType', val)}
                                        disabled={isLoading}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ean13">EAN-13</SelectItem>
                                            <SelectItem value="code128">CODE-128</SelectItem>
                                            <SelectItem value="qr">QR Code</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </div>
    );
}
