import React, { useState, useEffect } from 'react';
import { ScreenType } from '../types';
import { TopAppBar } from '../components/TopAppBar';
import { UserInfo, sendOtp, verifyOtp, generateBackupCodes, getBackupCodes, useBackupCode, toggleBiometric, BackupCode } from '../lib/api';

interface ProfileSecurityScreenProps {
  onNavigate: (screen: ScreenType, transition?: 'push' | 'push_back' | 'none') => void;
  user: UserInfo | null;
}

export const ProfileSecurityScreen: React.FC<ProfileSecurityScreenProps> = ({ onNavigate, user }) => {
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  // OTP state
  const [otpEmail, setOtpEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);

  // Backup codes state
  const [backupCodes, setBackupCodes] = useState<BackupCode[]>([]);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [showCodes, setShowCodes] = useState(false);

  // Password reset state
  const [resetMode, setResetMode] = useState(false);
  const [resetOtp, setResetOtp] = useState('');
  const [resetNewPass, setResetNewPass] = useState('');
  const [resetConfirmPass, setResetConfirmPass] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) setOtpEmail(user.origin || '');
    // Fetch existing backup codes
    getBackupCodes().then(({ codes }) => {
      setBackupCodes(codes);
      if (codes.length > 0) setShowCodes(true);
    }).catch(() => {});
  }, [user]);

  // Send OTP
  const handleSendOtp = async () => {
    if (!otpEmail) { setOtpMessage('Enter your email first'); return; }
    setOtpLoading(true);
    setOtpMessage(null);
    try {
      const res = await sendOtp(otpEmail, 'reset');
      setOtpSent(true);
      setOtpMessage(res.devCode ? `Dev code: ${res.devCode}` : 'OTP sent to your email');
    } catch (err: any) {
      setOtpMessage(err.message || 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) { setOtpMessage('Enter 6-digit code'); return; }
    setOtpLoading(true);
    setOtpMessage(null);
    try {
      await verifyOtp(otpEmail, otpCode, 'reset');
      setOtpMessage('Email verified successfully!');
      setOtpSent(false);
      setOtpCode('');
    } catch (err: any) {
      setOtpMessage(err.message || 'Invalid OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  // Generate backup codes
  const handleGenerateBackupCodes = async () => {
    setBackupLoading(true);
    setBackupMessage(null);
    try {
      const { codes } = await generateBackupCodes();
      setBackupCodes(codes);
      setShowCodes(true);
      setBackupMessage('New backup codes generated! Save them securely.');
    } catch (err: any) {
      setBackupMessage(err.message || 'Failed to generate codes');
    } finally {
      setBackupLoading(false);
    }
  };

  // Fetch existing backup codes
  const handleFetchBackupCodes = async () => {
    setBackupLoading(true);
    try {
      const { codes } = await getBackupCodes();
      setBackupCodes(codes);
      if (codes.length > 0) setShowCodes(true);
    } catch (err: any) {
      setBackupMessage(err.message || 'Failed to fetch codes');
    } finally {
      setBackupLoading(false);
    }
  };

  // Toggle biometric
  const handleToggleBiometric = async () => {
    setBiometricLoading(true);
    try {
      const res = await toggleBiometric(!biometricEnabled);
      setBiometricEnabled(res.biometricEnabled);
    } catch (err: any) {
      // silently fail — biometric is a device feature
    } finally {
      setBiometricLoading(false);
    }
  };

  return (
    <div className="bg-[var(--vp-cream)] text-[var(--vp-on-surface)] font-['Inter'] min-h-screen pb-28 pt-16 flex flex-col">
      <TopAppBar currentScreen="profile-security" onNavigate={onNavigate} title="SECURITY" />

      <main className="max-w-4xl mx-auto w-full px-4 md:px-8 py-6 flex flex-col gap-6">
        {/* Security Status */}
        <section className="flex flex-col items-start gap-3">
          <h2 className="text-2xl font-bold text-[var(--vp-ink-text)] tracking-tight">
            SECURITY STATUS
          </h2>
          <div className="bg-[var(--vp-green)] text-[var(--vp-white-text)] font-pixel text-[18px] px-4 py-1.5 border-2 border-[var(--vp-ink)] voxel-shadow-sm flex items-center gap-2 font-bold tracking-wider">
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              shield
            </span>
            PROTECTED
          </div>
        </section>

        {/* Biometric Data */}
        <section className="bg-[var(--vp-cream)] border-2 border-[var(--vp-ink)] voxel-shadow p-5 sm:p-6 flex flex-col gap-5">
          <div className="flex items-center gap-3 border-b-2 border-[var(--vp-ink)] pb-3">
            <span className="material-symbols-outlined text-[var(--vp-ink-text)] text-2xl">
              fingerprint
            </span>
            <h3 className="text-xl font-bold text-[var(--vp-ink-text)]">BIOMETRIC DATA</h3>
          </div>

          <div className="flex justify-between items-center bg-[var(--vp-container)] p-4 border-2 border-[var(--vp-ink)]">
            <div className="flex flex-col">
              <span className="text-[17px] text-[var(--vp-ink-text)] font-bold">Fingerprint / Face ID</span>
              <span className="font-pixel text-[14px] text-[var(--vp-outline)]">
                STATUS: {biometricEnabled ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleBiometric}
              disabled={biometricLoading}
              className={`border-2 border-[var(--vp-ink)] px-4 py-2 font-pixel text-[17px] voxel-btn-active cursor-pointer transition-all disabled:opacity-50 ${
                biometricEnabled
                  ? 'bg-[var(--vp-green)] text-[var(--vp-white-text)] voxel-shadow-sm'
                  : 'bg-[var(--vp-ink)] text-[var(--vp-white-text)] voxel-shadow-saffron'
              }`}
            >
              {biometricLoading ? '...' : biometricEnabled ? 'ACTIVE' : 'ENABLE'}
            </button>
          </div>
        </section>

        {/* Email Verification / OTP */}
        <section className="bg-[var(--vp-cream)] border-2 border-[var(--vp-ink)] voxel-shadow p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b-2 border-[var(--vp-ink)] pb-3">
            <span className="material-symbols-outlined text-[var(--vp-ink-text)] text-2xl">
              mail
            </span>
            <h3 className="text-xl font-bold text-[var(--vp-ink-text)]">EMAIL VERIFICATION (OTP)</h3>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-pixel text-[14px] text-[var(--vp-muted)] uppercase tracking-wider">
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                value={otpEmail}
                onChange={(e) => setOtpEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full p-3 font-pixel text-[18px] bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] focus:outline-none focus:border-[var(--vp-cyan)] transition-all"
              />
            </div>

            {!otpSent ? (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={otpLoading || !otpEmail}
                className="self-start bg-[var(--vp-ink)] text-[var(--vp-white-text)] font-pixel text-[17px] py-2.5 px-5 border-2 border-[var(--vp-ink)] voxel-shadow-saffron voxel-btn-active flex items-center gap-2 uppercase tracking-widest cursor-pointer transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">send</span>
                {otpLoading ? 'SENDING...' : 'SEND OTP'}
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full p-3 font-pixel text-[22px] tracking-[0.3em] text-center bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] focus:outline-none focus:border-[var(--vp-cyan)] transition-all"
                />
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={otpLoading || otpCode.length !== 6}
                  className="self-start bg-[var(--vp-green)] text-[var(--vp-white-text)] font-pixel text-[17px] py-2.5 px-5 border-2 border-[var(--vp-ink)] voxel-shadow-sm voxel-btn-active flex items-center gap-2 uppercase tracking-widest cursor-pointer transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  {otpLoading ? 'VERIFYING...' : 'VERIFY OTP'}
                </button>
              </div>
            )}

            {otpMessage && (
              <div className={`p-3 border-2 font-pixel text-[15px] ${
                otpMessage.includes('success') || otpMessage.includes('sent') || otpMessage.includes('Dev code')
                  ? 'border-[var(--vp-green)] bg-[var(--vp-container-low)] text-[var(--vp-green-text)]'
                  : 'border-[var(--vp-magenta)] bg-[var(--vp-error-container)] text-[var(--vp-error)]'
              }`}>
                {otpMessage}
              </div>
            )}
          </div>
        </section>

        {/* Password Reset */}
        <section className="bg-[var(--vp-cream)] border-2 border-[var(--vp-ink)] voxel-shadow p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b-2 border-[var(--vp-ink)] pb-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[var(--vp-ink-text)] text-2xl">
                key
              </span>
              <h3 className="text-xl font-bold text-[var(--vp-ink-text)]">PASSWORD RESET</h3>
            </div>
            <button
              type="button"
              onClick={() => setResetMode(!resetMode)}
              className="font-pixel text-[15px] text-[var(--vp-ink-text)] underline hover:text-[var(--vp-saffron-text)] cursor-pointer"
            >
              {resetMode ? 'CANCEL' : 'RESET PASSWORD'}
            </button>
          </div>

          {resetMode && (
            <div className="flex flex-col gap-3">
              <p className="text-[14px] text-[var(--vp-muted)]">
                Verify your email via OTP first, then set a new passkey.
              </p>
              <div className="flex flex-col gap-1">
                <label className="font-pixel text-[14px] text-[var(--vp-muted)] uppercase tracking-wider">OTP CODE</label>
                <input
                  type="text"
                  value={resetOtp}
                  onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full p-3 font-pixel text-[18px] bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] focus:outline-none focus:border-[var(--vp-cyan)] transition-all"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-pixel text-[14px] text-[var(--vp-muted)] uppercase tracking-wider">NEW PASSKEY</label>
                <input
                  type="password"
                  value={resetNewPass}
                  onChange={(e) => setResetNewPass(e.target.value)}
                  placeholder="********"
                  className="w-full p-3 font-pixel text-[18px] bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] focus:outline-none focus:border-[var(--vp-cyan)] transition-all"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-pixel text-[14px] text-[var(--vp-muted)] uppercase tracking-wider">CONFIRM PASSKEY</label>
                <input
                  type="password"
                  value={resetConfirmPass}
                  onChange={(e) => setResetConfirmPass(e.target.value)}
                  placeholder="********"
                  className="w-full p-3 font-pixel text-[18px] bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] focus:outline-none focus:border-[var(--vp-cyan)] transition-all"
                />
              </div>
              {resetNewPass && resetConfirmPass && resetNewPass !== resetConfirmPass && (
                <p className="font-pixel text-[14px] text-[var(--vp-error)]">PASSKEYS DO NOT MATCH</p>
              )}
              <button
                type="button"
                onClick={async () => {
                  if (resetNewPass !== resetConfirmPass) return;
                  if (resetNewPass.length < 4) { setResetMessage('Passkey must be at least 4 characters'); return; }
                  setResetLoading(true);
                  setResetMessage(null);
                  try {
                    await (await import('../lib/api')).resetPassword(otpEmail, resetOtp, resetNewPass);
                    setResetMessage('Password reset successful! Redirecting to login...');
                    setResetMode(false);
                    setTimeout(() => onNavigate('login', 'push_back'), 2000);
                  } catch (err: any) {
                    setResetMessage(err.message || 'Reset failed');
                  } finally {
                    setResetLoading(false);
                  }
                }}
                disabled={resetLoading || resetNewPass !== resetConfirmPass || resetNewPass.length < 4}
                className="self-start bg-[var(--vp-ink)] text-[var(--vp-white-text)] font-pixel text-[17px] py-2.5 px-5 border-2 border-[var(--vp-ink)] voxel-shadow-saffron voxel-btn-active flex items-center gap-2 uppercase tracking-widest cursor-pointer transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">lock_reset</span>
                {resetLoading ? 'RESETTING...' : 'RESET PASSWORD'}
              </button>
              {resetMessage && (
                <div className={`p-3 border-2 font-pixel text-[15px] ${
                  resetMessage.includes('success')
                    ? 'border-[var(--vp-green)] bg-[var(--vp-container-low)] text-[var(--vp-green-text)]'
                    : 'border-[var(--vp-magenta)] bg-[var(--vp-error-container)] text-[var(--vp-error)]'
                }`}>
                  {resetMessage}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Backup / Recovery Codes */}
        <section className="bg-[var(--vp-cream)] border-2 border-[var(--vp-magenta)] shadow-[4px_4px_0px_0px_var(--vp-magenta)] p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b-2 border-[var(--vp-magenta)] pb-3">
            <span className="material-symbols-outlined text-[var(--vp-magenta-text)] text-2xl">
              warning
            </span>
            <h3 className="text-xl font-bold text-[var(--vp-magenta-text)]">BACKUP / RECOVERY CODES</h3>
          </div>

          <p className="text-[15px] text-[var(--vp-muted)]">
            Store these codes in a secure location. Each code can be used once to recover access if you lose your primary authentication methods.
          </p>

          {showCodes && backupCodes.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {backupCodes.map((code, i) => (
                <div
                  key={i}
                  className={`p-2 border-2 border-[var(--vp-ink)] font-pixel text-[16px] tracking-wider text-center ${
                    code.used
                      ? 'bg-[var(--vp-container)] text-[var(--vp-outline)] line-through opacity-50'
                      : 'bg-[var(--vp-error-container)] text-[var(--vp-error)] font-bold'
                  }`}
                >
                  {code.code}
                </div>
              ))}
            </div>
          )}

          {backupMessage && (
            <div className={`p-3 border-2 font-pixel text-[15px] ${
              backupMessage.includes('generated')
                ? 'border-[var(--vp-green)] bg-[var(--vp-container-low)] text-[var(--vp-green-text)]'
                : 'border-[var(--vp-magenta)] bg-[var(--vp-error-container)] text-[var(--vp-error)]'
            }`}>
              {backupMessage}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleGenerateBackupCodes}
              disabled={backupLoading}
              className="self-start bg-[var(--vp-cream)] text-[var(--vp-magenta-text)] font-pixel text-[17px] py-2.5 px-5 border-2 border-[var(--vp-magenta)] shadow-[4px_4px_0px_0px_var(--vp-magenta)] hover:bg-[var(--vp-magenta)] hover:text-[var(--vp-white-text)] voxel-btn-active transition-all flex justify-center items-center gap-2 uppercase cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
              {backupLoading ? 'GENERATING...' : 'GENERATE NEW CODES'}
            </button>
            {!showCodes && (
              <button
                type="button"
                onClick={handleFetchBackupCodes}
                disabled={backupLoading}
                className="self-start bg-[var(--vp-ink)] text-[var(--vp-white-text)] font-pixel text-[17px] py-2.5 px-5 border-2 border-[var(--vp-ink)] voxel-shadow-sm voxel-btn-active transition-all flex justify-center items-center gap-2 uppercase cursor-pointer disabled:opacity-50"
              >
                VIEW EXISTING CODES
              </button>
            )}
          </div>
        </section>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-3 bg-[var(--vp-cream)] border-t-4 border-[var(--vp-ink)] shadow-[0px_-4px_0px_0px_rgba(1,7,102,1)] md:hidden">
        <button onClick={() => onNavigate('scan', 'none')} className="flex flex-col items-center justify-center text-[var(--vp-muted)] p-1 hover:bg-[var(--vp-container)] active:scale-95 transition-transform w-16 cursor-pointer">
          <span className="material-symbols-outlined text-2xl">qr_code_scanner</span>
          <span className="font-pixel text-[13px] uppercase mt-1">Scan</span>
        </button>
        <button onClick={() => onNavigate('inventory', 'none')} className="flex flex-col items-center justify-center text-[var(--vp-muted)] p-1 hover:bg-[var(--vp-container)] active:scale-95 transition-transform w-16 cursor-pointer">
          <span className="material-symbols-outlined text-2xl">inventory_2</span>
          <span className="font-pixel text-[13px] uppercase mt-1">Vault</span>
        </button>
        <button onClick={() => onNavigate('history', 'none')} className="flex flex-col items-center justify-center text-[var(--vp-muted)] p-1 hover:bg-[var(--vp-container)] active:scale-95 transition-transform w-16 cursor-pointer">
          <span className="material-symbols-outlined text-2xl">history</span>
          <span className="font-pixel text-[13px] uppercase mt-1">History</span>
        </button>
        <button onClick={() => onNavigate('account', 'none')} className="flex flex-col items-center justify-center bg-[var(--vp-saffron)] text-[var(--vp-black-text)] border-2 border-[var(--vp-ink)] p-1 active:scale-95 transition-transform w-16 font-bold voxel-shadow-sm cursor-pointer">
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
          <span className="font-pixel text-[13px] uppercase mt-1">Profile</span>
        </button>
      </nav>
    </div>
  );
};
