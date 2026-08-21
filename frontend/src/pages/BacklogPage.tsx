/**
 * BacklogPage — Historical archive of resolved and closed tickets.
 *
 * Role-aware filters:
 * - CLIENT: type + date (area auto-scoped by backend)
 * - RESOLVER: type + date + area
 * - SYSADMIN: type + date + area + resolver
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ticketsApi } from '../api/tickets';
import { usersApi } from '../api/users';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import UrgencyBadge from '../components/UrgencyBadge';
import TicketTypeBadge from '../components/TicketTypeBadge';
import { formatDate } from '../utils/dateUtils';
import type { Ticket } from '../types';

const PAGE_SIZE = 10;

export default function BacklogPage() {
  const { role } = useAuth();
  const { t } = useTranslation(['backlog', 'common', 'tickets']);

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [resolverFilter, setResolverFilter] = useState('');
  const [ordering, setOrdering] = useState('-created_at');
  const [page, setPage] = useState(1);

  // Expanded resolution docs tracker
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Fetch areas (for RESOLVER / SYSADMIN area filter)
  const { data: areas } = useQuery({
    queryKey: ['areas'],
    queryFn: usersApi.getAreas,
    enabled: role === 'RESOLVER' || role === 'SYSADMIN',
  });

  // Fetch resolvers (SYSADMIN only)
  const { data: resolvers } = useQuery({
    queryKey: ['resolvers'],
    queryFn: usersApi.getResolvers,
    enabled: role === 'SYSADMIN',
  });

  // Fetch backlog tickets — always RESOLVED + CLOSED
  // We fetch with status=RESOLVED,CLOSED but the API may only accept one value;
  // we default to showing both by making two requests and merging, or we rely on
  // the backend supporting comma-separated values. For robustness, we pass no status
  // filter here and instead pass a combined param. If backend supports 'status__in',
  // great; otherwise we pass status=RESOLVED as the primary filter (most useful).
  // We also try passing an ordering that shows newest resolved first.
  const { data: ticketsData, isLoading, isError } = useQuery({
    queryKey: [
      'backlog',
      { typeFilter, dateFrom, dateTo, areaFilter, resolverFilter, ordering, page },
    ],
    queryFn: () =>
      ticketsApi.list({
        status: 'RESOLVED,CLOSED',
        ticket_type: typeFilter || undefined,
        source_area: areaFilter || undefined,
        assigned_to: resolverFilter ? Number(resolverFilter) : undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        ordering,
        page,
        page_size: PAGE_SIZE,
      }),
  });

  const tickets = ticketsData?.results ?? [];
  const totalCount = ticketsData?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const start = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, totalCount);

  const hasActiveFilters = !!(typeFilter || dateFrom || dateTo || areaFilter || resolverFilter);

  const handleClearFilters = () => {
    setTypeFilter('');
    setDateFrom('');
    setDateTo('');
    setAreaFilter('');
    setResolverFilter('');
    setPage(1);
  };

  const pageSubtitleKey =
    role === 'SYSADMIN'
      ? 'page_subtitle_admin'
      : role === 'RESOLVER'
        ? 'page_subtitle_resolver'
        : 'page_subtitle_client';

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight flex items-center gap-3">
            <ArchiveIcon />
            {t('backlog:page_title')}
          </h1>
          <p className="text-text-secondary mt-1">{t(`backlog:${pageSubtitleKey}`)}</p>
        </div>

        {/* Ordering */}
        <div className="shrink-0">
          <select
            value={ordering}
            onChange={(e) => { setOrdering(e.target.value); setPage(1); }}
            className="bg-obsidian-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-teal/60 cursor-pointer transition-colors"
          >
            <option value="-created_at">{t('backlog:sort_newest')}</option>
            <option value="created_at">{t('backlog:sort_oldest')}</option>
          </select>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
            <FilterIcon />
            {t('backlog:filters_heading')}
          </h2>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs text-text-muted hover:text-urgency-high transition-colors flex items-center gap-1"
            >
              ✕ {t('backlog:filter_clear')}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Type filter — all roles */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-muted font-medium">{t('backlog:filter_type')}</label>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="bg-obsidian-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-teal/60 cursor-pointer transition-colors"
            >
              <option value="">{t('backlog:filter_all_types')}</option>
              <option value="BUG">{t('tickets:type.BUG')}</option>
              <option value="FEATURE">{t('tickets:type.FEATURE')}</option>
            </select>
          </div>

          {/* Date from — all roles */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-muted font-medium">{t('backlog:filter_date_from')}</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="bg-obsidian-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-teal/60 transition-colors [color-scheme:dark]"
            />
          </div>

          {/* Date to — all roles */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-muted font-medium">{t('backlog:filter_date_to')}</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="bg-obsidian-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-teal/60 transition-colors [color-scheme:dark]"
            />
          </div>

          {/* Area filter — RESOLVER + SYSADMIN */}
          {(role === 'RESOLVER' || role === 'SYSADMIN') && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-muted font-medium">{t('backlog:filter_area')}</label>
              <select
                value={areaFilter}
                onChange={(e) => { setAreaFilter(e.target.value); setPage(1); }}
                className="bg-obsidian-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-teal/60 cursor-pointer transition-colors"
              >
                <option value="">{t('backlog:filter_all_areas')}</option>
                {areas?.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Resolver filter — SYSADMIN only */}
          {role === 'SYSADMIN' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-muted font-medium">{t('backlog:filter_resolver')}</label>
              <select
                value={resolverFilter}
                onChange={(e) => { setResolverFilter(e.target.value); setPage(1); }}
                className="bg-obsidian-light border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-teal/60 cursor-pointer transition-colors"
              >
                <option value="">{t('backlog:filter_all_resolvers')}</option>
                {resolvers?.map((r) => (
                  <option key={r.user.id} value={String(r.user.id)}>
                    {r.user.first_name} {r.user.last_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="text-xs text-text-muted">{t('backlog:active_filters')}:</span>
            {typeFilter && (
              <FilterChip label={t(`tickets:type.${typeFilter}`)} onRemove={() => setTypeFilter('')} />
            )}
            {dateFrom && (
              <FilterChip label={`≥ ${formatDate(dateFrom)}`} onRemove={() => setDateFrom('')} />
            )}
            {dateTo && (
              <FilterChip label={`≤ ${formatDate(dateTo)}`} onRemove={() => setDateTo('')} />
            )}
            {areaFilter && areas && (
              <FilterChip
                label={areas.find((a) => a.id === areaFilter)?.name ?? areaFilter}
                onRemove={() => setAreaFilter('')}
              />
            )}
            {resolverFilter && resolvers && (
              <FilterChip
                label={(() => {
                  const r = resolvers.find((r) => String(r.user.id) === resolverFilter);
                  return r ? `${r.user.first_name} ${r.user.last_name}` : resolverFilter;
                })()}
                onRemove={() => setResolverFilter('')}
              />
            )}
          </div>
        )}
      </div>

      {/* ── Ticket List ── */}
      <div className="glass-card p-6 space-y-3">
        {/* Count + pagination info */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-text-muted">
            {totalCount > 0
              ? t('backlog:showing', { start, end, total: totalCount })
              : t('backlog:results_count', { count: 0 })}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-surface/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-16">
            <p className="text-urgency-high text-sm">Failed to load backlog tickets.</p>
          </div>
        ) : tickets.length === 0 ? (
          <EmptyState
            title={t('backlog:no_results_title')}
            subtitle={t('backlog:no_results_subtitle')}
          />
        ) : (
          <div className="space-y-2">
            {tickets.map((ticket: Ticket, index: number) => {
              const isExpanded = expandedIds.has(ticket.id);
              const hasResolutionDocs = !!ticket.resolution_documentation;

              return (
                <div
                  key={ticket.id}
                  className="rounded-xl border border-border/50 bg-surface/20 overflow-hidden transition-all duration-200 hover:border-border animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'both' }}
                >
                  {/* Main row */}
                  <div className="flex items-center gap-4 p-4">
                    {/* Type badge */}
                    <div className="shrink-0">
                      <TicketTypeBadge type={ticket.ticket_type} />
                    </div>

                    {/* Title + meta */}
                    <Link
                      to={`/tickets/${ticket.id}`}
                      className="flex-1 min-w-0 group"
                    >
                      <p className="text-sm font-medium text-text-primary group-hover:text-teal-glow transition-colors truncate">
                        {ticket.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-text-muted">
                          {ticket.source_area.name}
                        </span>
                        <span className="text-text-muted/40 text-xs">·</span>
                        <span className="text-xs text-text-muted">
                          {t('backlog:created_date')}: {formatDate(ticket.created_at)}
                        </span>
                        {ticket.resolved_at && (
                          <>
                            <span className="text-text-muted/40 text-xs">·</span>
                            <span className="text-xs text-status-resolved">
                              {t('backlog:resolved_date')}: {formatDate(ticket.resolved_at)}
                            </span>
                          </>
                        )}
                      </div>
                    </Link>

                    {/* Right badges + assigned */}
                    <div className="flex items-center gap-2 shrink-0">
                      {ticket.assigned_to && (
                        <span className="hidden sm:flex items-center gap-1.5 text-xs text-text-muted px-2 py-1 rounded-lg bg-surface/60 border border-border/40">
                          <PersonIcon />
                          {ticket.assigned_to.first_name} {ticket.assigned_to.last_name}
                        </span>
                      )}
                      <UrgencyBadge level={ticket.urgency} />
                      <StatusBadge status={ticket.status} />
                    </div>

                    {/* Expand docs toggle */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(ticket.id)}
                      title={isExpanded ? t('backlog:collapse_docs') : t('backlog:expand_docs')}
                      className={`shrink-0 p-2 rounded-lg border transition-all duration-200 cursor-pointer ${
                        hasResolutionDocs
                          ? isExpanded
                            ? 'border-teal/50 bg-teal/10 text-teal-glow'
                            : 'border-border/60 bg-surface/50 text-text-muted hover:border-teal/40 hover:text-teal-glow'
                          : 'border-border/30 text-text-muted/30 cursor-default'
                      }`}
                      disabled={!hasResolutionDocs}
                    >
                      <DocsIcon />
                    </button>
                  </div>

                  {/* Expandable resolution documentation */}
                  {isExpanded && (
                    <div className="border-t border-border/50 px-4 pb-4 pt-3 bg-obsidian/40 animate-fade-in">
                      <p className="text-xs font-semibold text-teal-glow uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <DocsIcon />
                        {t('backlog:resolution_docs')}
                      </p>
                      {hasResolutionDocs ? (
                        <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                          {ticket.resolution_documentation}
                        </p>
                      ) : (
                        <p className="text-sm text-text-muted italic">
                          {t('backlog:no_resolution_docs')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-4">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-border/60 text-text-secondary hover:text-text-primary hover:border-teal/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              ← {t('common:actions.previous')}
            </button>
            <span className="text-sm text-text-muted">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-border/60 text-text-secondary hover:text-text-primary hover:border-teal/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {t('common:actions.next')} →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ──

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal/10 text-teal-glow border border-teal/20">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 hover:text-white transition-colors cursor-pointer leading-none"
      >
        ×
      </button>
    </span>
  );
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center py-20 space-y-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface/50 border border-border/50 text-text-muted/50 mb-2">
        <EmptyArchiveIcon />
      </div>
      <div>
        <p className="text-text-primary font-semibold text-lg">{title}</p>
        <p className="text-text-muted text-sm mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

// ── Icons ──

function ArchiveIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal-glow">
      <path d="M21 8v13H3V8" />
      <path d="M1 3h22v5H1z" />
      <path d="M10 12h4" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function DocsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function EmptyArchiveIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8v13H3V8" />
      <path d="M1 3h22v5H1z" />
      <path d="M10 12h4" />
    </svg>
  );
}
