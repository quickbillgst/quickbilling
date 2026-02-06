'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, Eye, EyeOff, Building2, User, FileText, ArrowRight } from 'lucide-react';

import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const registerSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  firstName: z.string().min(2, 'First name must be at least 2 characters').optional().or(z.literal('')),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').optional().or(z.literal('')),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format').optional().or(z.literal('')),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      businessName: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      gstin: ''
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await registerUser(data);
      toast.success('Account created successfully!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-2 text-center sm:text-left animate-in fade-in zoom-in duration-300">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create an account
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your details below to create your account
        </p>
      </div>

      <div className="grid gap-6 py-6" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left px-1">

          {/* Business Name */}
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="businessName"
                placeholder="Acme Corp"
                className={`pl-10 ${errors.businessName ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                disabled={isLoading}
                {...register('businessName')}
              />
            </div>
            {errors.businessName && (
              <p className="text-sm text-red-500">{errors.businessName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="firstName"
                  placeholder="John"
                  className={`pl-10 ${errors.firstName ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  disabled={isLoading}
                  {...register('firstName')}
                />
              </div>
              {errors.firstName && (
                <p className="text-sm text-red-500">{errors.firstName.message}</p>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                className={`${errors.lastName ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                disabled={isLoading}
                {...register('lastName')}
              />
              {errors.lastName && (
                <p className="text-sm text-red-500">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                className={`pl-10 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                disabled={isLoading}
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className={`pl-10 pr-10 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                disabled={isLoading}
                {...register('password')}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Must be at least 8 characters long.
            </p>
          </div>

          {/* GSTIN */}
          <div className="space-y-2">
            <Label htmlFor="gstin">GSTIN <span className="text-muted-foreground text-xs font-normal">(Optional)</span></Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="gstin"
                placeholder="22AAAAA0000A1Z5"
                className={`pl-10 uppercase ${errors.gstin ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                disabled={isLoading}
                {...register('gstin')}
              />
            </div>
            {errors.gstin && (
              <p className="text-sm text-red-500">{errors.gstin.message}</p>
            )}
          </div>

          <Button disabled={isLoading} type="submit" className="w-full mt-4 group">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                Create Account
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-primary hover:text-primary/90 hover:underline transition-all"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
