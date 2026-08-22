import React, { useEffect, useState } from 'react';
import { TopAppBar } from '../components/TopAppBar';
import { ScreenType } from '../types';
import { getPlans, purchasePlan, getUsage, Plan, UsageInfo, UserInfo } from '../lib/api';

interface PricingScreenProps {
  onNavigate: (screen: ScreenType, transition?: 'push' | 'push_back' | 'none') => void;
  user: UserInfo | null;
}

type PayMethod = 'card' | 'upi';

interface Receipt {
  planName: string;
  credits: number;
  amountInr: number;
  cardLast4: string;
  txRef: string;
  timestamp: string;
  method: PayMethod;
}

export const PricingScreen: React.FC<PricingScreenProps> = ({ onNavigate, user }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [buying, setBuying] = useState<Plan | null>(null);
  const [method, setMethod] = useState<PayMethod>('card');
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [upiId, setUpiId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    getPlans().then((r) => setPlans(r.plans)).catch(() => undefined);
    getUsage().then(setUsage).catch(() => undefined);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBuy = async () => {
    if (!buying) return;
    setProcessing(true);
    setError(null);
    // Build a fake card payload for UPI (backend expects card fields; UPI is simulated)
    const cardPayload =
      method === 'upi'
        ? { number: '0000000000000000', expiry: '12/99', cvv: '000', name: upiId || 'UPI User' }
        : card;
    try {
      const res = await purchasePlan(buying.id, cardPayload);
      const txRef = `VP-X402-${Date.now().toString(36).toUpperCase()}`;
      setReceipt({
        planName: buying.name,
        credits: res.creditsAdded,
        amountInr: res.amountInr,
        cardLast4: method === 'upi' ? upiId.slice(-4) || '****' : res.cardLast4,
        txRef,
        timestamp: new Date().toLocaleString('en-IN', { hour12: true }),
        method,
      });
      setBuying(null);
      setCard({ number: '', expiry: '', cvv: '', name: '' });
      setUpiId('');
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Purchase failed. Try again.');
    } finally {
      setProcessing(false);
    }
  };

  const remaining = usage ? Math.max(0, usage.freeLimit - usage.used) : 0;
  const canSubmitCard = card.number.replace(/\s/g, '').length >= 12 && card.expiry && card.cvv && card.name;
  const canSubmitUpi = upiId.includes('@') || upiId.length >= 6;

  return (
    <div className="min-h-screen bg-[var(--vp-cream)]">
      <TopAppBar
        currentScreen="pricing"
        onNavigate={onNavigate}
        onBack={() => onNavigate('account', 'push_back')}
        showBack
        title="Plans & Pricing"
      />

      <main className="pt-24 pb-16 px-4 md:px-8 max-w-5xl mx-auto">
        {/* Balance banner */}
        <section className="voxel-border bg-[var(--vp-ink)] text-[var(--vp-cream-text)] p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-pixel text-[13px] uppercase tracking-widest opacity-80">Verification credits</p>
            <p className="font-pixel text-[26px]">
              {usage?.credits ?? 0} <span className="text-[14px]">credits</span>
            </p>
          </div>
          <div className="text-right">
            <p className="font-pixel text-[13px] uppercase tracking-widest opacity-80">Free scans left</p>
            <p className="font-pixel text-[26px]">
              {remaining} <span className="text-[14px]">/ {usage?.freeLimit ?? 3}</span>
            </p>
          </div>
          <p className="w-full md:w-auto text-[13px] opacity-90">
            1 credit = 1 verification report · 1–5 credits = 1 AI question (0.001–0.005 ALGO via x402). Free scans refill on login.
          </p>
        </section>

        {/* Pay-per-use info */}
        <section className="voxel-border bg-[var(--vp-ink)] text-[var(--vp-cream-text)] p-4 mb-6">
          <p className="font-pixel text-[13px] uppercase tracking-widest opacity-80 mb-3">Pay-per-use (x402 · Algorand)</p>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3 bg-[var(--vp-cream)] text-[var(--vp-ink-text)] border-2 border-[var(--vp-ink)] px-3 py-2">
              <div>
                <p className="font-pixel text-[14px] uppercase tracking-wider">Verification report</p>
                <p className="text-[12px] opacity-70">3 free scans per login → credits → 0.001 ALGO per report</p>
              </div>
              <span className="font-pixel text-[16px]">0.001 ALGO</span>
            </div>
            <div className="flex items-center justify-between gap-3 bg-[var(--vp-cream)] text-[var(--vp-ink-text)] border-2 border-[var(--vp-ink)] px-3 py-2">
              <div>
                <p className="font-pixel text-[14px] uppercase tracking-wider">AI Assistant question</p>
                <p className="text-[12px] opacity-70">1–5 credits per question · 0.001–0.005 ALGO via x402</p>
              </div>
              <span className="font-pixel text-[16px]">0.001–0.005 ALGO</span>
            </div>
          </div>
        </section>

        {/* Plan cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p, i) => (
            <div
              key={p.id}
              className={`voxel-border bg-[var(--vp-white)] p-6 flex flex-col gap-3 ${
                i === 1 ? 'border-[var(--vp-saffron)] shadow-[6px_6px_0px_0px_var(--vp-saffron)]' : 'shadow-[6px_6px_0px_0px_var(--vp-ink)]'
              }`}
            >
              {i === 1 && (
                <span className="self-start bg-[var(--vp-saffron)] text-[var(--vp-black-text)] font-pixel text-[11px] px-2 py-0.5 uppercase tracking-widest">
                  Most popular
                </span>
              )}
              <h3 className="font-pixel text-[20px] text-[var(--vp-ink-text)] uppercase tracking-wider">{p.name}</h3>
              <p className="text-[13px] text-[var(--vp-outline)] min-h-[36px]">{p.tagline}</p>
              <p className="font-pixel text-[34px] text-[var(--vp-ink-text)]">
                {p.credits}
                <span className="text-[14px]"> verification credits</span>
              </p>
              <p className="font-pixel text-[18px] text-[var(--vp-green-text)]">₹{p.price_inr}</p>
              <button
                type="button"
                onClick={() => { setBuying(p); setMethod('card'); setError(null); }}
                className="mt-auto w-full border-2 border-[var(--vp-ink)] bg-[var(--vp-ink)] text-[var(--vp-white-text)] font-pixel text-[16px] py-3 voxel-shadow hover:bg-[var(--vp-saffron)] hover:text-[var(--vp-black-text)] voxel-btn-active uppercase tracking-widest cursor-pointer transition-all"
              >
                Buy {p.credits} credits
              </button>
            </div>
          ))}
        </section>

        <p className="mt-8 text-[12px] text-[var(--vp-outline)]">
          Demo payments are simulated — no real charge. Enter any 12+ digit card number.
        </p>
      </main>

      {/* ============ x402 PAYMENT GATEWAY MODAL ============ */}
      {buying && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
          <div className="voxel-border bg-[var(--vp-cream)] w-full max-w-md flex flex-col overflow-hidden">

            {/* Gateway header */}
            <div className="bg-[var(--vp-ink)] text-[var(--vp-cream-text)] px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--vp-cyan)]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  currency_bitcoin
                </span>
                <div>
                  <p className="font-pixel text-[13px] uppercase tracking-widest opacity-70">x402 · Algorand</p>
                  <p className="font-pixel text-[17px] uppercase tracking-wider">Secure Checkout</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBuying(null)}
                className="text-[var(--vp-cream-text)]/60 hover:text-[var(--vp-cream-text)] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Receipt summary */}
            <div className="bg-[var(--vp-white)] border-b-2 border-[var(--vp-ink)] px-5 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-pixel text-[12px] uppercase tracking-widest text-[var(--vp-outline)]">Plan</p>
                <p className="font-pixel text-[15px] text-[var(--vp-ink-text)] uppercase">{buying.name}</p>
                <p className="text-[12px] text-[var(--vp-muted)]">{buying.credits} verification credits · {buying.tagline}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-pixel text-[12px] uppercase tracking-widest text-[var(--vp-outline)]">Total</p>
                <p className="font-pixel text-[22px] text-[var(--vp-ink-text)]">₹{buying.price_inr}</p>
                <p className="font-pixel text-[11px] text-[var(--vp-outline)]">≈ {(buying.price_inr * 0.00012).toFixed(4)} ALGO</p>
              </div>
            </div>

            {/* Method tabs */}
            <div className="flex border-b-2 border-[var(--vp-ink)]">
              {(['card', 'upi'] as PayMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`flex-1 font-pixel text-[14px] uppercase tracking-widest py-3 flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    method === m
                      ? 'bg-[var(--vp-ink)] text-[var(--vp-cream-text)]'
                      : 'bg-[var(--vp-cream)] text-[var(--vp-ink-text)] hover:bg-[var(--vp-container)]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {m === 'card' ? 'credit_card' : 'smartphone'}
                  </span>
                  {m === 'card' ? 'Card' : 'UPI'}
                </button>
              ))}
            </div>

            {/* Form body */}
            <div className="px-5 py-4 flex flex-col gap-3">
              {method === 'card' ? (
                <>
                  <input
                    value={card.name}
                    onChange={(e) => setCard({ ...card, name: e.target.value })}
                    placeholder="Name on card"
                    className="voxel-border bg-[var(--vp-white)] px-3 py-2.5 text-[14px] text-[var(--vp-ink-text)] outline-none"
                  />
                  <input
                    value={card.number}
                    onChange={(e) => setCard({ ...card, number: e.target.value.replace(/[^\d ]/g, '') })}
                    placeholder="Card number (e.g. 4242 4242 4242 4242)"
                    maxLength={19}
                    className="voxel-border bg-[var(--vp-white)] px-3 py-2.5 text-[14px] text-[var(--vp-ink-text)] outline-none font-mono tracking-widest"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={card.expiry}
                      onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="voxel-border bg-[var(--vp-white)] px-3 py-2.5 text-[14px] text-[var(--vp-ink-text)] outline-none"
                    />
                    <input
                      value={card.cvv}
                      onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/[^\d]/g, '') })}
                      placeholder="CVV"
                      maxLength={4}
                      type="password"
                      className="voxel-border bg-[var(--vp-white)] px-3 py-2.5 text-[14px] text-[var(--vp-ink-text)] outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-[var(--vp-outline)] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">lock</span>
                    Secured by x402 · Algorand blockchain · Demo — no real charge
                  </p>
                </>
              ) : (
                <>
                  {/* UPI QR placeholder */}
                  <div className="flex items-center justify-center gap-4 bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] p-3">
                    <div className="w-20 h-20 border-2 border-[var(--vp-ink)] grid grid-cols-5 gap-0.5 p-1.5 bg-white">
                      {Array.from({ length: 25 }).map((_, i) => (
                        <div
                          key={i}
                          className={`rounded-none ${
                            [0,1,2,3,4,5,10,15,20,21,22,23,24,12,6].includes(i)
                              ? 'bg-[var(--vp-ink)]'
                              : 'bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                    <div>
                      <p className="font-pixel text-[12px] uppercase text-[var(--vp-outline)] tracking-wider">Pay to UPI</p>
                      <p className="font-pixel text-[14px] text-[var(--vp-ink-text)]">veripass@algorand</p>
                      <p className="font-pixel text-[18px] text-[var(--vp-green-text)]">₹{buying.price_inr}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-pixel text-[12px] uppercase tracking-widest text-[var(--vp-outline)]">
                      Your UPI ID
                    </label>
                    <input
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="yourname@upi  or  phone@paytm"
                      className="voxel-border bg-[var(--vp-white)] px-3 py-2.5 text-[14px] text-[var(--vp-ink-text)] outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-[var(--vp-outline)] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">lock</span>
                    UPI secured via x402 · Algorand · Demo — no real charge
                  </p>
                </>
              )}

              {error && (
                <p className="font-pixel text-[12px] text-[var(--vp-magenta-text)] uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  {error}
                </p>
              )}

              <div className="flex gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => setBuying(null)}
                  disabled={processing}
                  className="flex-1 border-2 border-[var(--vp-ink)] bg-[var(--vp-white)] text-[var(--vp-ink-text)] font-pixel text-[14px] py-3 voxel-btn-active uppercase tracking-widest cursor-pointer transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBuy}
                  disabled={processing || (method === 'card' ? !canSubmitCard : !canSubmitUpi)}
                  className="flex-1 border-2 border-[var(--vp-ink)] bg-[var(--vp-green)] text-[var(--vp-white-text)] font-pixel text-[14px] py-3 voxel-shadow voxel-btn-active uppercase tracking-widest cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">autorenew</span>
                      Processing…
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">bolt</span>
                      Pay ₹{buying.price_inr}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ RECEIPT MODAL ============ */}
      {receipt && (
        <div className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center p-4">
          <div className="voxel-border bg-[var(--vp-cream)] w-full max-w-sm flex flex-col overflow-hidden">

            {/* Receipt header */}
            <div className="bg-[var(--vp-green)] text-[var(--vp-white-text)] px-5 py-5 text-center flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
              <p className="font-pixel text-[18px] uppercase tracking-widest">Payment Successful</p>
              <p className="font-pixel text-[28px]">₹{receipt.amountInr}</p>
            </div>

            {/* Receipt body */}
            <div className="px-5 py-4 flex flex-col gap-3">
              {/* x402 badge */}
              <div className="flex items-center gap-2 bg-[var(--vp-ink)] text-[var(--vp-cream-text)] px-3 py-2 voxel-border">
                <span className="material-symbols-outlined text-[var(--vp-cyan)] text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  currency_bitcoin
                </span>
                <span className="font-pixel text-[12px] uppercase tracking-widest">x402 · Algorand · Verified</span>
              </div>

              {/* Receipt lines */}
              {[
                { label: 'Transaction Ref', value: receipt.txRef },
                { label: 'Plan', value: receipt.planName },
                { label: 'Credits Added', value: `+${receipt.credits} verification credits` },
                { label: 'Method', value: receipt.method === 'upi' ? `UPI · ****${receipt.cardLast4}` : `Card ···· ${receipt.cardLast4}` },
                { label: 'Date & Time', value: receipt.timestamp },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start gap-3 border-b border-[var(--vp-ink)]/10 pb-2">
                  <span className="font-pixel text-[11px] uppercase tracking-widest text-[var(--vp-outline)] shrink-0">{label}</span>
                  <span className="text-[13px] text-[var(--vp-ink-text)] text-right font-medium">{value}</span>
                </div>
              ))}

              <p className="text-[11px] text-[var(--vp-outline)] text-center mt-1">
                Credits are active instantly · secured via x402 protocol on Algorand
              </p>

              <button
                type="button"
                onClick={() => setReceipt(null)}
                className="w-full border-2 border-[var(--vp-ink)] bg-[var(--vp-ink)] text-[var(--vp-cream-text)] font-pixel text-[15px] py-3 voxel-shadow voxel-btn-active uppercase tracking-widest cursor-pointer transition-all hover:bg-[var(--vp-saffron)] hover:text-[var(--vp-black-text)]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
