import { RequestStats } from '@/lib/analytics';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Clock, CheckCircle2, TrendingUp } from 'lucide-react';

interface StatsCardsProps {
  stats: RequestStats;
}

/**
 * High-level key performance metrics for the municipal admin dashboard.
 * Uses a mobile-first responsive grid (2 columns on mobile, 4 columns on desktop).
 * Styled with the municipal primary green (#1E6B34) and Lucide icons.
 */
export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Requests',
      value: stats.total,
      suffix: '',
      subtitle: 'All submitted issues',
      icon: FileText,
      ariaLabel: `Total requests: ${stats.total}`,
    },
    {
      title: 'Open Requests',
      value: stats.open,
      suffix: '',
      subtitle: `${stats.pending} pending, ${stats.inProgress} in progress`,
      icon: Clock,
      ariaLabel: `Open requests: ${stats.open} (${stats.pending} pending, ${stats.inProgress} in progress)`,
    },
    {
      title: 'Resolved',
      value: stats.resolved,
      suffix: '',
      subtitle: 'Successfully closed',
      icon: CheckCircle2,
      ariaLabel: `Resolved requests: ${stats.resolved}`,
    },
    {
      title: 'Resolution Rate',
      value: stats.resolutionRate,
      suffix: '%',
      subtitle: 'Resolved vs total',
      icon: TrendingUp,
      ariaLabel: `Resolution rate: ${stats.resolutionRate} percent`,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => {
        const IconComponent = card.icon;
        return (
          <Card
            key={card.title}
            className="hover:border-[#1E6B34]/50 transition-colors shadow-sm"
            aria-label={card.ariaLabel}
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-bold text-zinc-800 line-clamp-1">
                  {card.title}
                </span>
                {/* Municipal primary color badge icon */}
                <div
                  className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-[#1E6B34]/10 text-[#1E6B34]"
                  aria-hidden="true"
                >
                  <IconComponent className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>

              <div className="mt-2 sm:mt-3">
                <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
                  {card.value}
                  {card.suffix}
                </div>
                <p className="text-[11px] sm:text-xs text-zinc-600 font-medium mt-1 line-clamp-1">
                  {card.subtitle}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
