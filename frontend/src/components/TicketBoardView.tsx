import { useTranslation } from 'react-i18next';
import TicketBoardCard from './TicketBoardCard';
import type { Ticket } from '../types';

interface TicketBoardViewProps {
  tickets: Ticket[];
  isLoading: boolean;
}

export default function TicketBoardView({ tickets, isLoading }: TicketBoardViewProps) {
  const { t } = useTranslation(['tickets', 'common']);

  // Sort tickets by oldest to newest by default (FIFO - First In, First Out)
  const sortedTickets = [...tickets].sort((a, b) => {
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  // Categorize tickets into the 3 columns
  // Column 1: CREATED (OPEN unassigned) and ASSIGNED (OPEN assigned)
  const queueTickets = sortedTickets.filter((ticket) => ticket.status === 'OPEN');
  const createdCount = queueTickets.filter((t) => !t.assigned_to).length;
  const assignedCount = queueTickets.filter((t) => !!t.assigned_to).length;

  // Column 2: IN PROGRESS
  const inProgressTickets = sortedTickets.filter((ticket) => ticket.status === 'IN_PROGRESS');

  // Column 3: RESOLVED (testing it) and CLOSED
  const doneTickets = sortedTickets.filter(
    (ticket) => ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
  );
  const resolvedCount = doneTickets.filter((t) => t.status === 'RESOLVED').length;
  const closedCount = doneTickets.filter((t) => t.status === 'CLOSED').length;

  const columns = [
    {
      id: 'QUEUE' as const,
      title: t('board.col_queue'),
      subtitle: t('board.col_queue_desc'),
      tickets: queueTickets,
      badgeText: `${queueTickets.length}`,
      breakdownText: `${createdCount} ${t('board.substatus_created').toLowerCase()} · ${assignedCount} ${t('board.substatus_assigned').toLowerCase()}`,
      headerColor: 'border-t-teal text-teal-glow bg-teal/5',
      indicatorColor: 'bg-teal',
    },
    {
      id: 'IN_PROGRESS' as const,
      title: t('board.col_in_progress'),
      subtitle: t('board.col_in_progress_desc'),
      tickets: inProgressTickets,
      badgeText: `${inProgressTickets.length}`,
      breakdownText: t('board.count_breakdown', { count: inProgressTickets.length }),
      headerColor: 'border-t-status-in-progress text-status-in-progress bg-status-in-progress/5',
      indicatorColor: 'bg-status-in-progress',
    },
    {
      id: 'DONE' as const,
      title: t('board.col_done'),
      subtitle: t('board.col_done_desc'),
      tickets: doneTickets,
      badgeText: `${doneTickets.length}`,
      breakdownText: `${resolvedCount} ${t('board.substatus_resolved').toLowerCase()} · ${closedCount} ${t('board.substatus_closed').toLowerCase()}`,
      headerColor: 'border-t-status-resolved text-status-resolved bg-status-resolved/5',
      indicatorColor: 'bg-status-resolved',
    },
  ];

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
    <div className="space-y-4 animate-fade-in">
      {/* 3 Columns Kanban Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {columns.map((column) => (
          <div
            key={column.id}
            className="flex flex-col bg-obsidian-light/60 border border-border rounded-2xl overflow-hidden shadow-lg backdrop-blur-sm min-h-[600px]"
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
              <p className="text-[11px] text-text-muted mt-1">
                {column.breakdownText}
              </p>
            </div>

            {/* Column Body / Cards List */}
            <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)]">
              {column.tickets.length > 0 ? (
                column.tickets.map((ticket) => (
                  <TicketBoardCard
                    key={ticket.id}
                    ticket={ticket}
                    columnType={column.id}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-text-muted border-2 border-dashed border-border/40 rounded-xl m-2">
                  <span className="text-2xl mb-2 opacity-50">🦆</span>
                  <p className="text-xs font-medium">{t('board.empty_column')}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
