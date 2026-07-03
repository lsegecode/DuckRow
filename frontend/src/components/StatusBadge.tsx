/**
 * StatusBadge — color-coded pill for ticket status.
 */

import type { TicketStatus } from '../types';

interface StatusBadgeProps {
  status: TicketStatus;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<TicketStatus, { label: string; classes: string }> = {
  OPEN: {
    label: 'Open',
    classes: 'bg-status-open/20 text-status-open border-status-open/30',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    classes: 'bg-status-in-progress/20 text-status-in-progress border-status-in-progress/30',
  },
  RESOLVED: {
    label: 'Resolved',
    classes: 'bg-status-resolved/20 text-status-resolved border-status-resolved/30',
  },
  CLOSED: {
    label: 'Closed',
    classes: 'bg-status-closed/20 text-status-closed border-status-closed/30',
  },
};

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${config.classes} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        status === 'OPEN' ? 'bg-status-open' :
        status === 'IN_PROGRESS' ? 'bg-status-in-progress' :
        status === 'RESOLVED' ? 'bg-status-resolved' :
        'bg-status-closed'
      }`} />
      {config.label}
    </span>
  );
}
