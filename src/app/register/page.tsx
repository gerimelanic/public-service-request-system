'use client';

import { useState, useActionState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { register, type AuthState } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import {
  User,
  Shield,
  CheckCircle2,
  Calendar,
  CreditCard,
  Phone,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  FilePlus,
  LayoutDashboard,
} from 'lucide-react';

const initialState: AuthState = {};

function RegisterForm() {
  const searchParams = useSearchParams();
  const isVerifiedFromUrl = searchParams.get('verified') === 'true';

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(isVerifiedFromUrl ? 3 : 1);
  const [state, formAction, isPending] = useActionState(register, initialState);

  // Form field state for step 1 validation and persistence across steps
  const [idNumber, setIdNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [secondName, setSecondName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phone, setPhone] = useState('');
  const [isEmailConfirmed, setIsEmailConfirmed] = useState(isVerifiedFromUrl);

  // ID Number Validation:
  // If user enters wrong characters (non-digits) or too many characters (> 8):
  let idNumberError: string | null = null;
  if (idNumber) {
    if (!/^\d+$/.test(idNumber) || idNumber.length > 8) {
      idNumberError = 'Incorrect national ID number,Try again';
    }
  }

  // Phone Number Validation:
  // Limit digits to 10 if in 07XXXXXXXX format, and 12 digits if in +254XXXXXXXXX format.
  // If one enters more digits than expected: "Too many digits, try again"
  let phoneError: string | null = null;
  if (phone) {
    const rawDigits = phone.replace(/\D/g, '');
    if (phone.startsWith('+254') || phone.startsWith('254')) {
      if (rawDigits.length > 12) {
        phoneError = 'Too many digits, try again';
      }
    } else if (phone.startsWith('0')) {
      if (rawDigits.length > 10) {
        phoneError = 'Too many digits, try again';
      }
    } else {
      if (rawDigits.length > 10) {
        phoneError = 'Too many digits, try again';
      }
    }
  }

  const isIdValid = /^\d{8}$/.test(idNumber.trim()) && !idNumberError;
  const isPhoneValid =
    !phone ||
    (!phoneError &&
      ((phone.startsWith('+254') && phone.replace(/\D/g, '').length === 12) ||
        (phone.startsWith('0') && phone.replace(/\D/g, '').length === 10)));

  // Validate step 1 fields
  const isStep1Valid =
    isIdValid &&
    firstName.trim().length >= 2 &&
    secondName.trim().length >= 2 &&
    dateOfBirth.trim() !== '' &&
    isPhoneValid;

  // Step 3 is reached when server action succeeds or query param confirms verification
  const isStep3 = state.success || currentStep === 3;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-xl shadow-xl border-[#1E6B34]/25 bg-white">
        {/* Step Progress Header */}
        <div className="border-b border-zinc-100 px-6 pt-6 pb-4">
          <div className="flex items-center justify-between max-w-sm mx-auto">
            {/* Step 1 Indicator */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  isStep3 || currentStep > 1
                    ? 'bg-[#1E6B34] text-white'
                    : currentStep === 1
                    ? 'border-2 border-[#1E6B34] bg-emerald-50 text-[#1E6B34]'
                    : 'bg-zinc-100 text-zinc-500'
                }`}
              >
                {isStep3 || currentStep > 1 ? <CheckCircle2 className="h-5 w-5" /> : '1'}
              </div>
              <span className="text-[11px] font-medium mt-1 text-zinc-600">
                Contact
              </span>
            </div>

            <div
              className={`flex-1 h-0.5 mx-2 transition-colors ${
                isStep3 || currentStep > 1 ? 'bg-[#1E6B34]' : 'bg-zinc-200'
              }`}
            />

            {/* Step 2 Indicator */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  isStep3
                    ? 'bg-[#1E6B34] text-white'
                    : currentStep === 2
                    ? 'border-2 border-[#1E6B34] bg-emerald-50 text-[#1E6B34]'
                    : 'bg-zinc-100 text-zinc-500'
                }`}
              >
                {isStep3 ? <CheckCircle2 className="h-5 w-5" /> : '2'}
              </div>
              <span className="text-[11px] font-medium mt-1 text-zinc-600">
                Password
              </span>
            </div>

            <div
              className={`flex-1 h-0.5 mx-2 transition-colors ${
                isStep3 ? 'bg-[#1E6B34]' : 'bg-zinc-200'
              }`}
            />

            {/* Step 3 Indicator: Renamed to "Confirm" */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  isStep3
                    ? 'bg-[#D4A017] text-white ring-4 ring-amber-100'
                    : 'bg-zinc-100 text-zinc-500'
                }`}
              >
                3
              </div>
              <span className="text-[11px] font-medium mt-1 text-zinc-600">
                Confirm
              </span>
            </div>
          </div>
        </div>

        {/* STEP 3: CONFIRM & WELCOME SCREEN */}
        {isStep3 ? (
          <div>
            {!isEmailConfirmed ? (
              /* A. Initial Notification: Ask citizen to confirm their email address */
              <div>
                <CardHeader className="text-center pt-8 pb-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-[#D4A017] mb-3 border border-amber-200 shadow-sm">
                    <Mail className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-zinc-900">
                    Confirm your email address
                  </CardTitle>
                  <CardDescription className="text-sm text-zinc-600 max-w-md mx-auto mt-2 leading-relaxed">
                    We have sent a verification link to your email address{' '}
                    <strong className="text-zinc-900">{state.registeredEmail || 'your email'}</strong>. Please click the link sent to your email to verify and activate your citizen account.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-2">
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 text-xs text-zinc-600 leading-relaxed space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-zinc-900">
                      <Shield className="h-4 w-4 text-[#1E6B34]" />
                      <span>Security Verification Pending</span>
                    </div>
                    <p>
                      Email confirmation ensures only authorized citizens lodge official municipal service requests. Once you open the link in your email, your account is immediately verified.
                    </p>
                  </div>

                  {/* Action to proceed after confirming email */}
                  <div className="pt-2">
                    <Button
                      type="button"
                      onClick={() => setIsEmailConfirmed(true)}
                      className="w-full gap-2 py-5 text-sm bg-[#1E6B34] hover:bg-[#144d24] text-white font-semibold"
                    >
                      <CheckCircle2 className="h-4 w-4 text-[#D4A017]" />
                      <span>I Have Confirmed My Email Link</span>
                    </Button>
                  </div>
                </CardContent>

                <CardFooter className="justify-center border-t border-zinc-100 pt-4">
                  <p className="text-xs text-zinc-500">
                    Need help?{' '}
                    <Link href="/login" className="font-semibold text-[#1E6B34] hover:underline">
                      Return to Sign In
                    </Link>
                  </p>
                </CardFooter>
              </div>
            ) : (
              /* B. Verified Welcome Note (as requested) */
              <div>
                <CardHeader className="text-center pt-8 pb-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-[#1E6B34] mb-3 shadow-inner">
                    <CheckCircle2 className="h-9 w-9" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-zinc-900">
                    Welcome to eCitizen Public Services!
                  </CardTitle>
                  <CardDescription className="text-base text-zinc-700 max-w-md mx-auto mt-2">
                    Hello <span className="font-semibold text-[#1E6B34]">{state.registeredName || firstName || 'Citizen'}</span>, your citizen account has been successfully registered and verified.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-2">
                  <div className="rounded-xl border border-[#1E6B34]/30 bg-emerald-50/60 p-4 text-sm">
                    <div className="flex items-center gap-2 font-bold text-[#1E6B34]">
                      <Shield className="h-4 w-4" />
                      <span>Citizen Profile Ready</span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-700 leading-relaxed">
                      You are now empowered to lodge municipal public service tickets (streetlights, water supply, garbage, road repairs) and track the resolution process step by step.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Link href="/requests/new" className="flex-1">
                      <Button className="w-full gap-2 shadow-sm py-5 text-sm bg-[#D4A017] hover:bg-[#B8860B] text-white font-semibold">
                        <FilePlus className="h-4 w-4" />
                        <span>Submit Service Request</span>
                      </Button>
                    </Link>
                    <Link href="/requests" className="flex-1">
                      <Button variant="outline" className="w-full gap-2 py-5 text-sm border-[#1E6B34]/30 text-[#1E6B34] hover:bg-emerald-50 font-semibold">
                        <LayoutDashboard className="h-4 w-4 text-[#D4A017]" />
                        <span>View My Dashboard</span>
                      </Button>
                    </Link>
                  </div>
                </CardContent>

                <CardFooter className="justify-center border-t border-zinc-100 pt-4">
                  <p className="text-xs text-zinc-500">
                    Verified citizen account for{' '}
                    <span className="font-mono text-zinc-700">{state.registeredEmail || 'Applicant'}</span>
                  </p>
                </CardFooter>
              </div>
            )}
          </div>
        ) : (
          <form action={formAction}>
            {/* Hidden fields to preserve Step 1 values when submitting on Step 2 */}
            <input type="hidden" name="id_number" value={idNumber} />
            <input type="hidden" name="first_name" value={firstName} />
            <input type="hidden" name="second_name" value={secondName} />
            <input type="hidden" name="date_of_birth" value={dateOfBirth} />
            <input type="hidden" name="phone" value={phone} />

            <CardHeader className="space-y-1 text-center pb-4">
              <CardTitle className="text-2xl font-bold tracking-tight text-zinc-900">
                {currentStep === 1 ? 'Step 1: Contact & Personal Details' : 'Step 2: Password & Security'}
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500">
                {currentStep === 1
                  ? 'Enter your identification and contact details to verify your citizen profile'
                  : 'Set up your secure login credentials to protect your citizen portal'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {state.error && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 border border-rose-200"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{state.error}</span>
                </div>
              )}

              {/* STEP 1 FIELDS */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  {/* National ID Number */}
                  <div className="space-y-1.5">
                    <Label htmlFor="id_number" className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-[#1E6B34]" />
                      <span>National ID Number</span>
                    </Label>
                    <Input
                      id="id_number"
                      type="text"
                      placeholder="e.g. 12345678"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      required
                      className={`border-zinc-300 focus-visible:ring-[#1E6B34] ${
                        idNumberError ? 'border-rose-400 focus-visible:ring-rose-500' : ''
                      }`}
                    />
                    {idNumberError && (
                      <p className="text-xs text-rose-600 font-medium animate-in fade-in">
                        {idNumberError}
                      </p>
                    )}
                  </div>

                  {/* Names Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="first_name" className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-[#1E6B34]" />
                        <span>First Name</span>
                      </Label>
                      <Input
                        id="first_name"
                        type="text"
                        placeholder="e.g. Jane"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="border-zinc-300 focus-visible:ring-[#1E6B34]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="second_name" className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-[#1E6B34]" />
                        <span>Second Name</span>
                      </Label>
                      <Input
                        id="second_name"
                        type="text"
                        placeholder="e.g. Mwangi"
                        value={secondName}
                        onChange={(e) => setSecondName(e.target.value)}
                        required
                        className="border-zinc-300 focus-visible:ring-[#1E6B34]"
                      />
                    </div>
                  </div>

                  {/* Date of Birth with Calendar picker */}
                  <div className="space-y-1.5">
                    <Label htmlFor="date_of_birth" className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-[#1E6B34]" />
                      <span>Date of Birth</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="date_of_birth"
                        type="date"
                        max={new Date().toISOString().split('T')[0]}
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="pr-10 border-zinc-300 focus-visible:ring-[#1E6B34]"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-[#1E6B34]" />
                      <span>Phone Number <span className="text-xs text-zinc-400 font-normal">(Optional)</span></span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="0712345678 or +254712345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`border-zinc-300 focus-visible:ring-[#1E6B34] ${
                        phoneError ? 'border-rose-400 focus-visible:ring-rose-500' : ''
                      }`}
                    />
                    {phoneError && (
                      <p className="text-xs text-rose-600 font-medium animate-in fade-in">
                        {phoneError}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2 FIELDS */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-[#1E6B34]" />
                      <span>Email Address</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="youremail@example.com"
                      autoComplete="email"
                      required
                      className="border-zinc-300 focus-visible:ring-[#1E6B34]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-[#1E6B34]" />
                      <span>Password (min 8 characters)</span>
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      className="border-zinc-300 focus-visible:ring-[#1E6B34]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirm_password" className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-[#1E6B34]" />
                      <span>Confirm Password</span>
                    </Label>
                    <Input
                      id="confirm_password"
                      name="confirm_password"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      className="border-zinc-300 focus-visible:ring-[#1E6B34]"
                    />
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-2">
              {currentStep === 1 ? (
                <Button
                  type="button"
                  disabled={!isStep1Valid}
                  onClick={() => setCurrentStep(2)}
                  className="w-full flex items-center justify-center gap-2 py-5 bg-[#D4A017] hover:bg-[#B8860B] text-white font-semibold"
                >
                  <span>Proceed to Password Setup</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <div className="flex w-full gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 gap-1.5 border-[#1E6B34]/30 text-[#1E6B34]"
                    disabled={isPending}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back</span>
                  </Button>

                  <Button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 gap-2 bg-[#D4A017] hover:bg-[#B8860B] text-white font-semibold"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Registering...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Complete Registration</span>
                      </>
                    )}
                  </Button>
                </div>
              )}

              <p className="text-center text-xs text-zinc-600">
                Already registered?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-[#1E6B34] hover:text-[#144d24] underline underline-offset-4"
                >
                  Sign In
                </Link>
              </p>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
          <div className="h-96 w-full max-w-xl rounded-xl bg-white border border-[#1E6B34]/25 animate-pulse" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
