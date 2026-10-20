import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { ServiceCarousel } from '@/components/ServiceCarousel';
import { ScrollReveal } from '@/components/ScrollReveal';
import {
  ShieldCheck,
  ArrowRight,
  FileText,
  Clock,
  CheckCircle,
  PlusCircle,
  LogIn,
  UserPlus,
} from 'lucide-react';

export default async function HomePage() {
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

  // Admins solely track submitted requests; redirect directly to Services Received
  if (profile?.role === 'admin') {
    redirect('/admin');
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden py-16 sm:py-24 bg-gradient-to-b from-emerald-50/60 via-zinc-50 to-white dark:from-emerald-950/20 dark:via-zinc-950 dark:to-zinc-950 border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3.5 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 mb-6">
              <ShieldCheck className="h-4 w-4" />
              <span>Official Citizen Service Portal</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.15]">
              Empowering Citizens.{' '}
              <span className="text-emerald-600 dark:text-emerald-400">
                Resolving Public Issues.
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              Report public service breakdowns in your community—from broken streetlights and burst water pipes to potholes and garbage—and track their resolution in real time.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href={user ? '/requests/new' : '/login'}>
                <Button size="lg" className="gap-2 shadow-md py-6 px-7 text-base bg-[#D4A017] hover:bg-[#B8860B] text-white font-semibold">
                  <PlusCircle className="h-5 w-5 text-white" />
                  <span>Submit Request</span>
                </Button>
              </Link>

              <Link href={user ? '/requests' : '/login'}>
                <Button size="lg" className="gap-2 shadow-md py-6 px-7 text-base bg-[#D4A017] hover:bg-[#B8860B] text-white font-semibold">
                  <span>Track Request</span>
                  <ArrowRight className="h-4 w-4 text-white" />
                </Button>
              </Link>

              {!user && (
                <Link href="/register">
                  <Button variant="outline" size="lg" className="gap-2 py-6 px-6 text-base border-[#1E6B34]/30 text-[#1E6B34] hover:bg-emerald-50">
                    <UserPlus className="h-4 w-4 text-[#D4A017]" />
                    <span>Register as Citizen</span>
                  </Button>
                </Link>
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 2. "WHAT YOU CAN REPORT" SECTION (CAROUSEL) */}
      <section className="py-16 bg-zinc-50/50 dark:bg-zinc-900/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  What You Can Report
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
                  Choose from core municipal services to notify responsible local authorities directly.
                </p>
              </div>
            </div>

            {/* Scroll-Snap Carousel */}
            <ServiceCarousel />
          </ScrollReveal>
        </div>
      </section>

      {/* 3. "HOW IT WORKS" SECTION */}
      <section className="py-16 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                How It Works
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-lg mx-auto">
                A simple, transparent 3-step lifecycle ensuring accountability from report to repair.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Step 1: Submit */}
            <ScrollReveal delayMs={100}>
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 p-6 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-sm">
                      1
                    </span>
                    <FileText className="h-5 w-5 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    1. Submit
                  </h3>
                  <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Lodge your service request with an accurate location landmark, description of the fault, and an optional site photograph.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-zinc-200/60 dark:border-zinc-800 text-[11px] text-zinc-400">
                  Starts as <span className="font-semibold text-zinc-600 dark:text-zinc-300">Pending</span>
                </div>
              </div>
            </ScrollReveal>

            {/* Step 2: Track */}
            <ScrollReveal delayMs={200}>
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 p-6 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold text-sm">
                      2
                    </span>
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    2. Track
                  </h3>
                  <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Follow real-time status updates from your dashboard as administrative officers review reports and dispatch field technicians.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-zinc-200/60 dark:border-zinc-800 text-[11px] text-amber-600 dark:text-amber-400">
                  Advances to <span className="font-semibold">In Progress</span>
                </div>
              </div>
            </ScrollReveal>

            {/* Step 3: Resolved */}
            <ScrollReveal delayMs={300}>
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 p-6 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-sm">
                      3
                    </span>
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    3. Resolved
                  </h3>
                  <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Once maintenance works are verified complete, the issue status is permanently marked as resolved on public records.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-zinc-200/60 dark:border-zinc-800 text-[11px] text-emerald-600 dark:text-emerald-400">
                  Completed as <span className="font-semibold">Resolved</span>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* 4. CLOSING CALL TO ACTION */}
      <section className="py-16 bg-gradient-to-b from-zinc-50 to-emerald-50/30 dark:from-zinc-900/40 dark:to-emerald-950/20 border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <ScrollReveal>
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 sm:p-12 shadow-sm">
              {user ? (
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Ready to report an issue, {profile?.full_name?.split(' ')[0] || 'Citizen'}?
                  </h2>
                  <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto">
                    Help make your neighborhood safer and cleaner. Submit a ticket now and our municipal department will be notified immediately.
                  </p>
                  <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link href="/requests/new">
                      <Button size="lg" className="gap-2 shadow-sm py-5 px-6">
                        <PlusCircle className="h-5 w-5" />
                        <span>Submit a Service Request</span>
                      </Button>
                    </Link>
                    <Link href="/requests">
                      <Button variant="outline" size="lg" className="gap-2 py-5 px-6">
                        <span>Go to My Dashboard</span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Get started with eCitizen Services
                  </h2>
                  <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto">
                    Create an account in less than two minutes using your National ID and start tracking municipal services in your ward today.
                  </p>
                  <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link href="/register">
                      <Button size="lg" className="gap-2 shadow-sm py-5 px-6">
                        <UserPlus className="h-5 w-5" />
                        <span>Register Now</span>
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button variant="outline" size="lg" className="gap-2 py-5 px-6">
                        <LogIn className="h-4 w-4" />
                        <span>Sign In to Existing Account</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
