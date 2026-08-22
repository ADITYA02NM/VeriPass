import React, { useEffect, useState } from 'react';
import { ScreenType } from '../types';
import { TopAppBar } from '../components/TopAppBar';
import { UserInfo, InventoryItem, getProducts, ApiError } from '../lib/api';

interface InventoryScreenProps {
  onNavigate: (screen: ScreenType, transition?: 'push' | 'push_back' | 'none') => void;
  user: UserInfo | null;
  onOpenHistory: (code: string) => void;
}

export const InventoryScreen: React.FC<InventoryScreenProps> = ({ onNavigate, user, onOpenHistory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState(false);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProducts()
      .then((res) => {
        setItems(res.products);
        setRole(res.role);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'INVENTORY UNREACHABLE'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((it) => {
    const q = searchTerm.trim().toLowerCase();
    const matchQ =
      !q ||
      it.batchId.toLowerCase().includes(q) ||
      it.name.toLowerCase().includes(q) ||
      it.code.toLowerCase().includes(q);
    return filterActive ? matchQ && it.status === 'alert' : matchQ;
  });

  return (
    <div className="bg-[var(--vp-surface)] text-[var(--vp-on-surface)] font-['Inter'] min-h-screen pb-24 pt-16 flex flex-col">
      <TopAppBar currentScreen="inventory" onNavigate={onNavigate} />

      <main className="max-w-6xl mx-auto w-full px-4 md:px-8 py-6">
        {/* Header Section */}
        <div className="mb-6 border-b-2 border-[var(--vp-ink)] pb-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--vp-ink-text)] tracking-tight">
            Inventory Log
          </h1>
          <p className="font-pixel text-[17px] text-[var(--vp-muted)] mt-1 uppercase tracking-widest">
            VERIFIED INSTITUTIONAL ASSETS
          </p>
        </div>

        {/* Filter/Controls Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-6 gap-3">
          <div className="flex items-center gap-2 border-2 border-[var(--vp-ink)] px-3 py-2 bg-[var(--vp-white)] voxel-shadow">
            <span className="material-symbols-outlined text-[var(--vp-outline)]">search</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Batch ID..."
              className="border-none bg-transparent font-pixel text-[18px] text-[var(--vp-ink-text)] focus:ring-0 focus:outline-none placeholder-[var(--vp-outline)] w-full sm:w-56"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilterActive(!filterActive)}
              className="bg-[var(--vp-ink)] text-[var(--vp-white-text)] font-pixel text-[18px] px-5 py-2 border-2 border-[var(--vp-ink)] voxel-shadow-saffron voxel-btn-active flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">filter_list</span>
              {filterActive ? 'FILTER: ALL' : 'FILTER: ALERTS'}
            </button>
          </div>
        </div>

        {/* Loading / Error / Empty states */}
        {loading && (
          <div className="border-2 border-[var(--vp-ink)] bg-[var(--vp-white)] p-10 text-center voxel-shadow-sm">
            <span className="material-symbols-outlined text-5xl text-[var(--vp-outline)] animate-pulse">hourglass_top</span>
            <p className="font-pixel text-[17px] text-[var(--vp-ink-text)] mt-3 uppercase tracking-wider">LOADING INVENTORY...</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-[var(--vp-error-container)]/60 border-2 border-[var(--vp-magenta)] px-4 py-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--vp-magenta-text)]">error</span>
            <span className="font-pixel text-[16px] text-[var(--vp-error)] uppercase tracking-wider">{error}</span>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="border-2 border-dashed border-[var(--vp-ink)] bg-[var(--vp-white)] p-10 text-center voxel-shadow-sm">
            <span className="material-symbols-outlined text-5xl text-[var(--vp-outline)]">inventory_2</span>
            <h3 className="text-xl font-bold text-[var(--vp-ink-text)] mt-3">
              {role === 'User' ? 'VAULT EMPTY — NO PRODUCTS IN YOUR INVENTORY' : 'NO PRODUCTS FOUND'}
            </h3>
            <p className="font-pixel text-[15px] text-[var(--vp-outline)] mt-2 uppercase tracking-wider">
              {role === 'User'
                ? 'Scan a product QR code and tap Bookmark — bookmarked products appear here.'
                : 'Try a different search or clear the filter.'}
            </p>
            <button
              type="button"
              onClick={() => onNavigate('scan', 'none')}
              className="mt-5 bg-[var(--vp-ink)] text-[var(--vp-cream-text)] font-pixel text-[18px] py-2.5 px-6 border-2 border-[var(--vp-ink)] voxel-shadow-saffron voxel-btn-active flex items-center justify-center gap-2 mx-auto cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">qr_code_scanner</span>
              GO TO SCANNER
            </button>
          </div>
        )}

        {/* Inventory Grid */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((it) => {
              const isAlert = it.status === 'alert';
              return (
                <div
                  key={it.code}
                  className={`bg-[var(--vp-white)] border-2 p-4 sm:p-5 voxel-shadow hover:border-[var(--vp-saffron)] transition-all flex flex-col gap-4 ${
                    isAlert
                      ? 'border-[var(--vp-magenta)] shadow-[4px_4px_0px_0px_var(--vp-magenta)] hover:translate-x-[1px] hover:translate-y-[1px] relative overflow-hidden'
                      : 'border-[var(--vp-ink)]'
                  }`}
                >
                  {isAlert && <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--vp-magenta)]/10 rounded-bl-full pointer-events-none" />}

                  <div className="flex justify-between items-start relative z-10">
                    <div
                      className={`w-16 h-16 border-2 flex items-center justify-center p-2 ${
                        isAlert ? 'border-[var(--vp-magenta)] bg-[var(--vp-error-container)]' : 'border-[var(--vp-ink)] bg-[var(--vp-container-low)]'
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-3xl ${isAlert ? 'text-[var(--vp-error)]' : 'text-[var(--vp-ink-text)]'}`}
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {it.icon}
                      </span>
                    </div>
                    <div
                      className="text-[var(--vp-white-text)] font-pixel text-[15px] px-2.5 py-1 uppercase border-2 border-[var(--vp-ink)] flex items-center gap-1 voxel-shadow-sm font-bold"
                      style={{ backgroundColor: it.color }}
                    >
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {isAlert ? 'warning' : 'verified'}
                      </span>
                      {it.verdict}
                    </div>
                  </div>

                  <div className="relative z-10">
                    <h3 className={`text-xl font-bold mb-1 ${isAlert ? 'text-[var(--vp-error)]' : 'text-[var(--vp-on-surface)]'}`}>{it.name}</h3>
                    <div
                      className={`font-pixel text-[15px] text-[var(--vp-muted)] flex flex-col gap-1 mt-2 p-2.5 border-2 ${
                        isAlert ? 'bg-[var(--vp-error-container)]/40 border-[var(--vp-magenta)]/40' : 'bg-[var(--vp-surface)] border-[var(--vp-ink)]/20'
                      }`}
                    >
                      <div className="flex justify-between">
                        <span className={isAlert ? 'text-[var(--vp-magenta-text)]' : 'text-[var(--vp-outline)]'}>BATCH:</span>
                        <span className={`font-bold ${isAlert ? 'text-[var(--vp-error)]' : 'text-[var(--vp-ink-text)]'}`}>{it.batchId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isAlert ? 'text-[var(--vp-magenta-text)]' : 'text-[var(--vp-outline)]'}>SCANNED:</span>
                        <span>{it.scannedAt ?? '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isAlert ? 'text-[var(--vp-magenta-text)]' : 'text-[var(--vp-outline)]'}>SIGNATURES:</span>
                        <span>{it.signedCount}/3</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-2 relative z-10">
                    <button
                      type="button"
                      onClick={() => onOpenHistory(it.code)}
                      className={`w-full font-pixel text-[18px] py-2 border-2 border-[var(--vp-ink)] voxel-shadow voxel-btn-active transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isAlert ? 'bg-[var(--vp-magenta)] text-[var(--vp-white-text)] hover:bg-[#ba1a1a]' : 'bg-[var(--vp-cream)] text-[var(--vp-ink-text)] hover:bg-[var(--vp-container)]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">{isAlert ? 'report' : 'history'}</span>
                      {isAlert ? 'VIEW INCIDENT' : 'VIEW HISTORY'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Inline bottom nav (mobile) */}
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
          }}
          className="flex flex-col items-center justify-center bg-[var(--vp-saffron)] text-[var(--vp-black-text)] border-2 border-[var(--vp-ink)] p-1 active:scale-95 transition-transform w-16 font-bold voxel-shadow-sm"
        >
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            inventory_2
          </span>
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
          className="flex flex-col items-center justify-center text-[var(--vp-muted)] p-1 hover:bg-[var(--vp-container)] active:scale-95 transition-transform w-16"
        >
          <span className="material-symbols-outlined text-2xl">account_circle</span>
          <span className="font-pixel text-[13px] uppercase mt-1">Profile</span>
        </a>
      </nav>
    </div>
  );
};