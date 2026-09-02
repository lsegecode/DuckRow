import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi } from '../api/tickets';
import { useAuth } from '../context/AuthContext';
import TicketTypeBadge from './TicketTypeBadge';
import UrgencyBadge from './UrgencyBadge';
import UserAvatar from './UserAvatar';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import type { Ticket, TicketStatus, Priority } from '../types';

interface TicketBoardCardProps {
  ticket: Ticket;
  columnType: 'QUEUE' | 'IN_PROGRESS' | 'DONE';
  isDragging?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export default function TicketBoardCard({
  ticket,
  columnType,
  isDragging = false,
  onDragStart,
  onDragEnd,
}: TicketBoardCardProps) {
  const { role } = useAuth();
  const { t } = useTranslation(['tickets', 'common']);
  const queryClient = useQueryClient();
  const [isChangingPriority, setIsChangingPriority] = useState(false);

  const isStaff = role === 'SYSADMIN' || role === 'RESOLVER';
  const isAssigned = !!ticket.assigned_to;

  // Determine substatus according to the user's specification:
  // - Created: OPEN + !assigned_to
  // - Assigned: OPEN + assigned_to
  // - In Progress: IN_PROGRESS
  // - Resolved (Testing it): RESOLVED
  // - Closed: CLOSED
  let substatusKey = 'board.substatus_created';
  let substatusBadgeColor = 'bg-obsidian border-border text-text-muted';
  let shouldShowAvatar = false;
  let avatarUser = null;
  let avatarSubtitle = '';

  if (ticket.status === 'OPEN') {
    if (isAssigned) {
      substatusKey = 'board.substatus_assigned';
      substatusBadgeColor = 'bg-teal/10 border-teal/30 text-teal-glow';
      shouldShowAvatar = true;
      avatarUser = ticket.assigned_to;
      avatarSubtitle = t('board.assigned_to', { name: ticket.assigned_to?.first_name || ticket.assigned_to?.username });
    } else {
      substatusKey = 'board.substatus_created';
      substatusBadgeColor = 'bg-surface border-border text-text-secondary';
      shouldShowAvatar = false; // Created has no picture
    }
  } else if (ticket.status === 'IN_PROGRESS') {
    substatusKey = 'board.substatus_in_progress';
    substatusBadgeColor = 'bg-status-in-progress/10 border-status-in-progress/30 text-status-in-progress';
    shouldShowAvatar = true; // In Progress has picture
    avatarUser = ticket.assigned_to;
    avatarSubtitle = t('board.assigned_to', { name: ticket.assigned_to?.first_name || ticket.assigned_to?.username });
  } else if (ticket.status === 'RESOLVED') {
    substatusKey = 'board.substatus_resolved';
    substatusBadgeColor = 'bg-status-resolved/10 border-status-resolved/30 text-status-resolved';
    shouldShowAvatar = true; // Resolved has picture of tester/resolver
    avatarUser = ticket.assigned_to || ticket.created_by;
    avatarSubtitle = t('board.testing_by', { name: avatarUser?.first_name || avatarUser?.username });
  } else if (ticket.status === 'CLOSED') {
    substatusKey = 'board.substatus_closed';
    substatusBadgeColor = 'bg-obsidian border-border text-text-muted';
    shouldShowAvatar = false; // Closed has no picture
  }

  // Mutations
  const updateMutation = useMutation({
    mutationFn: (payload: any) => ticketsApi.update(ticket.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-stats'] });
      setIsChangingPriority(false);
    },
  });

  const claimMutation = useMutation({
    mutationFn: () => ticketsApi.claim(ticket.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-stats'] });
    },
  });

  const handleStatusTransition = (newStatus: TicketStatus) => {
    updateMutation.mutate({ status: newStatus });
  };

  const handlePriorityChange = (newPriority: Priority) => {
    updateMutation.mutate({ internal_priority: newPriority });
  };


  return (
    <div
      draggable={isStaff}
      onDragStart={(e) => {
        if (!isStaff) return;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', ticket.id);
        onDragStart?.();
      }}
      onDragEnd={onDragEnd}
      className={[
        'glass-card p-4 rounded-xl border border-border hover:border-teal/50',
        'transition-all duration-[var(--transition-fast)] shadow-md hover:shadow-[var(--shadow-glow-teal)]',
        'flex flex-col justify-between group space-y-3 bg-obsidian-light/80 backdrop-blur-md',
        isStaff ? 'cursor-grab active:cursor-grabbing select-none' : '',
        isDragging ? 'opacity-40 scale-95 rotate-1 shadow-2xl border-teal/30' : '',
      ].join(' ')}
    >
      {/* Top Header: Type, ID, Urgency & Internal Priority */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <TicketTypeBadge type={ticket.ticket_type || 'BUG'} />
            <span className="text-[11px] font-mono text-text-muted truncate">
              #{ticket.id.slice(0, 6)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <UrgencyBadge level={ticket.urgency} />

            {/* Internal Priority (Staff only) */}
            {isStaff && (
              <div className="relative flex items-center">
                {isChangingPriority ? (
                  <select
                    autoFocus
                    value={ticket.internal_priority || 'MEDIUM'}
                    onChange={(e) => handlePriorityChange(e.target.value as Priority)}
                    onBlur={() => setIsChangingPriority(false)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-obsidian border border-teal text-text-primary outline-none cursor-pointer"
                  >
                    <option value="LOW">{t('tickets:priority.LOW')}</option>
                    <option value="MEDIUM">{t('tickets:priority.MEDIUM')}</option>
                    <option value="HIGH">{t('tickets:priority.HIGH')}</option>
                    <option value="CRITICAL">{t('tickets:priority.CRITICAL')}</option>
                  </select>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsChangingPriority(true)}
                    title={t('board.action_priority')}
                    className="cursor-pointer hover:scale-105 transition-transform flex items-center justify-center p-0 m-0 border-0 bg-transparent outline-none leading-none"
                  >
                    {ticket.internal_priority ? (
                      <UrgencyBadge level={ticket.internal_priority} type="priority" />
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 bg-surface text-text-muted rounded border border-border flex items-center">
                        + {t('board.action_priority')}
                      </span>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <Link
          to={`/tickets/${ticket.id}`}
          className="text-sm font-semibold text-text-primary group-hover:text-teal-glow transition-colors line-clamp-2 leading-snug"
        >
          {ticket.title}
        </Link>

        {/* Area tag & Date */}
        <div className="flex items-center justify-between text-[11px] text-text-muted mt-2">
          <span className="px-2 py-0.5 rounded-md bg-surface text-text-secondary border border-border/60">
            🏢 {ticket.source_area.name}
          </span>
          <span title={formatDateTime(ticket.created_at)}>
            🕒 {formatDate(ticket.created_at)}
          </span>
        </div>
      </div>

      {/* Middle/Bottom Footer: Substatus + Conditional Avatar per User Rules */}
      <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${substatusBadgeColor}`}>
            {t(substatusKey)}
          </span>

          {shouldShowAvatar && avatarUser && (
            <UserAvatar user={avatarUser} size="xs" subtitle={avatarSubtitle} />
          )}
        </div>

        {/* Quick Action Buttons for Resolvers and Sysadmins */}
        {isStaff && (
          <div className="flex items-center gap-1">
            {columnType === 'QUEUE' && !isAssigned && (
              <button
                onClick={() => claimMutation.mutate()}
                disabled={claimMutation.isPending}
                className="px-2 py-1 bg-teal/20 hover:bg-teal/35 text-teal-glow rounded-lg text-[10px] font-semibold border border-teal/30 transition-all hover:scale-105 active:scale-95"
                title={t('board.action_claim')}
              >
                {claimMutation.isPending ? '...' : `⚡ ${t('board.action_claim')}`}
              </button>
            )}

            {columnType === 'QUEUE' && isAssigned && (
              <button
                onClick={() => handleStatusTransition('IN_PROGRESS')}
                disabled={updateMutation.isPending}
                className="px-2 py-1 bg-status-in-progress/20 hover:bg-status-in-progress/35 text-status-in-progress rounded-lg text-[10px] font-semibold border border-status-in-progress/30 transition-all hover:scale-105 active:scale-95"
                title={t('board.action_start')}
              >
                ▶ {t('board.action_start')}
              </button>
            )}

            {columnType === 'IN_PROGRESS' && (
              <button
                onClick={() => handleStatusTransition('RESOLVED')}
                disabled={updateMutation.isPending}
                className="px-2 py-1 bg-status-resolved/20 hover:bg-status-resolved/35 text-status-resolved rounded-lg text-[10px] font-semibold border border-status-resolved/30 transition-all hover:scale-105 active:scale-95"
                title={t('board.action_resolve')}
              >
                ✓ {t('board.action_resolve')}
              </button>
            )}

            {columnType === 'DONE' && ticket.status === 'RESOLVED' && (
              <button
                onClick={() => handleStatusTransition('CLOSED')}
                disabled={updateMutation.isPending}
                className="px-2 py-1 bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary rounded-lg text-[10px] font-semibold border border-border transition-all hover:scale-105 active:scale-95"
                title={t('board.action_close')}
              >
                🏁 {t('board.action_close')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
