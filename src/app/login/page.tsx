'use client';

import { useState, useActionState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { login, forgotPassword, type AuthState } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Shield, AlertCircle, Loader2, Sparkles, KeyRound, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

const initialState: AuthState = {};

function LoginForm() {
  const searchParams = useSearchParams();
  const [loginState, loginAction, isLoginPending] = useActionState(login, initialState);
  const [forgotState, forgotAction, isForgotPending] = useActionState(forgotPassword, initialState);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showAdminHelper, setShowAdminHelper] = useState(false);
  const isForgotFromQuery = searchParams.get('forgot') === 'true';
  const [isForgotPasswordOverride, setIsForgotPasswordOverride] = useState<boolean | null>(null);
  const isForgotPassword = isForgotPasswordOverride ?? isForgotFromQuery;

  // Autofill administrative demo credentials
  const fillAdminCredentials = () => {
    setEmail('admin@gmail.com');
    setPassword('Admin@2025');
    setShowAdminHelper(true);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-[#1E6B34]/25 bg-white dark:bg-zinc-900">
        <CardHeader className="space-y-2 text-center pb-4">
          {/* County Logo in Full Color */}
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
            {isForgotPassword ? 'Reset Password' : 'Portal Sign In'}
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            {isForgotPassword
              ? 'Enter your registered email address to receive password reset instructions'
              : 'Murang\'a County Public Service Request & Management Portal'}
          </CardDescription>
        </CardHeader>

        {isForgotPassword ? (
          /* FORGOT PASSWORD FORM */
          <form action={forgotAction}>
            <CardContent className="space-y-4">
              {forgotState.error && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{forgotState.error}</span>
                </div>
              )}

              {forgotState.success && (
                <div
                  role="status"
                  className="flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{forgotState.message}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="reset_email" className="text-zinc-900 dark:text-zinc-100 font-semibold text-xs flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-[#1E6B34] dark:text-emerald-400" />
                  <span>Registered Email Address</span>
                </Label>
                <Input
                  id="reset_email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="youremail@example.com"
                  defaultValue={email}
                  required
                  className="border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 focus-visible:ring-[#1E6B34]"
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-3 pt-2">
              <Button
                type="submit"
                disabled={isForgotPending}
                className="w-full flex items-center justify-center gap-2 py-5 bg-[#D4A017] hover:bg-[#B8860B] text-white font-semibold shadow-md"
              >
                {isForgotPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <span>Send Password Reset Link</span>
                )}
              </Button>

              <button
                type="button"
                onClick={() => setIsForgotPasswordOverride(false)}
                className="inline-flex items-center justify-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white pt-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Sign In</span>
              </button>
            </CardFooter>
          </form>
        ) : (
          /* STANDARD LOGIN FORM */
          <form action={loginAction}>
            <CardContent className="space-y-4">
              {loginState.error && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{loginState.error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-900 dark:text-zinc-100 font-semibold text-xs">
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="youremail@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 focus-visible:ring-[#1E6B34]"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-zinc-900 dark:text-zinc-100 font-semibold text-xs">
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOverride(true)}
                    className="text-xs font-semibold text-[#1E6B34] hover:text-[#144d24] dark:text-emerald-400 dark:hover:text-emerald-300 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 focus-visible:ring-[#1E6B34]"
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-2">
              {/* Primary Action Button (Gold with White Text) */}
              <Button
                type="submit"
                disabled={isLoginPending}
                className="w-full flex items-center justify-center gap-2 py-5 bg-[#D4A017] hover:bg-[#B8860B] text-white font-semibold shadow-md"
              >
                {isLoginPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    <span>Sign In to Portal</span>
                  </>
                )}
              </Button>

              {/* Citizen Register link */}
              <p className="text-center text-xs text-zinc-600 dark:text-zinc-400">
                Don&apos;t have an account?{' '}
                <Link
                  href="/register"
                  className="font-semibold text-[#1E6B34] hover:text-[#144d24] dark:text-emerald-400 dark:hover:text-emerald-300 underline underline-offset-4"
                >
                  Register as a Citizen
                </Link>
              </p>

              {/* Log in as Admin button below 'Don't have an account...' */}
              <div className="w-full pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={fillAdminCredentials}
                  className="w-full gap-2 border-[#1E6B34]/30 text-[#1E6B34] hover:bg-emerald-50 hover:text-[#144d24] dark:border-[#1E6B34]/50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 text-xs font-semibold py-4"
                >
                  <Shield className="h-4 w-4 text-[#1E6B34] dark:text-emerald-400" />
                  <span>Log in as Admin</span>
                </Button>

                {/* Autofill admin shortcut */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={fillAdminCredentials}
                    className="text-[11px] text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 underline"
                  >
                    (Autofill admin: admin@ecitizen.ke)
                  </button>
                </div>

                {/* Autofill Admin persistent button/banner when admin mode is selected */}
                {showAdminHelper && (
                  <div className="rounded-lg border border-[#1E6B34]/25 bg-emerald-50/70 dark:bg-emerald-950/40 p-2.5 flex items-center justify-between text-xs animate-in fade-in">
                    <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-200 font-mono text-[11px]">
                      <span className="font-semibold text-[#1E6B34] dark:text-emerald-400">Admin Loaded:</span>
                      <span>admin@ecitizen.ke</span>
                    </div>
                    <button
                      type="button"
                      onClick={fillAdminCredentials}
                      className="inline-flex items-center gap-1 font-semibold text-[#D4A017] hover:text-[#B8860B] underline text-xs"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>Autofill Admin</span>
                    </button>
                  </div>
                )}
              </div>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#1E6B34]" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
