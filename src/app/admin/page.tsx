import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ServiceRequest } from '@/lib/constants';
import { computeStats } from '@/lib/analytics';
import { StatsCards } from '@/components/StatsCards';
import { CategoryBreakdown } from '@/components/CategoryBreakdown';
import { AdminRequestList } from '@/components/AdminRequestList';
import { Shield, Sparkles, AlertTriangle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await createClient();

  // 1. Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 2. Server-side role verification
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  // NOTE FOR INTERVIEWS:
  // This server-side check is solely for user experience (UX) to prevent unauthorized
  // citizens from seeing the admin screen. Row Level Security (RLS) in Postgres is the
  // true, unbypassable security layer protecting all admin data and status mutations.
  if (profile?.role !== 'admin') {
    redirect('/requests');
  }

  // 3. Fetch all municipal requests joined with citizen profile info
  // Admin RLS policy permits reading all service_requests and all profiles.
  const { data: requests, error } = await supabase
    .from('service_requests')
    .select(`
      id,
      citizen_id,
      category,
      location,
      description,
      image_url,
      status,
      created_at,
      updated_at,
      profiles (
        id,
        full_name,
        phone,
        id_number,
        role
      )
    `)
    .order('created_at', { ascending: false });

  interface RawJoinedRequest extends Omit<ServiceRequest, 'profiles'> {
    profiles: ServiceRequest['profiles'] | ServiceRequest['profiles'][];
  }

  // Defensive normalization: ensures profiles object matches interface whether PostgREST returns object or array
  const rawRequests = (requests as unknown as RawJoinedRequest[]) || [];
  const requestList: ServiceRequest[] = rawRequests.map((req) => ({
    ...req,
    profiles: Array.isArray(req.profiles) ? req.profiles[0] || null : req.profiles || null,
  }));

  // 4. Compute analytics directly from the already-fetched requests.
  // We reuse requestList to avoid a redundant second database query.
  //
  // NOTE ON SECURITY & ROW LEVEL SECURITY (RLS):
  // Analytics are admin-only: this page verifies the admin role server-side.
  // Row Level Security (RLS) in Supabase/PostgreSQL is why full municipal analytics
  // must run in the admin context: under the policy "Citizens can view own requests",
  // citizen accounts can only SELECT their own submitted rows (auth.uid() = citizen_id).
  // Only municipal admin accounts possess elevated RLS permissions to query all
  // service requests across the county, allowing true aggregate analytics without leaking
  // other citizens' private rows on citizen-facing routes.
  const stats = computeStats(requestList);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950">
              Services Received
            </h1>
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
              <Shield className="h-3 w-3" />
              Verified Officer
            </span>
          </div>
          <p className="text-zinc-700 mt-1 font-medium">
            Logged in as Admin. Track the progress of submitted requests, monitor department analytics, and advance resolutions.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 bg-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-300">
          <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
          <span>RLS Active: Admin Access</span>
        </div>
      </div>

      {/* Query error alert */}
      {error && (
        <div className="mb-6 rounded-lg bg-rose-50 p-4 text-xs text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>Failed to load service requests: {error.message}. Please refresh the page.</span>
        </div>
      )}

      {/* Analytics Section: High-level KPIs & Category Breakdown */}
      <section aria-label="System Analytics" className="mb-8 space-y-6">
        <StatsCards stats={stats} />
        <CategoryBreakdown byCategory={stats.byCategory} totalRequests={stats.total} />
      </section>

      {/* Main Request List & Filter Component */}
      <AdminRequestList initialRequests={requestList} />
    </div>
  );
}
