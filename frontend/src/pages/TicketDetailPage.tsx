import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ticketsApi } from '../api/tickets';
import { usersApi } from '../api/users';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import UrgencyBadge from '../components/UrgencyBadge';
import TicketTypeBadge from '../components/TicketTypeBadge';
import StructuredDescription from '../components/StructuredDescription';
import { formatDateTime, formatDuration } from '../utils/dateUtils';
import type { Ticket, TicketStatus, Priority, UserProfile } from '../types';

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role, user } = useAuth();
  const { t, i18n } = useTranslation(['tickets', 'common']);

  const [statusVal, setStatusVal] = useState<TicketStatus | ''>('');
  const [priorityVal, setPriorityVal] = useState<Priority | ''>('');
  const [assignedToVal, setAssignedToVal] = useState<number | ''>('');
  const [estimatedResolutionVal, setEstimatedResolutionVal] = useState('');
  const [estimatedWorkVal, setEstimatedWorkVal] = useState('');
  const [resolvedAtVal, setResolvedAtVal] = useState('');
  const [resDocs, setResDocs] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Fetch ticket details
  const { data: ticket, isLoading, isError } = useQuery<Ticket, Error>({
    queryKey: ['ticket', id],
    queryFn: () => ticketsApi.get(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (ticket) {
      setStatusVal(ticket.status);
      setPriorityVal(ticket.internal_priority || '');
      setAssignedToVal(ticket.assigned_to?.id || '');
      setEstimatedResolutionVal(
        ticket.estimated_resolution_time
          ? new Date(ticket.estimated_resolution_time).toISOString().slice(0, 16)
          : ''
      );
      setEstimatedWorkVal(ticket.estimated_work_hours || '');
      setResolvedAtVal(
        ticket.resolved_at
          ? new Date(ticket.resolved_at).toISOString().slice(0, 16)
          : ''
      );
      setResDocs(ticket.resolution_documentation || '');
    }
  }, [ticket]);

  // Fetch resolvers (for assign option)
  const { data: resolvers } = useQuery({
    queryKey: ['resolvers'],
    queryFn: usersApi.getResolvers,
    enabled: role === 'SYSADMIN',
  });

  const resolversList: UserProfile[] = Array.isArray(resolvers) ? resolvers : (resolvers as any)?.results || [];

  const updateTicketMutation = useMutation({
    mutationFn: (payload: any) => ticketsApi.update(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setIsEditing(false);
    },
  });

  const claimTicketMutation = useMutation({
    mutationFn: () => ticketsApi.claim(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-stats'] });
    },
  });

  const deleteTicketMutation = useMutation({
    mutationFn: () => ticketsApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-stats'] });
      navigate('/tickets');
    },
  });


  // Always reset resolvedAtVal when status changes to RESOLVED/CLOSED (pre-fill with now)
  const handleStatusChange = (val: TicketStatus | '') => {
    setStatusVal(val);
    if ((val === 'RESOLVED' || val === 'CLOSED') && ticket) {
      // Only pre-fill if the ticket wasn't already resolved (avoid overwriting existing date)
      const existing = ticket.resolved_at
        ? new Date(ticket.resolved_at).toISOString().slice(0, 16)
        : '';
      setResolvedAtVal(existing || new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    }
  };

  // Live duration preview for the resolved_at picker
  const resolvedAtPreviewDuration = (() => {
    if (!resolvedAtVal || !ticket) return null;
    return formatDuration(ticket.created_at, new Date(resolvedAtVal).toISOString(), i18n.language);
  })();

  const resolutionDuration = ticket ? formatDuration(ticket.created_at, ticket.resolved_at, i18n.language) : null;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="h-6 w-24 bg-surface/50 rounded animate-pulse" />
        <div className="glass-card p-6 space-y-4">
          <div className="h-8 w-1/2 bg-surface/50 rounded animate-pulse" />
          <div className="h-20 w-full bg-surface/50 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h3 className="text-xl font-bold text-urgency-high">{t('tickets:detail.not_found_title')}</h3>
        <p className="text-text-secondary mt-1">{t('tickets:detail.not_found_desc')}</p>
        <Link to="/tickets" className="mt-4 inline-block text-teal-glow hover:underline">
          {t('tickets:detail.back_to_list')}
        </Link>
      </div>
    );
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {};

    if (role === 'SYSADMIN') {
      payload.status = statusVal;
      payload.internal_priority = priorityVal || undefined;
      payload.assigned_to_id = assignedToVal ? Number(assignedToVal) : null;
      payload.estimated_resolution_time = estimatedResolutionVal ? new Date(estimatedResolutionVal).toISOString() : null;
      payload.estimated_work_hours = estimatedWorkVal || null;
      payload.resolution_documentation = resDocs || null;
      // Include explicit resolved_at when resolving/closing
      if (statusVal === 'RESOLVED' || statusVal === 'CLOSED') {
        payload.resolved_at = resolvedAtVal ? new Date(resolvedAtVal).toISOString() : null;
      }
    } else if (role === 'RESOLVER') {
      payload.status = statusVal;
      payload.internal_priority = priorityVal || undefined;
      payload.estimated_resolution_time = estimatedResolutionVal ? new Date(estimatedResolutionVal).toISOString() : null;
      payload.estimated_work_hours = estimatedWorkVal || null;
      payload.resolution_documentation = resDocs || null;
      // Include explicit resolved_at when resolving/closing
      if (statusVal === 'RESOLVED' || statusVal === 'CLOSED') {
        payload.resolved_at = resolvedAtVal ? new Date(resolvedAtVal).toISOString() : null;
      }
    }

    updateTicketMutation.mutate(payload);
  };

  const handleQuickAssign = (resolverId: string) => {
    updateTicketMutation.mutate({
      assigned_to_id: resolverId ? Number(resolverId) : null,
    });
  };

  const handleDelete = () => {
    if (window.confirm(t('tickets:detail.delete_confirm'))) {
      deleteTicketMutation.mutate();
    }
  };

  const isAssignedResolver = ticket.assigned_to?.id === user?.id;
  const isUnassigned = !ticket.assigned_to;
  const canClaim = isUnassigned && (role === 'RESOLVER' || role === 'SYSADMIN');
  const canUpdate = role === 'SYSADMIN' || (role === 'RESOLVER' && (isAssignedResolver || isUnassigned));
  const canDelete = role === 'SYSADMIN';

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Top action row */}
      <div className="flex items-center justify-between">
        <Link to="/tickets" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-all">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          {t('tickets:detail.back_to_list')}
        </Link>

        {canClaim && (
          <button
            onClick={() => claimTicketMutation.mutate()}
            disabled={claimTicketMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal hover:bg-teal-light text-white font-semibold rounded-xl text-xs shadow-[var(--shadow-glow-teal)] transition-all active:scale-[0.98]"
          >
            {claimTicketMutation.isPending ? t('tickets:detail.claiming') : t('tickets:detail.assign_to_me')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area (Left side) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-card p-6 space-y-6">
            {/* Header info */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/50 pb-5">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <TicketTypeBadge type={ticket.ticket_type || 'BUG'} />
                  <span className="text-xs text-text-muted font-mono">{ticket.id}</span>
                </div>
                <h1 className="text-2xl font-bold text-text-primary">{ticket.title}</h1>
                <p className="text-xs text-text-secondary mt-1.5">
                  {t('tickets:detail.submitted_by')}{' '}
                  <span className="font-semibold text-text-primary">{ticket.created_by.first_name || ticket.created_by.username}</span> &middot; {formatDateTime(ticket.created_at)}
                </p>
              </div>
              <div className="flex gap-2 items-center">
                <UrgencyBadge level={ticket.urgency} />
                {role !== 'CLIENT' && ticket.internal_priority && (
                  <UrgencyBadge level={ticket.internal_priority} type="priority" />
                )}
                <StatusBadge status={ticket.status} />
              </div>
            </div>

            {/* Description broken into structured sections */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">{t('tickets:detail.description_heading')}</h3>
              <StructuredDescription description={ticket.description} />
            </div>

            {/* Attached Screenshots Gallery */}
            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
                  {t('tickets:detail.attachments_heading')} ({ticket.attachments.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {ticket.attachments.map((att) => (
                    <div
                      key={att.id}
                      onClick={() => setPreviewImage(att.url)}
                      className="group relative rounded-xl overflow-hidden border border-border bg-obsidian aspect-video cursor-pointer hover:border-teal transition-all shadow-sm"
                    >
                      <img
                        src={att.url}
                        alt={att.file_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                        <span className="text-[11px] text-white truncate font-medium">{att.file_name || 'Screenshot'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resolution Documentation */}
            {(ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' || ticket.resolution_documentation) && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-status-resolved uppercase tracking-wider">{t('tickets:detail.resolution_docs_heading')}</h3>
                <div className="bg-status-resolved/5 p-5 rounded-xl border border-status-resolved/20 text-text-primary text-sm whitespace-pre-wrap leading-relaxed">
                  {ticket.resolution_documentation || <span className="text-text-muted italic">{t('tickets:detail.no_resolution_docs')}</span>}
                </div>
              </div>
            )}
          </div>

          {/* Edit Panel (if authorized Resolver/Sysadmin) */}
          {canUpdate && (
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <h3 className="text-md font-semibold text-text-primary">{t('tickets:detail.update_action_heading')}</h3>
                {!isEditing && (
                  <button
                    onClick={() => {
                      setStatusVal(ticket.status);
                      setPriorityVal(ticket.internal_priority || '');
                      setAssignedToVal(ticket.assigned_to?.id || '');
                      setEstimatedResolutionVal(
                        ticket.estimated_resolution_time
                          ? new Date(ticket.estimated_resolution_time).toISOString().slice(0, 16)
                          : ''
                      );
                      setResolvedAtVal(
                        ticket.resolved_at
                          ? new Date(ticket.resolved_at).toISOString().slice(0, 16)
                          : ''
                      );
                      setResDocs(ticket.resolution_documentation || '');
                      setIsEditing(true);
                    }}
                    className="px-3.5 py-1.5 bg-teal/15 hover:bg-teal/25 text-teal-glow font-semibold rounded-lg text-xs transition-all border border-teal/20"
                  >
                    {t('common:actions.modify_fields')}
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleUpdate} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Priority Selector for SYSADMIN & RESOLVER */}
                    {(role === 'SYSADMIN' || role === 'RESOLVER') && (
                      <div>
                        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                          {t('tickets:table.priority')}
                        </label>
                        <select
                          value={priorityVal}
                          onChange={(e) => setPriorityVal(e.target.value as Priority)}
                          className="w-full px-3 py-2 bg-obsidian border border-border rounded-lg text-text-primary text-sm focus:border-teal outline-none cursor-pointer"
                        >
                          <option value="LOW">{t('tickets:priority.LOW')}</option>
                          <option value="MEDIUM">{t('tickets:priority.MEDIUM')}</option>
                          <option value="HIGH">{t('tickets:priority.HIGH')}</option>
                          <option value="CRITICAL">{t('tickets:priority.CRITICAL')}</option>
                        </select>
                      </div>
                    )}

                    {/* Status selector — SYSADMIN & RESOLVER, using handleStatusChange to pre-fill resolvedAtVal */}
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                        {t('tickets:table.status')}
                      </label>
                      <select
                        value={statusVal}
                        onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                        className="w-full px-3 py-2 bg-obsidian border border-border rounded-lg text-text-primary text-sm focus:border-teal outline-none cursor-pointer"
                      >
                        <option value="OPEN">{t('tickets:status.OPEN')}</option>
                        <option value="IN_PROGRESS">{t('tickets:status.IN_PROGRESS')}</option>
                        <option value="RESOLVED">{t('tickets:status.RESOLVED')}</option>
                        <option value="CLOSED">{t('tickets:status.CLOSED')}</option>
                      </select>
                    </div>

                    {/* Sysadmin Field (Assign) */}
                    {role === 'SYSADMIN' && (
                      <div>
                        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                          {t('tickets:table.assigned')}
                        </label>
                        <select
                          value={assignedToVal}
                          onChange={(e) => setAssignedToVal(e.target.value ? Number(e.target.value) : '')}
                          className="w-full px-3 py-2 bg-obsidian border border-border rounded-lg text-text-primary text-sm focus:border-teal outline-none cursor-pointer"
                        >
                          <option value="">{t('tickets:table.unassigned')}</option>
                          {resolversList.map((r) => (
                            <option key={r.user.id} value={r.user.id}>
                              {r.user.first_name || r.user.username}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Dual Estimation: Expected Delivery Date & Estimated Work Effort */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Expected Delivery Date (External Target) */}
                    <div className="p-4 rounded-xl bg-obsidian/70 border border-border/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                          {t('tickets:detail.estimated_delivery_label')}
                        </label>
                        {estimatedResolutionVal && (
                          <button
                            type="button"
                            onClick={() => setEstimatedResolutionVal('')}
                            className="px-2 py-0.5 rounded-md bg-urgency-high/15 hover:bg-urgency-high/25 text-urgency-high border border-urgency-high/30 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                          >
                            ✕ {t('common:actions.clear')}
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-text-muted">{t('tickets:detail.estimated_delivery_hint')}</p>

                      {/* Quick Target Presets */}
                      <div>
                        <div className="flex flex-wrap gap-1.5">
                          {[1, 2, 4, 8, 24, 48].map((hrs) => (
                            <button
                              key={hrs}
                              type="button"
                              onClick={() => {
                                const target = new Date(Date.now() + hrs * 3600 * 1000);
                                const localIso = new Date(target.getTime() - target.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                                setEstimatedResolutionVal(localIso);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-surface hover:bg-teal/20 hover:text-teal-glow text-text-secondary border border-border text-xs font-semibold transition-all cursor-pointer active:scale-95"
                            >
                              +{hrs >= 24 ? `${hrs / 24}d` : `${hrs}h`}
                            </button>
                          ))}
                        </div>
                      </div>

                      <input
                        type="datetime-local"
                        value={estimatedResolutionVal}
                        onChange={(e) => setEstimatedResolutionVal(e.target.value)}
                        className="w-full px-3 py-2 bg-obsidian border border-border rounded-lg text-text-primary text-sm focus:border-teal outline-none [color-scheme:dark]"
                      />
                    </div>

                    {/* Estimated Active Work Effort (Internal Effort) */}
                    <div className="p-4 rounded-xl bg-obsidian/70 border border-border/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                          {t('tickets:detail.estimated_work_label')}
                        </label>
                        {estimatedWorkVal && (
                          <button
                            type="button"
                            onClick={() => setEstimatedWorkVal('')}
                            className="px-2 py-0.5 rounded-md bg-urgency-high/15 hover:bg-urgency-high/25 text-urgency-high border border-urgency-high/30 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                          >
                            ✕ {t('common:actions.clear')}
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-text-muted">{t('tickets:detail.estimated_work_hint')}</p>

                      {/* Quick Work Effort Presets */}
                      <div>
                        <div className="flex flex-wrap gap-1.5">
                          {['15m', '30m', '1h', '2h', '4h', '8h'].map((eff) => (
                            <button
                              key={eff}
                              type="button"
                              onClick={() => setEstimatedWorkVal(eff)}
                              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                                estimatedWorkVal === eff
                                  ? 'bg-teal text-white border-teal'
                                  : 'bg-surface hover:bg-teal/20 hover:text-teal-glow text-text-secondary border-border'
                              }`}
                            >
                              {eff}
                            </button>
                          ))}
                        </div>
                      </div>

                      <input
                        type="text"
                        placeholder="e.g. 1h 30m"
                        value={estimatedWorkVal}
                        onChange={(e) => setEstimatedWorkVal(e.target.value)}
                        className="w-full px-3 py-2 bg-obsidian border border-border rounded-lg text-text-primary text-sm focus:border-teal outline-none"
                      />
                    </div>
                  </div>

                  {/* Resolution Docs Field */}
                  {(statusVal === 'RESOLVED' || statusVal === 'CLOSED') && (
                    <>
                      {/* Resolved At — backdatable datetime picker */}
                      <div className="p-4 rounded-xl bg-status-resolved/5 border border-status-resolved/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-semibold text-status-resolved uppercase tracking-wider">
                            {t('tickets:detail.resolved_at_label')}
                          </label>
                          {resolvedAtVal && (
                            <button
                              type="button"
                              onClick={() => setResolvedAtVal('')}
                              className="px-2 py-0.5 rounded-md bg-urgency-high/15 hover:bg-urgency-high/25 text-urgency-high border border-urgency-high/30 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                            >
                              ✕ {t('common:actions.clear')}
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-text-muted">{t('tickets:detail.resolved_at_hint')}</p>
                        <input
                          type="datetime-local"
                          value={resolvedAtVal}
                          max={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                          onChange={(e) => setResolvedAtVal(e.target.value)}
                          className="w-full px-3 py-2 bg-obsidian border border-status-resolved/30 rounded-lg text-text-primary text-sm focus:border-status-resolved outline-none [color-scheme:dark]"
                        />
                        {resolvedAtPreviewDuration && (
                          <p className="text-xs font-semibold text-status-resolved">
                            {t('tickets:detail.resolution_duration_preview', { duration: resolvedAtPreviewDuration })}
                          </p>
                        )}
                      </div>

                      {/* Resolution documentation */}
                      <div>
                        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                          {t('tickets:detail.resolution_docs_heading')}
                        </label>
                        <textarea
                          required
                          rows={4}
                          placeholder={t('tickets:detail.resolution_placeholder')}
                          value={resDocs}
                          onChange={(e) => setResDocs(e.target.value)}
                          className="w-full px-3 py-2 bg-obsidian border border-border rounded-lg text-text-primary text-sm focus:border-teal outline-none resize-none"
                        />
                      </div>
                    </>
                  )}

                  {/* Edit buttons */}
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary rounded-lg text-xs font-semibold transition-all border border-border"
                    >
                      {t('common:actions.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={updateTicketMutation.isPending}
                      className="px-4 py-2 bg-teal hover:bg-teal-light text-white rounded-lg text-xs font-semibold transition-all"
                    >
                      {updateTicketMutation.isPending ? t('common:actions.saving') : t('common:actions.save_updates')}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-xs text-text-muted">
                  {t('tickets:detail.modify_hint')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Info Panel (Right side) - Detailed Lifecycle & Timestamps */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-6 space-y-5">
            <h3 className="text-sm font-semibold text-text-primary border-b border-border/50 pb-2">
              {t('tickets:detail.metadata_heading')}
            </h3>

            <div className="space-y-4 text-sm">
              {/* Type */}
              <div>
                <span className="text-xs text-text-secondary block">{t('tickets:table.type')}</span>
                <div className="mt-1">
                  <TicketTypeBadge type={ticket.ticket_type || 'BUG'} />
                </div>
              </div>

              {/* Department */}
              <div>
                <span className="text-xs text-text-secondary block">{t('tickets:detail.source_department')}</span>
                <span className="font-medium text-text-primary mt-0.5 block">{ticket.source_area.name}</span>
              </div>

              {/* Staff Assignment & Admin Quick Assign */}
              {role !== 'CLIENT' && (
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary block">{t('tickets:detail.assigned_staff')}</span>
                    {canClaim && (
                      <button
                        onClick={() => claimTicketMutation.mutate()}
                        disabled={claimTicketMutation.isPending}
                        className="text-[11px] text-teal-glow hover:underline font-semibold"
                      >
                        {t('tickets:detail.assign_to_me')}
                      </button>
                    )}
                  </div>

                  {role === 'SYSADMIN' ? (
                    <div className="mt-1">
                      <select
                        value={ticket.assigned_to?.id || ''}
                        onChange={(e) => handleQuickAssign(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-obsidian border border-border rounded-lg text-text-primary text-xs focus:border-teal outline-none cursor-pointer"
                      >
                        <option value="">{t('tickets:table.unassigned')}</option>
                        {resolversList.map((r) => (
                          <option key={r.user.id} value={r.user.id}>
                            {r.user.first_name || r.user.username}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <span className="font-medium text-text-primary mt-0.5 block">
                      {ticket.assigned_to ? (
                        ticket.assigned_to.first_name || ticket.assigned_to.username
                      ) : (
                        <span className="text-text-muted italic">{t('tickets:table.unassigned')}</span>
                      )}
                    </span>
                  )}
                </div>
              )}

              {/* Divider for Timestamps */}
              <div className="pt-2 border-t border-border/40 space-y-3">
                {/* Creation Date */}
                <div>
                  <span className="text-xs text-text-secondary flex items-center gap-1.5">
                    <span>📅</span>
                    <span>{t('tickets:detail.created_date')}</span>
                  </span>
                  <span className="font-medium text-text-primary mt-0.5 block text-xs">
                    {formatDateTime(ticket.created_at)}
                  </span>
                </div>

                {/* Assigned / Start Date */}
                <div>
                  <span className="text-xs text-text-secondary flex items-center gap-1.5">
                    <span>🚀</span>
                    <span>{t('tickets:detail.assigned_date')}</span>
                  </span>
                  <span className="font-medium text-text-primary mt-0.5 block text-xs">
                    {ticket.assigned_at ? (
                      formatDateTime(ticket.assigned_at)
                    ) : (
                      <span className="text-text-muted italic">{t('tickets:detail.not_assigned_yet')}</span>
                    )}
                  </span>
                </div>

                {/* Expected Delivery Date (Target) */}
                <div>
                  <span className="text-xs text-text-secondary flex items-center gap-1.5">
                    <span>📅</span>
                    <span>{t('tickets:detail.estimated_delivery_label')}</span>
                  </span>
                  <span className="font-medium text-teal-glow mt-0.5 block text-xs">
                    {ticket.estimated_resolution_time ? (
                      formatDateTime(ticket.estimated_resolution_time)
                    ) : (
                      <span className="text-text-muted italic">{t('tickets:detail.not_set')}</span>
                    )}
                  </span>
                </div>

                {/* Estimated Active Work Effort */}
                <div>
                  <span className="text-xs text-text-secondary flex items-center gap-1.5">
                    <span>⏱️</span>
                    <span>{t('tickets:detail.estimated_work_label')}</span>
                  </span>
                  <span className="font-medium text-text-primary mt-0.5 block text-xs">
                    {ticket.estimated_work_hours ? (
                      ticket.estimated_work_hours
                    ) : (
                      <span className="text-text-muted italic">{t('tickets:detail.not_set')}</span>
                    )}
                  </span>
                </div>

                {/* Closed Date */}
                <div>
                  <span className="text-xs text-text-secondary flex items-center gap-1.5">
                    <span>🏁</span>
                    <span>{t('tickets:detail.closed_date')}</span>
                  </span>
                  <span className="font-medium text-text-primary mt-0.5 block text-xs">
                    {ticket.resolved_at ? (
                      formatDateTime(ticket.resolved_at)
                    ) : (
                      <span className="text-text-muted italic">{t('tickets:detail.not_closed_yet')}</span>
                    )}
                  </span>
                </div>

                {/* Actual Time of Resolution */}
                {resolutionDuration && (
                  <div className="p-2.5 rounded-lg bg-status-resolved/10 border border-status-resolved/30">
                    <span className="text-xs text-status-resolved font-semibold flex items-center gap-1.5">
                      <span>✅</span>
                      <span>{t('tickets:detail.actual_resolution_time')}</span>
                    </span>
                    <span className="text-sm font-bold text-status-resolved mt-1 block">
                      {resolutionDuration}
                    </span>
                  </div>
                )}

                {/* Last Updated */}
                <div className="pt-1">
                  <span className="text-[11px] text-text-muted block">
                    {t('tickets:detail.last_updated')}: {formatDateTime(ticket.updated_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions for admins */}
            {canDelete && (
              <div className="pt-4 border-t border-border/50">
                <button
                  onClick={handleDelete}
                  disabled={deleteTicketMutation.isPending}
                  className="w-full py-2.5 bg-urgency-high/15 hover:bg-urgency-high/25 text-urgency-high font-semibold rounded-lg text-xs transition-all border border-urgency-high/20 active:scale-[0.98]"
                >
                  {deleteTicketMutation.isPending ? t('common:actions.deleting') : t('tickets:detail.delete_ticket')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in cursor-pointer"
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <img src={previewImage} alt="Attachment Full Size" className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl border border-border" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-obsidian border border-border text-white flex items-center justify-center text-sm font-bold shadow-lg hover:bg-surface"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ──


