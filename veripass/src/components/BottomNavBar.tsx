import React from 'react';
import { ScreenType } from '../types';

interface BottomNavBarProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ currentScreen, onNavigate }) => {
  const isProfileActive =
    currentScreen === 'account' ||
    currentScreen === 'profile-security' ||
    currentScreen === 'preferences' ||
    currentScreen === 'digital-signatures';

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-3 py-2.5 bg-[var(--vp-cream)] border-t-4 border-[var(--vp-ink)] shadow-[0px_-4px_0px_0px_rgba(1,7,102,1)] md:hidden">
      {/* 1. Scan */}
      <button
        onClick={() => onNavigate('scan')}
        className={`flex flex-col items-center justify-center p-1 w-16 transition-transform active:scale-95 ${
          currentScreen === 'scan'
            ? 'bg-[var(--vp-saffron)] text-[var(--vp-black-text)] border-2 border-[var(--vp-ink)] voxel-shadow-sm font-bold'
            : 'text-[var(--vp-muted)] hover:bg-[var(--vp-container)]'
        }`}
      >
        <span
          className="material-symbols-outlined text-[24px]"
          style={currentScreen === 'scan' ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          qr_code_scanner
        </span>
        <span className="font-pixel text-[13px] uppercase mt-0.5">Scan</span>
      </button>

      {/* 2. Vault / Inventory */}
      <button
        onClick={() => onNavigate('inventory')}
        className={`flex flex-col items-center justify-center p-1 w-16 transition-transform active:scale-95 ${
          currentScreen === 'inventory'
            ? 'bg-[var(--vp-saffron)] text-[var(--vp-black-text)] border-2 border-[var(--vp-ink)] voxel-shadow-sm font-bold'
            : 'text-[var(--vp-muted)] hover:bg-[var(--vp-container)]'
        }`}
      >
        <span
          className="material-symbols-outlined text-[24px]"
          style={currentScreen === 'inventory' ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          inventory_2
        </span>
        <span className="font-pixel text-[13px] uppercase mt-0.5">Vault</span>
      </button>

      {/* 3. History */}
      <button
        onClick={() => onNavigate('history')}
        className={`flex flex-col items-center justify-center p-1 w-16 transition-transform active:scale-95 ${
          currentScreen === 'history'
            ? 'bg-[var(--vp-saffron)] text-[var(--vp-black-text)] border-2 border-[var(--vp-ink)] voxel-shadow-sm font-bold'
            : 'text-[var(--vp-muted)] hover:bg-[var(--vp-container)]'
        }`}
      >
        <span
          className="material-symbols-outlined text-[24px]"
          style={currentScreen === 'history' ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          history
        </span>
        <span className="font-pixel text-[13px] uppercase mt-0.5">History</span>
      </button>

      {/* 4. Profile / Account */}
      <button
        onClick={() => onNavigate('account')}
        className={`flex flex-col items-center justify-center p-1 w-16 transition-transform active:scale-95 ${
          isProfileActive
            ? 'bg-[var(--vp-saffron)] text-[var(--vp-black-text)] border-2 border-[var(--vp-ink)] voxel-shadow-sm font-bold'
            : 'text-[var(--vp-muted)] hover:bg-[var(--vp-container)]'
        }`}
      >
        <span
          className="material-symbols-outlined text-[24px]"
          style={isProfileActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          account_circle
        </span>
        <span className="font-pixel text-[13px] uppercase mt-0.5">Profile</span>
      </button>
    </nav>
  );
};
