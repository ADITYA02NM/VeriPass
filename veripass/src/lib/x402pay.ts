/**
 * VeriPass — Shared x402 auto-payment helper.
 * Pays via Pera wallet (client-side signing) for wallet users,
 * or server-side mnemonic signing for standard users.
 * Returns an X-Pay-Signature proof usable on any 402-gated endpoint.
 */
import { peraWallet } from './pera';
import { payX402, recordClientPayment } from './api';
import * as algosdk from 'algosdk';

const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const PLATFORM_RECEIVER = 'NYRK2742GDQ7KIRNGWCHKVUKVUZTFDXVKWXT3N5HTAV6IMWWDSPNT7ZOPM';
const X402_NOTE = 'VeriPass product verification report (x402 · Algorand)';

export interface AutoPayResult {
  xPaySignature: string;
  txId: string;
  /** Amount actually paid on-chain, e.g. "0.005" */
  amount: string;
}

/**
 * Silently pay `amountAlgo` to the platform receiver.
 * Pera users sign on-device; everyone else pays from their backend wallet.
 */
export async function autoX402Pay(
  userWalletAddress: string | undefined,
  amountAlgo: string,
): Promise<AutoPayResult> {
  const amountMicro = Math.round(parseFloat(amountAlgo) * 1_000_000);

  // ---- Pera wallet user: client-side signing ----
  if (userWalletAddress) {
    let accounts: string[] = [];
    try {
      accounts = await peraWallet.reconnectSession();
    } catch {
      accounts = await peraWallet.connect();
    }
    const sender = accounts[0] || userWalletAddress;
    if (!sender) throw new Error('No Pera wallet address returned');

    const algod = new algosdk.Algodv2('', ALGOD_SERVER, '');
    const suggestedParams = await algod.getTransactionParams().do();

    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender,
      receiver: PLATFORM_RECEIVER,
      amount: amountMicro,
      suggestedParams,
      note: new TextEncoder().encode(X402_NOTE),
    });

    const signedTxns = await peraWallet.signTransaction([[{ txn: txn.toByte() }]]);
    const { txId } = await algod.sendRawTransaction(signedTxns[0]).do();
    await algosdk.waitForConfirmation(algod, txId, 10);

    const result = await recordClientPayment(txId, sender, amountAlgo);
    return { xPaySignature: result.xPaySignature, txId, amount: amountAlgo };
  }

  // ---- Standard user: server-side mnemonic signing ----
  const result = await payX402('ai');
  // Use the ACTUAL amount the server charged (source of truth), not our estimate.
  return { xPaySignature: result.xPaySignature, txId: result.txId, amount: result.amount };
}
