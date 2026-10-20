'use client';

import { useState, useTransition, useMemo } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  RequestStatus,
  ServiceRequest,
  CATEGORY_MAP,
  CATEGORIES,
} from '@/lib/constants';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { advanceStatus } from '@/app/actions';
import {
  MapPin,
  Calendar,
  User,
  Phone,
  CreditCard,
  ExternalLink,
  Loader2,
  Clock,
  CheckCircle2,
  Filter,
  Search,
  X,
  AlertCircle,
} from 'lucide-react';

interface AdminRequestListProps {
  initialRequests: ServiceRequest[];
}

type FilterStatus = 'all' | RequestStatus;

export function AdminRequestList({ initialRequests }: AdminRequestListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active status filter (reads from URL query param `?status=...` or defaults to 'all')
  const statusParam = (searchParams?.get('status') as FilterStatus) || 'all';
  const [activeStatus, setActiveStatus] = useState<FilterStatus>(
    ['all', 'pending', 'in_progress', 'resolved'].includes(statusParam)
      ? statusParam
      : 'all'
  );

  // Search & Category filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Track loading state per request ID during advanceStatus transitions
  const [isPending, startTransition] = useTransition();
  const [advancingId, setAdvancingId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{
    id: string;
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Full-size image modal state
  const [modalImage, setModalImage] = useState<{ url: string; title: string } | null>(null);

  // Compute status counts across all incoming requests
  const counts = useMemo(() => {
    return initialRequests.reduce(
      (acc, r) => {
        acc.all += 1;
        if (r.status === 'pending') acc.pending += 1;
        if (r.status === 'in_progress') acc.in_progress += 1;
        if (r.status === 'resolved') acc.resolved += 1;
        return acc;
      },
      { all: 0, pending: 0, in_progress: 0, resolved: 0 }
    );
  }, [initialRequests]);

  // Filter requests based on status, category, and text search
  const filteredRequests = useMemo(() => {
    return initialRequests.filter((req) => {
      // 1. Status Filter
      if (activeStatus !== 'all' && req.status !== activeStatus) {
        return false;
      }

      // 2. Category Filter
      if (selectedCategory !== 'all' && req.category !== selectedCategory) {
        return false;
      }

      // 3. Search Query (Matches citizen name, phone, id_number, location, or description)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesLocation = req.location.toLowerCase().includes(query);
        const matchesDesc = req.description.toLowerCase().includes(query);
        const matchesCitizenName = req.profiles?.full_name?.toLowerCase().includes(query) ?? false;
        const matchesCitizenPhone = req.profiles?.phone?.toLowerCase().includes(query) ?? false;
        const matchesCitizenId = req.profiles?.id_number?.toLowerCase().includes(query) ?? false;
        const matchesId = req.id.toLowerCase().includes(query);

        if (
          !matchesLocation &&
          !matchesDesc &&
          !matchesCitizenName &&
          !matchesCitizenPhone &&
          !matchesCitizenId &&
          !matchesId
        ) {
          return false;
        }
      }

      return true;
    });
  }, [initialRequests, activeStatus, selectedCategory, searchQuery]);

  // Handle status tab click and sync with URL
  const handleStatusFilterChange = (status: FilterStatus) => {
    setActiveStatus(status);
    const params = new URLSearchParams(window.location.search);
    if (status === 'all') {
      params.delete('status');
    } else {
      params.set('status', status);
    }
    const newPath = params.toString() ? `/admin?${params.toString()}` : '/admin';
    router.replace(newPath, { scroll: false });
  };

  // Handle advance status trigger
  const handleAdvance = (requestId: string, currentStatus: RequestStatus) => {
    setAdvancingId(requestId);
    setActionFeedback(null);

    startTransition(async () => {
      try {
        const result = await advanceStatus(requestId, currentStatus);
        if (result.success) {
          setActionFeedback({
            id: requestId,
            type: 'success',
            message: `Status advanced to ${result.newStatus === 'in_progress' ? 'In Progress' : 'Resolved'}.`,
          });
        } else {
          setActionFeedback({
            id: requestId,
            type: 'error',
            message: result.error || 'Failed to advance status.',
          });
        }
      } catch (err: unknown) {
        setActionFeedback({
          id: requestId,
          type: 'error',
          message: err instanceof Error ? err.message : 'An unexpected error occurred.',
        });
      } finally {
        setAdvancingId(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Filter and Control Bar */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 shadow-sm space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider mr-1 hidden lg:inline">
              Filter by Status:
            </span>

            {/* All */}
            <button
              onClick={() => handleStatusFilterChange('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeStatus === 'all'
                  ? 'bg-[#1E6B34] text-white shadow-sm'
                  : 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200 border border-zinc-300'
              }`}
            >
              <span>All Received</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeStatus === 'all'
                    ? 'bg-[#D4A017] text-white'
                    : 'bg-zinc-200 text-zinc-800'
                }`}
              >
                {counts.all}
              </span>
            </button>

            {/* Pending */}
            <button
              onClick={() => handleStatusFilterChange('pending')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeStatus === 'pending'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200 border border-zinc-300'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
              <span>Pending</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-zinc-200 text-zinc-800">
                {counts.pending}
              </span>
            </button>

            {/* In Progress */}
            <button
              onClick={() => handleStatusFilterChange('in_progress')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeStatus === 'in_progress'
                  ? 'bg-[#D4A017] text-white shadow-sm'
                  : 'bg-amber-50 text-amber-950 hover:bg-amber-100 border border-amber-300'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse" />
              <span>In Progress</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-200 text-amber-950">
                {counts.in_progress}
              </span>
            </button>

            {/* Resolved */}
            <button
              onClick={() => handleStatusFilterChange('resolved')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeStatus === 'resolved'
                  ? 'bg-[#1E6B34] text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-950 hover:bg-emerald-100 border border-emerald-300'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              <span>Resolved</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-950">
                {counts.resolved}
              </span>
            </button>
          </div>

          <div className="text-xs font-medium text-zinc-700 self-end sm:self-center">
            Showing <span className="font-bold text-zinc-950">{filteredRequests.length}</span> of {initialRequests.length}
          </div>
        </div>

        {/* Search & Category Filter Sub-row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-3 border-t border-zinc-200">
          {/* Search Box */}
          <div className="relative sm:col-span-7 md:col-span-8">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by citizen, phone, ID number, location or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2 text-xs font-medium rounded-lg border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E6B34] text-zinc-950 placeholder:text-zinc-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-zinc-700"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="sm:col-span-5 md:col-span-4 flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-zinc-500 shrink-0 hidden sm:inline" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2 px-3 text-xs font-medium rounded-lg border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E6B34] text-zinc-950"
            >
              <option value="all">All Service Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.emoji} {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Global Action Feedback Alert */}
      {actionFeedback && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-lg text-xs border ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <Card className="border-dashed border-2 border-zinc-200 dark:border-zinc-800 text-center py-12">
          <CardContent className="space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              <Filter className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              No matching service requests
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== 'all' || activeStatus !== 'all'
                ? 'Try adjusting or clearing your status, category, or search filters to find what you are looking for.'
                : 'No public service requests have been submitted by citizens yet.'}
            </p>
            {(searchQuery || selectedCategory !== 'all' || activeStatus !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveStatus('all');
                  setSelectedCategory('all');
                  setSearchQuery('');
                  router.replace('/admin', { scroll: false });
                }}
                className="text-xs gap-1.5 mt-2"
              >
                <X className="h-3 w-3" />
                <span>Reset All Filters</span>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const categoryMeta = CATEGORY_MAP[req.category] || {
              label: req.category,
              emoji: '🏛️',
            };

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

            const formattedDate = new Date(req.created_at).toLocaleDateString('en-KE', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            const isCurrentlyAdvancing = isPending && advancingId === req.id;

            return (
              <Card
                key={req.id}
                className="overflow-hidden border border-[#1E6B34]/25 bg-white hover:border-[#1E6B34]/60 transition-all shadow-sm"
              >
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                    {/* Main Content Column */}
                    <div className="flex-1 space-y-3.5">
                      {/* Top Badges & ID */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Category Badge */}
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-900 border border-zinc-300">
                            <span>{categoryMeta.emoji}</span>
                            <span>{displayCategoryLabel}</span>
                          </span>

                          {/* Status Badge */}
                          <StatusBadge status={req.status} />
                        </div>

                        {/* Request ID & Timestamp */}
                        <div className="flex items-center gap-2 text-[11px] text-zinc-700 font-mono font-medium">
                          <span>ID: {req.id.slice(0, 8)}</span>
                        </div>
                      </div>

                      {/* Citizen Information Row */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-800 bg-emerald-50/70 p-2.5 rounded-lg border border-[#1E6B34]/30">
                        {/* Full Name */}
                        <div className="flex items-center gap-1.5 font-bold text-zinc-950">
                          <User className="h-3.5 w-3.5 text-[#1E6B34] shrink-0" />
                          <span>{req.profiles?.full_name || 'Citizen'}</span>
                        </div>

                        {/* Phone Number */}
                        {req.profiles?.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-[#D4A017] shrink-0" />
                            <a
                              href={`tel:${req.profiles.phone}`}
                              className="hover:underline text-[#1E6B34] font-bold"
                            >
                              {req.profiles.phone}
                            </a>
                          </div>
                        )}

                        {/* National ID Number */}
                        {req.profiles?.id_number && (
                          <div className="flex items-center gap-1.5 text-zinc-800 font-medium">
                            <CreditCard className="h-3.5 w-3.5 text-[#D4A017] shrink-0" />
                            <span>ID: {req.profiles.id_number}</span>
                          </div>
                        )}

                        {/* Date submitted */}
                        <div className="flex items-center gap-1.5 ml-auto text-zinc-700 font-medium">
                          <Calendar className="h-3 w-3 shrink-0 text-zinc-500" />
                          <span>{formattedDate}</span>
                        </div>
                      </div>

                      {/* Location Landmark */}
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#1E6B34]">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-[#1E6B34]" />
                        <span>{req.location}</span>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-zinc-900 whitespace-pre-wrap leading-relaxed font-medium">
                        {displayDescription}
                      </p>
                    </div>

                    {/* Right Column: Attached Image + Advance Action Button */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between lg:justify-start gap-4 lg:w-48 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-zinc-100 dark:border-zinc-800">
                      {/* Attached Image Thumbnail */}
                      {req.image_url ? (
                        <div className="w-full sm:w-40 lg:w-full">
                          <button
                            type="button"
                            onClick={() =>
                              setModalImage({
                                url: req.image_url!,
                                title: `${categoryMeta.label} - ${req.location}`,
                              })
                            }
                            className="group block relative h-28 sm:h-24 w-full rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-left"
                            title="Click to view full photo"
                          >
                            <Image
                              src={req.image_url}
                              alt={`Photo for ${req.category} request`}
                              fill
                              unoptimized
                              className="object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs gap-1 font-medium">
                              <ExternalLink className="h-3.5 w-3.5" />
                              <span>Enlarge</span>
                            </div>
                          </button>
                        </div>
                      ) : (
                        <div className="hidden lg:flex h-20 w-full items-center justify-center rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-400">
                          No photo attached
                        </div>
                      )}

                      {/* One-Click Advance Status Action */}
                      <div className="w-full sm:w-auto lg:w-full">
                        {req.status === 'pending' && (
                          <Button
                            type="button"
                            size="sm"
                            disabled={isCurrentlyAdvancing}
                            onClick={() => handleAdvance(req.id, 'pending')}
                            className="w-full gap-1.5 bg-[#D4A017] hover:bg-[#B8860B] text-white shadow-sm text-xs font-semibold"
                          >
                            {isCurrentlyAdvancing ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>Updating...</span>
                              </>
                            ) : (
                              <>
                                <Clock className="h-3.5 w-3.5" />
                                <span>Mark In Progress</span>
                              </>
                            )}
                          </Button>
                        )}

                        {req.status === 'in_progress' && (
                          <Button
                            type="button"
                            size="sm"
                            disabled={isCurrentlyAdvancing}
                            onClick={() => handleAdvance(req.id, 'in_progress')}
                            className="w-full gap-1.5 bg-[#1E6B34] hover:bg-[#144d24] text-white shadow-sm text-xs font-semibold"
                          >
                            {isCurrentlyAdvancing ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>Updating...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Mark Resolved</span>
                              </>
                            )}
                          </Button>
                        )}

                        {req.status === 'resolved' && (
                          <div className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md bg-emerald-50 text-[#1E6B34] text-xs font-semibold border border-[#1E6B34]/30">
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#1E6B34]" />
                            <span>Resolved</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Lightbox / Full Photo Modal */}
      {modalImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in"
          onClick={() => setModalImage(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-zinc-900 rounded-xl overflow-hidden shadow-2xl border border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3.5 border-b border-zinc-800 text-zinc-100">
              <span className="text-xs font-medium truncate pr-4">{modalImage.title}</span>
              <button
                onClick={() => setModalImage(null)}
                className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="relative h-[65vh] w-full bg-zinc-950 flex items-center justify-center p-2">
              <Image
                src={modalImage.url}
                alt={modalImage.title}
                fill
                unoptimized
                className="object-contain"
              />
            </div>
            <div className="p-3 bg-zinc-900 border-t border-zinc-800 flex justify-end">
              <a
                href={modalImage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Open in New Tab</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
