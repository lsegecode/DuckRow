/**
 * UrgencyBadge — color-coded pill for urgency/priority levels.
 */

import { useTranslation } from 'react-i18next';
import type { Urgency, Priority } from '../types';

interface UrgencyBadgeProps {
  level: Urgency | Priority;
  type?: 'urgency' | 'priority';
}

const LEVEL_CLASSES: Record<string, string> = {
  LOW: 'bg-urgency-low/20 text-urgency-low border-urgency-low/30',
  MEDIUM: 'bg-urgency-medium/20 text-urgency-medium border-urgency-medium/30',
  HIGH: 'bg-urgency-high/20 text-urgency-high border-urgency-high/30',
  CRITICAL: 'bg-priority-critical/20 text-priority-critical border-priority-critical/30 animate-pulse-glow',
};

export default function UrgencyBadge({ level, type = 'urgency' }: UrgencyBadgeProps) {
  const { t } = useTranslation('tickets');
  const classes = LEVEL_CLASSES[level] || LEVEL_CLASSES.LOW;
  const prefix = type === 'priority' ? 'P' : 'U';
  const label = t(`${type}.${level}`);
  const titleType = type === 'priority' ? t('table.priority') : t('table.urgency');

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full border ${classes}`}
      title={`${titleType}: ${label}`}
    >
      <span className="mr-1 opacity-60">{prefix}:</span>
      {label}
    </span>
  );
}
