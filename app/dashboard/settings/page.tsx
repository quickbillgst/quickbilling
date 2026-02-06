'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Lock, Bell, User, CreditCard, FileText, AlertCircle, CheckCircle, Loader2, Upload, Trash2, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';

const INDIAN_STATES = [
  { value: "AP", label: "Andhra Pradesh" },
  { value: "AR", label: "Arunachal Pradesh" },
  { value: "AS", label: "Assam" },
  { value: "BR", label: "Bihar" },
  { value: "CT", label: "Chhattisgarh" },
  { value: "GA", label: "Goa" },
  { value: "GJ", label: "Gujarat" },
  { value: "HR", label: "Haryana" },
  { value: "HP", label: "Himachal Pradesh" },
  { value: "JH", label: "Jharkhand" },
  { value: "KA", label: "Karnataka" },
  { value: "KL", label: "Kerala" },
  { value: "MP", label: "Madhya Pradesh" },
  { value: "MH", label: "Maharashtra" },
  { value: "MN", label: "Manipur" },
  { value: "ML", label: "Meghalaya" },
  { value: "MZ", label: "Mizoram" },
  { value: "NL", label: "Nagaland" },
  { value: "OR", label: "Odisha" },
  { value: "PB", label: "Punjab" },
  { value: "RJ", label: "Rajasthan" },
  { value: "SK", label: "Sikkim" },
  { value: "TN", label: "Tamil Nadu" },
  { value: "TG", label: "Telangana" },
  { value: "TR", label: "Tripura" },
  { value: "UP", label: "Uttar Pradesh" },
  { value: "UK", label: "Uttarakhand" },
  { value: "WB", label: "West Bengal" },
  { value: "AN", label: "Andaman and Nicobar Islands" },
  { value: "CH", label: "Chandigarh" },
  { value: "DN", label: "Dadra and Nagar Haveli and Daman and Diu" },
  { value: "DL", label: "Delhi" },
  { value: "JK", label: "Jammu and Kashmir" },
  { value: "LA", label: "Ladakh" },
  { value: "LD", label: "Lakshadweep" },
  { value: "PY", label: "Puducherry" }
];

export default function SettingsPage() {
  const { token, refreshAuth } = useAuth();
  const [activeTab, setActiveTab] = useState('business');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Business Settings State
  const [businessData, setBusinessData] = useState({
    businessName: '',
    email: '',
    phone: '',
    gstin: '',
    pan: '',
    invoicePrefix: 'INV-',
    nextInvoiceNumber: 1,
    nonGstInvoicePrefix: 'BILL-',
    nextNonGstInvoiceNumber: 1,
    address: {
      line1: '',
      city: '',
      state: 'MH',
      pincode: ''
    },
    // Adding Bank Details
    bankDetails: {
      bankName: '',
      accountName: '',
      accountNumber: '',
      ifscCode: '',
      branchName: ''
    }
  });

  // User Profile State
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    emailPreferences: {
      invoiceSent: true,
      paymentReceived: true,
      lowStock: true,
      gstFiling: true,
      weeklyReport: false,
    },
    notificationPreferences: {
      invoiceCreated: true,
      invoiceDue: true,
      invoiceOverdue: true,
      paymentReceived: true,
      paymentFailed: true,
      stockLow: true,
      stockCritical: true,
      gstFiling: true,
      invoiceRequired: true
    }
  });

  // Password State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [sessions, setSessions] = useState<any[]>([]);

  // Logo state
  const [logo, setLogo] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Signatures state (up to 2 signatures)
  const [signatures, setSignatures] = useState<Array<{ name: string; designation: string; image: string }>>([]);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const signatureInputRef1 = useRef<HTMLInputElement>(null);
  const signatureInputRef2 = useRef<HTMLInputElement>(null);
  const [signatureNames, setSignatureNames] = useState<[string, string]>(['', '']);
  const [signatureDesignations, setSignatureDesignations] = useState<[string, string]>(['', '']);

  // UPI state
  const [upiId, setUpiId] = useState('');
  const [isSavingUpi, setIsSavingUpi] = useState(false);

  // Fetch all settings
  const fetchSettings = async () => {
    try {
      if (!token) return;

      // 1. Fetch Business Settings
      const businessRes = await fetch('/api/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const businessJson = await businessRes.json();

      if (businessJson.success && businessJson.data) {
        const data = businessJson.data;
        setBusinessData({
          businessName: data.businessName || '',
          email: data.email || '',
          phone: data.phone || '',
          gstin: data.gstin || '',
          pan: data.pan || '',
          invoicePrefix: data.invoicePrefix || 'INV-',
          nextInvoiceNumber: data.nextInvoiceNumber || 1,
          nonGstInvoicePrefix: data.nonGstInvoicePrefix || 'BILL-',
          nextNonGstInvoiceNumber: data.nextNonGstInvoiceNumber || 1,
          address: {
            line1: data.address?.line1 || '',
            city: data.address?.city || '',
            state: data.address?.state || 'MH',
            pincode: data.address?.pincode || ''
          },
          bankDetails: {
            bankName: data.bankDetails?.bankName || '',
            accountName: data.bankDetails?.accountName || '',
            accountNumber: data.bankDetails?.accountNumber || '',
            ifscCode: data.bankDetails?.ifscCode || '',
            branchName: data.bankDetails?.branchName || ''
          }
        });

        // Set logo if exists
        if (data.logo) {
          setLogo(data.logo);
        }
      }

      // 2. Fetch Profile Settings
      const profileRes = await fetch('/api/settings/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const profileJson = await profileRes.json();

      if (profileJson.success && profileJson.data) {
        const data = profileJson.data;
        setProfileData(prev => ({
          ...prev,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          role: data.role || '',
          emailPreferences: { ...prev.emailPreferences, ...(data.emailPreferences || {}) },
          notificationPreferences: { ...prev.notificationPreferences, ...(data.notificationPreferences || {}) }
        }));
      }

      // 3. Fetch Sessions
      const sessionRes = await fetch('/api/settings/sessions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sessionData = await sessionRes.json();
      if (sessionData.success) {
        setSessions(sessionData.data);
      }

      // 4. Fetch Signatures and UPI
      const signaturesRes = await fetch('/api/settings/signatures', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const signaturesData = await signaturesRes.json();
      if (signaturesData.success && signaturesData.data) {
        setSignatures(signaturesData.data.signatures || []);
        setUpiId(signaturesData.data.upiId || '');
        // Set signature names and designations for editing
        const sigs = signaturesData.data.signatures || [];
        setSignatureNames([
          sigs[0]?.name || '',
          sigs[1]?.name || ''
        ]);
        setSignatureDesignations([
          sigs[0]?.designation || '',
          sigs[1]?.designation || ''
        ]);
      }

    } catch (error) {
      console.error(error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [token]);

  // Handler for Saving Business Settings (Includes Bank Details)
  const handleSaveBusiness = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(businessData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update business settings');
      }
      toast.success('Business settings and bank details saved!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save business settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Handler for Saving Profile (Info, Email Prefs, Notification Prefs)
  const handleSaveProfile = async (section: 'info' | 'email' | 'notifications' = 'info') => {
    setIsSaving(true);
    try {
      // We send the whole profile object or just parts, API merges it.
      // Sending specific parts makes sense visually for the user feedback

      const payload: any = {};

      if (section === 'info') {
        payload.firstName = profileData.firstName;
        payload.lastName = profileData.lastName;
        payload.phone = profileData.phone;
      } else if (section === 'email') {
        payload.emailPreferences = profileData.emailPreferences;
      } else if (section === 'notifications') {
        payload.notificationPreferences = profileData.notificationPreferences;
      }

      const res = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      // Update local context if name changed
      if (section === 'info') {
        refreshAuth();
      }

      toast.success(`${section === 'info' ? 'Profile' : section === 'email' ? 'Email preferences' : 'Notification settings'} saved!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Handler for Updating Password
  const handleUpdatePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/settings/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');

      toast.success('Password updated successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setIsSaving(false);
    }
  };

  // Handler for Logo Upload
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 2MB');
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload JPG, PNG, GIF or WebP');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const res = await fetch('/api/settings/logo', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload logo');

      setLogo(data.data.logo);
      toast.success('Logo uploaded successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handler for Logo Delete
  const handleLogoDelete = async () => {
    setIsUploadingLogo(true);
    try {
      const res = await fetch('/api/settings/logo', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove logo');

      setLogo(null);
      toast.success('Logo removed successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Handler for Signature Upload
  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const name = signatureNames[index];
    const designation = signatureDesignations[index];

    if (!name.trim()) {
      toast.error('Please enter signatory name before uploading');
      return;
    }

    setIsUploadingSignature(true);
    try {
      const formData = new FormData();
      formData.append('signature', file);
      formData.append('name', name);
      formData.append('designation', designation);
      formData.append('index', index.toString());

      const res = await fetch('/api/settings/signatures', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload signature');

      setSignatures(data.data.signatures);
      toast.success('Signature uploaded successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload signature');
    } finally {
      setIsUploadingSignature(false);
    }
  };

  // Handler for Signature Delete
  const handleSignatureDelete = async (index: number) => {
    setIsUploadingSignature(true);
    try {
      const res = await fetch(`/api/settings/signatures?index=${index}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove signature');

      setSignatures(data.data.signatures);
      // Clear the name and designation for this slot
      const newNames = [...signatureNames] as [string, string];
      const newDesignations = [...signatureDesignations] as [string, string];
      newNames[index] = '';
      newDesignations[index] = '';
      setSignatureNames(newNames);
      setSignatureDesignations(newDesignations);
      toast.success('Signature removed successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove signature');
    } finally {
      setIsUploadingSignature(false);
    }
  };

  // Handler for saving UPI ID
  const handleSaveUpi = async () => {
    setIsSavingUpi(true);
    try {
      const res = await fetch('/api/settings/signatures', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ upiId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save UPI ID');

      toast.success('UPI ID saved successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save UPI ID');
    } finally {
      setIsSavingUpi(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-1">
          Manage your business configuration and account preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="grid grid-cols-5 w-full bg-slate-100 p-1">
          <TabsTrigger value="business" className="gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Business</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="w-4 h-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-2">
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Billing</span>
          </TabsTrigger>
        </TabsList>

        {/* ==================== BUSINESS TAB ==================== */}
        <TabsContent value="business" className="space-y-6 focus-visible:ring-0">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Core details about your business</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload Section */}
              <div className="space-y-4">
                <Label>Business Logo</Label>
                <div className="flex items-start gap-6">
                  {/* Logo Preview */}
                  <div className="relative">
                    {logo ? (
                      <div className="relative w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
                        <img
                          src={logo}
                          alt="Business Logo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                        <ImageIcon className="w-10 h-10 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex flex-col gap-3">
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleLogoUpload}
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden"
                        id="logo-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingLogo}
                        className="gap-2"
                      >
                        {isUploadingLogo ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        {logo ? 'Change Logo' : 'Upload Logo'}
                      </Button>
                    </div>

                    {logo && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleLogoDelete}
                        disabled={isUploadingLogo}
                        className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove Logo
                      </Button>
                    )}

                    <p className="text-xs text-gray-500">
                      Recommended: Square image, max 2MB<br />
                      Formats: JPG, PNG, GIF, WebP
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6"></div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Business Name</Label>
                  <Input
                    value={businessData.businessName}
                    onChange={(e) => setBusinessData({ ...businessData, businessName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Company Email</Label>
                  <Input
                    type="email"
                    value={businessData.email}
                    onChange={(e) => setBusinessData({ ...businessData, email: e.target.value })}
                    placeholder="contact@company.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Company Phone</Label>
                  <Input
                    type="tel"
                    value={businessData.phone}
                    onChange={(e) => setBusinessData({ ...businessData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="space-y-2">
                  <Label>GSTIN</Label>
                  <Input
                    value={businessData.gstin}
                    onChange={(e) => setBusinessData({ ...businessData, gstin: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>PAN</Label>
                  <Input
                    value={businessData.pan}
                    onChange={(e) => setBusinessData({ ...businessData, pan: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={businessData.address.line1}
                    onChange={(e) => setBusinessData({
                      ...businessData,
                      address: { ...businessData.address, line1: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={businessData.address.city}
                    onChange={(e) => setBusinessData({
                      ...businessData,
                      address: { ...businessData.address, city: e.target.value }
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Registered State</Label>
                  <Select
                    value={businessData.address.state}
                    onValueChange={(val) => setBusinessData({
                      ...businessData,
                      address: { ...businessData.address, state: val }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Pincode</Label>
                  <Input
                    value={businessData.address.pincode}
                    onChange={(e) => setBusinessData({
                      ...businessData,
                      address: { ...businessData.address, pincode: e.target.value }
                    })}
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label>GST Invoice Prefix</Label>
                  <Input
                    value={businessData.invoicePrefix}
                    onChange={(e) => setBusinessData({ ...businessData, invoicePrefix: e.target.value })}
                    maxLength={10}
                  />
                  <p className="text-xs text-slate-500">Prefix for GST Bills (e.g. INV-)</p>
                </div>

                <div className="space-y-2">
                  <Label>Next GST Invoice Number</Label>
                  <Input
                    type="number"
                    value={businessData.nextInvoiceNumber}
                    onChange={(e) => setBusinessData({ ...businessData, nextInvoiceNumber: parseInt(e.target.value) })}
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Non-GST Invoice Prefix</Label>
                  <Input
                    value={businessData.nonGstInvoicePrefix}
                    onChange={(e) => setBusinessData({ ...businessData, nonGstInvoicePrefix: e.target.value })}
                    maxLength={10}
                    placeholder="BILL-"
                  />
                  <p className="text-xs text-slate-500">Prefix for Non-GST Bills (e.g. BILL-)</p>
                </div>

                <div className="space-y-2">
                  <Label>Next Non-GST Invoice Number</Label>
                  <Input
                    type="number"
                    value={businessData.nextNonGstInvoiceNumber}
                    onChange={(e) => setBusinessData({ ...businessData, nextNonGstInvoiceNumber: parseInt(e.target.value) })}
                    min="1"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveBusiness} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Business Info
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bank Account Details</CardTitle>
              <CardDescription>For payment receipts and NEFT transfers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  <Input
                    value={businessData.bankDetails.bankName}
                    onChange={(e) => setBusinessData({
                      ...businessData,
                      bankDetails: { ...businessData.bankDetails, bankName: e.target.value }
                    })}
                    placeholder="HDFC Bank"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Holder Name</Label>
                  <Input
                    value={businessData.bankDetails.accountName}
                    onChange={(e) => setBusinessData({
                      ...businessData,
                      bankDetails: { ...businessData.bankDetails, accountName: e.target.value }
                    })}
                    placeholder="ABC Corporation"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input
                    value={businessData.bankDetails.accountNumber}
                    onChange={(e) => setBusinessData({
                      ...businessData,
                      bankDetails: { ...businessData.bankDetails, accountNumber: e.target.value }
                    })}
                    placeholder="1234567890"
                  />
                </div>
                <div className="space-y-2">
                  <Label>IFSC Code</Label>
                  <Input
                    value={businessData.bankDetails.ifscCode}
                    onChange={(e) => setBusinessData({
                      ...businessData,
                      bankDetails: { ...businessData.bankDetails, ifscCode: e.target.value.toUpperCase() }
                    })}
                    placeholder="HDFC0001234"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Branch Name</Label>
                  <Input
                    value={businessData.bankDetails.branchName}
                    onChange={(e) => setBusinessData({
                      ...businessData,
                      bankDetails: { ...businessData.bankDetails, branchName: e.target.value }
                    })}
                    placeholder="Main Branch"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveBusiness} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Bank Details
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Authorized Signatures Section */}
          <Card>
            <CardHeader>
              <CardTitle>Authorized Signatures</CardTitle>
              <CardDescription>
                Add up to 2 authorized signatories for invoices. These will appear on generated PDFs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Signature 1 */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-semibold text-slate-900">Signatory 1</h4>
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={signatureNames[0]}
                      onChange={(e) => setSignatureNames([e.target.value, signatureNames[1]])}
                      placeholder="e.g., John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Designation</Label>
                    <Input
                      value={signatureDesignations[0]}
                      onChange={(e) => setSignatureDesignations([e.target.value, signatureDesignations[1]])}
                      placeholder="e.g., Managing Director"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Signature Image</Label>
                    {signatures[0]?.image ? (
                      <div className="relative">
                        <img
                          src={signatures[0].image}
                          alt="Signature 1"
                          className="h-20 object-contain border rounded bg-white p-2"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-0 right-0"
                          onClick={() => handleSignatureDelete(0)}
                          disabled={isUploadingSignature}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <input
                          ref={signatureInputRef1}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleSignatureUpload(e, 0)}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => signatureInputRef1.current?.click()}
                          disabled={isUploadingSignature || !signatureNames[0].trim()}
                        >
                          {isUploadingSignature ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="mr-2 h-4 w-4" />
                          )}
                          Upload Signature
                        </Button>
                        {!signatureNames[0].trim() && (
                          <p className="text-xs text-amber-600 mt-1">Enter name first</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Signature 2 */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-semibold text-slate-900">Signatory 2</h4>
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={signatureNames[1]}
                      onChange={(e) => setSignatureNames([signatureNames[0], e.target.value])}
                      placeholder="e.g., Jane Smith"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Designation</Label>
                    <Input
                      value={signatureDesignations[1]}
                      onChange={(e) => setSignatureDesignations([signatureDesignations[0], e.target.value])}
                      placeholder="e.g., Accountant"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Signature Image</Label>
                    {signatures[1]?.image ? (
                      <div className="relative">
                        <img
                          src={signatures[1].image}
                          alt="Signature 2"
                          className="h-20 object-contain border rounded bg-white p-2"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-0 right-0 text-white"
                          onClick={() => handleSignatureDelete(1)}
                          disabled={isUploadingSignature}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <input
                          ref={signatureInputRef2}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleSignatureUpload(e, 1)}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => signatureInputRef2.current?.click()}
                          disabled={isUploadingSignature || !signatureNames[1].trim()}
                        >
                          {isUploadingSignature ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="mr-2 h-4 w-4" />
                          )}
                          Upload Signature
                        </Button>
                        {!signatureNames[1].trim() && (
                          <p className="text-xs text-amber-600 mt-1">Enter name first</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* UPI Payment Section */}
          <Card>
            <CardHeader>
              <CardTitle>UPI Payment Details</CardTitle>
              <CardDescription>
                Add your UPI ID to display a QR code on invoices for easy payments.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>UPI ID</Label>
                    <Input
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="yourname@upi"
                    />
                    <p className="text-xs text-slate-500">
                      Example: business@okaxis, 9876543210@paytm
                    </p>
                  </div>
                  <Button onClick={handleSaveUpi} disabled={isSavingUpi}>
                    {isSavingUpi ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save UPI ID
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>QR Code Preview</Label>
                  {upiId ? (
                    <div className="border rounded-lg p-4 bg-white inline-block">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(businessData.businessName || 'Business')}`}
                        alt="UPI QR Code"
                        className="w-36 h-36"
                      />
                      <p className="text-center text-sm text-slate-600 mt-2">{upiId}</p>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-8 bg-slate-50 text-center text-slate-500">
                      <p>Enter UPI ID to see QR preview</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== ACCOUNT TAB ==================== */}
        <TabsContent value="account" className="space-y-6 focus-visible:ring-0">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Your personal account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="bg-gray-100"
                  />
                  <p className="text-xs text-gray-500">Contact admin to change email</p>
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input value={profileData.role} disabled className="bg-gray-100 capitalize" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => handleSaveProfile('info')} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Preferences</CardTitle>
              <CardDescription>Manage how you receive communications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  { id: 'invoiceSent', label: 'Invoice sent to customer' },
                  { id: 'paymentReceived', label: 'Payment received' },
                  { id: 'lowStock', label: 'Low stock alerts' },
                  { id: 'gstFiling', label: 'GST filing reminders' },
                  { id: 'weeklyReport', label: 'Weekly sales report' },
                ].map((pref) => (
                  <label key={pref.id} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(profileData.emailPreferences as any)[pref.id]}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        emailPreferences: { ...profileData.emailPreferences, [pref.id]: e.target.checked }
                      })}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm text-slate-700">{pref.label}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-end">
                <Button onClick={() => handleSaveProfile('email')} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Email Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== SECURITY TAB ==================== */}
        <TabsContent value="security" className="space-y-6 focus-visible:ring-0">
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>Manage your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input
                  type="password"
                  placeholder="Enter current password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input
                  type="password"
                  placeholder="Enter new password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Confirm Password</Label>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleUpdatePassword} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            {/* 2FA Section (Placeholder for now) */}
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                Two-factor authentication is not currently enabled on your account.
              </p>
              <Button variant="outline" disabled>Enable 2FA (Coming Soon)</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>Manage your active login sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sessions.length === 0 ? (
                  <p className="text-sm text-slate-500">No active sessions found.</p>
                ) : (
                  sessions.map((session, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-semibold">{session.device || 'Unknown Device'}</p>
                        <p className="text-xs text-slate-500">
                          {session.ip} • {session.location} • Last active: {new Date(session.lastActive).toLocaleString()}
                        </p>
                      </div>
                      {!session.current && (
                        <Button variant="outline" size="sm">
                          Sign Out
                        </Button>
                      )}
                      {session.current && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          Current
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== NOTIFICATIONS TAB ==================== */}
        <TabsContent value="notifications" className="space-y-6 focus-visible:ring-0">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure alerts for important business events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {[
                  {
                    title: 'Invoice-Related Alerts',
                    alerts: [
                      { id: 'invoiceCreated', label: 'New invoice created' },
                      { id: 'invoiceDue', label: 'Invoice due date approaching' },
                      { id: 'invoiceOverdue', label: 'Invoice overdue' },
                    ],
                  },
                  {
                    title: 'Payment Alerts',
                    alerts: [
                      { id: 'paymentReceived', label: 'Payment received' },
                      { id: 'paymentFailed', label: 'Payment failed' },
                    ],
                  },
                  {
                    title: 'Inventory Alerts',
                    alerts: [
                      { id: 'stockLow', label: 'Low stock warning' },
                      { id: 'stockCritical', label: 'Critical stock level' },
                    ],
                  },
                ].map((section) => (
                  <div key={section.title}>
                    <h4 className="font-semibold mb-2 text-slate-900">{section.title}</h4>
                    <div className="space-y-2 pl-4">
                      {section.alerts.map((alert) => (
                        <label
                          key={alert.id}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={(profileData.notificationPreferences as any)[alert.id]}
                            onChange={(e) => setProfileData({
                              ...profileData,
                              notificationPreferences: { ...profileData.notificationPreferences, [alert.id]: e.target.checked }
                            })}
                            className="w-4 h-4 rounded"
                          />
                          <span className="text-sm text-slate-700">{alert.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <Button onClick={() => handleSaveProfile('notifications')} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== BILLING TAB (Static) ==================== */}
        <TabsContent value="payment" className="space-y-6 focus-visible:ring-0">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plan</CardTitle>
              <CardDescription>Your current billing information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg bg-slate-50">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">Professional Plan</p>
                    <p className="text-sm text-slate-600">
                      ₹999/month • Unlimited invoices, customers, products
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹999/month</p>
                    <p className="text-xs text-slate-500">Next billing: Mar 3, 2024</p>
                  </div>
                </div>
              </div>
              <Button variant="outline">Change Plan</Button>
              <Button variant="outline" className="text-red-600 bg-transparent hover:bg-red-50">
                Cancel Subscription
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>Your recent invoices and payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { date: '2024-02-03', amount: '₹999', status: 'Paid' },
                  { date: '2024-01-03', amount: '₹999', status: 'Paid' },
                  { date: '2023-12-03', amount: '₹999', status: 'Paid' },
                ].map((bill, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-semibold">{bill.date}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-semibold">{bill.amount}</p>
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                        {bill.status}
                      </span>
                      <Button variant="ghost" size="sm">
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
