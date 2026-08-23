import React, { useState, useRef } from 'react';
import { ScreenType } from '../types';
import { sendOtp, verifyOtp, resetPassword, ApiError } from '../lib/api';

interface PasswordResetScreenProps {
  onNavigate: (screen: ScreenType, transition?: 'push' | 'push_back' | 'none') => void;
}

export const PasswordResetScreen: React.FC<PasswordResetScreenProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1=email, 2=otp, 3=new password
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

  // Step 1: Send OTP to email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await sendOtp(email.trim(), 'reset');
      setDevCode(result.devCode || null);
      setStep(2);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Enter all 6 digits');
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(email.trim(), code, 'reset');
      setStep(3);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Set new password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 4) {
      setError('Passkey must be at least 4 characters');
      return;
    }
    setLoading(true);
    try {
      const code = otp.join('');
      await resetPassword(email.trim(), code, password);
      setSuccess(true);
      setTimeout(() => {
        onNavigate('login', 'push_back');
      }, 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-['Inter'] text-[var(--vp-on-surface)] bg-[var(--vp-cream)] min-h-screen flex flex-col antialiased">
      {/* TopAppBar */}
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

        {/* div[2]: Desktop & Mobile Nav */}
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-3 sm:gap-6">
            <a
              href="#scan"
              onClick={(e) => { e.preventDefault(); onNavigate('scan', 'none'); }}
              className="font-pixel text-[16px] text-[var(--vp-ink-text)] hover:text-[var(--vp-saffron-text)] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">qr_code_scanner</span>
              <span className="hidden sm:inline">Scan</span>
            </a>
            <a
              href="#vault"
              onClick={(e) => { e.preventDefault(); onNavigate('inventory', 'none'); }}
              className="font-pixel text-[16px] text-[var(--vp-ink-text)] hover:text-[var(--vp-saffron-text)] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">inventory_2</span>
              <span className="hidden sm:inline">Vault</span>
            </a>
            <a
              href="#history"
              onClick={(e) => { e.preventDefault(); onNavigate('history', 'none'); }}
              className="font-pixel text-[16px] text-[var(--vp-ink-text)] hover:text-[var(--vp-saffron-text)] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">history</span>
              <span className="hidden sm:inline">History</span>
            </a>
            <a
              href="#profile"
              onClick={(e) => { e.preventDefault(); onNavigate('account', 'none'); }}
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
                To prevent unauthorized access to your identity vault, this recovery process requires successful verification across multiple trusted channels. Ensure you have access to your registered email.
              </p>
            </div>
          </div>

          {/* Step Progress */}
          <div className="flex items-center gap-3">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-10 h-10 flex items-center justify-center border-2 font-pixel text-[16px] font-bold transition-all ${
                  step >= s
                    ? 'bg-[var(--vp-ink)] text-[var(--vp-white-text)] border-[var(--vp-ink)]'
                    : 'bg-[var(--vp-white)] text-[var(--vp-outline)] border-[var(--vp-outline)]'
                }`}>
                  {step > s ? '✓' : `0${s}`}
                </div>
                {s < 3 && <div className={`w-8 h-px ${step > s ? 'bg-[var(--vp-ink)]' : 'bg-[var(--vp-outline)]'}`} />}
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-[var(--vp-error-container)]/60 border-2 border-[var(--vp-magenta)] px-3 py-2.5 flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--vp-magenta-text)] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
              <span className="font-pixel text-[16px] text-[var(--vp-error)] uppercase tracking-wider">{error}</span>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="bg-green-50 border-2 border-green-600 px-3 py-2.5 flex items-center gap-2">
              <span className="material-symbols-outlined text-green-600 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <span className="font-pixel text-[16px] text-green-700 uppercase tracking-wider">ACCESS RESTORED — REDIRECTING...</span>
            </div>
          )}

          {/* Dev code notice */}
          {devCode && (
            <div className="bg-[var(--vp-container-low)] border-2 border-[var(--vp-cyan)] px-4 py-3">
              <p className="font-pixel text-[14px] text-[var(--vp-cyan-text)] uppercase tracking-wider">
                DEV MODE — OTP: <span className="font-bold text-lg">{devCode}</span>
              </p>
            </div>
          )}

          {/* Step 1: Email */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="flex gap-4 sm:gap-6 items-start">
              <div className="w-12 h-12 bg-[var(--vp-ink)] text-[var(--vp-white-text)] font-pixel text-[20px] flex items-center justify-center border-2 border-[var(--vp-ink)] shadow-[4px_4px_0px_0px_var(--vp-saffron)] shrink-0 font-bold">
                01
              </div>
              <div className="flex-grow bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] p-5 voxel-shadow">
                <label className="block font-pixel text-[15px] text-[var(--vp-ink-text)] mb-1 uppercase font-bold tracking-wider">
                  EMAIL ID
                </label>
                <p className="font-pixel text-[13px] text-[var(--vp-muted)] mb-3 uppercase tracking-wider">
                  Enter the email associated with your account
                </p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] p-3 font-pixel text-[18px] text-[var(--vp-ink-text)] focus:outline-none focus:border-[var(--vp-cyan)] transition-all placeholder:text-[var(--vp-outline-variant)]"
                />
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="mt-4 w-full bg-[var(--vp-ink)] text-[var(--vp-white-text)] font-pixel text-[18px] px-6 py-3 border-2 border-[var(--vp-ink)] shadow-[4px_4px_0px_0px_var(--vp-saffron)] voxel-btn-active uppercase flex items-center justify-center gap-2 cursor-pointer transition-all hover:bg-[#00044a] disabled:opacity-60 disabled:cursor-wait"
                >
                  <span className="material-symbols-outlined text-xl">mail</span>
                  {loading ? 'Sending OTP...' : 'Send Verification Code'}
                </button>
              </div>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="flex gap-4 sm:gap-6 items-start">
              <div className="w-12 h-12 bg-[var(--vp-ink)] text-[var(--vp-white-text)] font-pixel text-[20px] flex items-center justify-center border-2 border-[var(--vp-ink)] shadow-[4px_4px_0px_0px_var(--vp-saffron)] shrink-0 font-bold">
                02
              </div>
              <div className="flex-grow bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] p-5 voxel-shadow">
                <label className="block font-pixel text-[15px] text-[var(--vp-ink-text)] mb-2 uppercase font-bold tracking-wider">
                  VERIFICATION CODE (OTP)
                </label>
                <p className="font-pixel text-[13px] text-[var(--vp-muted)] mb-3 uppercase tracking-wider">
                  6-digit code sent to {email}
                </p>
                <div className="flex gap-2 items-center flex-wrap">
                  {[0, 1, 2].map((idx) => (
                    <input
                      key={idx}
                      ref={(el) => { otpInputs.current[idx] = el; }}
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
                      ref={(el) => { otpInputs.current[idx] = el; }}
                      type="text"
                      maxLength={1}
                      value={otp[idx]}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e.target)}
                      className="w-11 h-14 sm:w-14 sm:h-14 text-center border-2 border-[var(--vp-ink)] font-pixel text-2xl text-[var(--vp-ink-text)] focus:outline-none focus:border-[var(--vp-cyan)] focus:bg-[var(--vp-container-low)] transition-colors bg-[var(--vp-white)] font-bold"
                    />
                  ))}
                </div>
                <button
                  type="submit"
                  disabled={loading || otp.join('').length !== 6}
                  className="mt-4 w-full bg-[var(--vp-ink)] text-[var(--vp-white-text)] font-pixel text-[18px] px-6 py-3 border-2 border-[var(--vp-ink)] shadow-[4px_4px_0px_0px_var(--vp-saffron)] voxel-btn-active uppercase flex items-center justify-center gap-2 cursor-pointer transition-all hover:bg-[#00044a] disabled:opacity-60 disabled:cursor-wait"
                >
                  <span className="material-symbols-outlined text-xl">verified</span>
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setError(null);
                    setLoading(true);
                    try {
                      const result = await sendOtp(email.trim(), 'reset');
                      setDevCode(result.devCode || null);
                    } catch (err) {
                      setError(err instanceof ApiError ? err.message : 'Failed to resend OTP');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="mt-3 w-full bg-[var(--vp-cream)] text-[var(--vp-ink-text)] border-2 border-[var(--vp-ink)] py-2.5 font-pixel text-[16px] uppercase tracking-wider voxel-shadow-sm voxel-btn-active transition-all flex items-center justify-center gap-2 hover:bg-[var(--vp-container)] cursor-pointer"
                >
                  Resend OTP
                </button>
              </div>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="flex gap-4 sm:gap-6 items-start">
              <div className="w-12 h-12 bg-[var(--vp-ink)] text-[var(--vp-white-text)] font-pixel text-[20px] flex items-center justify-center border-2 border-[var(--vp-ink)] shadow-[4px_4px_0px_0px_var(--vp-saffron)] shrink-0 font-bold">
                03
              </div>
              <div className="flex-grow bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] p-5 voxel-shadow">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="block font-pixel text-[15px] text-[var(--vp-ink-text)] uppercase font-bold tracking-wider">
                      NEW PASSKEY
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] p-3 font-pixel text-[18px] text-[var(--vp-ink-text)] focus:outline-none focus:border-[var(--vp-cyan)] transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="block font-pixel text-[15px] text-[var(--vp-ink-text)] uppercase font-bold tracking-wider">
                      CONFIRM NEW PASSKEY
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] p-3 font-pixel text-[18px] text-[var(--vp-ink-text)] focus:outline-none focus:border-[var(--vp-cyan)] transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !password || !confirmPassword}
                  className="mt-4 w-full bg-[var(--vp-ink)] text-[var(--vp-white-text)] font-pixel text-[18px] px-6 py-3 border-2 border-[var(--vp-ink)] shadow-[4px_4px_0px_0px_var(--vp-saffron)] voxel-btn-active uppercase flex items-center justify-center gap-2 cursor-pointer transition-all hover:bg-[#00044a] disabled:opacity-60 disabled:cursor-wait"
                >
                  <span className="material-symbols-outlined text-xl">lock_reset</span>
                  {loading ? 'Restoring Access...' : 'Restore Access'}
                </button>
              </div>
            </form>
          )}

          {/* Support Link */}
          <div className="text-center mt-2">
            <a
              href="#support"
              onClick={(e) => {
                e.preventDefault();
                alert('Security Support: support@veripass.protocol.net | Emergency Key Recovery: 0x892A');
              }}
              className="text-[15px] text-[var(--vp-ink-text)] underline hover:text-[var(--vp-saffron-text)] transition-colors cursor-pointer"
            >
              Contact Security Support
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};
