import React, { useState, useRef } from 'react';
import { ScreenType } from '../types';

interface PasswordResetScreenProps {
  onNavigate: (screen: ScreenType, transition?: 'push' | 'push_back' | 'none') => void;
}

export const PasswordResetScreen: React.FC<PasswordResetScreenProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('USER@PROTOCOL.NET');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [restored, setRestored] = useState(false);

  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleRestore = (e: React.FormEvent) => {
    e.preventDefault();
    setRestored(true);
    setTimeout(() => {
      onNavigate('login', 'push_back');
    }, 1500);
  };

  return (
    <div className="font-['Inter'] text-[var(--vp-on-surface)] bg-[var(--vp-cream)] min-h-screen flex flex-col antialiased">
      {/* TopAppBar matching exact xpath: body/header[1]/div[2]/nav[1]/a[1], a[2], a[3], a[4] */}
      <header className="w-full top-0 sticky z-50 bg-[var(--vp-surface)] border-b-4 border-[var(--vp-ink)] shadow-[4px_4px_0px_0px_rgba(254,152,50,1)] flex items-center justify-between px-4 md:px-8 py-2.5">
        {/* div[1]: Logo */}
        <div
          onClick={() => onNavigate('login', 'push_back')}
          className="flex items-center gap-3 cursor-pointer"
        >
          <span
            className="material-symbols-outlined text-3xl text-[var(--vp-ink-text)]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            security
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--vp-ink-text)] uppercase tracking-tighter">
            VeriPass
          </h1>
        </div>

        {/* div[2]: Desktop & Mobile Nav containing a[1], a[2], a[3], a[4] */}
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-3 sm:gap-6">
            {/* a[1] -> Scan */}
            <a
              href="#scan"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('scan', 'none');
              }}
              className="font-pixel text-[16px] text-[var(--vp-ink-text)] hover:text-[var(--vp-saffron-text)] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">qr_code_scanner</span>
              <span className="hidden sm:inline">Scan</span>
            </a>

            {/* a[2] -> Vault / Inventory */}
            <a
              href="#vault"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('inventory', 'none');
              }}
              className="font-pixel text-[16px] text-[var(--vp-ink-text)] hover:text-[var(--vp-saffron-text)] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">inventory_2</span>
              <span className="hidden sm:inline">Vault</span>
            </a>

            {/* a[3] -> History */}
            <a
              href="#history"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('history', 'none');
              }}
              className="font-pixel text-[16px] text-[var(--vp-ink-text)] hover:text-[var(--vp-saffron-text)] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">history</span>
              <span className="hidden sm:inline">History</span>
            </a>

            {/* a[4] -> Account / Profile */}
            <a
              href="#profile"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('account', 'none');
              }}
              className="font-pixel text-[16px] text-[var(--vp-saffron-text)] hover:text-[var(--vp-ink-text)] transition-colors flex items-center gap-1 font-bold cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">account_circle</span>
              <span className="hidden sm:inline">Profile</span>
            </a>
          </nav>
        </div>

        {/* Right Icon */}
        <div className="hidden sm:flex items-center">
          <button
            onClick={() => onNavigate('login', 'push_back')}
            className="text-[var(--vp-ink-text)] hover:text-[var(--vp-saffron-text)] transition-colors cursor-pointer"
            title="Return to Login"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow flex flex-col items-center justify-start px-4 md:px-8 py-8 md:py-12 pb-24">
        <div className="w-full max-w-2xl flex flex-col gap-8">
          {/* Header Section */}
          <div className="text-left border-l-4 border-[var(--vp-ink)] pl-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--vp-ink-text)] uppercase tracking-tighter">
              SYSTEM RECOVERY
            </h2>
            <p className="font-pixel text-[16px] text-[var(--vp-outline)] mt-1 tracking-widest uppercase">
              RESTORE ACCESS TO YOUR IMMUTABLE IDENTITY
            </p>
          </div>

          {/* Security Warning Box */}
          <div className="bg-[var(--vp-white)] border-2 border-[var(--vp-magenta)] p-5 sm:p-6 shadow-[4px_4px_0px_0px_var(--vp-magenta)] flex items-start gap-4">
            <span
              className="material-symbols-outlined text-[var(--vp-magenta-text)] text-3xl shrink-0"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              warning
            </span>
            <div>
              <h3 className="text-xl font-bold text-[var(--vp-ink-text)] mb-1">
                Multi-Factor Verification Required
              </h3>
              <p className="text-[14px] sm:text-[15px] text-[var(--vp-muted)] leading-relaxed">
                To prevent unauthorized access to your identity vault, this recovery process requires successful verification across multiple trusted channels. Ensure you have access to your registered fallback methods.
              </p>
            </div>
          </div>

          {/* Recovery Form */}
          <form onSubmit={handleRestore} className="flex flex-col gap-6 relative">
            {/* Step 1 */}
            <div className="flex gap-4 sm:gap-6 items-start">
              <div className="w-12 h-12 bg-[var(--vp-ink)] text-[var(--vp-white-text)] font-pixel text-[20px] flex items-center justify-center border-2 border-[var(--vp-ink)] shadow-[4px_4px_0px_0px_var(--vp-saffron)] shrink-0 font-bold">
                01
              </div>
              <div className="flex-grow bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] p-5 voxel-shadow">
                <label
                  htmlFor="email-id"
                  className="block font-pixel text-[15px] text-[var(--vp-ink-text)] mb-1 uppercase font-bold tracking-wider"
                >
                  EMAIL ID
                </label>
                <input
                  id="email-id"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="USER@PROTOCOL.NET"
                  className="w-full bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] p-3 font-pixel text-[18px] text-[var(--vp-ink-text)] focus:outline-none focus:border-[var(--vp-cyan)] transition-all uppercase placeholder:text-[var(--vp-outline-variant)]"
                />
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4 sm:gap-6 items-start">
              <div className="w-12 h-12 bg-[var(--vp-white)] text-[var(--vp-ink-text)] font-pixel text-[20px] flex items-center justify-center border-2 border-[var(--vp-ink)] shrink-0 font-bold">
                02
              </div>
              <div className="flex-grow bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] p-5 voxel-shadow">
                <label
                  htmlFor="otp-code"
                  className="block font-pixel text-[15px] text-[var(--vp-ink-text)] mb-2 uppercase font-bold tracking-wider"
                >
                  VERIFICATION CODE (OTP)
                </label>
                <div className="flex gap-2 items-center flex-wrap">
                  {[0, 1, 2].map((idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputs.current[idx] = el;
                      }}
                      type="text"
                      maxLength={1}
                      value={otp[idx]}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e.target)}
                      className="w-11 h-14 sm:w-14 sm:h-14 text-center border-2 border-[var(--vp-ink)] font-pixel text-2xl text-[var(--vp-ink-text)] focus:outline-none focus:border-[var(--vp-cyan)] focus:bg-[var(--vp-container-low)] transition-colors bg-[var(--vp-white)] font-bold"
                    />
                  ))}
                  <span className="font-extrabold text-2xl text-[var(--vp-ink-text)] px-1">-</span>
                  {[3, 4, 5].map((idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputs.current[idx] = el;
                      }}
                      type="text"
                      maxLength={1}
                      value={otp[idx]}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e.target)}
                      className="w-11 h-14 sm:w-14 sm:h-14 text-center border-2 border-[var(--vp-ink)] font-pixel text-2xl text-[var(--vp-ink-text)] focus:outline-none focus:border-[var(--vp-cyan)] focus:bg-[var(--vp-container-low)] transition-colors bg-[var(--vp-white)] font-bold"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4 sm:gap-6 items-start" id="step-3-container">
              <div className="w-12 h-12 bg-[var(--vp-white)] text-[var(--vp-ink-text)] font-pixel text-[20px] flex items-center justify-center border-2 border-[var(--vp-ink)] shrink-0 font-bold">
                03
              </div>
              <div className="flex-grow bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] p-5 voxel-shadow">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="new-password"
                      className="block font-pixel text-[15px] text-[var(--vp-ink-text)] uppercase font-bold tracking-wider"
                    >
                      NEW PASSWORD
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] p-3 font-pixel text-[18px] text-[var(--vp-ink-text)] focus:outline-none focus:border-[var(--vp-cyan)] transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="confirm-password"
                      className="block font-pixel text-[15px] text-[var(--vp-ink-text)] uppercase font-bold tracking-wider"
                    >
                      CONFIRM NEW PASSWORD
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] p-3 font-pixel text-[18px] text-[var(--vp-ink-text)] focus:outline-none focus:border-[var(--vp-cyan)] transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-5 mt-2">
              <button
                type="submit"
                className="w-full sm:w-auto bg-[var(--vp-ink)] text-[var(--vp-white-text)] font-pixel text-[19px] px-8 py-3.5 border-2 border-[var(--vp-ink)] shadow-[4px_4px_0px_0px_var(--vp-saffron)] voxel-btn-active uppercase flex items-center justify-center gap-2 cursor-pointer transition-all hover:bg-[#00044a]"
              >
                <span className="material-symbols-outlined text-xl">verified</span>
                {restored ? 'ACCESS RESTORED! REDIRECTING...' : 'Validate & Restore'}
              </button>

              <a
                href="#support"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Security Support hotline: support@veripass.protocol.net | Emergency Key Recovery Node: 0x892A');
                }}
                className="text-[15px] text-[var(--vp-ink-text)] underline hover:text-[var(--vp-saffron-text)] transition-colors cursor-pointer"
              >
                Contact Security Support
              </a>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
