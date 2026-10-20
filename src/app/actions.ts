'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { NEXT_STATUS, RequestStatus } from '@/lib/constants';

export interface AdvanceStatusResult {
  success: boolean;
  error?: string;
  newStatus?: RequestStatus;
}

/**
 * Server Action: advanceStatus
 *
 * Advances a service request to its next deterministic lifecycle state:
 * pending -> in_progress -> resolved (forward-only, one step at a time).
 *
 * Interview & Architecture Defense:
 * 1. Optimistic Concurrency Control:
 *    We chain `.eq('id', requestId).eq('status', currentStatus)`.
 *    If two municipal officers click 'Advance' concurrently, only the first
 *    request matches both the ID and the current status. The second update matches 0
 *    rows, preventing accidental double-advancement or race conditions.
 *
 * 2. Unbypassable Database Access Control (RLS):
 *    Even if invoked directly without the UI, the PostgreSQL policy
 *    "Admins can update request status" checks `public.is_admin()`, rejecting
 *    unauthorized citizen requests at the database engine level.
 */
export async function advanceStatus(
  requestId: string,
  currentStatus: RequestStatus
): Promise<AdvanceStatusResult> {
  const supabase = await createClient();

  // 1. Authenticate user server-side
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized: You must be logged in.' };
  }

  // 2. Check user's role in profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return {
      success: false,
      error: 'Forbidden: Only administrators can update request status.',
    };
  }

  // 3. Compute next allowed status from single source of truth
  const nextStatus = NEXT_STATUS[currentStatus];
  if (!nextStatus) {
    return {
      success: false,
      error: `Request is already '${currentStatus}' and cannot be advanced further.`,
    };
  }

  // 4. Atomic conditional update
  const { error, count } = await supabase
    .from('service_requests')
    .update({ status: nextStatus })
    .eq('id', requestId)
    .eq('status', currentStatus);

  if (error) {
    console.error('Error advancing request status:', error);
    return {
      success: false,
      error: error.message || 'Database error occurred while updating status.',
    };
  }

  // If count is 0, the record was already transitioned by another concurrent request
  if (count === 0) {
    return {
      success: false,
      error: 'Status conflict: This request was already updated by another officer.',
    };
  }

  // 5. Revalidate cache on both admin and citizen pages
  revalidatePath('/admin');
  revalidatePath('/requests');

  return { success: true, newStatus: nextStatus };
}
