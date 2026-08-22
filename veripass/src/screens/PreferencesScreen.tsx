import React, { useState } from 'react';
import { ScreenType } from '../types';
import { TopAppBar } from '../components/TopAppBar';

interface PreferencesScreenProps {
  onNavigate: (screen: ScreenType, transition?: 'push' | 'push_back' | 'none') => void;
}

export const PreferencesScreen: React.FC<PreferencesScreenProps> = ({ onNavigate }) => {
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi' | 'de'>('en');
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('veripass_theme') === 'dark';
    }
    return false;
  });
  const [verifUpdates, setVerifUpdates] = useState(true);
  const [securityTips, setSecurityTips] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-[var(--vp-surface)] text-[var(--vp-on-surface)] font-['Inter'] min-h-screen pb-28 pt-16 flex flex-col">
      <TopAppBar currentScreen="preferences" onNavigate={onNavigate} />

      <main className="max-w-6xl mx-auto w-full px-4 md:px-8 py-6">
        {/* Header Section: div[1] with back button: body/main[1]/div[1]/button[1] */}
        <div className="mb-8 flex items-center gap-4 border-b-2 border-[var(--vp-ink)] pb-4">
          <button
            type="button"
            onClick={() => onNavigate('account', 'push_back')}
            className="w-10 h-10 flex items-center justify-center border-2 border-[var(--vp-ink)] voxel-shadow bg-[var(--vp-cream)] voxel-btn-active transition-all text-[var(--vp-ink-text)] cursor-pointer"
            aria-label="Back to Profile"
          >
            <span className="material-symbols-outlined font-bold">arrow_back</span>
          </button>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--vp-ink-text)] uppercase tracking-tight">
            APP PREFERENCES
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Theme Settings Section */}
            <section className="bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] voxel-shadow p-5 sm:p-6">
              <h2 className="text-xl font-bold text-[var(--vp-ink-text)] mb-4 flex items-center gap-2 border-b-2 border-[var(--vp-ink)] pb-2">
                <span className="material-symbols-outlined text-2xl">palette</span>
                THEME SETTINGS
              </h2>
              <div className="flex items-center justify-between p-4 bg-[var(--vp-container-low)] border-2 border-[var(--vp-ink)]">
                <div>
                  <p className="text-[16px] font-bold text-[var(--vp-on-surface)]">Dark Mode</p>
                  <p className="font-pixel text-[14px] text-[var(--vp-muted)] mt-0.5">
                    ENABLE HIGH-CONTRAST TERMINAL THEME
                  </p>
                </div>
                {/* Toggle Button */}
                <button
                  type="button"
                  onClick={() => {
                    const next = !darkMode;
                    setDarkMode(next);
                    window.localStorage.setItem('veripass_theme', next ? 'dark' : 'light');
                    document.documentElement.classList.toggle('dark', next);
                  }}
                  className={`w-12 h-6 border-2 border-[var(--vp-ink)] relative cursor-pointer transition-colors ${
                    darkMode ? 'bg-[var(--vp-green)]' : 'bg-[var(--vp-container-highest)]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] absolute top-0 transition-all ${
                      darkMode ? 'right-0' : 'left-0'
                    }`}
                  />
                </button>
              </div>
            </section>

            {/* Language Section */}
            <section className="bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] voxel-shadow p-5 sm:p-6">
              <h2 className="text-xl font-bold text-[var(--vp-ink-text)] mb-4 flex items-center gap-2 border-b-2 border-[var(--vp-ink)] pb-2">
                <span className="material-symbols-outlined text-2xl">language</span>
                SYSTEM LANGUAGE
              </h2>
              <div className="space-y-3">
                {/* English */}
                <div
                  onClick={() => setSelectedLanguage('en')}
                  className={`flex items-center p-4 bg-[var(--vp-container-low)] border-2 border-[var(--vp-ink)] cursor-pointer hover:bg-[var(--vp-container-high)] transition-colors ${
                    selectedLanguage === 'en' ? 'border-[var(--vp-ink)]' : ''
                  }`}
                >
                  <div className="w-5 h-5 bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] flex items-center justify-center">
                    {selectedLanguage === 'en' && <div className="w-2.5 h-2.5 bg-[var(--vp-ink)]" />}
                  </div>
                  <div className="ml-4 flex-grow flex justify-between items-center">
                    <span className="text-[16px] font-bold text-[var(--vp-on-surface)]">English (US)</span>
                    {selectedLanguage === 'en' && (
                      <span className="font-pixel text-[14px] text-[var(--vp-ink-text)] bg-[var(--vp-primary-fixed)] px-2 py-0.5 border border-[var(--vp-ink)] font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                </div>

                {/* Hindi */}
                <div
                  onClick={() => setSelectedLanguage('hi')}
                  className="flex items-center p-4 bg-[var(--vp-container-low)] border-2 border-[var(--vp-ink)] cursor-pointer hover:bg-[var(--vp-container-high)] transition-colors"
                >
                  <div className="w-5 h-5 bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] flex items-center justify-center">
                    {selectedLanguage === 'hi' && <div className="w-2.5 h-2.5 bg-[var(--vp-ink)]" />}
                  </div>
                  <div className="ml-4 flex-grow flex justify-between items-center">
                    <span className="text-[16px] font-bold text-[var(--vp-on-surface)]">Hindi (India)</span>
                    {selectedLanguage === 'hi' && (
                      <span className="font-pixel text-[14px] text-[var(--vp-ink-text)] bg-[var(--vp-primary-fixed)] px-2 py-0.5 border border-[var(--vp-ink)] font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                </div>

                {/* German */}
                <div
                  onClick={() => setSelectedLanguage('de')}
                  className="flex items-center p-4 bg-[var(--vp-container-low)] border-2 border-[var(--vp-ink)] cursor-pointer hover:bg-[var(--vp-container-high)] transition-colors"
                >
                  <div className="w-5 h-5 bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] flex items-center justify-center">
                    {selectedLanguage === 'de' && <div className="w-2.5 h-2.5 bg-[var(--vp-ink)]" />}
                  </div>
                  <div className="ml-4 flex-grow flex justify-between items-center">
                    <span className="text-[16px] font-bold text-[var(--vp-on-surface)]">German (DE)</span>
                    {selectedLanguage === 'de' && (
                      <span className="font-pixel text-[14px] text-[var(--vp-ink-text)] bg-[var(--vp-primary-fixed)] px-2 py-0.5 border border-[var(--vp-ink)] font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Notifications Section */}
            <section className="bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] voxel-shadow p-5 sm:p-6">
              <h2 className="text-xl font-bold text-[var(--vp-ink-text)] mb-4 flex items-center gap-2 border-b-2 border-[var(--vp-ink)] pb-2">
                <span className="material-symbols-outlined text-2xl">notifications</span>
                NOTIFICATIONS
              </h2>
              <div className="space-y-3">
                {/* System Alerts */}
                <div className="flex items-center justify-between p-4 bg-[var(--vp-container-low)] border-2 border-[var(--vp-ink)]">
                  <div>
                    <p className="text-[16px] font-bold text-[var(--vp-on-surface)] flex items-center gap-2">
                      <span className="material-symbols-outlined text-[var(--vp-magenta-text)] text-lg">
                        warning
                      </span>
                      System Alerts
                    </p>
                    <p className="font-pixel text-[13px] text-[var(--vp-muted)] mt-0.5">
                      CRITICAL SYSTEM & ACCOUNT NOTICES
                    </p>
                  </div>
                  <div className="w-12 h-6 border-2 border-[var(--vp-ink)] bg-[var(--vp-green)] relative opacity-80 cursor-not-allowed">
                    <div className="w-5 h-5 bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] absolute top-0 right-0" />
                  </div>
                </div>

                {/* Verification Updates */}
                <div className="flex items-center justify-between p-4 bg-[var(--vp-container-low)] border-2 border-[var(--vp-ink)]">
                  <div>
                    <p className="text-[16px] font-bold text-[var(--vp-on-surface)] flex items-center gap-2">
                      <span className="material-symbols-outlined text-[var(--vp-green-text)] text-lg">
                        verified
                      </span>
                      Verification Updates
                    </p>
                    <p className="font-pixel text-[13px] text-[var(--vp-muted)] mt-0.5">
                      PASSPORT STATUS CHANGES
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVerifUpdates(!verifUpdates)}
                    className={`w-12 h-6 border-2 border-[var(--vp-ink)] relative cursor-pointer transition-colors ${
                      verifUpdates ? 'bg-[var(--vp-green)]' : 'bg-[var(--vp-container-highest)]'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] absolute top-0 transition-all ${
                        verifUpdates ? 'right-0' : 'left-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Security Tips */}
                <div className="flex items-center justify-between p-4 bg-[var(--vp-container-low)] border-2 border-[var(--vp-ink)]">
                  <div>
                    <p className="text-[16px] font-bold text-[var(--vp-on-surface)] flex items-center gap-2">
                      <span className="material-symbols-outlined text-[var(--vp-cyan)] text-lg">
                        lightbulb
                      </span>
                      Security Tips
                    </p>
                    <p className="font-pixel text-[13px] text-[var(--vp-muted)] mt-0.5">
                      BEST PRACTICES FOR DATA SAFETY
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSecurityTips(!securityTips)}
                    className={`w-12 h-6 border-2 border-[var(--vp-ink)] relative cursor-pointer transition-colors ${
                      securityTips ? 'bg-[var(--vp-green)]' : 'bg-[var(--vp-container-highest)]'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] absolute top-0 transition-all ${
                        securityTips ? 'right-0' : 'left-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </section>

            {/* Action Area */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSave}
                className="bg-[var(--vp-ink)] text-[var(--vp-white-text)] font-pixel text-[19px] px-8 py-3.5 border-2 border-[var(--vp-ink)] voxel-shadow-saffron voxel-btn-active uppercase tracking-widest flex items-center gap-2 cursor-pointer transition-all"
              >
                <span className="material-symbols-outlined text-lg">save</span>
                {saved ? 'PREFERENCES SAVED!' : 'SAVE PREFERENCES'}
              </button>
            </div>
          </div>

          {/* Side Column */}
          <div className="lg:col-span-4 space-y-6">
            {/* Data Privacy Card */}
            <div className="bg-[var(--vp-cream)] border-2 border-[var(--vp-ink)] voxel-shadow p-5 sm:p-6 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-10 pointer-events-none">
                <span className="material-symbols-outlined text-[100px]">policy</span>
              </div>
              <h3 className="text-xl font-bold text-[var(--vp-ink-text)] mb-3 relative z-10 flex items-center gap-2">
                <span className="material-symbols-outlined text-2xl">shield</span>
                DATA PRIVACY
              </h3>
              <p className="text-[15px] text-[var(--vp-on-surface)] mb-5 relative z-10">
                Review how VeriPass handles your verifiable credentials, telemetry, and encrypted vaults.
              </p>
              <a
                href="#privacy"
                onClick={(e) => {
                  e.preventDefault();
                }}
                className="inline-flex items-center gap-1 text-[var(--vp-ink-text)] font-pixel text-[17px] uppercase border-b-2 border-[var(--vp-ink)] pb-0.5 hover:text-[var(--vp-saffron-text)] hover:border-[var(--vp-saffron)] transition-colors"
              >
                READ PRIVACY POLICY
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </a>
            </div>

            {/* System Info Panel */}
            <div className="bg-[var(--vp-black)] border-2 border-[var(--vp-cyan)] p-5 shadow-[4px_4px_0px_0px_var(--vp-cyan)]">
              <h3 className="font-pixel text-[19px] text-[var(--vp-cyan)] mb-3 border-b border-[var(--vp-cyan)]/40 pb-1.5 uppercase tracking-widest font-bold">
                SYS_INFO
              </h3>
              <ul className="font-pixel text-[15px] text-[var(--vp-outline-variant)] space-y-2">
                <li className="flex justify-between">
                  <span>APP_VERSION:</span> <span className="text-[var(--vp-white-text)]">v2.4.1-STABLE</span>
                </li>
                <li className="flex justify-between">
                  <span>LAST_SYNC:</span> <span className="text-[var(--vp-white-text)]">2023-10-27T14:32Z</span>
                </li>
                <li className="flex justify-between">
                  <span>CLIENT_ID:</span> <span className="text-[var(--vp-white-text)]">VX-8922</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Nav with <div> matching exact xpath: body/nav[1]/div[1], div[2], div[3] */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-3 bg-[var(--vp-cream)] border-t-4 border-[var(--vp-ink)] shadow-[0px_-4px_0px_0px_rgba(1,7,102,1)] md:hidden">
        {/* div[1] -> Scan */}
        <div
          onClick={() => onNavigate('scan', 'none')}
          className="flex flex-col items-center justify-center text-[var(--vp-muted)] p-1 hover:bg-[var(--vp-container)] active:scale-95 transition-transform w-16 cursor-pointer"
          role="button"
          tabIndex={0}
        >
          <span className="material-symbols-outlined text-2xl">qr_code_scanner</span>
          <span className="font-pixel text-[13px] uppercase mt-1">Scan</span>
        </div>

        {/* div[2] -> Inventory / Vault */}
        <div
          onClick={() => onNavigate('inventory', 'none')}
          className="flex flex-col items-center justify-center text-[var(--vp-muted)] p-1 hover:bg-[var(--vp-container)] active:scale-95 transition-transform w-16 cursor-pointer"
          role="button"
          tabIndex={0}
        >
          <span className="material-symbols-outlined text-2xl">inventory_2</span>
          <span className="font-pixel text-[13px] uppercase mt-1">Vault</span>
        </div>

        {/* div[3] -> History */}
        <div
          onClick={() => onNavigate('history', 'none')}
          className="flex flex-col items-center justify-center text-[var(--vp-muted)] p-1 hover:bg-[var(--vp-container)] active:scale-95 transition-transform w-16 cursor-pointer"
          role="button"
          tabIndex={0}
        >
          <span className="material-symbols-outlined text-2xl">history</span>
          <span className="font-pixel text-[13px] uppercase mt-1">History</span>
        </div>

        {/* div[4] -> Profile (Active) */}
        <div
          onClick={() => onNavigate('account', 'none')}
          className="flex flex-col items-center justify-center bg-[var(--vp-saffron)] text-[var(--vp-black-text)] border-2 border-[var(--vp-ink)] p-1 active:scale-95 transition-transform w-16 font-bold voxel-shadow-sm cursor-pointer"
          role="button"
          tabIndex={0}
        >
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            account_circle
          </span>
          <span className="font-pixel text-[13px] uppercase mt-1">Profile</span>
        </div>
      </nav>
    </div>
  );
};
