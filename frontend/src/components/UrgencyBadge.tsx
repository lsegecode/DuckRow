/**
 * UrgencyBadge — color-coded visual indicator for external urgency and internal priority.
 *
 * Requirements:
 * - 'E' for External Urgency (Client-facing)
 * - 'I' for Internal Priority (Staff-facing)
 * - Low = Grey
 * - Medium = Green
 * - High = Yellow
 * - Critical = Red
 * - Minimal design without text to declutter cards.
 */

import { useTranslation } from 'react-i18next';
import type { Urgency, Priority } from '../types';

interface UrgencyBadgeProps {
  level: Urgency | Priority;
  type?: 'urgency' | 'priority';
  size?: 'sm' | 'md';
}

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  LOW: {
    bg: 'bg-slate-800/80',
    text: 'text-slate-300',
    border: 'border-slate-600/60',
    glow: 'shadow-none',
  },
  MEDIUM: {
    bg: 'bg-emerald-950/80',
    text: 'text-emerald-400',
    border: 'border-emerald-500/50',
    glow: 'shadow-[0_0_8px_rgba(16,185,129,0.2)]',
  },
  HIGH: {
    bg: 'bg-amber-950/80',
    text: 'text-amber-300',
    border: 'border-amber-500/50',
    glow: 'shadow-[0_0_8px_rgba(245,158,11,0.2)]',
  },
  CRITICAL: {
    bg: 'bg-rose-950/80',
    text: 'text-rose-300',
    border: 'border-rose-500/60',
    glow: 'shadow-[0_0_10px_rgba(244,63,94,0.3)] animate-pulse',
  },
};

export default function UrgencyBadge({ level, type = 'urgency', size = 'sm' }: UrgencyBadgeProps) {
  const { t } = useTranslation('tickets');
  const style = COLOR_MAP[level] || COLOR_MAP.LOW;
  const prefix = type === 'priority' ? 'I' : 'E';
  const label = t(`${type}.${level}`);
  const titleType = type === 'priority' ? t('table.priority') : t('table.urgency');

  const sizeClass =
    size === 'md'
      ? 'w-6 h-6 text-xs'
      : 'w-5 h-5 text-[10px]';

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 ${sizeClass} font-bold rounded-full border ${style.bg} ${style.text} ${style.border} ${style.glow} select-none cursor-default transition-all leading-none`}
      title={`${titleType} (${prefix}): ${label}`}
    >
      {prefix}
    </span>
  );
}
