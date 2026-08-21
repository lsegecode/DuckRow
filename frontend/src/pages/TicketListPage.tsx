import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ticketsApi } from '../api/tickets';
import { usersApi } from '../api/users';
import StatusBadge from '../components/StatusBadge';
import UrgencyBadge from '../components/UrgencyBadge';
import TicketTypeBadge from '../components/TicketTypeBadge';
import UserAvatar from '../components/UserAvatar';
import TicketBoardView from '../components/TicketBoardView';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/dateUtils';

export default function TicketListPage() {
  const { role } = useAuth();
  const { t } = useTranslation(['tickets', 'common']);
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || '');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('');
  const [areaFilter, setAreaFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [ordering, setOrdering] = useState<string>('created_at'); // default oldest first (FIFO)
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam !== null) {
      setStatusFilter(statusParam);
    }
  }, [searchParams]);

  // Fetch areas for filtering
  const { data: areas } = useQuery({
    queryKey: ['areas'],
    queryFn: usersApi.getAreas,
  });

  // Fetch tickets based on filters
  const { data: ticketsData, isLoading, isError } = useQuery({
    queryKey: ['tickets', { ticket_type: typeFilter, status: statusFilter, urgency: urgencyFilter, area: areaFilter, search, ordering, page }],
    queryFn: () =>
      ticketsApi.list({
        ticket_type: typeFilter || undefined,
        status: statusFilter || undefined,
        urgency: urgencyFilter || undefined,
        source_area: areaFilter || undefined,
        search: search || undefined,
        ordering,
        page,
      }),
  });

  const handleResetFilters = () => {
    setTypeFilter('');
    setStatusFilter('');
    setUrgencyFilter('');
    setAreaFilter('');
    setSearch('');
    setPage(1);
  };

  const showCreateButton = true;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">{t('tickets:list_title')}</h1>
          <p className="text-text-secondary mt-1">{t('tickets:list_subtitle')}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* View Switcher Toggle */}
          <div className="flex items-center p-1 bg-obsidian-light border border-border rounded-xl shadow-inner">
            <button
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'board'
                  ? 'bg-teal text-white shadow-[var(--shadow-glow-teal)]'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="5" height="18" rx="1" />
                <rect x="10" y="3" width="5" height="12" rx="1" />
                <rect x="17" y="3" width="5" height="15" rx="1" />
              </svg>
              <span>{t('tickets:view_board')}</span>
            </button>

            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-teal text-white shadow-[var(--shadow-glow-teal)]'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
              <span>{t('tickets:view_list')}</span>
            </button>
          </div>

          {showCreateButton && (
            <Link
              to="/tickets/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal hover:bg-teal-light text-white font-semibold rounded-xl transition-all duration-[var(--transition-fast)] hover:shadow-[var(--shadow-glow-teal)] active:scale-[0.98] shrink-0 text-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              {t('tickets:create_ticket')}
            </Link>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-card p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative lg:col-span-1 sm:col-span-2">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-muted">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input
              type="text"
              placeholder={t('tickets:search_placeholder')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-obsidian border border-border rounded-xl text-text-primary placeholder-text-muted focus:border-teal focus:ring-1 focus:ring-teal/50 transition-all outline-none text-sm"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2.5 bg-obsidian border border-border rounded-xl text-text-primary focus:border-teal focus:ring-1 focus:ring-teal/50 transition-all outline-none text-sm cursor-pointer"
          >
            <option value="">{t('tickets:filter_all_types')}</option>
            <option value="BUG">🐞 {t('tickets:type.BUG')}</option>
            <option value="FEATURE">✨ {t('tickets:type.FEATURE')}</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2.5 bg-obsidian border border-border rounded-xl text-text-primary focus:border-teal focus:ring-1 focus:ring-teal/50 transition-all outline-none text-sm cursor-pointer"
          >
            <option value="">{t('tickets:filter_all_statuses')}</option>
            <option value="OPEN">{t('tickets:status.OPEN')}</option>
            <option value="IN_PROGRESS">{t('tickets:status.IN_PROGRESS')}</option>
            <option value="RESOLVED">{t('tickets:status.RESOLVED')}</option>
            <option value="CLOSED">{t('tickets:status.CLOSED')}</option>
          </select>

          {/* Urgency Filter */}
          <select
            value={urgencyFilter}
            onChange={(e) => {
              setUrgencyFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2.5 bg-obsidian border border-border rounded-xl text-text-primary focus:border-teal focus:ring-1 focus:ring-teal/50 transition-all outline-none text-sm cursor-pointer"
          >
            <option value="">{t('tickets:filter_all_urgencies')}</option>
            <option value="LOW">{t('tickets:urgency.LOW')}</option>
            <option value="MEDIUM">{t('tickets:urgency.MEDIUM')}</option>
            <option value="HIGH">{t('tickets:urgency.HIGH')}</option>
          </select>

          {/* Area Filter */}
          <select
            value={areaFilter}
            onChange={(e) => {
              setAreaFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2.5 bg-obsidian border border-border rounded-xl text-text-primary focus:border-teal focus:ring-1 focus:ring-teal/50 transition-all outline-none text-sm cursor-pointer"
          >
            <option value="">{t('tickets:filter_all_areas')}</option>
            {areas?.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </div>

        {/* Ordering and Clear Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border/50">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <span>{t('tickets:sort_by')}:</span>
            <select
              value={ordering}
              onChange={(e) => setOrdering(e.target.value)}
              className="bg-transparent border-none text-teal-glow font-medium outline-none cursor-pointer focus:ring-0 text-sm"
            >
              <option value="created_at">{t('tickets:sort_oldest')} (FIFO)</option>
              <option value="-created_at">{t('tickets:sort_newest')}</option>
              <option value="urgency">{t('tickets:sort_urgency_asc')}</option>
              <option value="-urgency">{t('tickets:sort_urgency_desc')}</option>
              <option value="status">{t('tickets:sort_status')}</option>
            </select>
          </div>

          {(typeFilter || statusFilter || urgencyFilter || areaFilter || search) && (
            <button
              onClick={handleResetFilters}
              className="text-sm text-urgency-high hover:underline transition-all cursor-pointer"
            >
              {t('common:actions.clear_filters')}
            </button>
          )}
        </div>
      </div>

      {/* Main View Area: Kanban Board vs Table List */}
      {viewMode === 'board' ? (
        <TicketBoardView
          tickets={ticketsData?.results || []}
          isLoading={isLoading}
        />
      ) : (
        <div className="glass-card overflow-hidden">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-surface/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : isError ? (
            <div className="p-12 text-center text-urgency-high">
              <p className="font-semibold">{t('tickets:empty_state.title')}</p>
              <p className="text-sm mt-1">{t('tickets:empty_state.subtitle')}</p>
            </div>
          ) : ticketsData?.results?.length ? (
            <div className="divide-y divide-border">
              {/* Table Header for larger screens */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-obsidian-light text-xs font-semibold text-text-secondary uppercase tracking-wider">
                <div className="col-span-5">{t('tickets:table.title')}</div>
                <div className="col-span-2">{t('tickets:table.department')}</div>
                <div className="col-span-2">{t('tickets:table.urgency')}</div>
                {role !== 'CLIENT' && <div className="col-span-1">{t('tickets:table.assigned')}</div>}
                <div className={role !== 'CLIENT' ? 'col-span-2' : 'col-span-3'}>{t('tickets:table.status')}</div>
              </div>

              {/* Ticket rows */}
              {ticketsData.results.map((ticket) => (
                <Link
                  key={ticket.id}
                  to={`/tickets/${ticket.id}`}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 items-center hover:bg-surface-hover/50 transition-colors"
                >
                  <div className="col-span-1 md:col-span-5 min-w-0">
                    <div className="flex items-center gap-2">
                      <TicketTypeBadge type={ticket.ticket_type || 'BUG'} />
                      <p className="text-sm font-medium text-text-primary truncate hover:text-teal-glow transition-colors">
                        {ticket.title}
                      </p>
                    </div>
                    <p className="text-xs text-text-muted mt-1 md:hidden">
                      {ticket.source_area.name} &middot; {formatDate(ticket.created_at)}
                    </p>
                    <p className="hidden md:block text-xs text-text-muted mt-1">
                      {t('tickets:table.created_by')} {ticket.created_by.first_name || ticket.created_by.username} &middot; {formatDate(ticket.created_at)}
                    </p>
                  </div>
                  <div className="hidden md:block col-span-2 text-sm text-text-secondary">
                    {ticket.source_area.name}
                  </div>
                  <div className="col-span-2 flex items-center gap-1.5">
                    <span className="md:hidden text-xs text-text-secondary mr-2">{t('tickets:table.urgency')}:</span>
                    <UrgencyBadge level={ticket.urgency} />
                    {role !== 'CLIENT' && ticket.internal_priority && (
                      <UrgencyBadge level={ticket.internal_priority} type="priority" />
                    )}
                  </div>
                  {role !== 'CLIENT' && (
                    <div className="col-span-1 text-sm text-text-secondary truncate flex items-center gap-2">
                      {ticket.assigned_to ? (
                        <>
                          <UserAvatar user={ticket.assigned_to} size="xs" />
                          <span className="truncate">{ticket.assigned_to.first_name || ticket.assigned_to.username}</span>
                        </>
                      ) : (
                        <span className="text-text-muted italic">{t('tickets:table.unassigned')}</span>
                      )}
                    </div>
                  )}
                  <div className={`${role !== 'CLIENT' ? 'col-span-2' : 'col-span-3'} flex items-center md:block justify-between`}>
                    <span className="md:hidden text-xs text-text-secondary">{t('tickets:table.status')}:</span>
                    <StatusBadge status={ticket.status} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-surface/50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-text-muted">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-text-primary">{t('tickets:empty_state.title')}</h3>
              <p className="text-text-secondary text-sm mt-1">{t('tickets:empty_state.subtitle')}</p>
            </div>
          )}

          {/* Pagination */}
          {ticketsData && ticketsData.count > 20 && (
            <div className="px-6 py-4 bg-obsidian-light/50 border-t border-border flex items-center justify-between gap-4">
              <p className="text-xs text-text-secondary">
                {t('tickets:pagination.showing', {
                  start: (page - 1) * 20 + 1,
                  end: Math.min(page * 20, ticketsData.count),
                  total: ticketsData.count,
                })}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 bg-obsidian border border-border text-text-secondary hover:text-text-primary rounded-lg text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  {t('common:actions.previous')}
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!ticketsData.next}
                  className="px-3 py-1.5 bg-obsidian border border-border text-text-secondary hover:text-text-primary rounded-lg text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  {t('common:actions.next')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
