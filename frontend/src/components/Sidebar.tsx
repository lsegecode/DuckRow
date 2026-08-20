/**
 * Sidebar — collapsible dark navigation with role-aware menu items.
 */

import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';

export default function Sidebar() {
  const { user, role, logout } = useAuth();
  const { t } = useTranslation(['common']);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      to: '/dashboard',
      icon: DashboardIcon,
      labelKey: 'nav.dashboard',
      roles: ['CLIENT', 'RESOLVER', 'SYSADMIN'] as const,
    },
    {
      to: '/tickets',
      icon: TicketIcon,
      labelKey: 'nav.tickets',
      roles: ['CLIENT', 'RESOLVER', 'SYSADMIN'] as const,
    },
    {
      to: '/backlog',
      icon: BacklogIcon,
      labelKey: 'nav.backlog',
      roles: ['CLIENT', 'RESOLVER', 'SYSADMIN'] as const,
    },
    {
      to: '/tickets/new',
      icon: PlusIcon,
      labelKey: 'nav.new_ticket',
      roles: ['CLIENT', 'RESOLVER', 'SYSADMIN'] as const,
    },
  ];

  const filteredItems = navItems.filter(
    (item) => role && (item.roles as readonly string[]).includes(role),
  );

  const roleKey = role === 'SYSADMIN' ? 'roles.SYSADMIN_SHORT' : role === 'RESOLVER' ? 'roles.RESOLVER_SHORT' : 'roles.CLIENT_SHORT';
  const roleColor = role === 'SYSADMIN' ? 'text-gold' : role === 'RESOLVER' ? 'text-teal-glow' : 'text-text-secondary';

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-obsidian-light border-r border-border flex flex-col z-50">
      {/* Logo & Lang Switcher */}
      <div className="p-6 border-b border-border">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="w-28 h-12 flex items-center justify-start animate-float">
              <img src="/static/logo.png" alt="DuckRow" className="max-h-full object-contain" />
            </div>
            <LanguageSwitcher variant="compact" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary tracking-tight">{t('app_name')}</h1>
            <p className="text-[11px] text-text-muted truncate">{t('tagline')}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {filteredItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-[var(--transition-fast)] ${
                isActive
                  ? 'bg-teal/15 text-teal-glow border border-teal/20 shadow-[var(--shadow-glow-teal)]'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary border border-transparent'
              }`
            }
          >
            <item.icon />
            {t(item.labelKey)}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-border">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-teal/20 flex items-center justify-center text-teal-glow font-bold text-sm">
              {user?.first_name?.[0] || user?.username?.[0] || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className={`text-xs font-semibold ${roleColor}`}>
                {t(roleKey)}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-xs font-medium text-text-secondary hover:text-urgency-high hover:bg-urgency-high/10 rounded-lg transition-all duration-[var(--transition-fast)] border border-transparent hover:border-urgency-high/20"
          >
            {t('actions.sign_out')}
          </button>
        </div>
      </div>
    </aside>
  );
}

// ── Inline SVG Icons ──

function DashboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="1.5" width="6" height="6" rx="1.5" />
      <rect x="10.5" y="1.5" width="6" height="6" rx="1.5" />
      <rect x="1.5" y="10.5" width="6" height="6" rx="1.5" />
      <rect x="10.5" y="10.5" width="6" height="6" rx="1.5" />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.5 5.25A2.25 2.25 0 013.75 3h10.5a2.25 2.25 0 012.25 2.25v1.5a2.25 2.25 0 000 4.5v1.5A2.25 2.25 0 0114.25 15H3.75a2.25 2.25 0 01-2.25-2.25v-1.5a2.25 2.25 0 000-4.5v-1.5z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M9 3.75v10.5M3.75 9h10.5" />
    </svg>
  );
}

function BacklogIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8v13H3V8" />
      <path d="M1 3h22v5H1z" />
      <path d="M10 12h4" />
    </svg>
  );
}
