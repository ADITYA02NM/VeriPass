import React from 'react';
import { ScreenType, UserRole } from '../types';
import { TopAppBar } from '../components/TopAppBar';
import { terminateSession, clearSession } from '../lib/api';
import { clearScanHistory } from './HistoryScreen';

interface AccountScreenProps {
  onNavigate: (screen: ScreenType, transition?: 'push' | 'push_back' | 'none') => void;
  userRole: UserRole;
}

export const AccountScreen: React.FC<AccountScreenProps> = ({ onNavigate, userRole }) => {
  const [terminating, setTerminating] = React.useState(false);

  const handleTerminate = async () => {
    if (!window.confirm('Terminate session?\n\nResets your free scan tokens back to 3 and wipes your vault bookmarks.')) return;
    setTerminating(true);
    try {
      await terminateSession();
    } catch {
      // even if the API call fails, log out locally so the user is never stuck
    }
    clearSession();
    clearScanHistory();
    onNavigate('login', 'push_back');
  };
  return (
    <div className="bg-[var(--vp-cream)] text-[var(--vp-on-surface)] font-['Inter'] min-h-screen flex flex-col pt-16 pb-24">
      <TopAppBar currentScreen="account" onNavigate={onNavigate} />

      <main className="flex-grow w-full max-w-4xl mx-auto px-4 md:px-8 py-6">
        {/* Section 1: Profile Header Card */}
        <section className="mb-6 border-2 border-[var(--vp-ink)] bg-[var(--vp-surface)] p-6 voxel-shadow relative">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar with Verification Overlay */}
            <div className="w-28 h-28 border-2 border-[var(--vp-ink)] bg-[var(--vp-container-low)] flex-shrink-0 relative overflow-hidden flex items-center justify-center">
              <span className="material-symbols-outlined text-6xl text-[var(--vp-ink-text)]">
                person
              </span>
              <div className="absolute bottom-0 right-0 bg-[var(--vp-green)] p-1 border-t-2 border-l-2 border-[var(--vp-ink)] flex items-center justify-center">
                <span className="material-symbols-outlined text-[var(--vp-white-text)] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>
              </div>
            </div>

            {/* Identity Info */}
            <div className="flex-grow text-center sm:text-left">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--vp-ink-text)] mb-1">
                Rajiv Sharma
              </h2>
              <p className="font-pixel text-[18px] text-[var(--vp-muted)] mb-3 uppercase tracking-widest font-bold">
                {userRole.toUpperCase()}
              </p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start font-pixel text-[16px]">
                <div className="border-2 border-[var(--vp-ink)] px-3 py-1 bg-[var(--vp-container-low)] text-[var(--vp-ink-text)]">
                  <span className="text-[var(--vp-outline)]">ID:</span> VRP-992-8A4
                </div>
                <div className="border-2 border-[var(--vp-ink)] px-3 py-1 bg-[var(--vp-container-low)] text-[var(--vp-ink-text)]">
                  <span className="text-[var(--vp-outline)]">JOIN:</span> 2023-11-04
                </div>
              </div>
            </div>
          </div>

          {/* Origin Badge */}
          <div className="absolute top-4 right-4 flex items-center border-2 border-[var(--vp-ink)] bg-[var(--vp-surface)] voxel-shadow-sm">
            <div className="h-full w-2 bg-[var(--vp-saffron)] self-stretch" />
            <div className="h-full w-2 bg-[var(--vp-white)] self-stretch" />
            <div className="h-full w-2 bg-[var(--vp-green)] self-stretch mr-1.5" />
            <span className="font-pixel text-[14px] text-[var(--vp-ink-text)] uppercase px-2 py-1 font-bold">
              Origin: IND
            </span>
          </div>
        </section>

        {/* Section 2: Configuration Options */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Button 1: Profile Security (body/main[1]/section[2]/button[1]) */}
          <button
            type="button"
            onClick={() => onNavigate('profile-security', 'push')}
            className="border-2 border-[var(--vp-ink)] bg-[var(--vp-surface)] p-5 voxel-shadow hover:bg-[var(--vp-container)] voxel-btn-active text-left flex items-center justify-between group cursor-pointer transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-[var(--vp-ink)] text-[var(--vp-cream-text)] flex items-center justify-center group-hover:bg-[var(--vp-saffron)] group-hover:text-[var(--vp-black-text)] transition-colors">
                <span className="material-symbols-outlined text-2xl">lock</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--vp-ink-text)]">Profile Security</h3>
                <p className="font-pixel text-[15px] text-[var(--vp-muted)] mt-0.5">
                  Biometrics, Passkeys, 2FA
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[var(--vp-ink-text)] group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </button>

          {/* Button 2: App Preferences (body/main[1]/section[2]/button[2]) */}
          <button
            type="button"
            onClick={() => onNavigate('preferences', 'push')}
            className="border-2 border-[var(--vp-ink)] bg-[var(--vp-surface)] p-5 voxel-shadow hover:bg-[var(--vp-container)] voxel-btn-active text-left flex items-center justify-between group cursor-pointer transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-[var(--vp-ink)] text-[var(--vp-cream-text)] flex items-center justify-center group-hover:bg-[var(--vp-saffron)] group-hover:text-[var(--vp-black-text)] transition-colors">
                <span className="material-symbols-outlined text-2xl">settings</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--vp-ink-text)]">App Preferences</h3>
                <p className="font-pixel text-[15px] text-[var(--vp-muted)] mt-0.5">
                  Theme, Language, Notifications
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[var(--vp-ink-text)] group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </button>

          {/* Button 3: Digital Signature Settings (body/main[1]/section[2]/button[3]) */}
          <button
            type="button"
            onClick={() => onNavigate('digital-signatures', 'push')}
            className="border-2 border-[var(--vp-ink)] bg-[var(--vp-surface)] p-5 voxel-shadow hover:bg-[var(--vp-container)] voxel-btn-active text-left flex items-center justify-between group sm:col-span-2 cursor-pointer transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-[var(--vp-ink)] text-[var(--vp-cream-text)] flex items-center justify-center group-hover:bg-[var(--vp-saffron)] group-hover:text-[var(--vp-black-text)] transition-colors">
                <span className="material-symbols-outlined text-2xl">fingerprint</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--vp-ink-text)]">
                  Digital Signature Settings
                </h3>
                <p className="font-pixel text-[15px] text-[var(--vp-muted)] mt-0.5">
                  Manage Keys, Revocation Certificates
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[var(--vp-ink-text)] group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </button>
        </section>

        {/* Section 3: Danger Zone */}
        <section className="mt-8">
          <button
            type="button"
            onClick={handleTerminate}
            disabled={terminating}
            className="w-full border-2 border-[var(--vp-ink)] bg-[var(--vp-magenta)] text-[var(--vp-white-text)] font-pixel text-[20px] py-4 voxel-shadow hover:bg-[#ba1a1a] voxel-btn-active flex items-center justify-center gap-2 uppercase tracking-widest cursor-pointer transition-all disabled:opacity-60 disabled:cursor-wait"
          >
            <span className="material-symbols-outlined text-2xl">power_settings_new</span>
            {terminating ? 'TERMINATING…' : 'TERMINATE SESSION'}
          </button>
          <p className="font-pixel text-[13px] text-[var(--vp-outline)] mt-2 text-center">
            Resets free scan tokens to 3 · wipes vault bookmarks
          </p>
        </section>
      </main>

      {/* Bottom Nav with <button> matching xpath: body/nav[1]/button[1], button[2], button[3] */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-3 bg-[var(--vp-cream)] border-t-4 border-[var(--vp-ink)] shadow-[0px_-4px_0px_0px_rgba(1,7,102,1)] md:hidden">
        {/* Button 1 -> Scan */}
        <button
          type="button"
          onClick={() => onNavigate('scan', 'none')}
          className="flex flex-col items-center justify-center text-[var(--vp-muted)] p-1 hover:bg-[var(--vp-container)] active:scale-95 transition-all w-16 cursor-pointer"
        >
          <span className="material-symbols-outlined text-2xl">qr_code_scanner</span>
          <span className="font-pixel text-[13px] uppercase mt-1">Scan</span>
        </button>

        {/* Button 2 -> Inventory / Vault */}
        <button
          type="button"
          onClick={() => onNavigate('inventory', 'none')}
          className="flex flex-col items-center justify-center text-[var(--vp-muted)] p-1 hover:bg-[var(--vp-container)] active:scale-95 transition-all w-16 cursor-pointer"
        >
          <span className="material-symbols-outlined text-2xl">inventory_2</span>
          <span className="font-pixel text-[13px] uppercase mt-1">Vault</span>
        </button>

        {/* Button 3 -> History */}
        <button
          type="button"
          onClick={() => onNavigate('history', 'none')}
          className="flex flex-col items-center justify-center text-[var(--vp-muted)] p-1 hover:bg-[var(--vp-container)] active:scale-95 transition-all w-16 cursor-pointer"
        >
          <span className="material-symbols-outlined text-2xl">history</span>
          <span className="font-pixel text-[13px] uppercase mt-1">History</span>
        </button>

        {/* Button 4 -> Profile (Active) */}
        <button
          type="button"
          className="flex flex-col items-center justify-center bg-[var(--vp-saffron)] text-[var(--vp-black-text)] border-2 border-[var(--vp-ink)] p-1 active:scale-95 transition-transform w-16 font-bold voxel-shadow-sm cursor-pointer"
        >
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            account_circle
          </span>
          <span className="font-pixel text-[13px] uppercase mt-1">Profile</span>
        </button>
      </nav>
    </div>
  );
};
