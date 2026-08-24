/**
 * UserDetailPage — User detail view showing full name, role, email,
 * assigned areas/departments, and ticket history.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usersApi } from '../api/users';
import { ticketsApi } from '../api/tickets';
import type { UserProfile, Ticket } from '../types';

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'created' | 'assigned'>('created');

  useEffect(() => {
    if (!id) return;

    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        let userProfile: UserProfile;
        // First try loading by User ID
        try {
          userProfile = await usersApi.getProfileByUserId(id!);
        } catch {
          // If by User ID fails, try loading by Profile ID
          userProfile = await usersApi.getProfileById(id!);
        }

        setProfile(userProfile);

        // Fetch related tickets for this user
        const allTicketsRes = await ticketsApi.list();
        setTickets(allTicketsRes.results || []);
      } catch (err: any) {
        console.error('Error loading user profile:', err);
        setError('No se pudo cargar la información del usuario.');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [id]);

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-duck-yellow/20 border-t-duck-yellow rounded-full animate-spin" />
          <p className="text-gray-400 text-sm font-medium">Cargando perfil de usuario...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="bg-obsidian-card border border-red-500/20 rounded-2xl p-8 max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-400">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Usuario no encontrado</h2>
          <p className="text-gray-400 text-sm mb-6">{error || 'El usuario solicitado no existe o no tienes permisos para verlo.'}</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-obsidian-light text-gray-200 hover:text-white rounded-xl hover:bg-gray-800 transition-colors text-sm font-medium cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Volver atrás</span>
          </button>
        </div>
      </div>
    );
  }

  const { user, role, areas } = profile;
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;

  // Filter user's created and assigned tickets
  const createdTickets = tickets.filter((t) => t.created_by.id === user.id);
  const assignedTickets = tickets.filter((t) => t.assigned_to?.id === user.id);

  const activeTicketsList = activeTab === 'created' ? createdTickets : assignedTickets;

  // Get initials for avatar
  const getInitials = (name: string) => {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const roleBadges: Record<string, { label: string; bg: string; text: string }> = {
    SYSADMIN: {
      label: 'Administrador',
      bg: 'bg-purple-500/10 border-purple-500/30',
      text: 'text-purple-400',
    },
    RESOLVER: {
      label: 'Resolutor / Soporte',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      text: 'text-emerald-400',
    },
    CLIENT: {
      label: 'Cliente',
      bg: 'bg-teal/10 border-teal/30',
      text: 'text-teal-glow',
    },
  };

  const currentRole = roleBadges[role] || roleBadges.CLIENT;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Top Header & Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors text-sm font-medium cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Volver</span>
        </button>

        <div className="flex items-center space-x-2 text-xs text-gray-500 font-mono">
          <span>User ID: #{user.id}</span>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="glass-card p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-duck-yellow/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-6 sm:space-y-0 sm:space-x-8 relative z-10">
          {/* Avatar Icon */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-duck-yellow to-teal p-1 shadow-lg flex-shrink-0">
            <div className="w-full h-full bg-obsidian rounded-[22px] flex items-center justify-center font-bold text-2xl sm:text-3xl text-duck-yellow">
              {getInitials(fullName)}
            </div>
          </div>

          {/* User Details */}
          <div className="flex-1 text-center sm:text-left space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{fullName}</h1>
                <p className="text-sm text-gray-400 font-mono">@{user.username}</p>
              </div>

              {/* Role Badge */}
              <div className={`inline-flex items-center space-x-2 px-4 py-1.5 rounded-full border text-xs font-semibold ${currentRole.bg} ${currentRole.text} self-center sm:self-auto`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>{currentRole.label}</span>
              </div>
            </div>

            {/* Email Address with Copy Button */}
            {user.email && (
              <div className="inline-flex items-center space-x-2 bg-obsidian/60 border border-border px-3.5 py-1.5 rounded-xl text-xs text-gray-300">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{user.email}</span>
                <button
                  onClick={() => handleCopyEmail(user.email)}
                  title="Copiar email"
                  className="text-gray-400 hover:text-duck-yellow transition-colors ml-1 cursor-pointer"
                >
                  {copied ? (
                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid Layout: Areas & Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Assigned Areas / Departments (2 cols) */}
        <div className="md:col-span-2 glass-card p-6 space-y-6">
          <div className="flex items-center space-x-3 border-b border-border/50 pb-4">
            <div className="p-2.5 bg-teal/10 rounded-2xl text-teal-glow">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h2m-2 0V11m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14m-6 0h6" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Área o Departamento</h2>
              <p className="text-xs text-text-secondary">Áreas organizacionales asociadas a este usuario</p>
            </div>
          </div>

          {areas && areas.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {areas.map((area) => (
                <div
                  key={area.id}
                  className="bg-obsidian border border-border hover:border-duck-yellow/40 rounded-2xl p-4 transition-all duration-300 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-duck-yellow/10 group-hover:bg-duck-yellow/20 text-duck-yellow flex items-center justify-center transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h2m-2 0V11m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14m-6 0h6" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white group-hover:text-duck-yellow transition-colors">
                        {area.name}
                      </h3>
                      <span className="text-[11px] text-text-muted">Área Asignada</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-obsidian/40 border border-dashed border-border rounded-2xl">
              <p className="text-sm text-gray-400">Sin áreas asignadas</p>
              <p className="text-xs text-gray-500 mt-1">Este usuario aún no tiene un departamento asignado.</p>
            </div>
          )}
        </div>

        {/* Right Column: User Quick Stats (1 col) */}
        <div className="glass-card p-6 space-y-4 flex flex-col justify-between">
          <div className="border-b border-border/50 pb-4">
            <h2 className="text-lg font-bold text-white">Estadísticas</h2>
            <p className="text-xs text-text-secondary">Actividad de tickets del usuario</p>
          </div>

          <div className="space-y-3">
            <div className="bg-obsidian border border-border rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-duck-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5z" />
                </svg>
                <span className="text-xs text-text-secondary font-medium">Tickets Creados</span>
              </div>
              <span className="text-lg font-extrabold text-white">{createdTickets.length}</span>
            </div>

            {role === 'RESOLVER' && (
              <div className="bg-obsidian border border-border rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a2 2 0 01-2 2H3a2 2 0 01-2-2V5a2 2 0 012-2h8v1zm-3 7h10M5 20h14a2 2 0 002-2v-5a2 2 0 00-2-2H5a2 2 0 00-2 2v5a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs text-text-secondary font-medium">Tickets Asignados</span>
                </div>
                <span className="text-lg font-extrabold text-white">{assignedTickets.length}</span>
              </div>
            )}

            <div className="bg-obsidian border border-border rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs text-text-secondary font-medium">Resueltos</span>
              </div>
              <span className="text-lg font-extrabold text-white">
                {createdTickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Tickets Section */}
      <div className="glass-card p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Tickets Relacionados</h2>
            <p className="text-xs text-text-secondary">Historial de solicitudes asociadas a este perfil</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-2 bg-obsidian p-1 rounded-xl border border-border self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('created')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'created'
                  ? 'bg-duck-yellow text-obsidian font-bold shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Creados ({createdTickets.length})
            </button>
            {role === 'RESOLVER' && (
              <button
                onClick={() => setActiveTab('assigned')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'assigned'
                    ? 'bg-duck-yellow text-obsidian font-bold shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Asignados ({assignedTickets.length})
              </button>
            )}
          </div>
        </div>

        {/* Tickets List */}
        {activeTicketsList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeTicketsList.map((ticket) => (
              <Link
                key={ticket.id}
                to={`/tickets/${ticket.id}`}
                className="bg-obsidian border border-border hover:border-teal/50 rounded-2xl p-4 transition-all duration-300 hover:shadow-lg group flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-text-secondary">
                    <span className="font-mono text-duck-yellow font-medium">#{ticket.id}</span>
                    <span className="inline-flex items-center space-x-1">
                      <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white group-hover:text-teal-glow transition-colors line-clamp-1">
                    {ticket.title}
                  </h3>
                </div>

                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                  <span className="text-text-secondary font-medium">
                    Área: <span className="text-white">{ticket.source_area?.name || 'General'}</span>
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
                      ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : ticket.status === 'IN_PROGRESS'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {ticket.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-obsidian/30 border border-dashed border-border rounded-2xl">
            <svg className="w-10 h-10 text-gray-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5z" />
            </svg>
            <p className="text-sm text-gray-400 font-medium">No hay tickets en este historial</p>
            <p className="text-xs text-gray-500 mt-1">Este usuario no tiene tickets registrados en esta sección.</p>
          </div>
        )}
      </div>
    </div>
  );
}
