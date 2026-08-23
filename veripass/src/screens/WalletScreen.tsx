import React, { useEffect, useState } from 'react';
import { ScreenType } from '../types';
import { TopAppBar } from '../components/TopAppBar';
import { BottomNavBar } from '../components/BottomNavBar';
import {
  getPayments, getSpending, setSpendingLimit,
  PaymentRecord, SpendingInfo, ApiError,
} from '../lib/api';

interface WalletScreenProps {
  onNavigate: (screen: ScreenType, transition?: 'push' | 'push_back' | 'none') => void;
}

/**
 * Wallet & Billing — shows per-user wallet address, spending limit,
 * payment history with lora.algorand tx links, and receipts.
 */
export const WalletScreen: React.FC<WalletScreenProps> = ({ onNavigate }) => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [spending, setSpending] = useState<SpendingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLimit, setSelectedLimit] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const LIMIT_OPTIONS = [9, 15, 25, 35, 50, 75, 99];

  useEffect(() => {
    Promise.all([getPayments(), getSpending()])
      .then(([p, s]) => { setPayments(p.payments); setSpending(s); })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load wallet data'))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveLimit = async () => {
    const val = selectedLimit === null ? 99 : selectedLimit;
    setSaving(true);
    try {
      const res = await setSpendingLimit(val);
      setSpending((s) => s ? { ...s, spendLimit: res.spendLimit, remaining: Math.max(0, res.spendLimit - s.totalSpent) } : s);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[var(--vp-surface)] min-h-screen flex flex-col pt-16 pb-24">
      <TopAppBar currentScreen="wallet" onNavigate={onNavigate} />
      <main className="w-full max-w-2xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--vp-ink-text)]">Wallet</h1>
          <p className="font-pixel text-[17px] text-[var(--vp-muted)] uppercase tracking-widest mt-1">
            Payment history · Spending limit · Algorand receipts
          </p>
        </div>

        {loading && (
          <div className="border-2 border-[var(--vp-ink)] bg-[var(--vp-white)] p-10 text-center voxel-shadow-sm">
            <span className="material-symbols-outlined text-5xl text-[var(--vp-outline)] animate-pulse">hourglass_top</span>
            <p className="font-pixel text-[17px] text-[var(--vp-ink-text)] mt-3 uppercase tracking-wider">LOADING...</p>
          </div>
        )}

        {error && (
          <div className="bg-[var(--vp-error-container)]/60 border-2 border-[var(--vp-magenta)] px-4 py-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--vp-magenta-text)]">error</span>
            <p className="font-pixel text-[16px] text-[var(--vp-error)] uppercase">{error}</p>
          </div>
        )}

        {/* Wallet Address + Spending */}
        {!loading && spending && (
          <section className="bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] p-5 voxel-shadow">
            <h2 className="font-pixel text-[18px] text-[var(--vp-ink-text)] uppercase tracking-wider mb-4">
              Wallet Details
            </h2>
            {spending.walletAddress && (
              <div className="border-l-4 border-[var(--vp-ink)] pl-3 mb-3">
                <p className="font-pixel text-[14px] text-[var(--vp-outline)] uppercase">Wallet Address</p>
                <p className="font-pixel text-[13px] text-[var(--vp-on-surface)] break-all">{spending.walletAddress}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="border-l-4 border-[var(--vp-saffron)] pl-3">
                <p className="font-pixel text-[14px] text-[var(--vp-outline)] uppercase">Total Spent</p>
                <p className="text-[17px] font-bold text-[var(--vp-on-surface)]">{spending.totalSpent.toFixed(4)} ALGO</p>
              </div>
              <div className="border-l-4 border-[var(--vp-green)] pl-3">
                <p className="font-pixel text-[14px] text-[var(--vp-outline)] uppercase">Remaining</p>
                <p className="text-[17px] font-bold text-[var(--vp-on-surface)]">{spending.remaining.toFixed(4)} ALGO</p>
              </div>
            </div>

            {/* Spending Limit */}
            <div className="border-t-2 border-[var(--vp-ink)]/20 pt-3">
              <p className="font-pixel text-[14px] text-[var(--vp-outline)] uppercase mb-2">
                AI Spending Limit: {spending.spendLimit} ALGO
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {LIMIT_OPTIONS.map((v) => (
                  <button
                    key={v}
                    onClick={() => setSelectedLimit(v)}
                    className={`font-pixel text-[13px] uppercase tracking-wider border-2 border-[var(--vp-ink)] px-3 py-1.5 transition-all cursor-pointer ${
                      selectedLimit === v
                        ? 'bg-[var(--vp-ink)] text-[var(--vp-cream-text)]'
                        : 'bg-[var(--vp-cream)] text-[var(--vp-ink-text)] hover:bg-[var(--vp-container-high)]'
                    }`}
                  >
                    {v} ALGO
                  </button>
                ))}
                <button
                  onClick={() => setSelectedLimit(null)}
                  className={`font-pixel text-[13px] uppercase tracking-wider border-2 border-[var(--vp-ink)] px-3 py-1.5 transition-all cursor-pointer ${
                    selectedLimit === null
                      ? 'bg-[var(--vp-ink)] text-[var(--vp-cream-text)]'
                      : 'bg-[var(--vp-cream)] text-[var(--vp-ink-text)] hover:bg-[var(--vp-container-high)]'
                  }`}
                >
                  No Limit
                </button>
              </div>
              <button
                onClick={handleSaveLimit}
                disabled={saving}
                className="bg-[var(--vp-ink)] text-[var(--vp-cream-text)] font-pixel text-[14px] px-4 py-2 border-2 border-[var(--vp-ink)] voxel-shadow-sm hover:bg-[var(--vp-saffron)] hover:text-[var(--vp-ink-text)] disabled:opacity-50 transition-all cursor-pointer"
              >
                {saving ? '...' : 'SET LIMIT'}
              </button>
            </div>
          </section>
        )}

        {/* Payment History */}
        {!loading && (
          <section className="bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] p-5 voxel-shadow">
            <h2 className="font-pixel text-[18px] text-[var(--vp-ink-text)] uppercase tracking-wider mb-4">
              Payment History ({payments.length})
            </h2>
            {payments.length === 0 ? (
              <p className="text-[15px] text-[var(--vp-muted)]">No payments yet. Scan a product or use AI to make your first x402 payment.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {payments.map((p, i) => (
                  <div key={i} className="border-l-4 border-[var(--vp-saffron)] pl-3 py-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="font-pixel text-[14px] text-[var(--vp-ink-text)] uppercase">
                        {p.amount} ALGO
                      </p>
                      <span className="font-pixel text-[12px] text-[var(--vp-muted)]">{p.createdAt}</span>
                    </div>
                    <p className="font-pixel text-[12px] text-[var(--vp-outline)] break-all mt-1">
                      TX: {p.txid}
                    </p>
                    {p.loraUrl && (
                      <a
                        href={p.loraUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-pixel text-[12px] text-[var(--vp-cyan-text)] underline mt-1 inline-flex items-center gap-1 hover:text-[var(--vp-saffron-text)]"
                      >
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                        View on Lora (TestNet)
                      </a>
                    )}
                    <div className="flex gap-4 mt-1">
                      <span className="font-pixel text-[11px] text-[var(--vp-outline)]">Network: {p.network}</span>
                      {p.round && <span className="font-pixel text-[11px] text-[var(--vp-outline)]">Round: {p.round}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Fund link */}
        <section className="bg-[var(--vp-ink)] text-[var(--vp-cream-text)] border-2 border-[var(--vp-ink)] p-4 voxel-shadow">
          <p className="font-pixel text-[14px] uppercase tracking-wider mb-2">
            Fund your wallet on Algorand TestNet
          </p>
          <a
            href="https://lora.algokit.io/testnet/fund"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-pixel text-[14px] text-[var(--vp-cyan)] underline hover:text-[var(--vp-saffron)]"
          >
            <span className="material-symbols-outlined text-sm">open_in_new</span>
            Lora TestNet Faucet
          </a>
        </section>
      </main>
      <BottomNavBar currentScreen="wallet" onNavigate={onNavigate} />
    </div>
  );
};
