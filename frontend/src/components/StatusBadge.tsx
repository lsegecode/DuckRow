/**
 * StatusBadge — color-coded pill for ticket status.
 */

import { useTranslation } from 'react-i18next';
import type { TicketStatus } from '../types';

interface StatusBadgeProps {
  status: TicketStatus;
  size?: 'sm' | 'md';
}

const STATUS_CLASSES: Record<TicketStatus, { classes: string; dotClass: string }> = {
  OPEN: {
    classes: 'bg-status-open/20 text-status-open border-status-open/30',
    dotClass: 'bg-status-open',
  },
  IN_PROGRESS: {
    classes: 'bg-status-in-progress/20 text-status-in-progress border-status-in-progress/30',
    dotClass: 'bg-status-in-progress',
  },
  RESOLVED: {
    classes: 'bg-status-resolved/20 text-status-resolved border-status-resolved/30',
    dotClass: 'bg-status-resolved',
  },
  CLOSED: {
    classes: 'bg-status-closed/20 text-status-closed border-status-closed/30',
    dotClass: 'bg-status-closed',
  },
};

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const { t } = useTranslation('tickets');
  const config = STATUS_CLASSES[status] || STATUS_CLASSES.OPEN;
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  const label = t(`status.${status}`);

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${config.classes} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${config.dotClass}`} />
      {label}
    </span>
  );
}
