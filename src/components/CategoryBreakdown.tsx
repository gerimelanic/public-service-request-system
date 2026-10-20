import { CategoryStat } from '@/lib/analytics';
import { CATEGORY_MAP, STATUS_LABELS, RequestCategory } from '@/lib/constants';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Layers, Info } from 'lucide-react';

interface CategoryBreakdownProps {
  byCategory: CategoryStat[];
  totalRequests?: number;
}

/**
 * Category breakdown displaying service request volume and open vs resolved progress
 * for every municipal service category.
 *
 * Designed without third-party chart libraries using lightweight, accessible Tailwind CSS bars.
 * Category labels and status terms are sourced directly from constants.ts.
 */
export function CategoryBreakdown({ byCategory, totalRequests = 0 }: CategoryBreakdownProps) {
  const hasZeroRequests = totalRequests === 0;

  return (
    <Card className="shadow-sm">
      <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E6B34]/10 text-[#1E6B34]"
              aria-hidden="true"
            >
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl font-bold text-zinc-950">Category Breakdown</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-zinc-700 font-medium">
                Resolution progress and request distribution across public service areas
              </CardDescription>
            </div>
          </div>

          {/* Quick summary pill */}
          <div className="text-xs font-semibold text-zinc-700 self-start sm:self-auto">
            <span className="font-bold text-zinc-950">{totalRequests}</span>{' '}
            total logged across {byCategory.length} categories
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 pt-2 sm:pt-3 space-y-4 sm:space-y-5">
        {/* Empty state friendly notice when no requests exist yet */}
        {hasZeroRequests && (
          <div
            role="status"
            className="rounded-lg bg-emerald-50 p-3 sm:p-4 text-xs sm:text-sm text-emerald-900 border border-emerald-200 flex items-start gap-2.5"
          >
            <Info className="h-4 w-4 shrink-0 text-[#1E6B34] mt-0.5" />
            <div>
              <p className="font-bold">No service requests submitted yet</p>
              <p className="text-xs text-emerald-800 font-medium mt-0.5">
                All service categories are initialized at zero. As citizens submit requests,
                resolution bars and counts will automatically update in real-time.
              </p>
            </div>
          </div>
        )}

        {/* List of categories */}
        <div className="space-y-4">
          {byCategory.map((item) => {
            const meta = CATEGORY_MAP[item.category as RequestCategory];
            const label = meta ? meta.label : item.category;
            const emoji = meta?.emoji || '📋';

            const openPct = item.total > 0 ? (item.open / item.total) * 100 : 0;
            const resolvedPct = item.total > 0 ? (item.resolved / item.total) * 100 : 0;
            const roundedResolvedPct = Math.round(resolvedPct);
            const roundedOpenPct = Math.round(openPct);

            return (
              <div key={item.category} className="space-y-1.5">
                {/* Header line: Category label, emoji, and explicit text counts */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs sm:text-sm">
                  <div className="flex items-center gap-1.5 font-bold text-zinc-950">
                    <span aria-hidden="true">{emoji}</span>
                    <span>{label}</span>
                  </div>

                  {/* Explicit text counts: never rely on bar color alone for meaning */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-zinc-700 font-medium">
                    <span>
                      <strong className="text-zinc-950 font-bold">{item.total}</strong> total
                    </span>
                    <span className="text-zinc-400" aria-hidden="true">•</span>
                    <span className="text-amber-800 font-bold">
                      <strong>{item.open}</strong> open
                    </span>
                    <span className="text-zinc-400" aria-hidden="true">•</span>
                    <span className="text-[#1E6B34] font-bold">
                      <strong>{item.resolved}</strong> resolved
                    </span>
                    {item.total > 0 && (
                      <>
                        <span className="text-zinc-400" aria-hidden="true">•</span>
                        <span className="font-semibold text-zinc-900">
                          {roundedResolvedPct}% resolved
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Horizontal proportion bar with accessible ARIA tags and visually hidden text */}
                <div
                  className="h-2.5 sm:h-3 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex shadow-inner"
                  role="progressbar"
                  aria-valuenow={roundedResolvedPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${label}: ${item.total} total, ${item.open} open, ${item.resolved} resolved (${roundedResolvedPct}% resolved)`}
                >
                  <span className="sr-only">
                    {label}: {item.total} total requests. {item.open} open ({roundedOpenPct}%),{' '}
                    {item.resolved} resolved ({roundedResolvedPct}%).
                  </span>

                  {item.total > 0 ? (
                    <>
                      {item.open > 0 && (
                        <div
                          style={{ width: `${openPct}%` }}
                          className="h-full bg-amber-500 transition-all duration-300 ease-out"
                          title={`Open: ${item.open} (${roundedOpenPct}%)`}
                        />
                      )}
                      {item.resolved > 0 && (
                        <div
                          style={{ width: `${resolvedPct}%` }}
                          className="h-full bg-[#1E6B34] dark:bg-emerald-500 transition-all duration-300 ease-out"
                          title={`Resolved: ${item.resolved} (${roundedResolvedPct}%)`}
                        />
                      )}
                    </>
                  ) : (
                    <div
                      className="h-full w-full bg-zinc-200/60 dark:bg-zinc-800"
                      title="No requests in this category"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend describing the bar segments using canonical status labels */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">Legend:</span>
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0"
              aria-hidden="true"
            />
            <span>
              Open ({STATUS_LABELS.pending} &amp; {STATUS_LABELS.in_progress})
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full bg-[#1E6B34] dark:bg-emerald-500 shrink-0"
              aria-hidden="true"
            />
            <span>{STATUS_LABELS.resolved}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
