import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CATEGORY_MAP, ServiceRequest } from '@/lib/constants';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  PlusCircle,
  MapPin,
  Calendar,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export default async function RequestsPage() {
  const supabase = await createClient();

  // 1. Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. Fetch user's profile
  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  // Admins manage incoming requests via "Services Received" (/admin) rather than creating requests
  if (profile?.role === 'admin') {
    redirect('/admin');
  }

  // 3. Fetch citizen's own requests
  // RLS automatically filters `citizen_id = auth.uid()`.
  const { data: requests, error } = await supabase
    .from('service_requests')
    .select('*')
    .order('created_at', { ascending: false });

  const requestList: ServiceRequest[] = requests || [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            My Service Requests
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            Welcome back{' '}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {profile?.full_name || user?.email}
            </span>
            . Track real-time progress and departmental resolutions.
          </p>
        </div>

        <Link href="/requests/new">
          <Button className="gap-2 shadow-sm py-5 px-5">
            <PlusCircle className="h-4 w-4" />
            <span>Submit New Request</span>
          </Button>
        </Link>
      </div>

      {/* Query error alert */}
      {error && (
        <div className="mb-6 rounded-lg bg-rose-50 p-4 text-sm text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900">
          Failed to load service requests. Please refresh the page.
        </div>
      )}

      {/* Empty State */}
      {requestList.length === 0 ? (
        <Card className="border-dashed border-2 border-zinc-200 dark:border-zinc-800 text-center py-12">
          <CardHeader className="max-w-md mx-auto">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 mb-3">
              <Sparkles className="h-7 w-7" />
            </div>
            <CardTitle className="text-xl font-bold">No requests lodged yet</CardTitle>
            <CardDescription className="text-sm mt-1">
              Have you noticed a broken streetlight, water pipe leak, uncollected refuse, or road damage in your area? Report it directly to municipal officers.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <Link href="/requests/new">
              <Button className="gap-2">
                <PlusCircle className="h-4 w-4" />
                <span>Submit Your First Request</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        /* Requests Grid / List */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
            <span>
              Showing {requestList.length} {requestList.length === 1 ? 'request' : 'requests'}
            </span>
            <span>Sorted by newest first</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {requestList.map((req) => {
              const categoryMeta = CATEGORY_MAP[req.category] || {
                label: req.category,
                emoji: '🏛️',
              };

              const formattedDate = new Date(req.created_at).toLocaleDateString('en-KE', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              const isOtherWithCustom = req.category === 'other' && req.description.startsWith('[Service:');
              let displayCategoryLabel: string = categoryMeta.label;
              let displayDescription = req.description;

              if (isOtherWithCustom) {
                const match = req.description.match(/^\[Service:\s*(.+?)\]\n\n([\s\S]*)$/);
                if (match) {
                  displayCategoryLabel = `Other: ${match[1]}`;
                  displayDescription = match[2];
                }
              }

              return (
                <Card
                  key={req.id}
                  className="hover:border-[#1E6B34]/50 border-[#1E6B34]/25 transition-all shadow-sm"
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      {/* Left: Category, Location, Description */}
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700">
                            <span>{categoryMeta.emoji}</span>
                            <span>{displayCategoryLabel}</span>
                          </span>

                          <StatusBadge status={req.status} />
                        </div>

                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1E6B34] dark:text-emerald-400">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-[#1E6B34] dark:text-emerald-400" />
                          <span>{req.location}</span>
                        </div>

                        <p className="text-sm text-zinc-800 dark:text-zinc-100 whitespace-pre-wrap leading-relaxed font-normal">
                          {displayDescription}
                        </p>

                        <div className="flex items-center gap-4 text-[11px] text-zinc-500 dark:text-zinc-300 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Submitted: {formattedDate}</span>
                          </span>
                          <span className="flex items-center gap-1 font-mono text-[10px] text-zinc-400 dark:text-zinc-300">
                            ID: {req.id.slice(0, 8)}
                          </span>
                        </div>
                      </div>

                      {/* Right: Attached Image Thumbnail (if any) */}
                      {req.image_url && (
                        <div className="sm:w-36 shrink-0">
                          <a
                            href={req.image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block relative h-28 sm:h-24 w-full rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800"
                            title="Click to view full image"
                          >
                            <Image
                              src={req.image_url}
                              alt={`Photo for ${req.category} request`}
                              fill
                              unoptimized
                              className="object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs gap-1 font-medium">
                              <ExternalLink className="h-3.5 w-3.5" />
                              <span>View Full</span>
                            </div>
                          </a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
