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
      <div className="py-1">
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

          <div className="flex items-center gap-4 shrink-0">
            <Link
              to="/backlog"
              className="text-sm text-text-muted hover:text-teal-glow transition-colors duration-[var(--transition-fast)]"
            >
              {i18n.language?.startsWith('es') ? 'Ver historial' : 'View backlog'} →
            </Link>
            <Link
              to={activeStatusFilter ? `/tickets?status=${activeStatusFilter}` : '/tickets'}
              className="text-sm text-teal-glow hover:text-teal-lighter transition-colors duration-[var(--transition-fast)]"
            >
              {t('common:actions.view_all')} &rarr;
            </Link>
          </div>
        </div>

        {ticketsLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-surface/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : ticketsData?.results?.length ? (
          <div className="space-y-2">
            {ticketsData.results.slice(0, 10).map((ticket: Ticket, index: number) => (
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
  const activeStyles = {
    teal: {
      card: 'bg-gradient-to-br from-teal/40 via-teal-dim/30 to-surface border-2 border-teal-glow shadow-[0_0_25px_rgba(20,184,154,0.4)] scale-105 z-10 opacity-100',
      label: 'text-teal-glow font-bold',
      value: 'text-teal-glow drop-shadow-[0_0_10px_rgba(20,184,154,0.6)]',
      badge: 'bg-teal-glow/20 border-teal-glow/50 text-teal-glow',
      dot: 'bg-teal-glow shadow-[0_0_8px_#14B89A]',
    },
    blue: {
      card: 'bg-gradient-to-br from-status-open/40 via-blue-950/40 to-surface border-2 border-status-open shadow-[0_0_25px_rgba(59,130,246,0.4)] scale-105 z-10 opacity-100',
      label: 'text-blue-400 font-bold',
      value: 'text-status-open drop-shadow-[0_0_10px_rgba(59,130,246,0.6)]',
      badge: 'bg-status-open/20 border-status-open/50 text-blue-400',
      dot: 'bg-status-open shadow-[0_0_8px_#3B82F6]',
    },
    purple: {
      card: 'bg-gradient-to-br from-status-in-progress/40 via-purple-950/40 to-surface border-2 border-status-in-progress shadow-[0_0_25px_rgba(139,92,246,0.4)] scale-105 z-10 opacity-100',
      label: 'text-purple-300 font-bold',
      value: 'text-status-in-progress drop-shadow-[0_0_10px_rgba(139,92,246,0.6)]',
      badge: 'bg-status-in-progress/20 border-status-in-progress/50 text-purple-300',
      dot: 'bg-status-in-progress shadow-[0_0_8px_#8B5CF6]',
    },
    green: {
      card: 'bg-gradient-to-br from-status-resolved/40 via-emerald-950/40 to-surface border-2 border-status-resolved shadow-[0_0_25px_rgba(16,185,129,0.4)] scale-105 z-10 opacity-100',
      label: 'text-emerald-400 font-bold',
      value: 'text-status-resolved drop-shadow-[0_0_10px_rgba(16,185,129,0.6)]',
      badge: 'bg-status-resolved/20 border-status-resolved/50 text-emerald-400',
      dot: 'bg-status-resolved shadow-[0_0_8px_#10B981]',
    },
  };

  const offCardStyle =
    'bg-surface/30 border border-border/50 opacity-50 grayscale-[60%] scale-95 hover:opacity-85 hover:grayscale-[20%] hover:scale-[0.98] transition-all duration-300';
  const offLabelStyle = 'text-text-muted font-medium';
  const offValueStyle = 'text-text-secondary/70';

  const currentActive = activeStyles[color];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`glass-card p-6 text-left transition-all duration-300 ease-out cursor-pointer relative overflow-hidden ${
        isActive ? currentActive.card : offCardStyle
      }`}
      style={{ animationDelay: `${delay * 80}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-center justify-between">
        <p className={`text-sm transition-colors duration-300 ${isActive ? currentActive.label : offLabelStyle}`}>
          {label}
        </p>
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border transition-all duration-300 ${
            isActive
              ? currentActive.badge
              : 'bg-surface/50 border-border/30 text-text-muted/60'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              isActive ? `${currentActive.dot} animate-pulse` : 'bg-text-muted/40'
            }`}
          />
          {isActive ? 'ON' : 'OFF'}
        </span>
      </div>

      {loading ? (
        <div className="h-9 w-16 bg-surface/50 rounded-lg animate-pulse mt-3" />
      ) : (
        <p
          className={`text-4xl font-extrabold mt-3 transition-all duration-300 ${
            isActive ? currentActive.value : offValueStyle
          }`}
        >
          {value}
        </p>
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
