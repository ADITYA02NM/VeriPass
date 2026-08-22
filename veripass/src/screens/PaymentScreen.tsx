import React, { useState } from 'react';
import { ScreenType } from '../types';
import { TopAppBar } from '../components/TopAppBar';
import { BottomNavBar } from '../components/BottomNavBar';
import { payX402, PayResult, ApiError } from '../lib/api';

interface PaymentScreenProps {
  onNavigate: (screen: ScreenType, transition?: 'push' | 'push_back' | 'none') => void;
  code: string | null;
  onPaid: (signature: string) => void;
}

/**
 * x402 Payment Page — Algorand micropayment checkout.
 * Shown when the free tier (3 verifies) is exhausted: the scan screen routes
 * here, the user pays 0.001 ALGO on Algorand (TestNet when funded, simulated
 * ledger otherwise), and the one-time X-Pay-Signature proof unlocks the report.
 */
export const PaymentScreen: React.FC<PaymentScreenProps> = ({ onNavigate, code, onPaid }) => {
  const [paying, setPaying] = useState(false);
  const [tx, setTx] = useState<PayResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    setPaying(true);
    setError(null);
    try {
      const result = await payX402();
      setTx(result);
      // brief confirmation beat, then hand the proof back to the scan screen
      setTimeout(() => {
        onPaid(result.xPaySignature);
        onNavigate('scan', 'push_back');
      }, 1400);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'PAYMENT NOT SUCCESSFUL — TRY AGAIN');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="bg-[var(--vp-surface)] min-h-screen flex flex-col pt-16 pb-24">
      <TopAppBar currentScreen="payment" onNavigate={onNavigate} />
      <main className="w-full max-w-2xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-6">
        {/* ============ Header ============ */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--vp-ink-text)]">x402 Payment</h1>
          <p className="font-pixel text-[17px] text-[var(--vp-muted)] uppercase tracking-widest mt-1">
            Algorand micropayment · unlock this verification report
          </p>
        </div>

        {/* ============ Invoice card ============ */}
        <section className="bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] p-5 sm:p-6 voxel-shadow">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-pixel text-[18px] text-[var(--vp-ink-text)] uppercase tracking-wider">
              Payment Invoice
            </h2>
            <span className="bg-[var(--vp-ink)] text-[var(--vp-cyan)] font-pixel text-[14px] px-3 py-1 border-2 border-[var(--vp-ink)] voxel-shadow-sm uppercase">
              x402 · Algorand
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <div className="border-l-4 border-[var(--vp-ink)] pl-3">
              <p className="font-pixel text-[14px] text-[var(--vp-outline)] uppercase">Product Code</p>
              <p className="text-[17px] font-bold text-[var(--vp-on-surface)] break-all">{code ?? '—'}</p>
            </div>
            <div className="border-l-4 border-[var(--vp-ink)] pl-3">
              <p className="font-pixel text-[14px] text-[var(--vp-outline)] uppercase">Amount</p>
              <p className="text-[17px] font-bold text-[var(--vp-on-surface)]">
                0.001 ALGO <span className="font-pixel text-[13px] text-[var(--vp-outline)]">(1,000 microAlgos)</span>
              </p>
            </div>
            <div className="border-l-4 border-[var(--vp-ink)] pl-3">
              <p className="font-pixel text-[14px] text-[var(--vp-outline)] uppercase">Network</p>
              <p className="text-[17px] font-bold text-[var(--vp-on-surface)]">
                Algorand <span className="font-pixel text-[13px] text-[var(--vp-saffron-text)]">(TestNet when funded · sim fallback)</span>
              </p>
            </div>
            <div className="border-l-4 border-[var(--vp-ink)] pl-3">
              <p className="font-pixel text-[14px] text-[var(--vp-outline)] uppercase">Receiver</p>
              <p className="font-pixel text-[15px] text-[var(--vp-muted)] break-all">
                QXEMYGSAHRJPLX3XPNRNPFNDPKTMAWKDDNZSOG7HICAJTK5AB636DZD6JI
              </p>
            </div>
            <div className="border-l-4 border-[var(--vp-ink)] pl-3">
              <p className="font-pixel text-[14px] text-[var(--vp-outline)] uppercase">Description</p>
              <p className="text-[17px] font-bold text-[var(--vp-on-surface)]">
                VeriPass product verification report (x402 · Algorand)
              </p>
            </div>
          </div>
        </section>

        {/* ============ Error ============ */}
        {error && (
          <div className="bg-[var(--vp-error-container)]/60 border-2 border-[var(--vp-magenta)] px-4 py-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--vp-magenta-text)]">error</span>
            <p className="font-pixel text-[16px] text-[var(--vp-error)] uppercase">{error}</p>
          </div>
        )}

        {/* ============ Pay / Confirmation ============ */}
        {tx ? (
          <section className="bg-[var(--vp-success-container)] border-2 border-[var(--vp-green)] p-5 sm:p-6 voxel-shadow">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--vp-green-text)] text-2xl">verified</span>
              <h2 className="font-pixel text-[18px] text-[var(--vp-on-surface)] uppercase tracking-wider">
                Payment Confirmed
              </h2>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <div className="border-l-4 border-[var(--vp-green)] pl-3">
                <p className="font-pixel text-[14px] text-[var(--vp-outline)] uppercase">Transaction ID</p>
                <p className="font-pixel text-[15px] text-[var(--vp-on-surface)] break-all">{tx.txId}</p>
              </div>
              <div className="border-l-4 border-[var(--vp-green)] pl-3">
                <p className="font-pixel text-[14px] text-[var(--vp-outline)] uppercase">Round</p>
                <p className="text-[17px] font-bold text-[var(--vp-on-surface)]">{tx.round}</p>
              </div>
              <div className="border-l-4 border-[var(--vp-green)] pl-3">
                <p className="font-pixel text-[14px] text-[var(--vp-outline)] uppercase">Sender</p>
                <p className="font-pixel text-[15px] text-[var(--vp-on-surface)] break-all">{tx.sender}</p>
              </div>
              <div className="border-l-4 border-[var(--vp-green)] pl-3">
                <p className="font-pixel text-[14px] text-[var(--vp-outline)] uppercase">Network</p>
                <p className="text-[17px] font-bold text-[var(--vp-on-surface)]">{tx.network}</p>
              </div>
              <p className="font-pixel text-[13px] text-[var(--vp-green-text)] uppercase mt-1">
                ✓ PAYMENT DONE — unlocking report…
              </p>
            </div>
          </section>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handlePay}
              disabled={paying}
              className="flex-1 bg-[var(--vp-saffron)] text-[var(--vp-ink-text)] font-pixel text-[18px] py-3 px-6 border-2 border-[var(--vp-ink)] voxel-shadow-sm voxel-btn-active flex items-center justify-center gap-2 transition-all hover:bg-[#e8871f] disabled:opacity-60 disabled:cursor-wait cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">{paying ? 'hourglass_top' : 'bolt'}</span>
              {paying ? 'PAYING…' : 'PAY 0.001 ALGO'}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('scan', 'push_back')}
              disabled={paying}
              className="bg-[var(--vp-cream)] text-[var(--vp-ink-text)] font-pixel text-[18px] py-3 px-6 border-2 border-[var(--vp-ink)] voxel-shadow-sm flex items-center justify-center gap-2 transition-all hover:bg-[var(--vp-container)] disabled:opacity-60 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">close</span>
              CANCEL
            </button>
          </div>
        )}
      </main>
      <BottomNavBar currentScreen="payment" onNavigate={onNavigate} />
    </div>
  );
};