'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const resetPasswordSchema = z.object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    const [tokenValid, setTokenValid] = useState<boolean | null>(null);

    const token = searchParams.get('token');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            password: '',
            confirmPassword: '',
        },
    });

    // Verify token on mount
    useEffect(() => {
        if (!token) {
            setTokenValid(false);
            return;
        }

        const verifyToken = async () => {
            try {
                const res = await fetch(`/api/auth/verify-reset-token?token=${token}`);
                setTokenValid(res.ok);
                if (!res.ok) {
                    toast.error('Invalid or expired reset link');
                }
            } catch (error) {
                setTokenValid(false);
                toast.error('Failed to verify reset link');
            }
        };

        verifyToken();
    }, [token]);

    const onSubmit = async (data: ResetPasswordFormData) => {
        if (!token) {
            toast.error('Invalid reset link');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    password: data.password,
                }),
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || 'Failed to reset password');
            }

            setResetSuccess(true);
            toast.success('Password reset successfully!');

            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (error: any) {
            toast.error(error.message || 'Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    if (tokenValid === null) {
        return (
            <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Verifying reset link...</p>
            </div>
        );
    }

    if (tokenValid === false) {
        return (
            <div className="flex flex-col space-y-6 text-center">
                <div className="flex justify-center">
                    <div className="rounded-full bg-red-100 p-4">
                        <Lock className="h-12 w-12 text-red-600" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Invalid Reset Link
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        This password reset link is invalid or has expired.
                    </p>
                </div>

                <div className="space-y-4 pt-4">
                    <Link href="/forgot-password">
                        <Button className="w-full">
                            Request New Reset Link
                        </Button>
                    </Link>

                    <Link href="/login">
                        <Button variant="outline" className="w-full">
                            Back to Login
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    if (resetSuccess) {
        return (
            <div className="flex flex-col space-y-6 text-center animate-in fade-in zoom-in duration-300">
                <div className="flex justify-center">
                    <div className="rounded-full bg-green-100 p-4">
                        <CheckCircle className="h-12 w-12 text-green-600" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Password Reset Successful!
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Your password has been reset successfully.
                    </p>
                </div>

                <div className="space-y-4 pt-4">
                    <p className="text-sm text-muted-foreground">
                        Redirecting to login page...
                    </p>

                    <Link href="/login">
                        <Button className="w-full">
                            Go to Login
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-2 text-center sm:text-left animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Reset Your Password
                </h1>
                <p className="text-sm text-muted-foreground">
                    Enter your new password below
                </p>
            </div>

            <div className="grid gap-6 py-6">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4">
                        {/* Password Field */}
                        <div className="grid gap-2">
                            <Label htmlFor="password">New Password</Label>
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
                                <p className="text-sm text-red-500 animate-pulse">{errors.password.message}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Must be at least 8 characters long
                            </p>
                        </div>

                        {/* Confirm Password Field */}
                        <div className="grid gap-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                    disabled={isLoading}
                                    {...register('confirmPassword')}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    disabled={isLoading}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </Button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="text-sm text-red-500 animate-pulse">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        <Button disabled={isLoading} type="submit" className="w-full mt-2">
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Resetting Password...
                                </>
                            ) : (
                                <>
                                    <Lock className="mr-2 h-4 w-4" />
                                    Reset Password
                                </>
                            )}
                        </Button>
                    </div>
                </form>

                <div className="text-center text-sm text-muted-foreground">
                    Remember your password?{' '}
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

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
