import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi } from '../api/tickets';
import { usersApi } from '../api/users';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import UrgencyBadge from '../components/UrgencyBadge';
import type { Ticket, TicketStatus, Priority } from '../types';

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role, user } = useAuth();

  const [statusVal, setStatusVal] = useState<TicketStatus | ''>('');
  const [priorityVal, setPriorityVal] = useState<Priority | ''>('');
  const [assignedToVal, setAssignedToVal] = useState<number | ''>('');
  const [resDocs, setResDocs] = useState('');
  const [isEditing, setIsEditing] = useState(false);

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
      setResDocs(ticket.resolution_documentation || '');
    }
  }, [ticket]);

  // Fetch resolvers (for assign option)
  const { data: resolvers } = useQuery({
    queryKey: ['resolvers'],
    queryFn: usersApi.getResolvers,
    enabled: role === 'SYSADMIN',
  });

  const updateTicketMutation = useMutation({
    mutationFn: (payload: any) => ticketsApi.update(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setIsEditing(false);
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
        <h3 className="text-xl font-bold text-urgency-high">Ticket Not Found</h3>
        <p className="text-text-secondary mt-1">The ticket you are looking for does not exist or you lack permission to view it.</p>
        <Link to="/tickets" className="mt-4 inline-block text-teal-glow hover:underline">
          Return to list
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
      payload.resolution_documentation = resDocs || null;
    } else if (role === 'RESOLVER') {
      payload.status = statusVal;
      payload.resolution_documentation = resDocs || null;
    }

    updateTicketMutation.mutate(payload);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this ticket?')) {
      deleteTicketMutation.mutate();
    }
  };

  const isAssignedResolver = ticket.assigned_to?.id === user?.id;
  const canUpdate = role === 'SYSADMIN' || (role === 'RESOLVER' && isAssignedResolver);
  const canDelete = role === 'SYSADMIN';

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Back button */}
      <div>
        <Link to="/tickets" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-all">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Tickets list
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area (Left side) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-card p-6 space-y-6">
            {/* Header info */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/50 pb-5">
              <div>
                <span className="text-xs text-text-muted font-mono">{ticket.id}</span>
                <h1 className="text-2xl font-bold text-text-primary mt-1">{ticket.title}</h1>
                <p className="text-xs text-text-secondary mt-1.5">
                  Submitted by <span className="font-semibold text-text-primary">{ticket.created_by.first_name || ticket.created_by.username}</span> &middot; {new Date(ticket.created_at).toLocaleString()}
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

            {/* Description */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Description</h3>
              <div className="bg-obsidian/30 p-5 rounded-xl border border-border/50 text-text-primary text-sm whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </div>
            </div>

            {/* Resolution Documentation */}
            {(ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' || ticket.resolution_documentation) && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-status-resolved uppercase tracking-wider">Resolution Documentation</h3>
                <div className="bg-status-resolved/5 p-5 rounded-xl border border-status-resolved/20 text-text-primary text-sm whitespace-pre-wrap leading-relaxed">
                  {ticket.resolution_documentation || <span className="text-text-muted italic">No documentation provided.</span>}
                </div>
              </div>
            )}
          </div>

          {/* Edit Panel (if authorized Resolver/Sysadmin) */}
          {canUpdate && (
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <h3 className="text-md font-semibold text-text-primary">Update Action</h3>
                {!isEditing && (
                  <button
                    onClick={() => {
                      setStatusVal(ticket.status);
                      setPriorityVal(ticket.internal_priority || '');
                      setAssignedToVal(ticket.assigned_to?.id || '');
                      setResDocs(ticket.resolution_documentation || '');
                      setIsEditing(true);
                    }}
                    className="px-3.5 py-1.5 bg-teal/15 hover:bg-teal/25 text-teal-glow font-semibold rounded-lg text-xs transition-all border border-teal/20"
                  >
                    Modify Fields
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Status Dropdown */}
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                        Status
                      </label>
                      <select
                        value={statusVal}
                        onChange={(e) => setStatusVal(e.target.value as TicketStatus)}
                        className="w-full px-3 py-2 bg-obsidian border border-border rounded-lg text-text-primary text-sm focus:border-teal outline-none"
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </div>

                    {/* Sysadmin Fields (Priority & Assign) */}
                    {role === 'SYSADMIN' && (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                            Internal Priority
                          </label>
                          <select
                            value={priorityVal}
                            onChange={(e) => setPriorityVal(e.target.value as Priority)}
                            className="w-full px-3 py-2 bg-obsidian border border-border rounded-lg text-text-primary text-sm focus:border-teal outline-none"
                          >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="CRITICAL">Critical</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                            Assigned To
                          </label>
                          <select
                            value={assignedToVal}
                            onChange={(e) => setAssignedToVal(e.target.value ? Number(e.target.value) : '')}
                            className="w-full px-3 py-2 bg-obsidian border border-border rounded-lg text-text-primary text-sm focus:border-teal outline-none"
                          >
                            <option value="">Unassigned</option>
                            {resolvers?.map((r) => (
                              <option key={r.user.id} value={r.user.id}>
                                {r.user.first_name || r.user.username}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Resolution Docs Field */}
                  {(statusVal === 'RESOLVED' || statusVal === 'CLOSED') && (
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                        Resolution Documentation
                      </label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Explain how this issue was resolved..."
                        value={resDocs}
                        onChange={(e) => setResDocs(e.target.value)}
                        className="w-full px-3 py-2 bg-obsidian border border-border rounded-lg text-text-primary text-sm focus:border-teal outline-none resize-none"
                      />
                    </div>
                  )}

                  {/* Edit buttons */}
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary rounded-lg text-xs font-semibold transition-all border border-border"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateTicketMutation.isPending}
                      className="px-4 py-2 bg-teal hover:bg-teal-light text-white rounded-lg text-xs font-semibold transition-all"
                    >
                      {updateTicketMutation.isPending ? 'Saving...' : 'Save Updates'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-xs text-text-muted">
                  Click &apos;Modify Fields&apos; above to edit ticket parameters.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Info Panel (Right side) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-6 space-y-5">
            <h3 className="text-sm font-semibold text-text-primary border-b border-border/50 pb-2">Ticket Metadata</h3>
            
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-xs text-text-secondary block">Source Department</span>
                <span className="font-medium text-text-primary mt-0.5 block">{ticket.source_area.name}</span>
              </div>

              {role !== 'CLIENT' && (
                <div>
                  <span className="text-xs text-text-secondary block">Assigned Staff</span>
                  <span className="font-medium text-text-primary mt-0.5 block">
                    {ticket.assigned_to
                      ? ticket.assigned_to.first_name || ticket.assigned_to.username
                      : <span className="text-text-muted italic">Unassigned</span>
                    }
                  </span>
                </div>
              )}

              {ticket.estimated_resolution_time && (
                <div>
                  <span className="text-xs text-text-secondary block">Estimated Resolution</span>
                  <span className="font-medium text-text-primary mt-0.5 block">
                    {new Date(ticket.estimated_resolution_time).toLocaleString()}
                  </span>
                </div>
              )}

              <div>
                <span className="text-xs text-text-secondary block">Last Updated</span>
                <span className="font-medium text-text-primary mt-0.5 block">
                  {new Date(ticket.updated_at).toLocaleString()}
                </span>
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
                  {deleteTicketMutation.isPending ? 'Deleting...' : 'Delete Ticket'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
