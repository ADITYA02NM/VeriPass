import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { ScreenType } from '../types';
import { TopAppBar } from '../components/TopAppBar';
import { BottomNavBar } from '../components/BottomNavBar';
import { appendScanHistory } from './HistoryScreen';
import {
  UserInfo,
  ProductPayload,
  UsageInfo,
  verifyProduct,
  getUsage,
  signProduct,
  bookmarkProduct,
  ApiError,
} from '../lib/api';

interface ScanScreenProps {
  onNavigate: (screen: ScreenType, transition?: 'push' | 'push_back' | 'none') => void;
  user: UserInfo | null;
  initialCode?: string | null;
  onConsumeCode: () => void;
  pendingSignature?: string | null;
  onConsumeSignature: () => void;
  restartToken?: number;
  onOpenHistory: (code: string) => void;
}

const ROLE_TO_KIND: Record<string, 'production' | 'shipment' | 'receipt'> = {
  Producer: 'production',
  Logistics: 'shipment',
  Retailer: 'receipt',
};

export const ScanScreen: React.FC<ScanScreenProps> = ({
  onNavigate,
  user,
  initialCode,
  onConsumeCode,
  pendingSignature,
  onConsumeSignature,
  restartToken,
  onOpenHistory,
}) => {
  const [code, setCode] = useState(initialCode ?? '');
  const [product, setProduct] = useState<ProductPayload | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [signing, setSigning] = useState(false);
  const [freeTierExhausted, setFreeTierExhausted] = useState(false);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exported, setExported] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  // Double-click on the camera HUD → fresh scan (local restart, same as Scan tab)
  const [localRestart, setLocalRestart] = useState(0);

  // Camera: requested immediately when the app opens (user requirement).
  // NOTE: getUserMedia needs a secure context — on plain http://LAN the
  // browser blocks it, so we fall back to manual code entry with a notice.
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loadingRef = useRef(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;

    const stopCamera = () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };

    const decodeLoop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!stopped && video && canvas && video.readyState >= 2) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qr = jsQR(img.data, img.width, img.height);
          if (qr && qr.data) {
            const match = qr.data.match(/[?&]qr=([^&]+)/) || qr.data.match(/^([A-Z0-9-]{4,64})$/);
            const found = match ? decodeURIComponent(match[1]) : null;
            if (found && !loadingRef.current) {
              stopCamera();
              setCameraActive(false);
              setCode(found);
              void runVerify(found);
            }
          }
        }
      }
      if (!stopped) raf = requestAnimationFrame(decodeLoop);
    };

    if (!navigator.mediaDevices?.getUserMedia) {
      // Insecure context (plain http://LAN) — mediaDevices doesn't even exist.
      setCameraActive(false);
      setCameraError(
        'CAMERA NEEDS HTTPS — BROWSER BLOCKS CAMERA ON PLAIN HTTP. USE MANUAL CODE ENTRY BELOW.'
      );
      return stopCamera;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .catch(() => navigator.mediaDevices.getUserMedia({ video: true }))
      .then((s) => {
        if (stopped) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        streamRef.current = s;
        setCameraActive(true);
        setCameraError(null);
        raf = requestAnimationFrame(decodeLoop);
      })
      .catch((err: unknown) => {
        setCameraActive(false);
        const name = err instanceof DOMException ? err.name : '';
        setCameraError(
          name === 'NotAllowedError'
            ? 'CAMERA PERMISSION DENIED — ALLOW CAMERA ACCESS IN THE BROWSER, OR USE MANUAL CODE ENTRY BELOW.'
            : 'CAMERA UNAVAILABLE — BROWSER BLOCKED ACCESS (NEEDS HTTPS). USE MANUAL CODE ENTRY BELOW.'
        );
      });

    return stopCamera;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restartToken, localRestart]);

  // Tapping the Scan tab while already scanning → restart fresh:
  // clear the previous result so the camera takes over again.
  useEffect(() => {
    if (restartToken > 0) {
      setProduct(null);
      setError(null);
      setFreeTierExhausted(false);
      setPaid(false);
      setBookmarked(false);
      setExported(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restartToken]);

  // Double-click on the scanning area → new scan: wipe the previous result
  // and restart the camera (localRestart re-runs the camera effect above).
  const handleRestartScan = () => {
    setProduct(null);
    setError(null);
    setFreeTierExhausted(false);
    setPaid(false);
    setBookmarked(false);
    setExported(false);
    setCode('');
    setLocalRestart((t) => t + 1);
  };

  // Attach the stream once the <video> element is actually mounted.
  // (setCameraActive only schedules a re-render, so the ref is null inside
  // the getUserMedia .then() — attaching there silently dropped the stream.)
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      void videoRef.current.play().catch(() => undefined);
    }
  }, [cameraActive]);

  // Load usage bar + auto-verify when opened via QR scan (?qr=CODE)
  // or when returning from the x402 payment page (pendingSignature set)
  useEffect(() => {
    getUsage().then(setUsage).catch(() => undefined);
    if (initialCode) {
      setCode(initialCode);
      if (pendingSignature) {
        void runVerify(initialCode, pendingSignature);
        onConsumeSignature();
      } else {
        void runVerify(initialCode);
      }
      onConsumeCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runVerify = async (codeToVerify: string, xPaySignature?: string) => {
    setLoading(true);
    loadingRef.current = true;
    setError(null);
    setFreeTierExhausted(false);
    try {
      const payload = await verifyProduct(codeToVerify, xPaySignature);
      setProduct(payload);
      setUsage((u) => (u ? { ...u, used: payload.x402.used, charged: false } : u));
      appendScanHistory(payload.code);
      if (xPaySignature) setPaid(true);
    } catch (e) {
      if (e instanceof ApiError && e.status === 402) {
        setFreeTierExhausted(true);
        setError('FREE TIER EXHAUSTED — BUY A PLAN TO CONTINUE VERIFYING');
      } else if (e instanceof ApiError && e.status === 404) {
        setError('PRODUCT NOT FOUND — CHECK THE CODE AND TRY AGAIN');
        setProduct(null);
      } else {
        setError(e instanceof ApiError ? e.message : 'VERIFICATION FAILED — SERVER UNREACHABLE');
      }
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    void runVerify(trimmed);
  };

  const handleSign = async () => {
    if (!product) return;
    setSigning(true);
    setError(null);
    try {
      const result = await signProduct(product.code);
      setProduct(result.product);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'SIGNING FAILED');
    } finally {
      setSigning(false);
    }
  };

  const handleExport = () => {
    setExported(true);
    setTimeout(() => setExported(false), 2500);
  };

  const handleBookmark = async () => {
    if (!product) return;
    try {
      await bookmarkProduct(product.code);
      setBookmarked(true);
      setTimeout(() => onNavigate('inventory', 'none'), 600);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'BOOKMARK FAILED');
    }
  };

  const used = usage?.used ?? product?.x402.used ?? 0;
  const freeLimit = usage?.freeLimit ?? product?.x402.freeLimit ?? 3;
  const remaining = Math.max(0, freeLimit - used);
  const barPct = Math.min(100, (used / freeLimit) * 100);

  const canSign =
    !!user &&
    !!product &&
    product.verdict.status !== 'NOT_GENUINE' &&
    ROLE_TO_KIND[user.role] !== undefined &&
    !product.timeline.some((t) => t.kind === ROLE_TO_KIND[user.role]);

  return (
    <div className="bg-[var(--vp-surface)] text-[var(--vp-on-surface)] font-['Inter'] min-h-screen flex flex-col pt-16 pb-24">
      <TopAppBar currentScreen="scan" onNavigate={onNavigate} />

      <main className="flex-grow w-full max-w-5xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-6">
        {/* ============ x402 API USAGE BAR (top) ============ */}
        <section
          className={`border-2 border-[var(--vp-ink)] px-4 py-3 voxel-shadow-sm flex flex-col sm:flex-row sm:items-center gap-3 ${
            freeTierExhausted ? 'bg-[var(--vp-ink)]' : 'bg-[var(--vp-white)]'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span
              className={`material-symbols-outlined text-xl ${freeTierExhausted ? 'text-[var(--vp-saffron-text)]' : 'text-[var(--vp-ink-text)]'}`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {freeTierExhausted ? 'lock' : 'api'}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex justify-between items-baseline gap-2">
                <span className={`font-pixel text-[15px] uppercase tracking-wider ${freeTierExhausted ? 'text-[var(--vp-cream-text)]' : 'text-[var(--vp-ink-text)]'}`}>
                  {freeTierExhausted ? 'FREE TIER EXHAUSTED' : 'API USAGE'}
                </span>
                <span className={`font-pixel text-[15px] ${freeTierExhausted ? 'text-[var(--vp-saffron-text)]' : 'text-[var(--vp-outline)]'}`}>
                  {freeTierExhausted
                    ? `${usage?.credits ?? 0} CREDITS REMAINING`
                    : remaining > 0
                    ? `${remaining} FREE LEFT · ${usage?.credits ?? 0} CREDITS`
                    : `0 FREE · ${usage?.credits ?? 0} CREDITS REMAIN`}
                </span>
              </div>
              <div className="mt-1.5 h-3 bg-[var(--vp-container-low)] border border-[var(--vp-ink)]/30 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${freeTierExhausted ? 'bg-[var(--vp-saffron)]' : 'bg-[var(--vp-green)]'}`}
                  style={{ width: `${freeTierExhausted ? 100 : barPct}%` }}
                />
              </div>
              <p className={`font-pixel text-[12px] mt-1 uppercase tracking-wider ${freeTierExhausted ? 'text-[var(--vp-cream-text)]/70' : 'text-[var(--vp-outline)]'}`}>
                {freeTierExhausted
                  ? 'Purchase a plan to continue — credits never expire'
                  : `First ${freeLimit} verifications free · x402 protocol · Algorand`}
              </p>
            </div>
          </div>
          {freeTierExhausted && (
            <button
              type="button"
              onClick={() => onNavigate('pricing', 'push')}
              className="shrink-0 bg-[var(--vp-saffron)] text-[var(--vp-ink-text)] font-pixel text-[17px] py-2 px-4 border-2 border-[var(--vp-ink)] voxel-shadow-sm voxel-btn-active flex items-center justify-center gap-2 transition-all hover:bg-[#e8871f] cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">shopping_cart</span>
              VIEW PLANS
            </button>
          )}
        </section>

        {/* ============ Camera HUD Section (live feed when permitted) ============ */}
        <section
          onDoubleClick={handleRestartScan}
          title="Double-click to start a new scan"
          className="relative w-full aspect-[4/3] sm:aspect-video max-h-[380px] bg-[var(--vp-black)] rounded-none border-2 border-[var(--vp-ink)] overflow-hidden voxel-shadow cursor-pointer"
        >
          {cameraActive ? (
            <>
              <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1c29] via-[#0f111a] to-[#07090e] flex items-center justify-center">
              <div className="w-52 h-52 sm:w-64 sm:h-64 border-2 border-[var(--vp-cyan)]/40 p-3 bg-black/60 relative flex items-center justify-center opacity-75">
                <div className="grid grid-cols-6 gap-1.5 w-full h-full p-2">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-none ${
                        (i % 2 === 0 && i % 3 !== 0) || i === 0 || i === 5 || i === 30 || i === 35 || i === 14 || i === 21
                          ? 'bg-[var(--vp-cyan)]/80'
                          : 'bg-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-[var(--vp-black)]/30 backdrop-blur-[1px] pointer-events-none flex items-center justify-center p-6">
            <div className="relative w-full max-w-xs sm:max-w-sm aspect-square border-2 border-[var(--vp-cyan)]/50 shadow-[0_0_15px_rgba(0,229,255,0.3)]">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[var(--vp-cyan)]" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[var(--vp-cyan)]" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[var(--vp-cyan)]" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[var(--vp-cyan)]" />
              <div className="scanner-line absolute left-0 w-full h-[3px] bg-[var(--vp-cyan)] shadow-[0_0_10px_var(--vp-cyan)]" />
              <div className="absolute top-3 left-3 font-pixel text-[16px] text-[var(--vp-cyan)] tracking-wider">
                TARGET: ACQUIRED
              </div>
              <div className="absolute bottom-3 right-3 font-pixel text-[16px] text-[var(--vp-cyan)] animate-pulse tracking-wider">
                ANALYZING...
              </div>
              <div className="absolute top-3 right-3 font-pixel text-[13px] text-[var(--vp-cyan)]/70 tracking-wider">
                DOUBLE-CLICK: RESCAN
              </div>
            </div>
          </div>
          {cameraError && (
            <div className="absolute bottom-0 left-0 right-0 bg-[var(--vp-ink)]/90 border-t-2 border-[var(--vp-saffron)] px-3 py-2 font-pixel text-[13px] text-[var(--vp-saffron-text)] uppercase tracking-wider">
              {cameraError}
            </div>
          )}
        </section>

        {/* ============ Manual QR / Code Entry ============ */}
        <form
          onSubmit={handleVerify}
          className="bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] p-4 voxel-shadow-sm flex flex-col sm:flex-row gap-3"
        >
          <div className="flex items-center gap-2 flex-1 bg-[var(--vp-cream)] border-2 border-[var(--vp-ink)] px-3">
            <span className="material-symbols-outlined text-[var(--vp-ink-text)]">qr_code_scanner</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ENTER PRODUCT CODE (e.g. AS-SENSOR-2026-001)"
              className="w-full bg-transparent py-2.5 font-pixel text-[17px] text-[var(--vp-ink-text)] placeholder:text-[var(--vp-outline)] outline-none uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="bg-[var(--vp-ink)] text-[var(--vp-cream-text)] font-pixel text-[18px] py-2.5 px-6 border-2 border-[var(--vp-ink)] voxel-shadow-saffron voxel-btn-active flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-wait cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">{loading ? 'hourglass_top' : 'verified_user'}</span>
            {loading ? 'VERIFYING...' : 'VERIFY'}
          </button>
        </form>

        {error && (
          <div className="bg-[var(--vp-error-container)]/60 border-2 border-[var(--vp-magenta)] px-4 py-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--vp-magenta-text)]">error</span>
            <span className="font-pixel text-[16px] text-[var(--vp-error)] uppercase tracking-wider">{error}</span>
          </div>
        )}

        {/* ============ Verification Terminal ============ */}
        {product && (
          <section className="bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] p-5 sm:p-6 voxel-shadow flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-[var(--vp-ink)] pb-4 gap-3">
              <div>
                <h2 className="text-2xl font-bold text-[var(--vp-ink-text)] tracking-tight">{product.name}</h2>
                <p className="font-pixel text-[18px] text-[var(--vp-muted)] mt-0.5">Batch ID: #{product.batchId}</p>
              </div>
              <div
                className="text-[var(--vp-white-text)] px-3.5 py-1.5 border-2 border-[var(--vp-ink)] voxel-shadow-sm font-pixel text-[18px] uppercase tracking-wider flex items-center gap-1.5"
                style={{ backgroundColor: product.verdict.color }}
              >
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {product.verdict.icon}
                </span>
                {product.verdict.label}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col border-l-4 border-[var(--vp-ink)] pl-3">
                  <span className="font-pixel text-[14px] text-[var(--vp-outline)] uppercase tracking-wider">ORIGIN</span>
                  <span className="text-[17px] text-[var(--vp-on-surface)] font-bold">{product.origin}</span>
                </div>
                <div className="flex flex-col border-l-4 border-[var(--vp-ink)] pl-3">
                  <span className="font-pixel text-[14px] text-[var(--vp-outline)] uppercase tracking-wider">PRODUCT CODE</span>
                  <span className="text-[17px] text-[var(--vp-on-surface)] font-bold">{product.code}</span>
                </div>
                <div className="flex flex-col border-l-4 border-[var(--vp-ink)] pl-3">
                  <span className="font-pixel text-[14px] text-[var(--vp-outline)] uppercase tracking-wider">DETAILS</span>
                  <span className="text-[15px] text-[var(--vp-on-surface)]">{product.details}</span>
                </div>
                <div className="flex flex-col border-l-4 border-[var(--vp-ink)] pl-3">
                  <span className="font-pixel text-[14px] text-[var(--vp-outline)] uppercase tracking-wider">INTEGRITY SCORE</span>
                  <span className="text-[17px] text-[var(--vp-on-surface)] font-bold">
                    {product.verdict.score}/100
                    {paid && (
                      <span className="ml-2 font-pixel text-[13px] text-[var(--vp-saffron-text)] uppercase">
                        · unlocked via x402 payment
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-4 bg-[var(--vp-container-low)] p-4 border-2 border-[var(--vp-ink)] border-dashed">
                <h3 className="font-pixel text-[18px] text-[var(--vp-ink-text)] tracking-wider uppercase font-bold">
                  TERMINAL ACTIONS
                </h3>

                <button
                  type="button"
                  onClick={handleExport}
                  className="w-full bg-[var(--vp-ink)] text-[var(--vp-white-text)] font-pixel text-[18px] py-2.5 px-4 border-2 border-[var(--vp-ink)] voxel-shadow-saffron voxel-btn-active flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">download</span>
                  {exported ? 'PASSPORT EXPORTED (PDF)' : 'Export Passport'}
                </button>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleBookmark}
                    disabled={!product || bookmarked}
                    className={`flex-1 font-pixel text-[18px] py-2.5 px-3 border-2 border-[var(--vp-ink)] voxel-shadow-sm voxel-btn-active flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait ${
                      bookmarked ? 'bg-[var(--vp-saffron)] text-[var(--vp-ink-text)]' : 'bg-[var(--vp-cream)] text-[var(--vp-ink-text)] hover:bg-[var(--vp-container)]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">bookmark</span>
                    {bookmarked ? 'BOOKMARKED ✓' : 'Bookmark'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenHistory(product.code)}
                    className="flex-1 bg-[var(--vp-cream)] text-[var(--vp-ink-text)] font-pixel text-[18px] py-2.5 px-3 border-2 border-[var(--vp-ink)] voxel-shadow-sm voxel-btn-active flex items-center justify-center gap-1.5 transition-all hover:bg-[var(--vp-container)] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">history</span>
                    History
                  </button>
                </div>

                {canSign && (
                  <div className="mt-2 pt-3 border-t-2 border-[var(--vp-ink)]">
                    <p className="font-pixel text-[13px] text-[var(--vp-outline)] uppercase mb-2">
                      {user?.role.toUpperCase()} ACTION REQUIRED — SIGN THIS PASSPORT
                    </p>
                    <button
                      type="button"
                      onClick={handleSign}
                      disabled={signing}
                      className="w-full bg-[var(--vp-green)] text-[var(--vp-white-text)] font-pixel text-[19px] py-2.5 px-4 border-2 border-[var(--vp-ink)] voxel-shadow-sm voxel-btn-active flex items-center justify-center gap-2 transition-all hover:bg-[#38962a] disabled:opacity-60 disabled:cursor-wait cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">{signing ? 'hourglass_top' : 'draw'}</span>
                      {signing ? 'SIGNING...' : 'Sign to Verify'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ============ Timeline ============ */}
            <div className="border-t-2 border-[var(--vp-ink)] pt-4">
              <h3 className="font-pixel text-[18px] text-[var(--vp-ink-text)] tracking-wider uppercase font-bold mb-3">
                SUPPLY CHAIN TIMELINE ({product.timeline.length} checkpoints)
              </h3>
              <div className="flex flex-col gap-3">
                {product.timeline.map((t) => (
                  <div key={t.id} className="flex gap-3 items-start">
                    <div
                      className="w-10 h-10 shrink-0 border-2 border-[var(--vp-ink)] flex items-center justify-center"
                      style={{ backgroundColor: t.kind === 'alert' ? '#ffdad6' : '#e8f5e9' }}
                    >
                      <span className="material-symbols-outlined text-[var(--vp-ink-text)]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {t.icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-pixel text-[16px] text-[var(--vp-ink-text)] uppercase tracking-wider">{t.label}</span>
                        <span className="font-pixel text-[13px] text-[var(--vp-outline)]">{t.timestamp}</span>
                      </div>
                      {t.signedBy && (
                        <p className="text-[14px] text-[var(--vp-on-surface)] font-bold">
                          Signed by {t.signedBy}
                          {t.signerRole ? ` · ${t.signerRole}` : ''}
                        </p>
                      )}
                      {t.note && <p className="text-[13px] text-[var(--vp-outline)]">{t.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <BottomNavBar currentScreen="scan" onNavigate={onNavigate} />
    </div>
  );
};