/**
 * LoginPage — dark-themed login with duck branding and language selection.
 */

import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
          setError('El enlace SSO ha expirado (máximo 120s). Vuelve a intentar desde el Portal EME.');
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ username, password });
      navigate(from, { replace: true });
    } catch {
      setError(t('auth:invalid_credentials'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center p-4">
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal/5 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/3 rounded-full blur-[128px]" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Language switch button top right */}
        <div className="flex justify-end mb-3">
          <LanguageSwitcher variant="compact" />
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-56 h-32 mb-4 animate-float">
            <img src="/static/logo.png" alt="DuckRow Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">{t('common:app_name')}</h1>
          <p className="text-text-secondary mt-1">{t('common:tagline')} &mdash; {t('auth:signin_title')}</p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-urgency-high/10 border border-urgency-high/20 text-urgency-high text-sm animate-fade-in">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-text-secondary mb-2">
                {t('auth:username_label')}
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                className="w-full px-4 py-3 bg-obsidian border border-border rounded-xl text-text-primary placeholder-text-muted focus:border-teal focus:ring-1 focus:ring-teal/50 transition-all duration-[var(--transition-fast)] outline-none"
                placeholder={t('auth:username_placeholder')}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
                {t('auth:password_label')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-obsidian border border-border rounded-xl text-text-primary placeholder-text-muted focus:border-teal focus:ring-1 focus:ring-teal/50 transition-all duration-[var(--transition-fast)] outline-none"
                placeholder={t('auth:password_placeholder')}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-teal hover:bg-teal-light text-white font-semibold rounded-xl transition-all duration-[var(--transition-fast)] disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[var(--shadow-glow-teal)] active:scale-[0.98]"
            >
              {isLoading ? (
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
