'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useActionState, useEffect, useState, Suspense } from 'react';
import { toast } from 'sonner';
import Form from 'next/form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/submit-button';

import { resetPassword, type ResetPasswordActionState } from '../actions';

// Create a client component that uses useSearchParams
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<ResetPasswordActionState, FormData>(
    resetPassword,
    {
      status: 'idle',
    },
  );

  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing reset token');
    }
  }, [token]);

  useEffect(() => {
    if (state.status === 'invalid_token') {
      toast.error('Invalid or expired reset token');
    } else if (state.status === 'failed') {
      toast.error('Failed to reset password');
    } else if (state.status === 'invalid_data') {
      toast.error('Please check your password inputs');
    } else if (state.status === 'success') {
      toast.success('Password reset successfully');
      setIsSuccessful(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }
  }, [state.status, router]);

  const handleSubmit = (formData: FormData) => {
    if (token) {
      formData.append('token', token);
    }
    formAction(formData);
  };

  if (!token) {
    return (
      <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
        <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
          <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
            <h3 className="text-xl font-semibold dark:text-zinc-50">Invalid Request</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              The password reset link is invalid or has expired.
            </p>
            <Button asChild className="mt-6">
              <Link href="/forgot-password">Request a new link</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Reset Password</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Enter your new password below
          </p>
        </div>
        
        {isSuccessful ? (
          <div className="flex flex-col gap-4 px-4 sm:px-16">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md">
              <p className="text-sm text-green-800 dark:text-green-300">
                Your password has been reset successfully. Redirecting to login...
              </p>
            </div>
          </div>
        ) : (
          <Form action={handleSubmit} className="flex flex-col gap-4 px-4 sm:px-16">
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="password"
                className="text-zinc-600 font-normal dark:text-zinc-400"
              >
                New Password
              </Label>

              <Input
                id="password"
                name="password"
                className="bg-muted text-md md:text-sm"
                type="password"
                placeholder="••••••••"
                required
                autoFocus
                minLength={6}
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="confirmPassword"
                className="text-zinc-600 font-normal dark:text-zinc-400"
              >
                Confirm New Password
              </Label>

              <Input
                id="confirmPassword"
                name="confirmPassword"
                className="bg-muted text-md md:text-sm"
                type="password"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <SubmitButton isSuccessful={isSuccessful}>Reset Password</SubmitButton>
            
            <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
              <Link
                href="/login"
                className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
              >
                Back to login
              </Link>
            </p>
          </Form>
        )}
      </div>
    </div>
  );
}

// Create a loading fallback for the Suspense boundary
function ResetPasswordLoading() {
  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
        </div>
        
        <div className="flex flex-col gap-4 px-4 sm:px-16">
          <div className="h-20 bg-muted rounded animate-pulse" />
          <div className="h-20 bg-muted rounded animate-pulse" />
          <div className="h-10 bg-muted rounded animate-pulse mt-4" />
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordForm />
    </Suspense>
  );
} 