/**
 * DashboardPage — summary stats and recent tickets.
 * Role-aware: shows scoped data based on user role with interactive status filter on StatCards.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ticketsApi } from '../api/tickets';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import UrgencyBadge from '../components/UrgencyBadge';
import type { Ticket } from '../types';

export default function DashboardPage() {
  const { user, role } = useAuth();
  const { t, i18n } = useTranslation(['dashboard', 'common', 'tickets']);
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['ticket-stats'],
    queryFn: ticketsApi.stats,
  });

  const { data: ticketsData, isLoading: ticketsLoading } = useQuery({
    queryKey: ['tickets', { page: 1, status: activeStatusFilter }],
    queryFn: () => ticketsApi.list({ page: 1, status: activeStatusFilter || undefined }),
  });

  const greeting = getGreeting(t);
  const roleKey = role === 'SYSADMIN' ? 'roles.SYSADMIN' : role === 'RESOLVER' ? 'roles.RESOLVER' : 'roles.CLIENT';

  const getSectionTitle = () => {
    if (!activeStatusFilter) return t('dashboard:recent_tickets');
    if (activeStatusFilter === 'OPEN') return `${t('tickets:status.OPEN')} (${stats?.open ?? 0})`;
    if (activeStatusFilter === 'IN_PROGRESS') return `${t('tickets:status.IN_PROGRESS')} (${stats?.in_progress ?? 0})`;
    if (activeStatusFilter === 'RESOLVED') return `${t('tickets:status.RESOLVED')} (${stats?.resolved ?? 0})`;
    return t('dashboard:recent_tickets');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">
          {greeting}, {user?.first_name || user?.username}
        </h1>
        <p className="text-text-secondary mt-1">
          {t(`common:${roleKey}`)} &middot; {t('dashboard:overview_subtitle')}
        </p>
      </div>

      {/* Interactive Stats Grid (Clicking acts as filter) */}
      <div>
        <p className="text-xs text-text-muted mb-2 font-medium">
          {i18n.language?.startsWith('es')
            ? '💡 Haz clic en una tarjeta para filtrar los tickets:'
            : '💡 Click a stat card to filter tickets:'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label={t('dashboard:stats.total')}
            value={stats?.total ?? 0}
            color="teal"
            loading={statsLoading}
            delay={0}
            isActive={activeStatusFilter === ''}
            onClick={() => setActiveStatusFilter('')}
          />
          <StatCard
            label={t('dashboard:stats.open')}
            value={stats?.open ?? 0}
            color="blue"
            loading={statsLoading}
            delay={1}
            isActive={activeStatusFilter === 'OPEN'}
            onClick={() => setActiveStatusFilter(activeStatusFilter === 'OPEN' ? '' : 'OPEN')}
          />
          <StatCard
            label={t('dashboard:stats.in_progress')}
            value={stats?.in_progress ?? 0}
            color="purple"
            loading={statsLoading}
            delay={2}
            isActive={activeStatusFilter === 'IN_PROGRESS'}
            onClick={() => setActiveStatusFilter(activeStatusFilter === 'IN_PROGRESS' ? '' : 'IN_PROGRESS')}
          />
          <StatCard
            label={t('dashboard:stats.resolved')}
            value={stats?.resolved ?? 0}
            color="green"
            loading={statsLoading}
            delay={3}
            isActive={activeStatusFilter === 'RESOLVED'}
            onClick={() => setActiveStatusFilter(activeStatusFilter === 'RESOLVED' ? '' : 'RESOLVED')}
          />
        </div>
      </div>

      {/* Filtered Tickets List */}
      <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-text-primary">{getSectionTitle()}</h2>
            {activeStatusFilter && (
              <button
                onClick={() => setActiveStatusFilter('')}
                className="px-2 py-0.5 rounded-full bg-surface text-text-muted hover:text-text-primary border border-border text-xs transition-colors cursor-pointer"
              >
                ✕ {i18n.language?.startsWith('es') ? 'Quitar filtro' : 'Clear filter'}
              </button>
            )}
          </div>

          <Link
            to={activeStatusFilter ? `/tickets?status=${activeStatusFilter}` : '/tickets'}
            className="text-sm text-teal-glow hover:text-teal-lighter transition-colors duration-[var(--transition-fast)]"
          >
            {t('common:actions.view_all')} &rarr;
          </Link>
        </div>

        {ticketsLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-surface/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : ticketsData?.results?.length ? (
          <div className="space-y-2">
            {ticketsData.results.slice(0, 8).map((ticket: Ticket, index: number) => (
              <Link
                key={ticket.id}
                to={`/tickets/${ticket.id}`}
                className="flex items-center gap-4 p-4 rounded-xl bg-surface/30 hover:bg-surface-hover border border-transparent hover:border-border transition-all duration-[var(--transition-fast)] group"
                style={{ animationDelay: `${index * 40}ms`, animationFillMode: 'both' }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary group-hover:text-teal-glow transition-colors truncate">
                    {ticket.title}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {ticket.source_area.name} &middot; {formatTimeAgo(ticket.created_at, t, i18n.language)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <UrgencyBadge level={ticket.urgency} />
                  {role !== 'CLIENT' && ticket.internal_priority && (
                    <UrgencyBadge level={ticket.internal_priority} type="priority" />
                  )}
                  <StatusBadge status={ticket.status} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-text-muted">{t('dashboard:no_tickets')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Helper Components ──

interface StatCardProps {
  label: string;
  value: number;
  color: 'teal' | 'blue' | 'purple' | 'green';
  loading: boolean;
  delay: number;
  isActive: boolean;
  onClick: () => void;
}

function StatCard({ label, value, color, loading, delay, isActive, onClick }: StatCardProps) {
  const colorMap = {
    teal: 'from-teal/20 to-teal/5 border-teal/30 hover:border-teal/60',
    blue: 'from-status-open/20 to-status-open/5 border-status-open/30 hover:border-status-open/60',
    purple: 'from-status-in-progress/20 to-status-in-progress/5 border-status-in-progress/30 hover:border-status-in-progress/60',
    green: 'from-status-resolved/20 to-status-resolved/5 border-status-resolved/30 hover:border-status-resolved/60',
  };

  const textColor = {
    teal: 'text-teal-glow',
    blue: 'text-status-open',
    purple: 'text-status-in-progress',
    green: 'text-status-resolved',
  };

  const activeRing = {
    teal: 'ring-2 ring-teal-glow shadow-[0_0_15px_rgba(13,92,77,0.4)] scale-[1.02]',
    blue: 'ring-2 ring-status-open shadow-[0_0_15px_rgba(59,130,246,0.3)] scale-[1.02]',
    purple: 'ring-2 ring-status-in-progress shadow-[0_0_15px_rgba(168,85,247,0.3)] scale-[1.02]',
    green: 'ring-2 ring-status-resolved shadow-[0_0_15px_rgba(34,197,94,0.3)] scale-[1.02]',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`glass-card p-6 bg-gradient-to-br text-left transition-all duration-[var(--transition-fast)] cursor-pointer ${colorMap[color]} ${
        isActive ? activeRing[color] : 'opacity-80 hover:opacity-100'
      }`}
      style={{ animationDelay: `${delay * 80}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary font-medium">{label}</p>
        {isActive && (
          <span className="w-2 h-2 rounded-full bg-teal-glow animate-pulse" />
        )}
      </div>
      {loading ? (
        <div className="h-9 w-16 bg-surface/50 rounded-lg animate-pulse mt-2" />
      ) : (
        <p className={`text-4xl font-bold mt-2 ${textColor[color]}`}>{value}</p>
      )}
    </button>
  );
}

// ── Helpers ──

function getGreeting(t: (key: string) => string): string {
  const hour = new Date().getHours();
  if (hour < 12) return t('dashboard:greeting_morning');
  if (hour < 18) return t('dashboard:greeting_afternoon');
  return t('dashboard:greeting_evening');
}

function formatTimeAgo(dateStr: string, t: (key: string, opts?: any) => string, lang: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMins < 1) return t('dashboard:time.just_now');
  if (diffMins < 60) return t('dashboard:time.minutes_ago', { count: diffMins });
  if (diffHrs < 24) return t('dashboard:time.hours_ago', { count: diffHrs });
  if (diffDays < 7) return t('dashboard:time.days_ago', { count: diffDays });
  return date.toLocaleDateString(lang.startsWith('es') ? 'es-ES' : 'en-US');
}
