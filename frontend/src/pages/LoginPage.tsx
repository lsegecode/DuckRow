/**
 * LoginPage — dark-themed login with duck branding.
 */

import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ username, password });
      navigate(from, { replace: true });
    } catch {
      setError('Invalid credentials. Please check your username and password.');
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
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-teal/10 border border-teal/20 mb-4 animate-float">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-teal-glow">
              <path
                d="M19.5 10.5c0-1.5-.5-3-1.5-4-1-1-2.5-2-4.5-2.5-.5-1.5-2-2.5-3.5-2.5-2 0-3.5 1.5-3.5 3.5 0 .3 0 .7.1 1C4.5 7 3 9 3 11.5c0 3 2 5.5 5 6.5v2c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-2c2.5-.8 4-3 4-5.5h-.5z"
                fill="currentColor"
                opacity="0.9"
              />
              <circle cx="8.5" cy="9" r="1" fill="#0B0F12" />
              <path d="M12 11.5c.8 0 1.5.3 2 .8" stroke="#F2A900" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">DuckRow</h1>
          <p className="text-text-secondary mt-1">Service Desk — Sign in to your account</p>
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
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                className="w-full px-4 py-3 bg-obsidian border border-border rounded-xl text-text-primary placeholder-text-muted focus:border-teal focus:ring-1 focus:ring-teal/50 transition-all duration-[var(--transition-fast)] outline-none"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-obsidian border border-border rounded-xl text-text-primary placeholder-text-muted focus:border-teal focus:ring-1 focus:ring-teal/50 transition-all duration-[var(--transition-fast)] outline-none"
                placeholder="Enter your password"
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
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Footer hint */}
        <p className="text-center text-text-muted text-xs mt-6">
          Agile Ducks Service Desk &middot; Keep your work in a row
        </p>
      </div>
    </div>
  );
}
