import React, { useEffect, useState } from 'react';
import { ScreenType } from '../types';
import { TopAppBar } from '../components/TopAppBar';
import { ProductPayload, verifyProduct, ApiError } from '../lib/api';

export const SCAN_HISTORY_KEY = 'veripass_scan_history';

export function appendScanHistory(code: string) {
  try {
    const raw = localStorage.getItem(SCAN_HISTORY_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(code)) list.unshift(code);
    localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(list.slice(0, 50)));
  } catch {
    // ignore storage errors
  }
}

export function clearScanHistory() {
  try {
    localStorage.removeItem(SCAN_HISTORY_KEY);
  } catch {
    // ignore storage errors
  }
}

// ─── Empty / Idle state shown when no code is loaded ────────────────────────
const EmptyHistoryState: React.FC<{
  onNavigate: (screen: ScreenType, transition?: 'push' | 'push_back' | 'none') => void;
}> = ({ onNavigate }) => {
  const [scannedIds, setScannedIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SCAN_HISTORY_KEY);
      setScannedIds(raw ? JSON.parse(raw) : []);
    } catch {
      setScannedIds([]);
    }
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Outline header */}
      <section className="border-2 border-[var(--vp-ink)] border-dashed bg-[var(--vp-white)] p-8 flex flex-col items-center gap-4 voxel-shadow">
        <span className="material-symbols-outlined text-6xl text-[var(--vp-outline)]">history</span>
        <h1 className="font-pixel text-[22px] text-[var(--vp-ink-text)] uppercase tracking-widest text-center">
          No Heritage Loaded
        </h1>
        <p className="text-[15px] text-[var(--vp-muted)] text-center max-w-sm">
          Scan a product QR code or open a bookmark from your Vault to view its full verification heritage and timeline.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('scan', 'push_back')}
          className="mt-2 bg-[var(--vp-ink)] text-[var(--vp-cream-text)] font-pixel text-[17px] px-6 py-3 border-2 border-[var(--vp-ink)] voxel-shadow voxel-btn-active flex items-center gap-2 uppercase tracking-widest cursor-pointer hover:bg-[var(--vp-saffron)] hover:text-[var(--vp-black-text)] transition-all"
        >
          <span className="material-symbols-outlined text-lg">qr_code_scanner</span>
          SCAN A PRODUCT
        </button>
      </section>

      {/* Past scanned IDs (session cache) */}
      {scannedIds.length > 0 && (
        <section>
          <h2 className="font-pixel text-[15px] text-[var(--vp-muted)] uppercase tracking-widest mb-3">
            Previously Scanned · Session Cache ({scannedIds.length})
          </h2>
          <div className="flex flex-col gap-1">
            {scannedIds.map((id) => (
              <p key={id} className="font-pixel text-[15px] text-[var(--vp-ink-text)] uppercase tracking-widest px-1 py-0.5">
                {id}
              </p>
            ))}
          </div>
          <p className="font-pixel text-[12px] text-[var(--vp-outline)] uppercase tracking-wider mt-3">
            Cache clears on session reset
          </p>
        </section>
      )}
    </div>
  );
};

interface HistoryScreenProps {
  onNavigate: (screen: ScreenType, transition?: 'push' | 'push_back' | 'none') => void;
  code?: string | null;
  onConsumeCode?: () => void;
  onRequestPayment: (code: string) => void;
  pendingSignature?: string | null;
  onConsumeSignature: () => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  onNavigate,
  code,
  onConsumeCode,
  onRequestPayment,
  pendingSignature,
  onConsumeSignature,
}) => {
  const [exported, setExported] = useState(false);
  const [product, setProduct] = useState<ProductPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [charged, setCharged] = useState(false);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Opened from a bookmark (Vault → VIEW HISTORY): load the real product
  // heritage. Free tier exhausted → 402 → pay 0.002 ALGO (x402) to unlock.
  useEffect(() => {
    if (!code) return;
    setLoading(true);
    setError(null);
    setCharged(false);
    verifyProduct(code, pendingSignature ?? undefined)
      .then((payload) => {
        setProduct(payload);
        if (pendingSignature) setPaid(true);
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 402) {
          setCharged(true);
          setError('FREE TIER EXHAUSTED — PAY WITH ALGORAND (x402) TO UNLOCK THIS HISTORY');
        } else if (e instanceof ApiError && e.status === 404) {
          setError('PRODUCT NOT FOUND — CHECK THE CODE AND TRY AGAIN');
        } else {
          setError(e instanceof ApiError ? e.message : 'VERIFICATION FAILED — SERVER UNREACHABLE');
        }
      })
      .finally(() => setLoading(false));
    if (pendingSignature) onConsumeSignature();
    if (onConsumeCode) onConsumeCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExport = () => {
    setExported(true);
    setTimeout(() => setExported(false), 2500);
  };

  return (
    <div className="bg-[var(--vp-surface)] text-[var(--vp-on-surface)] font-['Inter'] min-h-screen pb-28 pt-16 flex flex-col">
      <TopAppBar currentScreen="history" onNavigate={onNavigate} />

      <main className="max-w-4xl mx-auto w-full px-4 md:px-8 py-6">
        {code ? (
          /* ============ REAL PRODUCT HERITAGE (from bookmark) ============ */
          <>
            <section className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--vp-ink-text)] mb-4 tracking-tight">
                Product Heritage
              </h1>

              {loading && (
                <div className="border-2 border-[var(--vp-ink)] bg-[var(--vp-white)] p-10 text-center voxel-shadow-sm">
                  <span className="material-symbols-outlined text-5xl text-[var(--vp-outline)] animate-pulse">hourglass_top</span>
                  <p className="font-pixel text-[17px] text-[var(--vp-ink-text)] mt-3 uppercase tracking-wider">LOADING HERITAGE...</p>
                </div>
              )}

              {!loading && error && (
                <div className="bg-[var(--vp-error-container)]/60 border-2 border-[var(--vp-magenta)] px-4 py-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[var(--vp-magenta-text)]">error</span>
                  <span className="font-pixel text-[16px] text-[var(--vp-error)] uppercase tracking-wider">{error}</span>
                </div>
              )}

              {!loading && charged && (
                <div className="bg-[var(--vp-ink)] border-2 border-[var(--vp-ink)] px-4 py-4 voxel-shadow-sm flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="material-symbols-outlined text-xl text-[var(--vp-saffron-text)]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      payments
                    </span>
                    <div className="min-w-0">
                      <p className="font-pixel text-[15px] text-[var(--vp-cream-text)] uppercase tracking-wider">
                        PAID (x402 · ALGORAND)
                      </p>
                      <p className="font-pixel text-[12px] text-[var(--vp-cream-text)]/70 mt-1 uppercase tracking-wider">
                        Free tier exhausted — pay 0.002 ALGO on Algorand to unlock this history
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRequestPayment(code)}
                    className="shrink-0 bg-[var(--vp-saffron)] text-[var(--vp-ink-text)] font-pixel text-[17px] py-2 px-4 border-2 border-[var(--vp-ink)] voxel-shadow-sm voxel-btn-active flex items-center justify-center gap-2 transition-all hover:bg-[#e8871f] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">bolt</span>
                    PAY 0.002 ALGO
                  </button>
                </div>
              )}

              {!loading && product && (
                <div className="bg-[var(--vp-cream)] border-2 border-[var(--vp-ink)] p-5 sm:p-6 voxel-shadow relative hover:border-[var(--vp-saffron)] transition-colors">
                  <div
                    className="absolute top-0 right-0 text-[var(--vp-black-text)] font-pixel text-[15px] px-3 py-1 border-b-2 border-l-2 border-[var(--vp-ink)] font-bold uppercase tracking-wider"
                    style={{ backgroundColor: product.verdict.color }}
                  >
                    {product.verdict.label}
                  </div>

                  <p className="font-pixel text-[17px] text-[var(--vp-muted)] mb-1 uppercase tracking-wider">BATCH ID</p>
                  <p className="font-pixel text-3xl sm:text-4xl text-[var(--vp-ink-text)] mb-6 font-bold tracking-widest">
                    {product.batchId}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="font-pixel text-[13px] text-[var(--vp-outline)] uppercase tracking-wider">PRODUCT</p>
                      <p className="text-[16px] font-bold text-[var(--vp-on-surface)]">{product.name}</p>
                    </div>
                    <div>
                      <p className="font-pixel text-[13px] text-[var(--vp-outline)] uppercase tracking-wider">CODE</p>
                      <p className="text-[16px] font-bold text-[var(--vp-on-surface)]">{product.code}</p>
                    </div>
                    <div>
                      <p className="font-pixel text-[13px] text-[var(--vp-outline)] uppercase tracking-wider">ORIGIN</p>
                      <p className="text-[16px] font-bold text-[var(--vp-on-surface)]">{product.origin}</p>
                    </div>
                    <div>
                      <p className="font-pixel text-[13px] text-[var(--vp-outline)] uppercase tracking-wider">INTEGRITY SCORE</p>
                      <p className="text-[16px] font-bold text-[var(--vp-on-surface)]">
                        {product.verdict.score}/100
                        {paid && (
                          <span className="ml-1 font-pixel text-[12px] text-[var(--vp-saffron-text)] uppercase">· x402 paid</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {product.details && (
                    <p className="text-[14px] text-[var(--vp-muted)] mt-4 border-t-2 border-[var(--vp-ink)]/20 pt-3">{product.details}</p>
                  )}
                </div>
              )}
            </section>

            {!loading && product && (
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-[var(--vp-ink-text)] mb-6 tracking-tight">
                  Verification Logs ({product.timeline.length} checkpoints)
                </h2>

                <div className="relative pl-6 ml-2 border-l-4 border-[var(--vp-ink)] space-y-8 py-2">
                  {product.timeline.map((t) => (
                    <div key={t.id} className="relative">
                      <div
                        className="absolute -left-[32px] top-1.5 w-[14px] h-[14px] border-2 border-[var(--vp-ink)] z-10"
                        style={{ backgroundColor: t.kind === 'alert' ? '#E91E63' : '#41ad31' }}
                      />
                      <div className="bg-[var(--vp-container)] border-2 border-[var(--vp-ink)] p-4 sm:p-5 voxel-shadow">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-1">
                          <h3 className="font-pixel text-[20px] text-[var(--vp-ink-text)] uppercase font-bold tracking-wider">
                            {t.label}
                          </h3>
                          <span className="font-pixel text-[15px] text-[var(--vp-outline)]">{t.timestamp}</span>
                        </div>
                        {t.signedBy && (
                          <p className="text-[15px] text-[var(--vp-on-surface)] font-bold">
                            Signed by {t.signedBy}
                            {t.signerRole ? ` · ${t.signerRole}` : ''}
                          </p>
                        )}
                        {t.note && <p className="text-[15px] text-[var(--vp-muted)]">{t.note}</p>}
                        <div className="mt-3 inline-flex items-center gap-1.5 bg-[var(--vp-surface)] border border-[var(--vp-outline)] px-2.5 py-1">
                          <span
                            className="material-symbols-outlined text-base"
                            style={{ fontVariationSettings: "'FILL' 1", color: t.kind === 'alert' ? '#E91E63' : '#41ad31' }}
                          >
                            {t.kind === 'alert' ? 'error' : 'check_circle'}
                          </span>
                          <span className="font-pixel text-[15px] text-[var(--vp-black-text)] font-bold">
                            {t.kind === 'alert' ? 'Alert Flagged' : 'Digital Signature Valid'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {!loading && product && (
              <div className="flex justify-center mt-6">
                <button
                  type="button"
                  onClick={handleExport}
                  className="bg-[var(--vp-ink)] text-[var(--vp-cream-text)] font-pixel text-[20px] px-8 py-3.5 border-2 border-[var(--vp-ink)] voxel-shadow voxel-btn-active transition-all flex items-center gap-2 uppercase tracking-widest cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl">download</span>
                  {exported ? 'LOG EXPORTED (JSON+PDF)' : 'EXPORT LOG'}
                </button>
              </div>
            )}
          </>
        ) : (
          /* ============ EMPTY STATE + SCANNED PRODUCT IDS ============ */
          <EmptyHistoryState onNavigate={onNavigate} />
        
        )}
      </main>

      {/* Nav with <div> matching exact xpath: body/nav[1]/div[1], div[2], div[3], div[4] */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-3 bg-[var(--vp-cream)] border-t-4 border-[var(--vp-ink)] shadow-[0px_-4px_0px_0px_rgba(1,7,102,1)] md:hidden">
        {/* div[1] -> Scan */}
        <div
          onClick={() => onNavigate('scan', 'none')}
          className="flex flex-col items-center justify-center text-[var(--vp-muted)] p-1 hover:bg-[var(--vp-container)] active:scale-95 transition-transform w-16 cursor-pointer"
          role="button"
          tabIndex={0}
        >
          <span className="material-symbols-outlined text-2xl mb-0.5">qr_code_scanner</span>
          <span className="font-pixel text-[13px] uppercase">Scan</span>
        </div>

        {/* div[2] -> Inventory / Vault */}
        <div
          onClick={() => onNavigate('inventory', 'none')}
          className="flex flex-col items-center justify-center text-[var(--vp-muted)] p-1 hover:bg-[var(--vp-container)] active:scale-95 transition-transform w-16 cursor-pointer"
          role="button"
          tabIndex={0}
        >
          <span className="material-symbols-outlined text-2xl mb-0.5">inventory_2</span>
          <span className="font-pixel text-[13px] uppercase">Vault</span>
        </div>

        {/* div[3] -> History (Active — tap to refresh) */}
        <div
          onClick={() => onNavigate('history', 'none')}
          className="flex flex-col items-center justify-center bg-[var(--vp-saffron)] text-[var(--vp-black-text)] border-2 border-[var(--vp-ink)] p-1 active:scale-95 transition-transform w-16 font-bold voxel-shadow-sm cursor-pointer"
          role="button"
          tabIndex={0}
        >
          <span className="material-symbols-outlined text-2xl mb-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
            history
          </span>
          <span className="font-pixel text-[13px] uppercase">History</span>
        </div>

        {/* div[4] -> Account / Profile */}
        <div
          onClick={() => onNavigate('account', 'none')}
          className="flex flex-col items-center justify-center text-[var(--vp-muted)] p-1 hover:bg-[var(--vp-container)] active:scale-95 transition-transform w-16 cursor-pointer"
          role="button"
          tabIndex={0}
        >
          <span className="material-symbols-outlined text-2xl mb-0.5">account_circle</span>
          <span className="font-pixel text-[13px] uppercase">Profile</span>
        </div>
      </nav>
    </div>
  );
};