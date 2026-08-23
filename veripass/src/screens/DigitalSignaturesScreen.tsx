import React, { useState, useEffect } from 'react';
import { ScreenType } from '../types';
import { TopAppBar } from '../components/TopAppBar';
import { UserInfo, getSignatures, createSignature, signData, revokeSignature, DigitalSignature } from '../lib/api';

interface DigitalSignaturesScreenProps {
  onNavigate: (screen: ScreenType, transition?: 'push' | 'push_back' | 'none') => void;
  user: UserInfo | null;
}

export const DigitalSignaturesScreen: React.FC<DigitalSignaturesScreenProps> = ({ onNavigate, user }) => {
  const [signatures, setSignatures] = useState<DigitalSignature[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [signDataInput, setSignDataInput] = useState('');
  const [signTargetId, setSignTargetId] = useState<number | null>(null);
  const [signatureResult, setSignatureResult] = useState<string | null>(null);

  // Only show for non-User roles
  const isUser = user?.role === 'User';

  useEffect(() => {
    if (!isUser) fetchSignatures();
  }, [isUser]);

  const fetchSignatures = async () => {
    setLoading(true);
    try {
      const { signatures: sigs } = await getSignatures();
      setSignatures(sigs);
    } catch (err: any) {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    const label = newLabel.trim() || `SIG-${Date.now().toString(36).toUpperCase()}`;
    setLoading(true);
    try {
      await createSignature(label);
      setNewLabel('');
      setNotification(`Key pair created: ${label}`);
      setTimeout(() => setNotification(null), 3000);
      await fetchSignatures();
    } catch (err: any) {
      setNotification(err.message || 'Failed to create key');
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async (sigId: number) => {
    if (!signDataInput.trim()) { setNotification('Enter data to sign'); setTimeout(() => setNotification(null), 2000); return; }
    setLoading(true);
    try {
      const res = await signData(sigId, signDataInput);
      setSignatureResult(res.signature);
      setNotification('Data signed successfully!');
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      setNotification(err.message || 'Signing failed');
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (sigId: number) => {
    if (!window.confirm('Revoke this signature key? This cannot be undone.')) return;
    setLoading(true);
    try {
      await revokeSignature(sigId);
      setNotification('Key revoked');
      setTimeout(() => setNotification(null), 3000);
      await fetchSignatures();
    } catch (err: any) {
      setNotification(err.message || 'Revoke failed');
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // If User role, show access denied
  if (isUser) {
    return (
      <div className="bg-[var(--vp-cream)] text-[var(--vp-on-surface)] font-['Inter'] min-h-screen pb-28 pt-16 flex flex-col">
        <TopAppBar currentScreen="digital-signatures" onNavigate={onNavigate} title="SIGNATURES" />
        <main className="max-w-4xl mx-auto w-full px-4 md:px-8 py-6 flex flex-col items-center justify-center gap-6">
          <div className="bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] voxel-shadow p-8 text-center">
            <span className="material-symbols-outlined text-6xl text-[var(--vp-outline)] mb-4 block">block</span>
            <h2 className="text-2xl font-bold text-[var(--vp-ink-text)] mb-2">ACCESS RESTRICTED</h2>
            <p className="text-[16px] text-[var(--vp-muted)] mb-4">
              Digital signatures are available for Producer, Logistics, and Retailer accounts only.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('account', 'push_back')}
              className="bg-[var(--vp-ink)] text-[var(--vp-white-text)] font-pixel text-[17px] py-2.5 px-5 border-2 border-[var(--vp-ink)] voxel-shadow-saffron voxel-btn-active uppercase tracking-widest cursor-pointer"
            >
              BACK TO ACCOUNT
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-[var(--vp-cream)] text-[var(--vp-on-surface)] font-['Inter'] min-h-screen pb-28 pt-16 flex flex-col">
      <TopAppBar currentScreen="digital-signatures" onNavigate={onNavigate} title="SIGNATURES" />

      <main className="max-w-4xl mx-auto w-full px-4 md:px-8 py-6 space-y-6">
        {notification && (
          <div className={`p-3 font-pixel text-[17px] border-2 voxel-shadow-sm flex items-center justify-between ${
            notification.includes('created') || notification.includes('signed') || notification.includes('revoked')
              ? 'bg-[var(--vp-green)] text-[var(--vp-white-text)] border-[var(--vp-ink)]'
              : 'bg-[var(--vp-error-container)] text-[var(--vp-error)] border-[var(--vp-magenta)]'
          }`}>
            <span>{notification}</span>
            <button onClick={() => setNotification(null)} className="font-bold">✕</button>
          </div>
        )}

        {/* Signature Status */}
        <section className="bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] voxel-shadow p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[var(--vp-ink-text)] mb-2 tracking-tight">
              Digital Signatures
            </h2>
            <div className="flex items-center gap-2">
              <div className={`w-3.5 h-3.5 border-2 border-[var(--vp-ink)] ${signatures.some(s => s.status === 'active') ? 'bg-[var(--vp-green)]' : 'bg-[var(--vp-outline)]'}`} />
              <span className={`font-pixel text-[18px] tracking-widest uppercase font-bold ${signatures.some(s => s.status === 'active') ? 'text-[var(--vp-green-text)]' : 'text-[var(--vp-outline)]'}`}>
                {signatures.some(s => s.status === 'active') ? 'STATUS: ACTIVE KEYS' : 'STATUS: NO ACTIVE KEYS'}
              </span>
            </div>
          </div>
          <div className="bg-[var(--vp-container)] border-2 border-[var(--vp-ink)] p-3 flex flex-col">
            <span className="font-pixel text-[13px] text-[var(--vp-muted)] uppercase mb-0.5">TOTAL KEYS</span>
            <span className="font-pixel text-[20px] text-[var(--vp-ink-text)] tracking-widest font-bold">{signatures.length}</span>
          </div>
        </section>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column — Keys */}
          <section className="md:col-span-7 space-y-4">
            <h2 className="text-xl font-bold text-[var(--vp-ink-text)] border-b-2 border-[var(--vp-ink)] pb-2 inline-block">
              Cryptographic Keys
            </h2>

            {loading && signatures.length === 0 && (
              <div className="p-4 text-center font-pixel text-[var(--vp-muted)]">LOADING KEYS...</div>
            )}

            {!loading && signatures.length === 0 && (
              <div className="p-6 text-center font-pixel text-[var(--vp-muted)] border-2 border-dashed border-[var(--vp-outline)]">
                NO KEYS YET. Generate your first key pair to get started.
              </div>
            )}

            <div className="space-y-3">
              {signatures.map((sig) => {
                const isActive = sig.status === 'active';
                return (
                  <div
                    key={sig.id}
                    className={`bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isActive ? 'voxel-shadow' : 'opacity-70 bg-[var(--vp-container)]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`material-symbols-outlined text-2xl ${isActive ? 'text-[var(--vp-ink-text)]' : 'text-[var(--vp-outline)]'}`}>
                        {isActive ? 'key' : 'key_off'}
                      </span>
                      <div>
                        <div className="font-pixel text-[18px] text-[var(--vp-ink-text)] tracking-widest font-bold">
                          {sig.label}
                        </div>
                        <div className="font-pixel text-[13px] text-[var(--vp-muted)] uppercase">
                          {isActive ? 'ACTIVE' : 'REVOKED'} | {sig.pub_key?.slice(0, 16)}...
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {isActive && (
                        <button
                          type="button"
                          onClick={() => setSignTargetId(signTargetId === sig.id ? null : sig.id)}
                          className="px-3 py-1 font-pixel text-[14px] uppercase tracking-widest border-2 bg-[var(--vp-cream)] text-[var(--vp-ink-text)] border-[var(--vp-ink)] voxel-shadow-sm voxel-btn-active cursor-pointer transition-all"
                        >
                          SIGN
                        </button>
                      )}
                      {isActive && (
                        <button
                          type="button"
                          onClick={() => handleRevoke(sig.id)}
                          disabled={loading}
                          className="px-3 py-1 font-pixel text-[14px] uppercase tracking-widest border-2 bg-[var(--vp-magenta)] text-[var(--vp-white-text)] border-[var(--vp-ink)] voxel-btn-active cursor-pointer transition-all hover:bg-[#ba1a1a] disabled:opacity-50"
                        >
                          REVOKE
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Right Column — Actions */}
          <section className="md:col-span-5 space-y-4">
            <h2 className="text-xl font-bold text-[var(--vp-ink-text)] border-b-2 border-[var(--vp-ink)] pb-2 inline-block">
              Key Operations
            </h2>

            <div className="bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] voxel-shadow p-5 flex flex-col gap-5">
              {/* Generate new key */}
              <div className="space-y-3">
                <p className="text-[14px] text-[var(--vp-muted)]">
                  Generate a new ed25519 key pair to sign documents and transactions.
                </p>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="KEY LABEL (optional)"
                  className="w-full p-2.5 font-pixel text-[16px] bg-[var(--vp-cream)] border-2 border-[var(--vp-ink)] focus:outline-none focus:border-[var(--vp-cyan)] transition-all"
                />
                <button
                  type="button"
                  onClick={handleCreateKey}
                  disabled={loading}
                  className="w-full bg-[var(--vp-ink)] text-[var(--vp-cream-text)] font-pixel text-[18px] uppercase tracking-widest py-3 border-2 border-[var(--vp-ink)] voxel-shadow-saffron voxel-btn-active flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-xl">add_box</span>
                  {loading ? 'GENERATING...' : 'GENERATE NEW KEY PAIR'}
                </button>
              </div>

              {/* Sign data */}
              {signTargetId && (
                <div className="border-t-2 border-[var(--vp-outline-variant)] pt-4 space-y-3">
                  <p className="font-pixel text-[13px] text-[var(--vp-ink-text)] uppercase tracking-widest font-bold">
                    SIGN DATA
                  </p>
                  <textarea
                    value={signDataInput}
                    onChange={(e) => setSignDataInput(e.target.value)}
                    placeholder="Enter data to sign..."
                    rows={3}
                    className="w-full p-2.5 font-pixel text-[15px] bg-[var(--vp-cream)] border-2 border-[var(--vp-ink)] focus:outline-none focus:border-[var(--vp-cyan)] transition-all resize-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleSign(signTargetId)}
                    disabled={loading || !signDataInput.trim()}
                    className="w-full bg-[var(--vp-green)] text-[var(--vp-white-text)] font-pixel text-[17px] uppercase tracking-widest py-2.5 border-2 border-[var(--vp-ink)] voxel-shadow-sm voxel-btn-active flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-lg">edit_note</span>
                    {loading ? 'SIGNING...' : 'SIGN DATA'}
                  </button>

                  {signatureResult && (
                    <div className="p-3 bg-[var(--vp-container-low)] border-2 border-[var(--vp-ink)] font-pixel text-[13px] text-[var(--vp-ink-text)] break-all">
                      SIGNATURE: {signatureResult}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-3 bg-[var(--vp-cream)] border-t-4 border-[var(--vp-ink)] shadow-[0px_-4px_0px_0px_rgba(1,7,102,1)] md:hidden">
        <button onClick={() => onNavigate('scan', 'none')} className="flex flex-col items-center justify-center text-[var(--vp-muted)] p-1 hover:bg-[var(--vp-container)] active:scale-95 transition-transform w-16 cursor-pointer">
          <span className="material-symbols-outlined text-2xl">qr_code_scanner</span>
          <span className="font-pixel text-[13px] uppercase mt-1">Scan</span>
        </button>
        <button onClick={() => onNavigate('inventory', 'none')} className="flex flex-col items-center justify-center text-[var(--vp-muted)] p-1 hover:bg-[var(--vp-container)] active:scale-95 transition-transform w-16 cursor-pointer">
          <span className="material-symbols-outlined text-2xl">inventory_2</span>
          <span className="font-pixel text-[13px] uppercase mt-1">Vault</span>
        </button>
        <button onClick={() => onNavigate('history', 'none')} className="flex flex-col items-center justify-center text-[var(--vp-muted)] p-1 hover:bg-[var(--vp-container)] active:scale-95 transition-transform w-16 cursor-pointer">
          <span className="material-symbols-outlined text-2xl">history</span>
          <span className="font-pixel text-[13px] uppercase mt-1">History</span>
        </button>
        <button onClick={() => onNavigate('account', 'none')} className="flex flex-col items-center justify-center bg-[var(--vp-saffron)] text-[var(--vp-black-text)] border-2 border-[var(--vp-ink)] p-1 active:scale-95 transition-transform w-16 font-bold voxel-shadow-sm cursor-pointer">
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
          <span className="font-pixel text-[13px] uppercase mt-1">Profile</span>
        </button>
      </nav>
    </div>
  );
};
