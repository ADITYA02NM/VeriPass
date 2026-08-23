import React, { useState, useCallback } from 'react';
import { ScreenType } from '../types';
import { PassportAnimation } from '../components/PassportAnimation';
import { login, loginWithWallet, loginWithGoogle, setSession, ApiError, UserInfo } from '../lib/api';
import { PeraWalletConnect } from '@perawallet/connect';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';

const peraWallet = new PeraWalletConnect({ chainId: 416002 });

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

interface LoginScreenProps {
  onNavigate: (screen: ScreenType, transition?: 'push' | 'push_back' | 'none') => void;
  onLogin: (user: UserInfo) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onNavigate,
  onLogin,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [passkey, setPasskey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [walletLoading, setWalletLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token, user } = await login(identifier.trim(), passkey);
      setSession(token, user);
      onLogin(user);
      onNavigate('scan', 'push');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed — server unreachable');
    } finally {
      setLoading(false);
    }
  };

  const handlePeraConnect = useCallback(async () => {
    setError(null);
    setWalletLoading(true);
    try {
      const accounts = await peraWallet.connect();
      const walletAddress = accounts[0];
      if (!walletAddress) throw new Error('No wallet address returned');
      const { token, user } = await loginWithWallet(walletAddress);
      setSession(token, user);
      onLogin(user);
      onNavigate('scan', 'push');
    } catch (err) {
      if (err?.message?.includes('connected')) return; // user cancelled
      setError(err instanceof ApiError ? err.message : 'Wallet connection failed');
    } finally {
      setWalletLoading(false);
    }
  }, [onLogin, onNavigate]);

  const handleGoogleSuccess = useCallback(async (credentialResponse: any) => {
    setError(null);
    try {
      const idToken = credentialResponse?.credential;
      if (!idToken) throw new Error('No credential returned');
      const { token, user } = await loginWithGoogle(idToken);
      setSession(token, user);
      onLogin(user);
      onNavigate('scan', 'push');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Google sign-in failed');
    }
  }, [onLogin, onNavigate]);

  const handleGoogleError = useCallback(() => {
    setError('Google sign-in was cancelled or failed');
  }, []);

  return (
    <div className="bg-[var(--vp-cream)] text-[var(--vp-on-surface)] min-h-screen flex items-center justify-center p-4 sm:p-6 font-['Inter']">
      <div className="max-w-md w-full flex flex-col gap-6 bg-[var(--vp-surface)] p-5 sm:p-6 border-2 border-[var(--vp-ink)] voxel-shadow">
        {/* Hero 3D Animation Section */}
        <div className="relative w-full h-48 sm:h-56 border-2 border-[var(--vp-ink)] bg-[var(--vp-container-low)] flex items-center justify-center overflow-hidden voxel-shadow-sm">
          <PassportAnimation />
          {/* Overlay branding */}
          <div className="absolute bottom-3 left-3 bg-[var(--vp-surface)] px-2.5 py-1 border-2 border-[var(--vp-ink)] pointer-events-none voxel-shadow-sm">
            <span className="font-pixel text-[18px] text-[var(--vp-ink-text)] uppercase tracking-widest font-bold">
              VERIPASS V1.0
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="text-left border-l-4 border-[var(--vp-ink)] pl-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--vp-ink-text)] leading-none tracking-tight">
            ACCESS LOG
          </h1>
          <p className="font-pixel text-[15px] text-[var(--vp-outline)] mt-2 uppercase tracking-wider">
            SECURE AUTHENTICATION REQUIRED
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Credentials */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1 relative">
              <label className="font-pixel text-[14px] text-[var(--vp-muted)] uppercase tracking-wider">
                IDENTIFIER
              </label>
              <div className="relative">
                <span
                  className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--vp-ink-text)] text-xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  account_circle
                </span>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="ENTER ID"
                  className="w-full bg-[var(--vp-cream)] border-2 border-[var(--vp-ink)] py-2.5 pl-10 pr-4 font-pixel text-[19px] text-[var(--vp-ink-text)] focus:outline-none focus:border-[var(--vp-cyan)] transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 relative">
              <label className="font-pixel text-[14px] text-[var(--vp-muted)] uppercase tracking-wider">
                PASSKEY
              </label>
              <div className="relative">
                <span
                  className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--vp-ink-text)] text-xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  key
                </span>
                <input
                  type="password"
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[var(--vp-cream)] border-2 border-[var(--vp-ink)] py-2.5 pl-10 pr-4 font-pixel text-[19px] text-[var(--vp-ink-text)] focus:outline-none focus:border-[var(--vp-cyan)] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-[var(--vp-error-container)]/60 border-2 border-[var(--vp-magenta)] px-3 py-2.5 flex items-center gap-2">
              <span
                className="material-symbols-outlined text-[var(--vp-magenta-text)] text-xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                error
              </span>
              <span className="font-pixel text-[16px] text-[var(--vp-error)] uppercase tracking-wider">
                {error}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 mt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--vp-ink)] text-[var(--vp-cream-text)] border-2 border-[var(--vp-ink)] py-3.5 font-pixel text-[20px] uppercase tracking-widest voxel-shadow-saffron voxel-btn-active transition-all flex items-center justify-center gap-2 hover:bg-[#00044a] cursor-pointer disabled:opacity-60 disabled:cursor-wait"
            >
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                {loading ? 'hourglass_top' : 'login'}
              </span>
              {loading ? 'Authenticating...' : 'Initialize Session'}
            </button>

            <button
              type="button"
              onClick={() => onNavigate('register', 'push')}
              className="w-full bg-[var(--vp-cream)] text-[var(--vp-ink-text)] border-2 border-[var(--vp-ink)] py-3.5 font-pixel text-[20px] uppercase tracking-widest voxel-shadow-sm voxel-btn-active transition-all flex items-center justify-center gap-2 hover:bg-[var(--vp-container)] cursor-pointer"
            >
              Register New Entity
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mt-1">
            <div className="flex-1 h-px bg-[var(--vp-outline)]/30" />
            <span className="font-pixel text-[13px] text-[var(--vp-muted)] uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-[var(--vp-outline)]/30" />
          </div>

          {/* Google Sign-In */}
          {GOOGLE_CLIENT_ID && (
            <div className="flex flex-col items-center gap-2">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                text="signin_with"
                shape="rectangular"
                width="100%"
              />
            </div>
          )}

          {/* Pera Wallet Connect */}
          <button
            type="button"
            onClick={handlePeraConnect}
            disabled={walletLoading}
            className="w-full bg-[#0033AD] text-white border-2 border-[#002288] py-3.5 font-pixel text-[19px] uppercase tracking-widest voxel-shadow-sm voxel-btn-active transition-all flex items-center justify-center gap-3 hover:bg-[#002888] cursor-pointer disabled:opacity-60 disabled:cursor-wait"
          >
            {walletLoading ? (
              <span className="material-symbols-outlined text-xl animate-spin" style={{ fontVariationSettings: "'FILL' 1" }}>
                progress_activity
              </span>
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zm-9-1a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h6v1a1 1 0 0 0 2 0V9h2v11z"/>
              </svg>
            )}
            {walletLoading ? 'Connecting...' : 'Connect Pera Wallet'}
          </button>

          {/* Recovery Link */}
          <div className="text-center mt-2">
            <a
              href="#recovery"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('password-reset', 'push');
              }}
              className="font-pixel text-[16px] text-[var(--vp-ink-text)] underline hover:text-[var(--vp-saffron-text)] transition-colors cursor-pointer"
            >
              System Recovery
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};
