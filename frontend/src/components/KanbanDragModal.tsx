/**
 * KanbanDragModal — Contextual modal for Kanban drag & drop transitions.
 *
 * Renders different UI depending on the target status and user role:
 * - → IN_PROGRESS + SYSADMIN: resolver selector
 * - → IN_PROGRESS + RESOLVER: self-assign confirmation
 * - → RESOLVED / CLOSED: datetime picker + optional documentation
 */

import { useState, useEffect, useRef } from 'react';
import type { Ticket, TicketStatus, UserProfile, Role } from '../types';
import { toLocalInputDateTime } from '../utils/dateUtils';

interface KanbanDragModalProps {
  ticket: Ticket;
  targetStatus: TicketStatus;
  role: Role;
  currentUser: { id: number; first_name: string; username: string } | null;
  resolvers: UserProfile[];
  onConfirm: (payload: {
    status: TicketStatus;
    assigned_to_id?: number | null;
    resolved_at?: string | null;
    resolution_documentation?: string | null;
  }) => void;
  onCancel: () => void;
  isPending: boolean;
}

export default function KanbanDragModal({
  ticket,
  targetStatus,
  role,
  currentUser,
  resolvers,
  onConfirm,
  onCancel,
  isPending,
}: KanbanDragModalProps) {
  const [assignedToId, setAssignedToId] = useState<number | ''>(
    ticket.assigned_to?.id ?? ''
  );
  const [resolvedAt, setResolvedAt] = useState(toLocalInputDateTime(new Date()));
  const [resDocs, setResDocs] = useState(ticket.resolution_documentation || '');
  const [visible, setVisible] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Animate in
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleCancel = () => {
    setVisible(false);
    setTimeout(onCancel, 220);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) handleCancel();
  };

  const handleConfirm = () => {
    const payload: Parameters<typeof onConfirm>[0] = { status: targetStatus };

    if (targetStatus === 'IN_PROGRESS') {
      if (role === 'SYSADMIN') {
        payload.assigned_to_id = assignedToId ? Number(assignedToId) : null;
      } else if (role === 'RESOLVER') {
        payload.assigned_to_id = currentUser?.id ?? null;
      }
    }

    if (targetStatus === 'RESOLVED' || targetStatus === 'CLOSED') {
      payload.resolved_at = resolvedAt ? new Date(resolvedAt).toISOString() : null;
      payload.resolution_documentation = resDocs || null;
    }

    onConfirm(payload);
  };

  // ── Content per scenario ─────────────────────────────────────────────────

  const isMovingToProgress = targetStatus === 'IN_PROGRESS';
  const isClosing = targetStatus === 'RESOLVED' || targetStatus === 'CLOSED';

  const targetLabel: Record<TicketStatus, string> = {
    OPEN: 'Abierto',
    IN_PROGRESS: 'En Progreso',
    RESOLVED: 'Resuelto',
    CLOSED: 'Cerrado',
  };

  const targetColorClass: Partial<Record<TicketStatus, string>> = {
    IN_PROGRESS: 'text-status-in-progress',
    RESOLVED: 'text-status-resolved',
    CLOSED: 'text-text-muted',
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'rgba(11, 15, 18, 0.75)',
        backdropFilter: 'blur(6px)',
        transition: 'opacity 200ms ease',
        opacity: visible ? 1 : 0,
      }}
    >
      <div
        style={{
          transition: 'opacity 220ms ease, transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.96)',
        }}
        className="w-full max-w-md bg-obsidian-light border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/60 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-1">
              Mover ticket
            </p>
            <h2 className="text-base font-bold text-text-primary leading-snug">
              → <span className={targetColorClass[targetStatus] || 'text-text-primary'}>
                {targetLabel[targetStatus]}
              </span>
            </h2>
            <p className="text-xs text-text-muted mt-1 line-clamp-1">{ticket.title}</p>
          </div>
          <button
            onClick={handleCancel}
            className="shrink-0 w-7 h-7 rounded-lg bg-surface hover:bg-surface-hover flex items-center justify-center text-text-muted hover:text-text-primary transition-all text-sm"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Scenario: → IN_PROGRESS + SYSADMIN */}
          {isMovingToProgress && role === 'SYSADMIN' && (
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                👤 Asignar responsable
              </label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2.5 bg-obsidian border border-border rounded-xl text-text-primary text-sm focus:border-teal outline-none cursor-pointer"
              >
                <option value="">— Sin asignar —</option>
                {resolvers.map((r) => (
                  <option key={r.user.id} value={r.user.id}>
                    {r.user.first_name || r.user.username}
                  </option>
                ))}
              </select>
              {ticket.assigned_to && (
                <p className="text-[11px] text-text-muted mt-1.5">
                  Asignado actualmente:{' '}
                  <span className="text-text-secondary font-medium">
                    {ticket.assigned_to.first_name || ticket.assigned_to.username}
                  </span>
                </p>
              )}
            </div>
          )}

          {/* Scenario: → IN_PROGRESS + RESOLVER */}
          {isMovingToProgress && role === 'RESOLVER' && (
            <div className="p-4 rounded-xl bg-teal/5 border border-teal/20">
              <p className="text-sm text-text-primary font-medium">
                🙋 ¿Asignarte este ticket y comenzar a trabajar en él?
              </p>
              <p className="text-xs text-text-muted mt-1">
                Serás registrado como responsable y el ticket pasará a{' '}
                <span className="text-status-in-progress font-semibold">En Progreso</span>.
              </p>
            </div>
          )}

          {/* Scenario: → RESOLVED / CLOSED */}
          {isClosing && (
            <>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  📅 ¿Cuándo fue resuelto?
                </label>
                <input
                  type="datetime-local"
                  value={resolvedAt}
                  max={toLocalInputDateTime(new Date())}
                  onChange={(e) => setResolvedAt(e.target.value)}
                  className="w-full px-3 py-2 bg-obsidian border border-status-resolved/30 rounded-xl text-text-primary text-sm focus:border-status-resolved outline-none [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  📝 Documentación de cierre{' '}
                  <span className="text-text-muted font-normal">(opcional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe brevemente cómo se resolvió..."
                  value={resDocs}
                  onChange={(e) => setResDocs(e.target.value)}
                  className="w-full px-3 py-2 bg-obsidian border border-border rounded-xl text-text-primary text-sm focus:border-teal outline-none resize-none"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/60 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isPending}
            className="px-4 py-2 bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary rounded-xl text-xs font-semibold transition-all border border-border"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-60 ${
              targetStatus === 'RESOLVED' || targetStatus === 'CLOSED'
                ? 'bg-status-resolved hover:bg-status-resolved/80 text-obsidian'
                : 'bg-teal hover:bg-teal-light text-white shadow-[var(--shadow-glow-teal)]'
            }`}
          >
            {isPending
              ? '...'
              : isMovingToProgress && role === 'RESOLVER'
              ? '✔ Asignarme y comenzar'
              : `✔ Mover a ${targetLabel[targetStatus]}`}
          </button>
        </div>
      </div>
    </div>
  );
}
