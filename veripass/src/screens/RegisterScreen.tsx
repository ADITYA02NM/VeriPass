import React, { useState } from 'react';
import { ScreenType, UserRole } from '../types';
import { register, setSession, ApiError } from '../lib/api';

interface RegisterScreenProps {
  onNavigate: (screen: ScreenType, transition?: 'push' | 'push_back' | 'none') => void;
  onLogin: (user: { identifier: string; name: string; role: string; origin?: string | null }) => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onNavigate, onLogin }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [passkey, setPasskey] = useState('');
  const [confirmPasskey, setConfirmPasskey] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('User');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const roles: { label: string; value: UserRole; icon: string }[] = [
    { label: 'User', value: 'User', icon: 'person' },
    { label: 'Producer', value: 'Producer', icon: 'precision_manufacturing' },
    { label: 'Logistics', value: 'Logistics', icon: 'local_shipping' },
    { label: 'Retailer', value: 'Retailer', icon: 'storefront' },
  ];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (passkey !== confirmPasskey) {
      setError('Passkeys do not match');
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await register(username.trim(), passkey, username.trim(), email.trim() || undefined, selectedRole);
      setSession(token, user);
      onLogin(user);
      onNavigate('scan', 'push');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed — server unreachable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--vp-cream)] text-[var(--vp-on-surface)] font-['Inter'] flex flex-col">
      {/* TopAppBar */}
      <header className="w-full top-0 sticky bg-[var(--vp-cream)] z-50 border-b-2 border-[var(--vp-ink)] shadow-[4px_4px_0px_0px_rgba(1,7,102,1)] flex items-center justify-between px-4 md:px-8 h-16">
        <div
          onClick={() => onNavigate('login', 'push_back')}
          className="flex items-center gap-2 text-[var(--vp-ink-text)] cursor-pointer"
        >
          <span
            className="material-symbols-outlined text-3xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            fingerprint
          </span>
          <span className="font-extrabold text-2xl tracking-tighter uppercase text-[var(--vp-ink-text)]">
            VeriPass
          </span>
        </div>
        <button
          onClick={() => onNavigate('login', 'push_back')}
          className="font-pixel text-[16px] text-[var(--vp-ink-text)] hover:text-[var(--vp-saffron-text)] transition-colors"
        >
          Back to Login
        </button>
      </header>

      <main className="max-w-3xl mx-auto w-full px-4 md:px-8 py-8 flex flex-col gap-8 flex-grow">
        {/* Progress Tracker */}
        <section className="w-full max-w-xl mx-auto flex items-center justify-between relative px-4 mt-2">
          {/* Connecting Line */}
          <div className="absolute top-1/2 left-0 w-full h-[4px] bg-[var(--vp-ink)] -z-0 transform -translate-y-1/2" />

          {/* Node 1 */}
          <div className="flex flex-col items-center gap-2 bg-[var(--vp-cream)] px-3 z-10">
            <div className="w-6 h-6 border-2 border-[var(--vp-ink)] bg-[var(--vp-green)] shadow-[2px_2px_0px_0px_rgba(1,7,102,1)]" />
            <span className="font-pixel text-[15px] text-[var(--vp-ink-text)] font-bold">ENTITY</span>
          </div>

          {/* Node 2 */}
          <div className="flex flex-col items-center gap-2 bg-[var(--vp-cream)] px-3 z-10">
            <div className="w-6 h-6 border-2 border-[var(--vp-ink)] bg-[var(--vp-cream)] shadow-[2px_2px_0px_0px_rgba(1,7,102,1)]" />
            <span className="font-pixel text-[15px] text-[var(--vp-outline)]">VERIFY</span>
          </div>

          {/* Node 3 */}
          <div className="flex flex-col items-center gap-2 bg-[var(--vp-cream)] px-3 z-10">
            <div className="w-6 h-6 border-2 border-[var(--vp-ink)] bg-[var(--vp-cream)] shadow-[2px_2px_0px_0px_rgba(1,7,102,1)]" />
            <span className="font-pixel text-[15px] text-[var(--vp-outline)]">SECURE</span>
          </div>
        </section>

        {/* Header Section */}
        <section>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--vp-ink-text)] mb-2 uppercase tracking-tight">
            ENTITY REGISTRATION
          </h1>
          <p className="text-[15px] text-[var(--vp-muted)] max-w-xl">
            Select your entity classification and provide foundational identity data to begin the immutable verification process.
          </p>
        </section>

        {/* Form Section */}
        <div className="bg-[var(--vp-cream)] p-6 md:p-8 border-2 border-[var(--vp-ink)] voxel-shadow">
          <h2 className="font-pixel text-[18px] text-[var(--vp-ink-text)] uppercase mb-6 font-bold tracking-wider">
            IDENTITY DATA
          </h2>

          <form onSubmit={handleRegister} className="flex flex-col gap-5">
            {/* Entity Type Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="font-pixel text-[15px] text-[var(--vp-ink-text)] uppercase tracking-wider">
                ENTITY CLASSIFICATION
              </label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setSelectedRole(r.value)}
                    className={`flex items-center gap-2 p-3 border-2 font-pixel text-[15px] uppercase tracking-wider transition-all cursor-pointer ${
                      selectedRole === r.value
                        ? 'bg-[var(--vp-ink)] text-[var(--vp-cream-text)] border-[var(--vp-ink)] voxel-shadow-saffron'
                        : 'bg-[var(--vp-cream)] text-[var(--vp-ink-text)] border-[var(--vp-ink)] hover:bg-[var(--vp-container)] voxel-shadow-sm'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">{r.icon}</span>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="username"
                className="font-pixel text-[15px] text-[var(--vp-ink-text)] uppercase tracking-wider"
              >
                USERNAME
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ENTER_USERNAME"
                className="w-full p-3 font-pixel text-[18px] text-[var(--vp-on-surface)] bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] focus:outline-none focus:border-[var(--vp-cyan)] transition-all"
              />
            </div>

            {/* Contact Email */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="contactEmail"
                className="font-pixel text-[15px] text-[var(--vp-ink-text)] uppercase tracking-wider"
              >
                CONTACT EMAIL
              </label>
              <input
                id="contactEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ENTITY@DOMAIN.COM"
                className="w-full p-3 font-pixel text-[18px] text-[var(--vp-on-surface)] bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] focus:outline-none focus:border-[var(--vp-cyan)] transition-all"
              />
            </div>

            {/* Passkey */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="passkey"
                className="font-pixel text-[15px] text-[var(--vp-ink-text)] uppercase tracking-wider"
              >
                PASSKEY
              </label>
              <input
                id="passkey"
                type="password"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                placeholder="********"
                className="w-full p-3 font-pixel text-[18px] text-[var(--vp-on-surface)] bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] focus:outline-none focus:border-[var(--vp-cyan)] transition-all"
              />
            </div>

            {/* Confirm Passkey */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="confirmPasskey"
                className="font-pixel text-[15px] text-[var(--vp-ink-text)] uppercase tracking-wider"
              >
                CONFIRM PASSKEY
              </label>
              <input
                id="confirmPasskey"
                type="password"
                value={confirmPasskey}
                onChange={(e) => setConfirmPasskey(e.target.value)}
                placeholder="********"
                className="w-full p-3 font-pixel text-[18px] text-[var(--vp-on-surface)] bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] focus:outline-none focus:border-[var(--vp-cyan)] transition-all"
              />
            </div>

            {/* Action Button: xpath //button[contains(., 'REGISTER ENTITY')] */}
            {error && (
              <div className="p-3 border-2 border-[var(--vp-error)] bg-[var(--vp-error-container)] text-[var(--vp-error)] font-pixel text-[14px]">
                {error}
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-[var(--vp-ink)] text-[var(--vp-white-text)] py-3.5 px-6 font-pixel text-[19px] uppercase border-2 border-[var(--vp-ink)] voxel-shadow-saffron voxel-btn-active cursor-pointer transition-all hover:bg-[#00044a] disabled:opacity-50 disabled:cursor-wait"
              >
                {loading ? 'REGISTERING…' : 'REGISTER ENTITY'}
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
