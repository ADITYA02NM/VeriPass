/**
 * VeriPass — Shared PeraWalletConnect singleton.
 * Used by LoginScreen (connect) and PaymentScreen (sign transactions).
 */
import { PeraWalletConnect } from '@perawallet/connect';

export const peraWallet = new PeraWalletConnect({ chainId: 416002 });
