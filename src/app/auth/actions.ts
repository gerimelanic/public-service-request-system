'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export interface AuthState {
  error?: string | null;
  message?: string | null;
  success?: boolean;
  registeredName?: string;
  registeredEmail?: string;
}

// Simple email regex verifying name@domain.tld format
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 8-digit National ID regex
const ID_NUMBER_REGEX = /^\d{8}$/;

// Kenyan phone format: 07XXXXXXXX, 01XXXXXXXX, +2547XXXXXXXX, +2541XXXXXXXX
const KE_PHONE_REGEX = /^(?:\+254|0)[17]\d{8}$/;

export async function register(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const idNumber = String(formData.get('id_number') || '').trim();
  const firstName = String(formData.get('first_name') || '').trim();
  const secondName = String(formData.get('second_name') || '').trim();
  const dateOfBirth = String(formData.get('date_of_birth') || '').trim();
  const phone = String(formData.get('phone') || '').trim();
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  const confirmPassword = String(formData.get('confirm_password') || '');

  // 1. Server-side validation for Step 1 (Contact / Personal)
  if (!idNumber || !ID_NUMBER_REGEX.test(idNumber)) {
    return { error: 'Incorrect national ID number,Try again' };
  }

  if (!firstName || firstName.length < 2) {
    return { error: 'First name must be at least 2 characters.' };
  }

  if (!secondName || secondName.length < 2) {
    return { error: 'Second name must be at least 2 characters.' };
  }

  if (!dateOfBirth) {
    return { error: 'Please select your Date of Birth.' };
  }

  // Check phone length rules
  if (phone) {
    const rawDigits = phone.replace(/\D/g, '');
    if (phone.startsWith('+254') || phone.startsWith('254')) {
      if (rawDigits.length > 12) {
        return { error: 'Too many digits, try again' };
      }
    } else if (phone.startsWith('0')) {
      if (rawDigits.length > 10) {
        return { error: 'Too many digits, try again' };
      }
    }
    if (!KE_PHONE_REGEX.test(phone)) {
      return {
        error: 'Please enter a valid Kenyan phone number (e.g. 0712345678 or +254712345678).',
      };
    }
  }

  // 2. Server-side validation for Step 2 (Security)
  if (!email || !EMAIL_REGEX.test(email)) {
    return { error: 'Please enter a valid email address (e.g. youremail@example.com).' };
  }

  if (!password || password.length < 8) {
    return { error: 'Password must be at least 8 characters long.' };
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' };
  }

  const fullName = `${firstName} ${secondName}`;
  const supabase = await createClient();

  // 3. Sign up with Supabase Auth
  // We pass metadata so trigger handle_new_user() populates the public.profiles row.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        id_number: idNumber,
        date_of_birth: dateOfBirth,
        phone: phone || null,
      },
    },
  });

  if (error) {
    return {
      error: error.message.includes('already registered')
        ? 'An account with this email already exists.'
        : 'Failed to create account. Please try again.',
    };
  }

  // Return success payload to allow the UI to transition to Step 3 (Confirm Email / Welcome)
  return {
    success: true,
    message: data.session
      ? 'Account created successfully!'
      : 'Registration successful! Check your email to confirm your account.',
    registeredName: firstName,
    registeredEmail: email,
  };
}

export async function login(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');

  if (!email || !EMAIL_REGEX.test(email)) {
    return { error: 'Please enter a valid email address.' };
  }

  if (!password) {
    return { error: 'Please enter your password.' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: 'Invalid email or password.' };
  }

  // Check role from profiles to route admin vs citizen appropriately
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();

  if (profile?.role === 'admin') {
    redirect('/admin');
  }

  redirect('/requests');
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

/**
 * Functional Forgot Password Server Action
 * Dispatches password reset email via Supabase Auth
 */
export async function forgotPassword(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get('email') || '').trim().toLowerCase();

  if (!email || !EMAIL_REGEX.test(email)) {
    return { error: 'Please enter a valid email address.' };
  }

  const supabase = await createClient();

  // Send password reset email with callback route
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/reset-password`,
  });

  if (error) {
    if (error.message.toLowerCase().includes('rate limit')) {
      return {
        error:
          'Supabase email rate limit reached. Please wait 60 seconds before requesting another email, or click the password reset link already sent to your inbox.',
      };
    }
    return { error: error.message || 'Failed to send password reset link.' };
  }

  return {
    success: true,
    message: `Password reset link sent! Please check ${email} for instructions to reset your password.`,
  };
}

/**
 * Update password Server Action (called from /reset-password)
 */
export async function updatePassword(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const password = String(formData.get('password') || '');
  const confirmPassword = String(formData.get('confirm_password') || '');

  if (!password || password.length < 8) {
    return { error: 'New password must be at least 8 characters long.' };
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message || 'Failed to update password.' };
  }

  return {
    success: true,
    message: 'Your password has been successfully reset! You can now log in.',
  };
}
