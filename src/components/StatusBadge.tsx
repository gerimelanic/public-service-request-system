import { RequestStatus, STATUS_CONFIG } from '@/lib/constants';

interface StatusBadgeProps {
  status: RequestStatus;
  className?: string;
}

// Reusable status badge component.
// Adheres to the strict color scheme: pending = grey, in_progress = amber, resolved = green.
export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.badgeClasses} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dotClass}`} />
      <span>{config.label}</span>
    </span>
  );
}
