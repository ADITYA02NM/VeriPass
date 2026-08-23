import { useEffect, useState } from 'react';
import type { ScreenType, TransitionType, UserRole } from './types';
import type { UserInfo } from './lib/api';
import { getToken, getCachedUser, clearSession, getMe } from './lib/api';
import { LoginScreen } from './screens/LoginScreen';
import { ScanScreen } from './screens/ScanScreen';
import { InventoryScreen } from './screens/InventoryScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { AccountScreen } from './screens/AccountScreen';
import { ProfileSecurityScreen } from './screens/ProfileSecurityScreen';
import { PreferencesScreen } from './screens/PreferencesScreen';
import { DigitalSignaturesScreen } from './screens/DigitalSignaturesScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { PasswordResetScreen } from './screens/PasswordResetScreen';
import { PaymentScreen } from './screens/PaymentScreen';

import { AIChatScreen } from './screens/AIChatScreen';
import { WalletScreen } from './screens/WalletScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('login');
  const [userRole, setUserRole] = useState<UserRole>('Producer');
  const [historyStack, setHistoryStack] = useState<ScreenType[]>(['login']);
  const [user, setUser] = useState<UserInfo | null>(() => getCachedUser());
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [pendingSignature, setPendingSignature] = useState<string | null>(null);
  const [lastHistoryCode, setLastHistoryCode] = useState<string | null>(null);
  const [scanRestartToken, setScanRestartToken] = useState<number>(0);
  const [paymentReturn, setPaymentReturn] = useState<ScreenType>('scan');
  const [pendingHistorySignature, setPendingHistorySignature] = useState<string | null>(null);

  // Restore session + read ?qr= URL param (camera-app scan opens /?qr=CODE)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qr = params.get('qr');
    if (qr) {
      setPendingCode(qr);
      setCurrentScreen('scan');
      setHistoryStack(['login', 'scan']);
    }
    if (getToken()) {
      getMe()
        .then(({ user: u }) => setUser(u))
        .catch(() => clearSession());
    }
  }, []);

  const handleNavigate = (targetScreen: ScreenType, transition: TransitionType = 'none') => {
    // tapping the Scan tab while already on the scan screen → restart the camera
    if (targetScreen === 'scan' && currentScreen === 'scan') {
      setScanRestartToken((t) => t + 1);
    }
    if (transition === 'push') {
      setHistoryStack((stack) => [...stack, targetScreen]);
    } else if (transition === 'push_back') {
      setHistoryStack((stack) => (stack.length > 1 ? stack.slice(0, -1) : stack));
    } else {
      setHistoryStack((stack) => [...stack.slice(0, -1), targetScreen]);
    }
    setCurrentScreen(targetScreen);
    window.scrollTo(0, 0);
  };

  const handleLogin = (u: UserInfo) => {
    setUser(u);
    setUserRole(u.role);
  };

  const handleLogout = () => {
    clearSession();
    setUser(null);
    handleNavigate('login', 'none');
  };

  const handleOpenHistory = (code: string) => {
    setLastHistoryCode(code);
    handleNavigate('history', 'push');
  };

  const handleRequestPayment = (code: string) => {
    setPendingCode(code);
    setPaymentReturn(currentScreen);
    handleNavigate('payment', 'push');
  };

  const handlePaid = (signature: string) => {
    if (paymentReturn === 'history') {
      setPendingHistorySignature(signature);
    } else {
      setPendingSignature(signature);
    }
    handleNavigate(paymentReturn, 'push_back');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':
        return (
          <LoginScreen
            onNavigate={handleNavigate}
            onLogin={handleLogin}
          />
        );
      case 'scan':
        return (
          <ScanScreen
            onNavigate={handleNavigate}
            user={user}
            initialCode={pendingCode}
            onConsumeCode={() => setPendingCode(null)}
            pendingSignature={pendingSignature}
            onConsumeSignature={() => setPendingSignature(null)}
            restartToken={scanRestartToken}
            onOpenHistory={handleOpenHistory}
          />
        );
      case 'inventory':
        return (
          <InventoryScreen onNavigate={handleNavigate} user={user} onOpenHistory={handleOpenHistory} />
        );
      case 'history':
        return (
          <HistoryScreen
            onNavigate={handleNavigate}
            code={lastHistoryCode}
            onRequestPayment={handleRequestPayment}
            pendingSignature={pendingHistorySignature}
            onConsumeSignature={() => setPendingHistorySignature(null)}
          />
        );
      case 'account':
        return <AccountScreen onNavigate={handleNavigate} userRole={userRole} user={user} onLogout={handleLogout} />;
      case 'profile-security':
        return <ProfileSecurityScreen onNavigate={handleNavigate} user={user} />;
      case 'preferences':
        return <PreferencesScreen onNavigate={handleNavigate} user={user} />;
      case 'digital-signatures':
        return <DigitalSignaturesScreen onNavigate={handleNavigate} user={user} />;
      case 'register':
        return <RegisterScreen onNavigate={handleNavigate} onLogin={handleLogin} />;
      case 'password-reset':
        return <PasswordResetScreen onNavigate={handleNavigate} />;
      case 'payment':
        return <PaymentScreen onNavigate={handleNavigate} code={pendingCode} onPaid={handlePaid} />;
      case 'ai-chat':
        return <AIChatScreen onNavigate={handleNavigate} user={user} />;
      case 'wallet':
        return <WalletScreen onNavigate={handleNavigate} />;
      default:
        return <LoginScreen onNavigate={handleNavigate} onLogin={handleLogin} />;
    }
  };

  return (
    <div className="w-full min-h-screen bg-[var(--vp-cream)] selection:bg-[var(--vp-cyan)] selection:text-[var(--vp-ink-text)]">
      {renderScreen()}
    </div>
  );
}