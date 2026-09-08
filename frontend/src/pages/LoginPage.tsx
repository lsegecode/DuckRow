/**
 * LoginPage — dark-themed login with duck branding, language selection,
 * and 1-click portfolio demo role selector.
 */

import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

interface DemoUser {
  username: string;
  password: string;
  roleBadge: string;
  badgeColor: string;
  titleKey: string;
  descKey: string;
}

const CLIENT_OPTIONS: DemoUser[] = [
  {
    username: 'client_it',
    password: 'client1234',
    roleBadge: 'IT AREA',
    badgeColor: 'bg-status-open/15 text-blue-400 border-status-open/30',
    titleKey: 'auth:demo_client_it',
    descKey: 'auth:demo_client_it_desc',
  },
  {
    username: 'client_hr',
    password: 'client1234',
    roleBadge: 'HR AREA',
    badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    titleKey: 'auth:demo_client_hr',
    descKey: 'auth:demo_client_hr_desc',
  },
  {
    username: 'client_finance',
    password: 'client1234',
    roleBadge: 'FINANCE & MKT',
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    titleKey: 'auth:demo_client_finance',
    descKey: 'auth:demo_client_finance_desc',
  },
];

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [isClientOpen, setIsClientOpen] = useState(false);
  const [showTable, setShowTable] = useState(false);

  const { login } = useAuth();
  const { t } = useTranslation(['auth', 'common']);
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ssoError = params.get('error');
    if (ssoError) {
      switch (ssoError) {
        case 'token_expired':
          setError('El enlace SSO ha expirado (máximo 120s). Vuelve a intentar desde el portal de acceso.');
          break;
        case 'token_invalid':
          setError('El token SSO es inválido o la firma de autenticación no coincide.');
          break;
        case 'token_missing':
          setError('No se recibió el token de autenticación SSO.');
          break;
        case 'invalid_user_data':
          setError('Los datos de usuario enviados por SSO no son válidos.');
          break;
        default:
          setError('Credenciales inválidas o error de autenticación SSO.');
          break;
      }
    }
  }, [location.search]);

  const handleLogin = async (userToLogin: string, passToLogin: string, roleName?: string) => {
    setError('');
    setIsLoading(true);
    if (roleName) setLoadingRole(roleName);

    try {
      await login({ username: userToLogin, password: passToLogin });
      navigate(from, { replace: true });
    } catch {
      setError(t('auth:invalid_credentials'));
    } finally {
      setIsLoading(false);
      setLoadingRole(null);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleLogin(username, password);
  };

  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center p-4 py-8">
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal/5 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-[128px]" />
      </div>

      <div className="relative w-full max-w-lg animate-fade-in">
        {/* Language switch button top right */}
        <div className="flex justify-end mb-3">
          <LanguageSwitcher variant="compact" />
        </div>

        {/* Logo & Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-48 h-24 mb-2 animate-float">
            <img src="/static/logo.png" alt="DuckRow Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">{t('common:app_name')}</h1>
          <p className="text-text-secondary mt-1 text-sm">{t('common:tagline')} &mdash; {t('auth:signin_title')}</p>
        </div>

        {/* Error notification banner */}
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-urgency-high/10 border border-urgency-high/20 text-urgency-high text-sm animate-fade-in flex items-center gap-2">
            <span className="font-bold">✕</span> {error}
          </div>
        )}

        {/* ── 1-CLICK PORTFOLIO DEMO ACCESS PANEL ── */}
        <div className="glass-card p-6 mb-6 border border-teal/30 shadow-[0_0_25px_rgba(13,92,77,0.15)] relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal animate-pulse" />
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                {t('auth:demo_title')}
              </h2>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-teal/15 text-teal-lighter border border-teal/30">
              1-Click Login
            </span>
          </div>

          <p className="text-xs text-text-muted mb-4">
            {t('auth:demo_subtitle')}
          </p>

          <div className="space-y-2.5">
            {/* Option 1: Admin */}
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleLogin('admin', 'admin1234', 'admin')}
              className="w-full p-3 rounded-xl bg-surface/80 hover:bg-surface-hover border border-border hover:border-gold/50 transition-all text-left flex items-center justify-between group disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gold/15 text-gold flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform border border-gold/25">
                  👑
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text-primary group-hover:text-gold-light transition-colors">
                      {t('auth:demo_role_admin')}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-gold/15 text-gold border border-gold/30">
                      SYSADMIN
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">{t('auth:demo_role_admin_desc')}</p>
                </div>
              </div>

              <div className="text-xs font-semibold text-text-secondary group-hover:text-gold flex items-center gap-1">
                {loadingRole === 'admin' ? (
                  <span className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>→</span>
                )}
              </div>
            </button>

            {/* Option 2: Resolver */}
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleLogin('resolver1', 'resolver1234', 'resolver')}
              className="w-full p-3 rounded-xl bg-surface/80 hover:bg-surface-hover border border-border hover:border-teal/50 transition-all text-left flex items-center justify-between group disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal/20 text-teal-lighter flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform border border-teal/30">
                  🛠️
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text-primary group-hover:text-teal-lighter transition-colors">
                      {t('auth:demo_role_resolver')}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-teal/20 text-teal-lighter border border-teal/40">
                      RESOLVER
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">{t('auth:demo_role_resolver_desc')}</p>
                </div>
              </div>

              <div className="text-xs font-semibold text-text-secondary group-hover:text-teal-lighter flex items-center gap-1">
                {loadingRole === 'resolver' ? (
                  <span className="w-4 h-4 border-2 border-teal-lighter border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>→</span>
                )}
              </div>
            </button>

            {/* Option 3: Client (Expandable breakdown by department) */}
            <div className="rounded-xl bg-surface/80 border border-border transition-all">
              <button
                type="button"
                onClick={() => setIsClientOpen(!isClientOpen)}
                className="w-full p-3 text-left flex items-center justify-between group hover:bg-surface-hover rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-status-open/15 text-status-open flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform border border-status-open/30">
                    👥
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text-primary group-hover:text-blue-400 transition-colors">
                        {t('auth:demo_role_client')}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-status-open/15 text-blue-400 border border-status-open/30">
                        CLIENT
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">{t('auth:demo_role_client_desc')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-text-muted">{isClientOpen ? '▲' : '▼'}</span>
                </div>
              </button>

              {/* Sub-departments dropdown */}
              {isClientOpen && (
                <div className="p-3 pt-0 border-t border-border/50 space-y-2 mt-1 animate-fade-in">
                  <p className="text-[11px] text-text-muted font-mono uppercase tracking-wider mb-2">
                    Select department / area:
                  </p>
                  {CLIENT_OPTIONS.map((c) => (
                    <button
                      key={c.username}
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleLogin(c.username, c.password, c.username)}
                      className="w-full p-2.5 rounded-lg bg-obsidian/70 hover:bg-obsidian border border-border/80 hover:border-teal/50 transition-all flex items-center justify-between text-left group disabled:opacity-50"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-text-primary group-hover:text-teal-lighter transition-colors">
                            {t(c.titleKey)}
                          </span>
                          <span className={`text-[9px] px-1 py-0.2 rounded font-mono border ${c.badgeColor}`}>
                            {c.roleBadge}
                          </span>
                        </div>
                        <p className="text-[11px] text-text-muted">{t(c.descKey)}</p>
                      </div>

                      <div className="text-xs font-semibold text-text-secondary group-hover:text-teal flex items-center gap-1">
                        {loadingRole === c.username ? (
                          <span className="w-3.5 h-3.5 border-2 border-teal border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span>→</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Toggle manual credentials table */}
          <div className="mt-4 pt-3 border-t border-border/50 flex justify-between items-center text-xs">
            <button
              type="button"
              onClick={() => setShowTable(!showTable)}
              className="text-text-muted hover:text-text-primary transition-colors inline-flex items-center gap-1.5"
            >
              <span>{showTable ? '▲' : '▼'}</span>
              <span>{showTable ? t('auth:demo_credentials_hide') : t('auth:demo_credentials_toggle')}</span>
            </button>
            <span className="text-[11px] text-text-muted font-mono">passwords: *1234</span>
          </div>

          {showTable && (
            <div className="mt-3 overflow-x-auto text-[11px] font-mono bg-obsidian/90 p-3 rounded-xl border border-border animate-fade-in">
              <table className="w-full text-left text-text-secondary">
                <thead>
                  <tr className="border-b border-border/50 text-text-muted">
                    <th className="pb-1.5">User</th>
                    <th className="pb-1.5">Password</th>
                    <th className="pb-1.5">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  <tr>
                    <td className="py-1 text-gold font-bold">admin</td>
                    <td className="py-1 text-text-muted">admin1234</td>
                    <td className="py-1 text-text-primary">SYSADMIN</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-teal-lighter font-bold">resolver1</td>
                    <td className="py-1 text-text-muted">resolver1234</td>
                    <td className="py-1 text-text-primary">RESOLVER</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-blue-400 font-bold">client_it</td>
                    <td className="py-1 text-text-muted">client1234</td>
                    <td className="py-1 text-text-primary">CLIENT (IT)</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-purple-400 font-bold">client_hr</td>
                    <td className="py-1 text-text-muted">client1234</td>
                    <td className="py-1 text-text-primary">CLIENT (HR)</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-emerald-400 font-bold">client_finance</td>
                    <td className="py-1 text-text-muted">client1234</td>
                    <td className="py-1 text-text-primary">CLIENT (Finance)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="relative flex py-2 items-center mb-4">
          <div className="flex-grow border-t border-border" />
          <span className="flex-shrink mx-4 text-xs font-mono text-text-muted uppercase tracking-wider">
            {t('auth:demo_or_manual')}
          </span>
          <div className="flex-grow border-t border-border" />
        </div>

        {/* Manual Login Card */}
        <div className="glass-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-xs font-medium text-text-secondary mb-1.5">
                {t('auth:username_label')}
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-obsidian border border-border rounded-xl text-sm text-text-primary placeholder-text-muted focus:border-teal focus:ring-1 focus:ring-teal/50 transition-all outline-none"
                placeholder={t('auth:username_placeholder')}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-text-secondary mb-1.5">
                {t('auth:password_label')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-obsidian border border-border rounded-xl text-sm text-text-primary placeholder-text-muted focus:border-teal focus:ring-1 focus:ring-teal/50 transition-all outline-none"
                placeholder={t('auth:password_placeholder')}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-teal hover:bg-teal-light text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[var(--shadow-glow-teal)] active:scale-[0.98]"
            >
              {isLoading && !loadingRole ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('auth:signing_in')}
                </span>
              ) : (
                t('auth:sign_in_button')
              )}
            </button>
          </form>
        </div>

        {/* Footer hint */}
        <p className="text-center text-text-muted text-xs mt-6">
          {t('common:service_desk_title')} &middot; {t('common:tagline')}
        </p>
      </div>
    </div>
  );
}
