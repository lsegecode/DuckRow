/**
 * TicketTypeBadge — color-coded pill for Bug vs Feature ticket types.
 */

import { useTranslation } from 'react-i18next';
import type { TicketType } from '../types';

interface TicketTypeBadgeProps {
  type: TicketType;
  size?: 'sm' | 'md';
}

export default function TicketTypeBadge({ type, size = 'sm' }: TicketTypeBadgeProps) {
  const { t } = useTranslation('tickets');
  const isBug = type === 'BUG';
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-md border tracking-tight ${
        isBug
          ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
          : 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
      } ${sizeClasses}`}
    >
      <span>{isBug ? '🐞' : '✨'}</span>
      <span>{t(`type.${type}`)}</span>
    </span>
  );
}
