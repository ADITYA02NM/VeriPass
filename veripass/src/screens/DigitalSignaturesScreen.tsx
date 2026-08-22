import React, { useState } from 'react';
import { ScreenType } from '../types';
import { TopAppBar } from '../components/TopAppBar';

interface DigitalSignaturesScreenProps {
  onNavigate: (screen: ScreenType, transition?: 'push' | 'push_back' | 'none') => void;
}

export const DigitalSignaturesScreen: React.FC<DigitalSignaturesScreenProps> = ({ onNavigate }) => {
  const [keys, setKeys] = useState([
    {
      id: 'VRP-KEY-882',
      created: '2023-10-24',
      type: 'ROOT KEY',
      status: 'active',
    },
    {
      id: 'VRP-KEY-451',
      created: '2023-05-12',
      type: 'SESSION KEY',
      status: 'revoked',
    },
  ]);

  const [notification, setNotification] = useState<string | null>(null);

  const handleGenerateKey = () => {
    const newKeyId = `VRP-KEY-${Math.floor(100 + Math.random() * 900)}`;
    setKeys([
      {
        id: newKeyId,
        created: new Date().toISOString().split('T')[0],
        type: 'SESSION KEY',
        status: 'active',
      },
      ...keys,
    ]);
    setNotification(`Generated Key Pair: ${newKeyId}`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleRevokeAll = () => {
    setKeys(
      keys.map((k) => ({
        ...k,
        status: 'revoked',
      }))
    );
    setNotification('All active cryptographic keys revoked.');
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="bg-[var(--vp-cream)] text-[var(--vp-on-surface)] font-['Inter'] min-h-screen pb-28 pt-16 flex flex-col">
      <TopAppBar currentScreen="digital-signatures" onNavigate={onNavigate} title="SIGNATURES" />

      <main className="max-w-4xl mx-auto w-full px-4 md:px-8 py-6 space-y-6">
        {notification && (
          <div className="p-3 bg-[var(--vp-green)] text-[var(--vp-white-text)] font-pixel text-[17px] border-2 border-[var(--vp-ink)] voxel-shadow-sm flex items-center justify-between">
            <span>{notification}</span>
            <button onClick={() => setNotification(null)} className="font-bold">✕</button>
          </div>
        )}

        {/* 1. Active Signature Status */}
        <section className="bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] voxel-shadow p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[var(--vp-ink-text)] mb-2 tracking-tight">
              Signature Status
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 bg-[var(--vp-green)] border-2 border-[var(--vp-ink)]" />
              <span className="font-pixel text-[18px] text-[var(--vp-green-text)] tracking-widest uppercase font-bold">
                STATUS: VALID
              </span>
            </div>
          </div>

          <div className="bg-[var(--vp-container)] border-2 border-[var(--vp-ink)] p-3 flex flex-col">
            <span className="font-pixel text-[13px] text-[var(--vp-muted)] uppercase mb-0.5">
              ACTIVE CERTIFICATE ID
            </span>
            <span className="font-pixel text-[20px] text-[var(--vp-ink-text)] tracking-widest font-bold">
              CERT-8902-XJ9
            </span>
          </div>
        </section>

        {/* 2 & 3: Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* 2. Cryptographic Keys (Left Column) */}
          <section className="md:col-span-7 space-y-4">
            <h2 className="text-xl font-bold text-[var(--vp-ink-text)] border-b-2 border-[var(--vp-ink)] pb-2 inline-block">
              Cryptographic Keys
            </h2>

            <div className="space-y-3">
              {keys.map((key) => {
                const isActive = key.status === 'active';
                return (
                  <div
                    key={key.id}
                    className={`bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isActive ? 'voxel-shadow' : 'opacity-70 bg-[var(--vp-container)]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`material-symbols-outlined text-2xl ${
                          isActive ? 'text-[var(--vp-ink-text)]' : 'text-[var(--vp-outline)]'
                        }`}
                      >
                        {isActive ? 'key' : 'key_off'}
                      </span>
                      <div>
                        <div className="font-pixel text-[18px] text-[var(--vp-ink-text)] tracking-widest font-bold">
                          {key.id}
                        </div>
                        <div className="font-pixel text-[13px] text-[var(--vp-muted)] uppercase">
                          {isActive ? 'CREATED' : 'REVOKED'}: {key.created} | {key.type}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!isActive}
                      className={`px-4 py-2 font-pixel text-[16px] uppercase tracking-widest border-2 transition-all ${
                        isActive
                          ? 'bg-[var(--vp-cream)] text-[var(--vp-ink-text)] border-[var(--vp-ink)] voxel-shadow-sm voxel-btn-active cursor-pointer'
                          : 'bg-[var(--vp-container-highest)] text-[var(--vp-outline)] border-[var(--vp-outline)] cursor-not-allowed'
                      }`}
                    >
                      {isActive ? 'VIEW DETAILS' : 'ARCHIVED'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 3. Actions (Right Column) */}
          <section className="md:col-span-5 space-y-4">
            <h2 className="text-xl font-bold text-[var(--vp-ink-text)] border-b-2 border-[var(--vp-ink)] pb-2 inline-block">
              Key Operations
            </h2>

            <div className="bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] voxel-shadow p-5 flex flex-col gap-5">
              <div className="space-y-3">
                <p className="text-[14px] text-[var(--vp-muted)]">
                  Generate a new cryptographic key pair to secure your digital passport transactions.
                </p>
                <button
                  type="button"
                  onClick={handleGenerateKey}
                  className="w-full bg-[var(--vp-ink)] text-[var(--vp-cream-text)] font-pixel text-[18px] uppercase tracking-widest py-3 border-2 border-[var(--vp-ink)] voxel-shadow-saffron voxel-btn-active flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <span className="material-symbols-outlined text-xl">add_box</span>
                  GENERATE NEW KEY PAIR
                </button>
              </div>

              <div className="border-t-2 border-[var(--vp-outline-variant)] pt-4 space-y-2">
                <p className="font-pixel text-[13px] text-[var(--vp-error)] uppercase tracking-widest font-bold">
                  DANGER ZONE
                </p>
                <button
                  type="button"
                  onClick={handleRevokeAll}
                  className="w-full bg-[var(--vp-magenta)] text-[var(--vp-white-text)] font-pixel text-[18px] uppercase tracking-widest py-2.5 border-2 border-[var(--vp-ink)] voxel-shadow voxel-btn-active flex items-center justify-center gap-2 hover:bg-[#ba1a1a] cursor-pointer transition-all"
                >
                  <span className="material-symbols-outlined text-xl">warning</span>
                  REVOKE ALL KEYS
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* 4. Documentation */}
        <section className="bg-[var(--vp-container)] border-2 border-[var(--vp-ink)] p-5 mt-6">
          <h2 className="text-2xl font-bold text-[var(--vp-ink-text)] mb-4">Documentation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setNotification('Viewing Digital Custody Regulations compliance doc.')}
              className="bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] p-4 flex items-center justify-between voxel-shadow-sm voxel-btn-active hover:border-[var(--vp-saffron)] transition-colors cursor-pointer"
            >
              <div className="flex flex-col">
                <span className="font-pixel text-[18px] text-[var(--vp-ink-text)] uppercase tracking-widest font-bold">
                  DIGITAL CUSTODY LAWS
                </span>
                <span className="font-pixel text-[13px] text-[var(--vp-muted)]">
                  Review regulatory compliance
                </span>
              </div>
              <span className="material-symbols-outlined text-[var(--vp-ink-text)]">arrow_forward</span>
            </div>

            <div
              onClick={() => setNotification('Viewing Key Revocation Policy.')}
              className="bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] p-4 flex items-center justify-between voxel-shadow-sm voxel-btn-active hover:border-[var(--vp-saffron)] transition-colors cursor-pointer"
            >
              <div className="flex flex-col">
                <span className="font-pixel text-[18px] text-[var(--vp-ink-text)] uppercase tracking-widest font-bold">
                  REVOCATION POLICY
                </span>
                <span className="font-pixel text-[13px] text-[var(--vp-muted)]">
                  Understand key invalidation
                </span>
              </div>
              <span className="material-symbols-outlined text-[var(--vp-ink-text)]">arrow_forward</span>
            </div>
          </div>
        </section>
      </main>

      {/* Nav with <a> matching xpath: body/nav[1]/a[1], a[2], a[3] */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-3 bg-[var(--vp-cream)] border-t-4 border-[var(--vp-ink)] shadow-[0px_-4px_0px_0px_rgba(1,7,102,1)] md:hidden">
        {/* a[1] -> Scan */}
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

        {/* a[2] -> Inventory / Vault */}
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

        {/* a[3] -> History */}
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

        {/* a[4] -> Profile */}
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
