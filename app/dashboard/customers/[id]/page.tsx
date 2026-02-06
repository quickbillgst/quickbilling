'use client';

import React from "react"
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export default function EditCustomerPage() {
    const router = useRouter();
    const params = useParams();
    const { token } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        customerType: 'business',
        gstRegistered: false,
        gstin: '',
        pan: '',
        tdsApplicable: false,
        tdsRate: 2.5,
        creditLimit: 0,
        billingAddress: {
            line1: '',
            line2: '',
            city: '',
            state: '',
            pincode: ''
        }
    });

    useEffect(() => {
        if (token && params?.id) {
            console.log("Fetching customer:", params.id);
            fetch(`/api/customers/${params.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => {
                    console.log("Fetch status:", res.status);
                    if (!res.ok) {
                        return res.text().then(text => { throw new Error(text || "Failed to fetch") });
                    }
                    return res.json();
                })
                .then(result => {
                    console.log("Fetch result:", result);
                    if (result.success && result.data) {
                        const cust = result.data;
                        setFormData({
                            name: cust.name || '',
                            email: cust.email || '',
                            phone: cust.phone || '',
                            customerType: cust.customerType || 'business',
                            gstRegistered: cust.gstRegistered || false,
                            gstin: cust.gstin || '',
                            pan: cust.pan || '',
                            tdsApplicable: cust.tdsApplicable || false,
                            tdsRate: cust.tdsRate || 2.5,
                            creditLimit: cust.creditLimit || 0,
                            billingAddress: {
                                line1: cust.billingAddress?.line1 || '',
                                line2: cust.billingAddress?.line2 || '',
                                city: cust.billingAddress?.city || '',
                                state: cust.billingAddress?.state || '',
                                pincode: cust.billingAddress?.pincode || ''
                            }
                        });
                    }
                })
                .catch(err => {
                    console.error(err);
                    toast.error(err.message);
                })
                .finally(() => setIsFetching(false));
        }
    }, [token, params?.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch(`/api/customers/${params.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Failed to update customer');

            toast.success('Customer updated successfully!');
            router.push('/dashboard/customers');
        } catch (error: any) {
            toast.error(error.message || 'Failed to update customer');
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) return <div className="p-8">Loading customer details...</div>;

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Edit Customer</h1>
                <p className="text-slate-600 mt-1">Update customer details</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Customer Name *</Label>
                                <Input
                                    id="name"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="type">Customer Type</Label>
                                <Select value={formData.customerType} onValueChange={(value) => setFormData({ ...formData, customerType: value })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="individual">Individual</SelectItem>
                                        <SelectItem value="business">Business</SelectItem>
                                        <SelectItem value="government">Government</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="customer@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    placeholder="9876543210"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* GST Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>GST Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="gstRegistered"
                                checked={formData.gstRegistered}
                                onCheckedChange={(checked) => setFormData({ ...formData, gstRegistered: checked as boolean })}
                            />
                            <Label htmlFor="gstRegistered" className="font-normal">
                                Customer is GST Registered
                            </Label>
                        </div>

                        {formData.gstRegistered && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="gstin">GSTIN</Label>
                                    <Input
                                        id="gstin"
                                        placeholder="29AACCC5055K1Z5"
                                        value={formData.gstin}
                                        onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="pan">PAN</Label>
                                    <Input
                                        id="pan"
                                        placeholder="AAACR5055K"
                                        value={formData.pan}
                                        onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="tdsApplicable"
                                checked={formData.tdsApplicable}
                                onCheckedChange={(checked) => setFormData({ ...formData, tdsApplicable: checked as boolean })}
                            />
                            <Label htmlFor="tdsApplicable" className="font-normal">
                                TDS Applicable
                            </Label>
                        </div>

                        {formData.tdsApplicable && (
                            <div className="space-y-2">
                                <Label htmlFor="tdsRate">TDS Rate (%)</Label>
                                <Input
                                    id="tdsRate"
                                    type="number"
                                    step="0.1"
                                    value={formData.tdsRate}
                                    onChange={(e) => setFormData({ ...formData, tdsRate: parseFloat(e.target.value) })}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Billing Address */}
                <Card>
                    <CardHeader>
                        <CardTitle>Billing Address</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="line1">Address Line 1</Label>
                            <Input
                                id="line1"
                                placeholder="123 Main Street"
                                value={formData.billingAddress.line1}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    billingAddress: { ...formData.billingAddress, line1: e.target.value }
                                })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="line2">Address Line 2</Label>
                            <Input
                                id="line2"
                                placeholder="Apartment, suite, etc."
                                value={formData.billingAddress.line2}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    billingAddress: { ...formData.billingAddress, line2: e.target.value }
                                })}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    placeholder="Mumbai"
                                    value={formData.billingAddress.city}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        billingAddress: { ...formData.billingAddress, city: e.target.value }
                                    })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="state">State</Label>
                                <Select
                                    value={formData.billingAddress.state}
                                    onValueChange={(value) => setFormData({
                                        ...formData,
                                        billingAddress: { ...formData.billingAddress, state: value }
                                    })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select state" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="AN">Andaman Nicobar</SelectItem>
                                        <SelectItem value="AP">Andhra Pradesh</SelectItem>
                                        <SelectItem value="AR">Arunachal Pradesh</SelectItem>
                                        <SelectItem value="AS">Assam</SelectItem>
                                        <SelectItem value="BR">Bihar</SelectItem>
                                        <SelectItem value="CG">Chhattisgarh</SelectItem>
                                        <SelectItem value="CH">Chandigarh</SelectItem>
                                        <SelectItem value="DL">Delhi</SelectItem>
                                        <SelectItem value="GA">Goa</SelectItem>
                                        <SelectItem value="GJ">Gujarat</SelectItem>
                                        <SelectItem value="HR">Haryana</SelectItem>
                                        <SelectItem value="HP">Himachal Pradesh</SelectItem>
                                        <SelectItem value="JK">Jammu Kashmir</SelectItem>
                                        <SelectItem value="JH">Jharkhand</SelectItem>
                                        <SelectItem value="KA">Karnataka</SelectItem>
                                        <SelectItem value="KL">Kerala</SelectItem>
                                        <SelectItem value="LD">Lakshadweep</SelectItem>
                                        <SelectItem value="MP">Madhya Pradesh</SelectItem>
                                        <SelectItem value="MH">Maharashtra</SelectItem>
                                        <SelectItem value="MN">Manipur</SelectItem>
                                        <SelectItem value="ML">Meghalaya</SelectItem>
                                        <SelectItem value="MZ">Mizoram</SelectItem>
                                        <SelectItem value="OD">Odisha</SelectItem>
                                        <SelectItem value="PB">Punjab</SelectItem>
                                        <SelectItem value="RJ">Rajasthan</SelectItem>
                                        <SelectItem value="SK">Sikkim</SelectItem>
                                        <SelectItem value="TN">Tamil Nadu</SelectItem>
                                        <SelectItem value="TG">Telangana</SelectItem>
                                        <SelectItem value="TR">Tripura</SelectItem>
                                        <SelectItem value="UP">Uttar Pradesh</SelectItem>
                                        <SelectItem value="UT">Uttarakhand</SelectItem>
                                        <SelectItem value="WB">West Bengal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="pincode">Pincode</Label>
                                <Input
                                    id="pincode"
                                    placeholder="400001"
                                    value={formData.billingAddress.pincode}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        billingAddress: { ...formData.billingAddress, pincode: e.target.value }
                                    })}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Form Actions */}
                <div className="flex justify-end gap-4">
                    <Button variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Updating...' : 'Update Customer'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
