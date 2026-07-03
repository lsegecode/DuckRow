/**
 * UrgencyBadge — color-coded pill for urgency/priority levels.
 */

import type { Urgency, Priority } from '../types';

interface UrgencyBadgeProps {
  level: Urgency | Priority;
  type?: 'urgency' | 'priority';
}

const LEVEL_CONFIG: Record<string, { label: string; classes: string }> = {
  LOW: {
    label: 'Low',
    classes: 'bg-urgency-low/20 text-urgency-low border-urgency-low/30',
  },
  MEDIUM: {
    label: 'Medium',
    classes: 'bg-urgency-medium/20 text-urgency-medium border-urgency-medium/30',
  },
  HIGH: {
    label: 'High',
    classes: 'bg-urgency-high/20 text-urgency-high border-urgency-high/30',
  },
  CRITICAL: {
    label: 'Critical',
    classes: 'bg-priority-critical/20 text-priority-critical border-priority-critical/30 animate-pulse-glow',
  },
};

export default function UrgencyBadge({ level, type = 'urgency' }: UrgencyBadgeProps) {
  const config = LEVEL_CONFIG[level];
  const prefix = type === 'priority' ? 'P' : 'U';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full border ${config.classes}`}
      title={`${type === 'priority' ? 'Internal Priority' : 'Urgency'}: ${config.label}`}
    >
      <span className="mr-1 opacity-60">{prefix}:</span>
      {config.label}
    </span>
  );
}
