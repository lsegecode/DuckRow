import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ticketsApi } from '../api/tickets';
import { usersApi } from '../api/users';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import UrgencyBadge from '../components/UrgencyBadge';

export default function TicketListPage() {
  const { role } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('');
  const [areaFilter, setAreaFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [ordering, setOrdering] = useState<string>('-created_at');
  const [page, setPage] = useState<number>(1);

  // Fetch areas for filtering
  const { data: areas } = useQuery({
    queryKey: ['areas'],
    queryFn: usersApi.getAreas,
  });

  // Fetch tickets based on filters
  const { data: ticketsData, isLoading, isError } = useQuery({
    queryKey: ['tickets', { status: statusFilter, urgency: urgencyFilter, area: areaFilter, search, ordering, page }],
    queryFn: () =>
      ticketsApi.list({
        status: statusFilter || undefined,
        urgency: urgencyFilter || undefined,
        source_area: areaFilter || undefined,
        search: search || undefined,
        ordering,
        page,
      }),
  });

  const handleResetFilters = () => {
    setStatusFilter('');
    setUrgencyFilter('');
    setAreaFilter('');
    setSearch('');
    setPage(1);
  };

  const showCreateButton = role === 'CLIENT' || role === 'SYSADMIN';

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Service Tickets</h1>
          <p className="text-text-secondary mt-1">Manage and track service issues</p>
        </div>
        {showCreateButton && (
          <Link
            to="/tickets/new"
            className="inline-flex items-center gap-2 px-5 py-3 bg-teal hover:bg-teal-light text-white font-semibold rounded-xl transition-all duration-[var(--transition-fast)] hover:shadow-[var(--shadow-glow-teal)] active:scale-[0.98] shrink-0"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Create Ticket
          </Link>
        )}
      </div>

      {/* Filters Bar */}
      <div className="glass-card p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Search Input */}
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-muted">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-obsidian border border-border rounded-xl text-text-primary placeholder-text-muted focus:border-teal focus:ring-1 focus:ring-teal/50 transition-all outline-none text-sm"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-4 py-2.5 bg-obsidian border border-border rounded-xl text-text-primary focus:border-teal focus:ring-1 focus:ring-teal/50 transition-all outline-none text-sm cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          {/* Urgency Filter */}
          <select
            value={urgencyFilter}
            onChange={(e) => {
              setUrgencyFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-4 py-2.5 bg-obsidian border border-border rounded-xl text-text-primary focus:border-teal focus:ring-1 focus:ring-teal/50 transition-all outline-none text-sm cursor-pointer"
          >
            <option value="">All Urgencies</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>

          {/* Area Filter */}
          <select
            value={areaFilter}
            onChange={(e) => {
              setAreaFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-4 py-2.5 bg-obsidian border border-border rounded-xl text-text-primary focus:border-teal focus:ring-1 focus:ring-teal/50 transition-all outline-none text-sm cursor-pointer"
          >
            <option value="">All Areas</option>
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
            <span>Sort by:</span>
            <select
              value={ordering}
              onChange={(e) => setOrdering(e.target.value)}
              className="bg-transparent border-none text-teal-glow font-medium outline-none cursor-pointer focus:ring-0"
            >
              <option value="-created_at">Newest First</option>
              <option value="created_at">Oldest First</option>
              <option value="urgency">Urgency (Low to High)</option>
              <option value="-urgency">Urgency (High to Low)</option>
              <option value="status">Status</option>
            </select>
          </div>

          {(statusFilter || urgencyFilter || areaFilter || search) && (
            <button
              onClick={handleResetFilters}
              className="text-sm text-urgency-high hover:underline transition-all"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Tickets List Card */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-surface/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-12 text-center text-urgency-high">
            <p className="font-semibold">Failed to load tickets.</p>
            <p className="text-sm mt-1">Please try again later.</p>
          </div>
        ) : ticketsData?.results?.length ? (
          <div className="divide-y divide-border">
            {/* Table Header for larger screens */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-obsidian-light text-xs font-semibold text-text-secondary uppercase tracking-wider">
              <div className="col-span-5">Ticket Title</div>
              <div className="col-span-2">Department</div>
              <div className="col-span-2">Urgency</div>
              {role !== 'CLIENT' && <div className="col-span-1">Assigned</div>}
              <div className={role !== 'CLIENT' ? 'col-span-2' : 'col-span-3'}>Status</div>
            </div>

            {/* Ticket rows */}
            {ticketsData.results.map((ticket) => (
              <Link
                key={ticket.id}
                to={`/tickets/${ticket.id}`}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 items-center hover:bg-surface-hover/50 transition-colors"
              >
                <div className="col-span-1 md:col-span-5 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate hover:text-teal-glow transition-colors">
                    {ticket.title}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5 md:hidden">
                    {ticket.source_area.name} &middot; Created {new Date(ticket.created_at).toLocaleDateString()}
                  </p>
                  <p className="hidden md:block text-xs text-text-muted mt-0.5">
                    Created by {ticket.created_by.first_name || ticket.created_by.username} &middot; {new Date(ticket.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="hidden md:block col-span-2 text-sm text-text-secondary">
                  {ticket.source_area.name}
                </div>
                <div className="col-span-2 flex items-center md:block">
                  <span className="md:hidden text-xs text-text-secondary mr-2">Urgency:</span>
                  <UrgencyBadge level={ticket.urgency} />
                  {role !== 'CLIENT' && ticket.internal_priority && (
                    <span className="ml-1.5">
                      <UrgencyBadge level={ticket.internal_priority} type="priority" />
                    </span>
                  )}
                </div>
                {role !== 'CLIENT' && (
                  <div className="col-span-1 text-sm text-text-secondary truncate">
                    {ticket.assigned_to
                      ? ticket.assigned_to.first_name || ticket.assigned_to.username
                      : <span className="text-text-muted italic">Unassigned</span>
                    }
                  </div>
                )}
                <div className={`${role !== 'CLIENT' ? 'col-span-2' : 'col-span-3'} flex items-center md:block justify-between`}>
                  <span className="md:hidden text-xs text-text-secondary">Status:</span>
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
            <h3 className="text-lg font-medium text-text-primary">No tickets found</h3>
            <p className="text-text-secondary text-sm mt-1">Try adjusting your filters or search criteria.</p>
          </div>
        )}

        {/* Pagination */}
        {ticketsData && ticketsData.count > 20 && (
          <div className="px-6 py-4 bg-obsidian-light/50 border-t border-border flex items-center justify-between gap-4">
            <p className="text-xs text-text-secondary">
              Showing {(page - 1) * 20 + 1} - {Math.min(page * 20, ticketsData.count)} of {ticketsData.count} tickets
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-obsidian border border-border text-text-secondary hover:text-text-primary rounded-lg text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!ticketsData.next}
                className="px-3 py-1.5 bg-obsidian border border-border text-text-secondary hover:text-text-primary rounded-lg text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
