import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import { Home, FileText, LogOut, LogIn, UserPlus } from 'lucide-react';

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  // Determine top-left portal brand text based on role and auth state
  // Citizen account -> "Applicant portal"
  // Admin account -> "Admin portal"
  // Public/Logged out -> "Applicant portal" (or Murang'a County Services)
  const portalTitle = user
    ? profile?.role === 'admin'
      ? 'Admin portal'
      : 'Applicant portal'
    : 'Applicant portal';

  return (
    <header className="sticky top-0 z-40 w-full bg-[#1E6B34] border-b border-[#144d24] text-white shadow-md">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand / Logo with Muranga County Government Logo in full color */}
        <Link
          href={profile?.role === 'admin' ? '/admin' : '/'}
          className="flex items-center gap-3 group"
        >
          <div className="relative h-11 w-11 shrink-0 rounded-full bg-white p-0.5 shadow-sm overflow-hidden flex items-center justify-center border-2 border-[#D4A017]">
            <Image
              src="/images/muranga-logo.webp"
              alt="Muranga county government logo"
              fill
              unoptimized
              className="object-contain p-0.5"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-white tracking-tight leading-tight group-hover:text-amber-200 transition-colors">
              {portalTitle}
            </span>
            <span className="text-[10px] text-emerald-100 font-medium tracking-wide uppercase">
              Murang&apos;a County Government
            </span>
          </div>
        </Link>

        {/* Navigation links & User actions */}
        <nav className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              {/* Home navigation link is only shown to citizens; admins solely manage Services Received */}
              {profile?.role !== 'admin' && (
                <Link
                  href="/"
                  className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 px-2.5 py-1.5 rounded-md transition-colors"
                  title="Navigate to Landing Page"
                >
                  <Home className="h-4 w-4 text-[#D4A017]" />
                  <span>Home</span>
                </Link>
              )}

              {/* Conditional Navigation Link based on User Role:
                  Citizens make and track their own requests ("My Requests").
                  Admins track the progress of submitted requests ("Services received"). */}
              {profile?.role === 'admin' ? (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white bg-white/15 hover:bg-white/25 border border-white/20 px-2.5 py-1.5 rounded-md transition-colors"
                  title="Track incoming public service requests"
                >
                  <FileText className="h-4 w-4 text-[#D4A017]" />
                  <span>Services received</span>
                </Link>
              ) : (
                <Link
                  href="/requests"
                  className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 px-2.5 py-1.5 rounded-md transition-colors"
                >
                  <FileText className="h-4 w-4 text-[#D4A017]" />
                  <span className="hidden sm:inline">My Requests</span>
                  <span className="sm:hidden">Requests</span>
                </Link>
              )}

              {/* User badge */}
              <div className="hidden md:flex items-center gap-2 border-l border-emerald-700/80 pl-3 ml-1 text-xs text-emerald-100">
                <span className="truncate max-w-[130px] font-medium text-white">
                  {profile?.full_name || user.email}
                </span>
                <span className="rounded bg-[#D4A017] px-1.5 py-0.5 text-[10px] font-bold uppercase text-white shadow-xs">
                  {profile?.role || 'citizen'}
                </span>
              </div>

              {/* Logout Form */}
              <form action={logout}>
                <Button
                  variant="ghost"
                  size="sm"
                  type="submit"
                  className="gap-1.5 text-white/90 hover:text-white hover:bg-white/10 text-xs sm:text-sm"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </form>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-white/90 hover:text-white hover:bg-white/10 text-xs sm:text-sm"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="sm"
                  className="gap-1.5 bg-[#D4A017] text-white hover:bg-[#B8860B] font-semibold text-xs sm:text-sm shadow-sm"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Register</span>
                </Button>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

export function NavbarSkeleton() {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#1E6B34] border-b border-[#144d24] text-white shadow-md">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-white/20 animate-pulse" />
          <div className="h-5 w-32 bg-white/20 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-16 bg-white/15 rounded animate-pulse" />
          <div className="h-8 w-20 bg-[#D4A017]/50 rounded animate-pulse" />
        </div>
      </div>
    </header>
  );
}
