/**
 * Sidebar — collapsible dark navigation with role-aware menu items.
 */

import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      to: '/dashboard',
      icon: DashboardIcon,
      label: 'Dashboard',
      roles: ['CLIENT', 'RESOLVER', 'SYSADMIN'] as const,
    },
    {
      to: '/tickets',
      icon: TicketIcon,
      label: 'Tickets',
      roles: ['CLIENT', 'RESOLVER', 'SYSADMIN'] as const,
    },
    {
      to: '/tickets/new',
      icon: PlusIcon,
      label: 'New Ticket',
      roles: ['CLIENT', 'SYSADMIN'] as const,
    },
  ];

  const filteredItems = navItems.filter(
    (item) => role && (item.roles as readonly string[]).includes(role),
  );

  const roleLabel = role === 'SYSADMIN' ? 'Admin' : role === 'RESOLVER' ? 'Resolver' : 'Client';
  const roleColor = role === 'SYSADMIN' ? 'text-gold' : role === 'RESOLVER' ? 'text-teal-glow' : 'text-text-secondary';

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-obsidian-light border-r border-border flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal/20 flex items-center justify-center animate-float">
            <DuckLogo />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary tracking-tight">DuckRow</h1>
            <p className="text-xs text-text-muted">Service Desk</p>
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
            {item.label}
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
                {roleLabel}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-xs font-medium text-text-secondary hover:text-urgency-high hover:bg-urgency-high/10 rounded-lg transition-all duration-[var(--transition-fast)] border border-transparent hover:border-urgency-high/20"
          >
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}

// ── Inline SVG Icons ──

function DuckLogo() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-teal-glow">
      <path
        d="M19.5 10.5c0-1.5-.5-3-1.5-4-1-1-2.5-2-4.5-2.5-.5-1.5-2-2.5-3.5-2.5-2 0-3.5 1.5-3.5 3.5 0 .3 0 .7.1 1C4.5 7 3 9 3 11.5c0 3 2 5.5 5 6.5v2c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-2c2.5-.8 4-3 4-5.5h-.5z"
        fill="currentColor"
        opacity="0.9"
      />
      <circle cx="8.5" cy="9" r="1" fill="#0B0F12" />
      <path d="M12 11.5c.8 0 1.5.3 2 .8" stroke="#F2A900" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

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
