'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Lock, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const queryError = searchParams?.get('error');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(
    queryError
      ? 'This password reset link is invalid, expired, or was requested from another browser. Please request a fresh reset link below.'
      : null
  );
  const [success, setSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(!queryError);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    if (queryError) {
      return;
    }

    const supabase = createClient();
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');

    // 1. If there's a code in query params, attempt exchange (handles direct links)
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error: exchangeError }) => {
        setIsVerifying(false);
        if (exchangeError) {
          setError(
            'This password reset link is invalid, expired, or was requested from another browser. Please request a fresh reset link below.'
          );
        } else {
          setHasSession(true);
        }
      });
      return;
    }

    // 2. Check current session (e.g., exchanged by /auth/callback route handler or hash fragment)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setHasSession(true);
        setError(null);
      }
      setIsVerifying(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setHasSession(true);
        setError(null);
      }
      setIsVerifying(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryError, searchParams]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!password || password.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsPending(true);
    const supabase = createClient();

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    setIsPending(false);

    if (updateError) {
      setError(
        updateError.message === 'Auth session missing!'
          ? 'Your password reset session has expired. Please request a new reset link.'
          : updateError.message
      );
      return;
    }

    setSuccess(true);
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-[#1E6B34]/25 bg-white dark:bg-zinc-900">
        <CardHeader className="space-y-2 text-center pb-4">
          <div className="relative mx-auto h-16 w-16 shrink-0 rounded-full bg-white p-1 shadow-md border-2 border-[#D4A017] overflow-hidden flex items-center justify-center">
            <Image
              src="/images/muranga-logo.webp"
              alt="Muranga county government logo"
              fill
              unoptimized
              className="object-contain p-0.5"
              priority
            />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Set New Password
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            Enter and confirm your new secure password
          </CardDescription>
        </CardHeader>

        {success ? (
          <CardContent className="space-y-4 pt-2 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-[#1E6B34] dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Password Successfully Reset!
              </h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                Your new credentials are now active. You can proceed to sign in to your citizen account.
              </p>
            </div>
            <Link href="/login" className="block pt-2">
              <Button className="w-full gap-2 bg-[#D4A017] hover:bg-[#B8860B] text-white">
                <span>Sign In with New Password</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        ) : isVerifying ? (
          <CardContent className="py-10 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#1E6B34] dark:text-emerald-400" />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Verifying your reset security session...
            </p>
          </CardContent>
        ) : !hasSession && error ? (
          <CardContent className="space-y-4 text-center py-4">
            <div className="flex items-start gap-2.5 rounded-lg bg-rose-50 p-4 text-sm text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900 text-left">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold block">Reset Link Expired</span>
                <span className="text-xs opacity-90">{error}</span>
              </div>
            </div>
            <Link href="/login?forgot=true" className="block pt-2">
              <Button className="w-full bg-[#D4A017] hover:bg-[#B8860B] text-white font-semibold">
                Request New Reset Link
              </Button>
            </Link>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5"
                >
                  <Lock className="h-3.5 w-3.5 text-[#1E6B34] dark:text-emerald-400" />
                  <span>New Password (min 8 characters)</span>
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 focus-visible:ring-[#1E6B34]"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirm_password"
                  className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5"
                >
                  <Lock className="h-3.5 w-3.5 text-[#1E6B34] dark:text-emerald-400" />
                  <span>Confirm New Password</span>
                </Label>
                <Input
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 focus-visible:ring-[#1E6B34]"
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-3 pt-2">
              <Button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 py-5 bg-[#D4A017] hover:bg-[#B8860B] text-white font-semibold shadow-sm"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <span>Save New Password</span>
                )}
              </Button>

              <Link
                href="/login"
                className="text-xs text-center text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Cancel & return to Sign In
              </Link>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#1E6B34]" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
