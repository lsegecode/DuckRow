/**
 * SSOCallbackPage — captures SimpleJWT tokens returned from SSO exchange
 * and completes login into DuckRow.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SSOCallbackPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleSSO = async () => {
      // Extract tokens from URL hash (#access=...&refresh=...) or query (?access=...&refresh=...)
      const hash = window.location.hash.substring(1);
      const search = window.location.search.substring(1);
      const params = new URLSearchParams(hash || search);

      const accessToken = params.get('access');
      const refreshToken = params.get('refresh');

      if (accessToken && refreshToken) {
        // Save tokens in localStorage
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);

        // Clear hash and URL query for security
        window.history.replaceState(null, '', window.location.pathname);

        try {
          await refreshUser();
          navigate('/dashboard', { replace: true });
        } catch {
          setErrorMsg('Error al sincronizar la sesión del usuario SSO.');
        }
      } else {
        setErrorMsg('No se recibieron los tokens de autenticación SSO.');
      }
    };

    handleSSO();
  }, [navigate, refreshUser]);

  return (
    <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center p-4">
      <div className="glass-card p-8 max-w-md w-full text-center space-y-4 animate-fade-in">
        {errorMsg ? (
          <>
            <div className="w-14 h-14 mx-auto rounded-full bg-urgency-high/20 text-urgency-high flex items-center justify-center text-2xl font-bold">
              ✕
            </div>
            <h2 className="text-lg font-bold text-text-primary">Error de Autenticación SSO</h2>
            <p className="text-sm text-text-secondary">{errorMsg}</p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="mt-4 px-4 py-2 bg-teal hover:bg-teal-light text-white font-semibold rounded-xl text-xs transition-all"
            >
              Ir a Iniciar Sesión
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-teal/15 flex items-center justify-center animate-float border border-teal/20 p-2 overflow-hidden">
              <img src="/static/duckie.png" alt="Duckie Mascot" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-lg font-bold text-text-primary">Iniciando sesión desde Portal EME...</h2>
            <div className="flex justify-center items-center gap-2 pt-2">
              <span className="w-4 h-4 border-2 border-teal border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-text-muted">Validando credenciales...</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
