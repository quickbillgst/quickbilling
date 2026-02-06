'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const forgotPasswordSchema = z.object({
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        getValues,
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: '',
        },
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: data.email }),
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || 'Failed to send reset email');
            }

            setEmailSent(true);
            toast.success('Password reset link sent to your email!');
        } catch (error: any) {
            toast.error(error.message || 'Failed to send reset email');
        } finally {
            setIsLoading(false);
        }
    };

    if (emailSent) {
        return (
            <div className="flex flex-col space-y-6 text-center animate-in fade-in zoom-in duration-300">
                <div className="flex justify-center">
                    <div className="rounded-full bg-green-100 p-4">
                        <CheckCircle className="h-12 w-12 text-green-600" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Check Your Email
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        We've sent a password reset link to
                    </p>
                    <p className="text-sm font-medium">{getValues('email')}</p>
                </div>

                <div className="space-y-4 pt-4">
                    <p className="text-sm text-muted-foreground">
                        Click the link in the email to reset your password. The link will expire in 1 hour.
                    </p>

                    <div className="pt-4">
                        <Link href="/login">
                            <Button variant="outline" className="w-full">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Login
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-2 text-center sm:text-left animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Forgot Password?
                </h1>
                <p className="text-sm text-muted-foreground">
                    Enter your email address and we'll send you a link to reset your password
                </p>
            </div>

            <div className="grid gap-6 py-6">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4">
                        {/* Email Field */}
                        <div className="grid gap-2">
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
                                <p className="text-sm text-red-500 animate-pulse">{errors.email.message}</p>
                            )}
                        </div>

                        <Button disabled={isLoading} type="submit" className="w-full mt-2">
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Mail className="mr-2 h-4 w-4" />
                                    Send Reset Link
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
