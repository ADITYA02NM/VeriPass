import React, { useState } from 'react';
import { ScreenType } from '../types';

interface ProfileSecurityScreenProps {
  onNavigate: (screen: ScreenType, transition?: 'push' | 'push_back' | 'none') => void;
}

export const ProfileSecurityScreen: React.FC<ProfileSecurityScreenProps> = ({ onNavigate }) => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [faceIdActive, setFaceIdActive] = useState(false);

  const handleGenerateRecovery = () => {
    const code = `RECOV-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setGeneratedCode(code);
  };

  return (
    <div className="bg-[var(--vp-cream)] text-[var(--vp-on-surface)] font-['Inter'] min-h-screen pb-28 pt-16 flex flex-col">
      {/* TopAppBar with Back button matching body/header[1]/div[1]/button[1] */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-8 h-16 bg-[var(--vp-surface)] border-b-4 border-[var(--vp-ink)] shadow-[4px_4px_0px_0px_rgba(1,7,102,1)]">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => onNavigate('account', 'push_back')}
            className="hover:bg-[var(--vp-container)] transition-all active:translate-x-[2px] active:translate-y-[2px] p-2 border-2 border-[var(--vp-ink)] bg-[var(--vp-cream)] voxel-shadow-sm flex items-center justify-center cursor-pointer"
            aria-label="Back to Account"
          >
            <span className="material-symbols-outlined text-[var(--vp-ink-text)] text-xl font-bold">
              arrow_back
            </span>
          </button>
          <div className="font-pixel text-[22px] text-[var(--vp-ink-text)] tracking-widest uppercase font-bold">
            VeriPass
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-[var(--vp-container-high)] border-2 border-[var(--vp-ink)] overflow-hidden flex items-center justify-center">
            <span className="material-symbols-outlined text-[var(--vp-ink-text)] text-xl">
              account_circle
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-4 md:px-8 py-6 flex flex-col gap-6">
        {/* Security Status */}
        <section className="flex flex-col items-start gap-3">
          <h2 className="text-2xl font-bold text-[var(--vp-ink-text)] tracking-tight">
            SECURITY STATUS
          </h2>
          <div className="bg-[var(--vp-green)] text-[var(--vp-white-text)] font-pixel text-[18px] px-4 py-1.5 border-2 border-[var(--vp-ink)] voxel-shadow-sm flex items-center gap-2 font-bold tracking-wider">
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              shield
            </span>
            PROTECTED
          </div>
        </section>

        {/* Biometric Data */}
        <section className="bg-[var(--vp-cream)] border-2 border-[var(--vp-ink)] voxel-shadow p-5 sm:p-6 flex flex-col gap-5">
          <div className="flex items-center gap-3 border-b-2 border-[var(--vp-ink)] pb-3">
            <span className="material-symbols-outlined text-[var(--vp-ink-text)] text-2xl">
              fingerprint
            </span>
            <h3 className="text-xl font-bold text-[var(--vp-ink-text)]">BIOMETRIC DATA</h3>
          </div>

          <div className="flex flex-col gap-3">
            {/* Fingerprint Active */}
            <div className="flex justify-between items-center bg-[var(--vp-container)] p-4 border-2 border-[var(--vp-ink)]">
              <div className="flex flex-col">
                <span className="text-[17px] text-[var(--vp-ink-text)] font-bold">Fingerprint</span>
                <span className="font-pixel text-[14px] text-[var(--vp-outline)]">STATUS: ACTIVE</span>
              </div>
              <button
                type="button"
                className="bg-[var(--vp-cream)] border-2 border-[var(--vp-ink)] p-2 voxel-shadow-sm voxel-btn-active cursor-pointer"
              >
                <span className="material-symbols-outlined text-[var(--vp-ink-text)] text-xl">
                  settings
                </span>
              </button>
            </div>

            {/* Face ID Inactive / Toggle */}
            <div className="flex justify-between items-center bg-[var(--vp-container)] p-4 border-2 border-[var(--vp-ink)]">
              <div className="flex flex-col">
                <span className="text-[17px] text-[var(--vp-ink-text)] font-bold">Face ID</span>
                <span className="font-pixel text-[14px] text-[var(--vp-outline)]">
                  STATUS: {faceIdActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFaceIdActive(!faceIdActive)}
                className={`border-2 border-[var(--vp-ink)] px-4 py-2 font-pixel text-[17px] voxel-btn-active cursor-pointer transition-all ${
                  faceIdActive
                    ? 'bg-[var(--vp-green)] text-[var(--vp-white-text)] voxel-shadow-sm'
                    : 'bg-[var(--vp-ink)] text-[var(--vp-white-text)] voxel-shadow-saffron'
                }`}
              >
                {faceIdActive ? 'ACTIVE' : 'SETUP'}
              </button>
            </div>
          </div>
        </section>

        {/* Passkeys */}
        <section className="bg-[var(--vp-cream)] border-2 border-[var(--vp-ink)] voxel-shadow p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b-2 border-[var(--vp-ink)] pb-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[var(--vp-ink-text)] text-2xl">
                key
              </span>
              <h3 className="text-xl font-bold text-[var(--vp-ink-text)]">PASSKEYS</h3>
            </div>
            <span className="font-pixel text-[17px] text-[var(--vp-ink-text)] font-bold">2 ACTIVE</span>
          </div>

          <div className="flex flex-col gap-3">
            <div className="border-l-4 border-[var(--vp-ink)] pl-4 flex flex-col gap-0.5">
              <span className="text-[16px] text-[var(--vp-ink-text)] font-bold">
                iPhone 14 Pro Max
              </span>
              <span className="font-pixel text-[14px] text-[var(--vp-outline)]">
                LAST USED: 2023-10-27 14:32:01 UTC
              </span>
            </div>

            <div className="border-l-4 border-[var(--vp-ink)] pl-4 flex flex-col gap-0.5">
              <span className="text-[16px] text-[var(--vp-ink-text)] font-bold">MacBook Air M2</span>
              <span className="font-pixel text-[14px] text-[var(--vp-outline)]">
                LAST USED: 2023-10-25 09:15:44 UTC
              </span>
            </div>
          </div>

          <button
            type="button"
            className="w-full bg-[var(--vp-ink)] text-[var(--vp-white-text)] font-pixel text-[19px] py-3 border-2 border-[var(--vp-ink)] voxel-shadow-saffron voxel-btn-active flex justify-center items-center gap-2 mt-2 uppercase tracking-widest cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            CREATE NEW PASSKEY
          </button>
        </section>

        {/* Two-Factor Auth */}
        <section className="bg-[var(--vp-cream)] border-2 border-[var(--vp-ink)] voxel-shadow p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[var(--vp-ink-text)] text-2xl">
              phonelink_lock
            </span>
            <div className="flex flex-col">
              <h3 className="text-lg sm:text-xl font-bold text-[var(--vp-ink-text)]">
                TWO-FACTOR AUTH
              </h3>
              <span className="font-pixel text-[14px] text-[var(--vp-outline)]">
                SMS / EMAIL VERIFICATION
              </span>
            </div>
          </div>

          {/* Brutalist Toggle */}
          <button
            type="button"
            onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
            className={`relative inline-block w-16 h-8 border-2 border-[var(--vp-ink)] cursor-pointer transition-colors ${
              twoFactorEnabled ? 'bg-[var(--vp-green)]' : 'bg-[var(--vp-container-highest)]'
            }`}
          >
            <div
              className={`absolute top-0 w-7 h-7 bg-[var(--vp-cream)] border-2 border-[var(--vp-ink)] transition-all ${
                twoFactorEnabled ? 'right-0 border-l-2' : 'left-0 border-r-2'
              }`}
            />
          </button>
        </section>

        {/* Recovery Keys */}
        <section className="bg-[var(--vp-cream)] border-2 border-[var(--vp-magenta)] shadow-[4px_4px_0px_0px_var(--vp-magenta)] p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b-2 border-[var(--vp-magenta)] pb-3">
            <span className="material-symbols-outlined text-[var(--vp-magenta-text)] text-2xl">
              warning
            </span>
            <h3 className="text-xl font-bold text-[var(--vp-magenta-text)]">RECOVERY KEYS</h3>
          </div>

          <p className="text-[15px] text-[var(--vp-muted)]">
            Store these codes in a secure location. They are the only way to recover access if
            you lose your primary authentication methods.
          </p>

          {generatedCode && (
            <div className="p-3 bg-[var(--vp-error-container)] border-2 border-[var(--vp-magenta)] font-pixel text-[20px] text-[var(--vp-error)] font-bold tracking-widest text-center">
              {generatedCode}
            </div>
          )}

          <button
            type="button"
            onClick={handleGenerateRecovery}
            className="self-start bg-[var(--vp-cream)] text-[var(--vp-magenta-text)] font-pixel text-[18px] py-2.5 px-5 border-2 border-[var(--vp-magenta)] shadow-[4px_4px_0px_0px_var(--vp-magenta)] hover:bg-[var(--vp-magenta)] hover:text-[var(--vp-white-text)] voxel-btn-active transition-all flex justify-center items-center gap-2 uppercase cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            GENERATE NEW RECOVERY CODE
          </button>
        </section>
      </main>

      {/* Nav with <a> matching xpath: body/nav[1]/a[1], a[2], a[3], a[4] */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-3 bg-[var(--vp-cream)] border-t-4 border-[var(--vp-ink)] shadow-[0px_-4px_0px_0px_rgba(1,7,102,1)] md:hidden">
        <a
          href="#scan"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('scan', 'none');
          }}
          className="flex flex-col items-center justify-center text-[var(--vp-muted)] p-1 hover:bg-[var(--vp-container)] active:scale-95 transition-transform w-16"
        >
          <span className="material-symbols-outlined text-2xl">qr_code_scanner</span>
          <span className="font-pixel text-[13px] uppercase mt-1">Scan</span>
        </a>

        <a
          href="#vault"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('inventory', 'none');
          }}
          className="flex flex-col items-center justify-center text-[var(--vp-muted)] p-1 hover:bg-[var(--vp-container)] active:scale-95 transition-transform w-16"
        >
          <span className="material-symbols-outlined text-2xl">inventory_2</span>
          <span className="font-pixel text-[13px] uppercase mt-1">Vault</span>
        </a>

        <a
          href="#history"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('history', 'none');
          }}
          className="flex flex-col items-center justify-center text-[var(--vp-muted)] p-1 hover:bg-[var(--vp-container)] active:scale-95 transition-transform w-16"
        >
          <span className="material-symbols-outlined text-2xl">history</span>
          <span className="font-pixel text-[13px] uppercase mt-1">History</span>
        </a>

        <a
          href="#profile"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('account', 'none');
          }}
          className="flex flex-col items-center justify-center bg-[var(--vp-saffron)] text-[var(--vp-black-text)] border-2 border-[var(--vp-ink)] p-1 active:scale-95 transition-transform w-16 font-bold voxel-shadow-sm"
        >
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            account_circle
          </span>
          <span className="font-pixel text-[13px] uppercase mt-1">Profile</span>
        </a>
      </nav>
    </div>
  );
};
