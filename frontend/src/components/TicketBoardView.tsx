/**
 * TicketBoardView — Kanban board with HTML5 drag & drop.
 *
 * - Draggable cards via HTML5 DnD API (no external lib)
 * - Drop zones per column with smooth highlight animations
 * - Contextual modals via KanbanDragModal on drop
 * - Valid transitions: OPEN → IN_PROGRESS → RESOLVED → CLOSED (forward only)
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { ticketsApi } from '../api/tickets';
import { usersApi } from '../api/users';
import TicketBoardCard from './TicketBoardCard';
import KanbanDragModal from './KanbanDragModal';
import type { Ticket, TicketStatus } from '../types';

interface TicketBoardViewProps {
  tickets: Ticket[];
  isLoading: boolean;
}

// Allowed forward-only transitions
const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ['IN_PROGRESS'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED: ['CLOSED'],
  CLOSED: [],
};

// Map board column IDs to valid drop targets
const COLUMN_TARGET_STATUS: Record<'QUEUE' | 'IN_PROGRESS' | 'DONE', TicketStatus[]> = {
  QUEUE: [],              // Can't drop onto queue from any valid transition
  IN_PROGRESS: ['IN_PROGRESS'],
  DONE: ['RESOLVED', 'CLOSED'],
};

type ColumnId = 'QUEUE' | 'IN_PROGRESS' | 'DONE';

interface PendingDrop {
  ticket: Ticket;
  targetStatus: TicketStatus;
}

export default function TicketBoardView({ tickets, isLoading }: TicketBoardViewProps) {
  const { t } = useTranslation(['tickets', 'common']);
  const { role, user } = useAuth();
  const queryClient = useQueryClient();

  const [draggingTicketId, setDraggingTicketId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ColumnId | null>(null);
  const [pendingDrop, setPendingDrop] = useState<PendingDrop | null>(null);

  // Fetch resolvers list (needed for SYSADMIN assign modal)
  const { data: resolversRaw } = useQuery({
    queryKey: ['resolvers'],
    queryFn: usersApi.getResolvers,
    enabled: role === 'SYSADMIN',
  });
  const resolvers = Array.isArray(resolversRaw) ? resolversRaw : (resolversRaw as any)?.results || [];

  const dragUpdateMutation = useMutation({
    mutationFn: (payload: { id: string; body: any }) =>
      ticketsApi.update(payload.id, payload.body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-stats'] });
      setPendingDrop(null);
    },
    onError: (error: any) => {
      console.error('Failed to update ticket during drag & drop:', error);
      alert(error?.response?.data?.detail || error?.response?.data?.message || 'Error al actualizar el ticket');
      setPendingDrop(null);
    },
  });

  // Sort tickets oldest first (FIFO)
  const sortedTickets = [...tickets].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const queueTickets = sortedTickets.filter((t) => t.status === 'OPEN');
  const inProgressTickets = sortedTickets.filter((t) => t.status === 'IN_PROGRESS');
  const doneTickets = sortedTickets.filter(
    (t) => t.status === 'RESOLVED' || t.status === 'CLOSED'
  );

  const createdCount = queueTickets.filter((t) => !t.assigned_to).length;
  const assignedCount = queueTickets.filter((t) => !!t.assigned_to).length;
  const resolvedCount = doneTickets.filter((t) => t.status === 'RESOLVED').length;
  const closedCount = doneTickets.filter((t) => t.status === 'CLOSED').length;

  const columns: {
    id: ColumnId;
    title: string;
    subtitle: string;
    tickets: Ticket[];
    badgeText: string;
    breakdownText: string;
    headerColor: string;
    indicatorColor: string;
    dropTargetStatuses: TicketStatus[];
    dropAccentClass: string;
  }[] = [
    {
      id: 'QUEUE',
      title: t('board.col_queue'),
      subtitle: t('board.col_queue_desc'),
      tickets: queueTickets,
      badgeText: `${queueTickets.length}`,
      breakdownText: `${createdCount} ${t('board.substatus_created').toLowerCase()} · ${assignedCount} ${t('board.substatus_assigned').toLowerCase()}`,
      headerColor: 'border-t-teal text-teal-glow bg-teal/5',
      indicatorColor: 'bg-teal',
      dropTargetStatuses: COLUMN_TARGET_STATUS.QUEUE,
      dropAccentClass: 'border-teal/60 shadow-[0_0_30px_rgba(13,92,77,0.25)]',
    },
    {
      id: 'IN_PROGRESS',
      title: t('board.col_in_progress'),
      subtitle: t('board.col_in_progress_desc'),
      tickets: inProgressTickets,
      badgeText: `${inProgressTickets.length}`,
      breakdownText: t('board.count_breakdown', { count: inProgressTickets.length }),
      headerColor: 'border-t-status-in-progress text-status-in-progress bg-status-in-progress/5',
      indicatorColor: 'bg-status-in-progress',
      dropTargetStatuses: COLUMN_TARGET_STATUS.IN_PROGRESS,
      dropAccentClass: 'border-status-in-progress/60 shadow-[0_0_30px_rgba(139,92,246,0.25)]',
    },
    {
      id: 'DONE',
      title: t('board.col_done'),
      subtitle: t('board.col_done_desc'),
      tickets: doneTickets,
      badgeText: `${doneTickets.length}`,
      breakdownText: `${resolvedCount} ${t('board.substatus_resolved').toLowerCase()} · ${closedCount} ${t('board.substatus_closed').toLowerCase()}`,
      headerColor: 'border-t-status-resolved text-status-resolved bg-status-resolved/5',
      indicatorColor: 'bg-status-resolved',
      dropTargetStatuses: COLUMN_TARGET_STATUS.DONE,
      dropAccentClass: 'border-status-resolved/60 shadow-[0_0_30px_rgba(16,185,129,0.25)]',
    },
  ];

  // ── Drag handlers ─────────────────────────────────────────────────────────

  const handleDragStart = (ticket: Ticket) => {
    setDraggingTicketId(ticket.id);
  };

  const handleDragEnd = () => {
    setDraggingTicketId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: ColumnId) => {
    e.preventDefault();

    if (!draggingTicketId) return;

    const draggingTicket = tickets.find((t) => t.id === draggingTicketId);
    if (!draggingTicket) return;

    const col = columns.find((c) => c.id === columnId);
    if (!col) return;

    // Only highlight if there's a valid transition for this ticket into this column
    const validTargetsForTicket = VALID_TRANSITIONS[draggingTicket.status];
    const hasValidTarget = col.dropTargetStatuses.some((s) =>
      validTargetsForTicket.includes(s)
    );

    if (hasValidTarget) {
      e.dataTransfer.dropEffect = 'move';
      setDragOverColumn(columnId);
    } else {
      e.dataTransfer.dropEffect = 'none';
      setDragOverColumn(null);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, columnId: ColumnId) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggingTicketId) return;
    const draggingTicket = tickets.find((t) => t.id === draggingTicketId);
    if (!draggingTicket) return;

    const col = columns.find((c) => c.id === columnId);
    if (!col) return;

    const validTargetsForTicket = VALID_TRANSITIONS[draggingTicket.status];
    const matchedTarget = col.dropTargetStatuses.find((s) =>
      validTargetsForTicket.includes(s)
    );

    if (!matchedTarget) return;

    // For DONE column, choose RESOLVED first, then CLOSED if already resolved
    let targetStatus: TicketStatus = matchedTarget;
    if (columnId === 'DONE') {
      targetStatus = draggingTicket.status === 'RESOLVED' ? 'CLOSED' : 'RESOLVED';
    }

    // Only staff can trigger drag transitions
    if (role !== 'SYSADMIN' && role !== 'RESOLVER') return;

    setPendingDrop({ ticket: draggingTicket, targetStatus });
    setDraggingTicketId(null);
  };

  const handleModalConfirm = (payload: any) => {
    if (!pendingDrop) return;
    dragUpdateMutation.mutate({ id: pendingDrop.ticket.id, body: payload });
  };

  const handleModalCancel = () => {
    setPendingDrop(null);
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
        {[...Array(3)].map((_, colIdx) => (
          <div key={colIdx} className="glass-card p-4 space-y-4 min-h-[500px]">
            <div className="h-8 bg-surface/50 rounded-lg animate-pulse" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-surface/30 rounded-xl animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 animate-fade-in">
        {/* 3 Columns Kanban Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {columns.map((column) => {
            const isDragTarget = dragOverColumn === column.id && column.dropTargetStatuses.length > 0;

            return (
              <div
                key={column.id}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
                className={[
                  'flex flex-col bg-obsidian-light/60 border border-border rounded-2xl overflow-hidden shadow-lg backdrop-blur-sm min-h-[600px]',
                  'transition-all duration-200',
                  isDragTarget ? `border-opacity-100 ${column.dropAccentClass}` : '',
                ].join(' ')}
              >
                {/* Column Header */}
                <div className={`p-4 border-b border-border border-t-2 ${column.headerColor}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${column.indicatorColor} animate-pulse`} />
                      <h2 className="font-bold text-sm text-text-primary tracking-wide uppercase">
                        {column.title}
                      </h2>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-surface border border-border text-xs font-bold text-text-primary shadow-inner">
                      {column.badgeText}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted mt-1">{column.breakdownText}</p>
                </div>

                {/* Drop hint banner */}
                {isDragTarget && (
                  <div className="mx-3 mt-3 px-3 py-2 rounded-xl border border-dashed border-current/40 text-[11px] font-semibold text-center animate-fade-in"
                    style={{ color: 'var(--color-teal-glow)', background: 'rgba(13,92,77,0.08)' }}>
                    ⬇ Soltar aquí
                  </div>
                )}

                {/* Column Body / Cards List */}
                <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)]">
                  {column.tickets.length > 0 ? (
                    column.tickets.map((ticket) => (
                      <TicketBoardCard
                        key={ticket.id}
                        ticket={ticket}
                        columnType={column.id}
                        isDragging={draggingTicketId === ticket.id}
                        onDragStart={() => handleDragStart(ticket)}
                        onDragEnd={handleDragEnd}
                      />
                    ))
                  ) : (
                    <div className={[
                      'flex flex-col items-center justify-center py-16 text-center text-text-muted border-2 border-dashed rounded-xl m-2 transition-all duration-200',
                      isDragTarget ? 'border-teal/40 bg-teal/5' : 'border-border/40',
                    ].join(' ')}>
                      <span className="text-2xl mb-2 opacity-50">🦆</span>
                      <p className="text-xs font-medium">{t('board.empty_column')}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drag & Drop Modal */}
      {pendingDrop && (
        <KanbanDragModal
          ticket={pendingDrop.ticket}
          targetStatus={pendingDrop.targetStatus}
          role={role!}
          currentUser={user}
          resolvers={resolvers}
          onConfirm={handleModalConfirm}
          onCancel={handleModalCancel}
          isPending={dragUpdateMutation.isPending}
        />
      )}
    </>
  );
}
