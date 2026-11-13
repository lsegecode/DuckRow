/**
 * LoginPage — dark-themed login with duck branding, language selection,
 * and minimalist 2-tone (green & grey) portfolio demo access selector.
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
  titleKey: string;
  descKey: string;
}

const CLIENT_OPTIONS: DemoUser[] = [
  {
    username: 'client_it',
    password: 'client1234',
    roleBadge: 'IT AREA',
    titleKey: 'auth:demo_client_it',
    descKey: 'auth:demo_client_it_desc',
  },
  {
    username: 'client_hr',
    password: 'client1234',
    roleBadge: 'HR AREA',
    titleKey: 'auth:demo_client_hr',
    descKey: 'auth:demo_client_hr_desc',
  },
  {
    username: 'client_finance',
    password: 'client1234',
    roleBadge: 'FINANCE & MKT',
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
  const [showPassword, setShowPassword] = useState(false);

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
      {/* Background glow effects - strictly subtle teal and dark obsidian */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-teal/[0.03] rounded-full blur-[140px]" />
      </div>

      <div className="relative w-full max-w-4xl lg:max-w-5xl animate-fade-in">
        {/* Language switch button top right */}
        <div className="flex justify-end mb-3">
          <LanguageSwitcher variant="compact" />
        </div>

        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-48 h-24 mb-2 animate-float">
            <img src="/static/logo.png" alt="DuckRow Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">{t('common:app_name')}</h1>
          <p className="text-text-secondary mt-1 text-sm">{t('common:tagline')} &mdash; {t('auth:signin_title')}</p>
        </div>

        {/* Error notification banner */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-urgency-high/10 border border-urgency-high/20 text-urgency-high text-sm animate-fade-in flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* ── Responsive 2-Column Grid (Parallel on md+, Stacked on mobile) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Column 1: 1-CLICK PORTFOLIO DEMO ACCESS PANEL */}
          <div className="glass-card p-6 border border-border/80 bg-obsidian-light/60 backdrop-blur-md relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
                  <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                    {t('auth:demo_title')}
                  </h2>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-text-muted">
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
                  className="w-full p-3 rounded-xl bg-surface/40 hover:bg-surface/90 border border-border/70 hover:border-teal/50 transition-all text-left flex items-center justify-between group disabled:opacity-50 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface border border-border/80 group-hover:border-teal/40 group-hover:bg-teal/10 text-text-muted group-hover:text-teal-lighter flex items-center justify-center transition-all">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-text-primary group-hover:text-teal-lighter transition-colors">
                          {t('auth:demo_role_admin')}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-surface border border-border text-text-muted group-hover:border-teal/30 group-hover:text-teal-lighter transition-colors">
                          SYSADMIN
                        </span>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">{t('auth:demo_role_admin_desc')}</p>
                    </div>
                  </div>

                  <div className="text-xs font-semibold text-text-muted group-hover:text-teal-lighter flex items-center gap-1 transition-colors">
                    {loadingRole === 'admin' ? (
                      <span className="w-4 h-4 border-2 border-teal-lighter border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>&rarr;</span>
                    )}
                  </div>
                </button>

                {/* Option 2: Resolver */}
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleLogin('resolver1', 'resolver1234', 'resolver')}
                  className="w-full p-3 rounded-xl bg-surface/40 hover:bg-surface/90 border border-border/70 hover:border-teal/50 transition-all text-left flex items-center justify-between group disabled:opacity-50 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface border border-border/80 group-hover:border-teal/40 group-hover:bg-teal/10 text-text-muted group-hover:text-teal-lighter flex items-center justify-center transition-all">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-text-primary group-hover:text-teal-lighter transition-colors">
                          {t('auth:demo_role_resolver')}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-surface border border-border text-text-muted group-hover:border-teal/30 group-hover:text-teal-lighter transition-colors">
                          RESOLVER
                        </span>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">{t('auth:demo_role_resolver_desc')}</p>
                    </div>
                  </div>

                  <div className="text-xs font-semibold text-text-muted group-hover:text-teal-lighter flex items-center gap-1 transition-colors">
                    {loadingRole === 'resolver' ? (
                      <span className="w-4 h-4 border-2 border-teal-lighter border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>&rarr;</span>
                    )}
                  </div>
                </button>

                {/* Option 3: Client (Expandable breakdown by department) */}
                <div className="rounded-xl bg-surface/40 border border-border/70 transition-all">
                  <button
                    type="button"
                    onClick={() => setIsClientOpen(!isClientOpen)}
                    className="w-full p-3 text-left flex items-center justify-between group hover:bg-surface/80 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface border border-border/80 group-hover:border-teal/40 group-hover:bg-teal/10 text-text-muted group-hover:text-teal-lighter flex items-center justify-center transition-all">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-text-primary group-hover:text-teal-lighter transition-colors">
                            {t('auth:demo_role_client')}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-surface border border-border text-text-muted group-hover:border-teal/30 group-hover:text-teal-lighter transition-colors">
                            CLIENT
                          </span>
                        </div>
                        <p className="text-xs text-text-muted mt-0.5">{t('auth:demo_role_client_desc')}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <svg className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${isClientOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Sub-departments dropdown */}
                  {isClientOpen && (
                    <div className="p-3 pt-0 border-t border-border/50 space-y-2 mt-1 animate-fade-in">
                      <p className="text-[10px] text-text-muted font-mono uppercase tracking-wider mb-2">
                        Select department / area:
                      </p>
                      {CLIENT_OPTIONS.map((c) => (
                        <button
                          key={c.username}
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleLogin(c.username, c.password, c.username)}
                          className="w-full p-2.5 rounded-lg bg-surface/50 hover:bg-surface/90 border border-border/60 hover:border-teal/50 transition-all flex items-center justify-between text-left group disabled:opacity-50 cursor-pointer"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-text-primary group-hover:text-teal-lighter transition-colors">
                                {t(c.titleKey)}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-surface border border-border text-text-muted group-hover:border-teal/30 group-hover:text-teal-lighter transition-colors">
                                {c.roleBadge}
                              </span>
                            </div>
                            <p className="text-[11px] text-text-muted">{t(c.descKey)}</p>
                          </div>

                          <div className="text-xs font-semibold text-text-muted group-hover:text-teal-lighter flex items-center gap-1 transition-colors">
                            {loadingRole === c.username ? (
                              <span className="w-3.5 h-3.5 border-2 border-teal-lighter border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <span>&rarr;</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Toggle manual credentials table */}
            <div className="mt-5 pt-3 border-t border-border/50">
              <div className="flex justify-between items-center text-xs">
                <button
                  type="button"
                  onClick={() => setShowTable(!showTable)}
                  className="text-text-muted hover:text-text-primary transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <svg className={`w-3 h-3 transition-transform duration-200 ${showTable ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                  <span>{showTable ? t('auth:demo_credentials_hide') : t('auth:demo_credentials_toggle')}</span>
                </button>
                <span className="text-[11px] text-text-muted font-mono">passwords: *1234</span>
              </div>

              {showTable && (
                <div className="mt-3 overflow-x-auto text-[11px] font-mono bg-surface/30 p-3 rounded-xl border border-border/70 animate-fade-in">
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
                        <td className="py-1.5 text-text-primary font-semibold">admin</td>
                        <td className="py-1.5 text-text-muted">admin1234</td>
                        <td className="py-1.5 text-text-secondary">SYSADMIN</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 text-text-primary font-semibold">resolver1</td>
                        <td className="py-1.5 text-text-muted">resolver1234</td>
                        <td className="py-1.5 text-text-secondary">RESOLVER</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 text-text-primary font-semibold">client_it</td>
                        <td className="py-1.5 text-text-muted">client1234</td>
                        <td className="py-1.5 text-text-secondary">CLIENT (IT)</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 text-text-primary font-semibold">client_hr</td>
                        <td className="py-1.5 text-text-muted">client1234</td>
                        <td className="py-1.5 text-text-secondary">CLIENT (HR)</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 text-text-primary font-semibold">client_finance</td>
                        <td className="py-1.5 text-text-muted">client1234</td>
                        <td className="py-1.5 text-text-secondary">CLIENT (Finance)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Separator (only shown on screens < md) */}
          <div className="md:hidden relative flex py-2 items-center">
            <div className="flex-grow border-t border-border" />
            <span className="flex-shrink mx-4 text-xs font-mono text-text-muted uppercase tracking-wider">
              {t('auth:demo_or_manual')}
            </span>
            <div className="flex-grow border-t border-border" />
          </div>

          {/* Column 2: Manual Login Card */}
          <div className="glass-card p-6 border border-border/80 bg-obsidian-light/60 backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-text-muted" />
                  <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                    {t('auth:manual_title')}
                  </h2>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-text-muted">
                  Credentials
                </span>
              </div>

              <p className="text-xs text-text-muted mb-4">
                {t('auth:manual_subtitle')}
              </p>

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
                    className="w-full px-3.5 py-2.5 bg-obsidian border border-border rounded-xl text-sm text-text-primary placeholder-text-muted focus:border-teal focus:ring-1 focus:ring-teal/30 transition-all outline-none"
                    placeholder={t('auth:username_placeholder')}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-medium text-text-secondary mb-1.5">
                    {t('auth:password_label')}
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-3.5 pr-10 py-2.5 bg-obsidian border border-border rounded-xl text-sm text-text-primary placeholder-text-muted focus:border-teal focus:ring-1 focus:ring-teal/30 transition-all outline-none"
                      placeholder={t('auth:password_placeholder')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary transition-colors focus:outline-none"
                      title={showPassword ? t('auth:hide_password') : t('auth:show_password')}
                      aria-label={showPassword ? t('auth:hide_password') : t('auth:show_password')}
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-teal hover:bg-teal-light text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(13,92,77,0.3)] active:scale-[0.99] cursor-pointer"
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
                </div>
              </form>
            </div>

            <div className="mt-6 pt-3 border-t border-border/50 text-center">
              <p className="text-[11px] text-text-muted">
                {t('common:tagline')}
              </p>
            </div>
          </div>
        </div>

        {/* Footer hint */}
        <p className="text-center text-text-muted text-xs mt-6">
          {t('common:service_desk_title')} &middot; {t('common:tagline')}
        </p>
      </div>
    </div>
  );
}
