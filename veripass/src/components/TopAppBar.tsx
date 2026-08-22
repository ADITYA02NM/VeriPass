import React from 'react';
import { ScreenType } from '../types';

interface TopAppBarProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  onBack?: () => void;
  title?: string;
  showBack?: boolean;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  currentScreen,
  onNavigate,
  onBack,
  title = 'VeriPass',
  showBack = false,
}) => {
  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-8 h-16 bg-[var(--vp-cream)] border-b-4 border-[var(--vp-ink)] shadow-[4px_4px_0px_0px_rgba(1,7,102,1)]">
      <div className="flex items-center gap-3">
        {/* Hourglass → Billing (plans & pricing) */}
        <button
          onClick={() => onNavigate('pricing')}
          className="p-1.5 voxel-border bg-[var(--vp-cream)] voxel-shadow-sm hover:bg-[var(--vp-container)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center text-[var(--vp-ink-text)]"
          aria-label="Billing"
          title="Billing"
        >
          <span className="material-symbols-outlined text-xl">currency_rupee</span>
        </button>
        {showBack && onBack ? (
          <button
            onClick={onBack}
            className="p-1.5 voxel-border bg-[var(--vp-cream)] voxel-shadow-sm hover:bg-[var(--vp-container)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center text-[var(--vp-ink-text)]"
            aria-label="Go Back"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
        ) : (
          <button
            onClick={() => onNavigate('scan')}
            className="flex items-center gap-2 cursor-pointer focus:outline-none"
          >
            <span className="material-symbols-outlined text-[var(--vp-ink-text)] text-2xl font-bold">
              security
            </span>
          </button>
        )}
        <button
          onClick={() => onNavigate('scan')}
          className="font-pixel text-[22px] text-[var(--vp-ink-text)] tracking-widest uppercase font-bold hover:text-[var(--vp-saffron-text)] transition-colors focus:outline-none"
        >
          {title}
        </button>
      </div>

      {/* Desktop Quick Nav Links */}
      <nav className="hidden md:flex items-center gap-4">
        <button
          onClick={() => onNavigate('scan')}
          className={`font-pixel text-[17px] px-3 py-1 uppercase tracking-wider transition-all voxel-btn-active ${
            currentScreen === 'scan'
              ? 'bg-[var(--vp-saffron)] text-[var(--vp-black-text)] border-2 border-[var(--vp-ink)] voxel-shadow-sm'
              : 'text-[var(--vp-ink-text)] hover:bg-[var(--vp-container-high)]'
          }`}
        >
          Scan
        </button>
        <button
          onClick={() => onNavigate('inventory')}
          className={`font-pixel text-[17px] px-3 py-1 uppercase tracking-wider transition-all voxel-btn-active ${
            currentScreen === 'inventory'
              ? 'bg-[var(--vp-saffron)] text-[var(--vp-black-text)] border-2 border-[var(--vp-ink)] voxel-shadow-sm'
              : 'text-[var(--vp-ink-text)] hover:bg-[var(--vp-container-high)]'
          }`}
        >
          Vault
        </button>
        <button
          onClick={() => onNavigate('history')}
          className={`font-pixel text-[17px] px-3 py-1 uppercase tracking-wider transition-all voxel-btn-active ${
            currentScreen === 'history'
              ? 'bg-[var(--vp-saffron)] text-[var(--vp-black-text)] border-2 border-[var(--vp-ink)] voxel-shadow-sm'
              : 'text-[var(--vp-ink-text)] hover:bg-[var(--vp-container-high)]'
          }`}
        >
          History
        </button>
        <button
          onClick={() => onNavigate('account')}
          className={`font-pixel text-[17px] px-3 py-1 uppercase tracking-wider transition-all voxel-btn-active ${
            currentScreen === 'account' ||
            currentScreen === 'profile-security' ||
            currentScreen === 'preferences' ||
            currentScreen === 'digital-signatures'
              ? 'bg-[var(--vp-saffron)] text-[var(--vp-black-text)] border-2 border-[var(--vp-ink)] voxel-shadow-sm'
              : 'text-[var(--vp-ink-text)] hover:bg-[var(--vp-container-high)]'
          }`}
        >
          Profile
        </button>
      </nav>

      {/* Trailing Avatar Button → AI Assistant (agentic chat) */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onNavigate('ai-chat')}
          className="w-9 h-9 rounded-none voxel-border bg-[var(--vp-cream)] overflow-hidden voxel-shadow-sm flex items-center justify-center hover:bg-[var(--vp-container-high)] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
          title="AI Assistant"
        >
          <span className="material-symbols-outlined text-[var(--vp-ink-text)] text-2xl">
            account_circle
          </span>
        </button>
      </div>
    </header>
  );
};
