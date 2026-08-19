import type { UserMinimal } from '../types';

interface UserAvatarProps {
  user?: UserMinimal | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
  subtitle?: string;
}

const colorPalette = [
  'from-teal/40 to-teal-dark text-teal-lighter border-teal/40',
  'from-blue-500/30 to-blue-700/40 text-blue-300 border-blue-500/40',
  'from-purple-500/30 to-purple-700/40 text-purple-300 border-purple-500/40',
  'from-amber-500/30 to-amber-700/40 text-amber-300 border-amber-500/40',
  'from-emerald-500/30 to-emerald-700/40 text-emerald-300 border-emerald-500/40',
  'from-rose-500/30 to-rose-700/40 text-rose-300 border-rose-500/40',
  'from-cyan-500/30 to-cyan-700/40 text-cyan-300 border-cyan-500/40',
];

function getDeterministicColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colorPalette.length;
  return colorPalette[index];
}

function getInitials(user?: UserMinimal | null): string {
  if (!user) return '?';
  if (user.first_name && user.last_name) {
    return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
  }
  if (user.first_name) {
    return user.first_name.slice(0, 2).toUpperCase();
  }
  if (user.username) {
    return user.username.slice(0, 2).toUpperCase();
  }
  return '?';
}

function getDisplayName(user?: UserMinimal | null): string {
  if (!user) return '';
  if (user.first_name || user.last_name) {
    return `${user.first_name || ''} ${user.last_name || ''}`.trim();
  }
  return user.username || '';
}

export default function UserAvatar({
  user,
  size = 'sm',
  showName = false,
  className = '',
  subtitle,
}: UserAvatarProps) {
  if (!user) return null;

  const initials = getInitials(user);
  const displayName = getDisplayName(user);
  const colorClass = getDeterministicColor(user.username || displayName || 'user');

  const sizeClasses = {
    xs: 'w-5 h-5 text-[9px]',
    sm: 'w-7 h-7 text-[11px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-11 h-11 text-sm',
  }[size];

  return (
    <div className={`inline-flex items-center gap-2 ${className}`} title={displayName}>
      <div
        className={`${sizeClasses} rounded-full bg-gradient-to-br ${colorClass} border flex items-center justify-center font-bold shadow-sm select-none shrink-0`}
      >
        <span>{initials}</span>
      </div>
      {showName && (
        <div className="min-w-0">
          <p className="text-xs font-medium text-text-primary truncate">{displayName}</p>
          {subtitle && <p className="text-[10px] text-text-muted truncate">{subtitle}</p>}
        </div>
      )}
    </div>
  );
}
