/**
 * VeriPass — x402 (HTTP 402 Payment Required) on Algorand
 *
 * Per-user wallet payments: each user has their own funded wallet (from wallets.json).
 * Payments go FROM the user's wallet TO the platform receiver wallet.
 * REAL ONLY: every payment is an actual on-chain TestNet transaction signed
 * with the user's mnemonic. If the send fails it is retried up to 3 times;
 * users without a funded mnemonic wallet get a clear error (link a wallet or
 * connect Pera) instead of a fake simulated transaction.
 *
 * The x402 header protocol is identical in both modes:
 *   X-Pay-Provider: algorand
 *   X-Pay-Payload:  base64url({amount, receiverAddress, description, network})
 *   Retry-After: 0
 */
import { db } from './db.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import algosdk from 'algosdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WALLETS_FILE = path.join(__dirname, 'data', 'wallets.json');
const ALGOD_URL = 'https://testnet-api.algonode.cloud';

// Platform receiver wallet — all payments go TO this address
const PLATFORM_RECEIVER = 'NYRK2742GDQ7KIRNGWCHKVUKVUZTFDXVKWXT3N5HTAV6IMWWDSPNT7ZOPM';

export const X402 = {
  provider: 'algorand',
  network: 'testnet-v1.0',
  amount: '0.002',                    // 0.002 ALGO per verification
  receiverAddress: PLATFORM_RECEIVER,
  description: 'VeriPass product verification report (x402 · Algorand)',
};

/** Load all wallets from wallets.json (platform-receiver + per-user wallets). */
function loadWallets() {
  try {
    return JSON.parse(fs.readFileSync(WALLETS_FILE, 'utf8'));
  } catch (e) {
    console.error('[x402] loadWallets failed:', e.message);
    return null;
  }
}

/** Resolve a user's wallet mnemonic from wallets.json by their identifier. */
function getUserWallet(ownerKey) {
  const wallets = loadWallets();
  if (!wallets) return null;
  const entry = wallets[ownerKey];
  if (!entry || !entry.mnemonic) return null;
  const acc = algosdk.mnemonicToSecretKey(entry.mnemonic);
  return { address: acc.addr.toString(), mnemonic: entry.mnemonic, sk: acc.sk };
}

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

function unb64url(s) {
  return JSON.parse(Buffer.from(s, 'base64url').toString('utf8'));
}

/** x402 payment challenge headers (RFC-compliant 402 response). */
export function paymentChallenge(amount = X402.amount) {
  return {
    'X-Pay-Provider': X402.provider,
    'X-Pay-Payload': b64url({
      amount,
      receiverAddress: X402.receiverAddress,
      description: X402.description,
      network: X402.network,
    }),
    'Retry-After': '0',
  };
}

/** REAL Algorand TestNet payment — FROM user wallet TO platform receiver. */
async function realAlgorandPayment(ownerKey, amount = X402.amount) {
  const wallet = getUserWallet(ownerKey);
  if (!wallet) return null;

  const algod = new algosdk.Algodv2('', ALGOD_URL, '');

  // Wallet must be funded (min balance + fee + the payment amount)
  const acctInfo = await algod.accountInformation(wallet.address).do();
  const micro = Number(acctInfo.amount || 0);
  const microAlgos = Math.round(parseFloat(amount) * 1_000_000);
  if (micro < microAlgos + 1000) return null; // unfunded → caller falls back to sim

  const params = await algod.getTransactionParams().do();
  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: wallet.address,
    receiver: PLATFORM_RECEIVER,  // platform receiver takes fees
    amount: microAlgos,
    suggestedParams: params,
  });
  const signed = txn.signTxn(wallet.sk);
  const sent = await algod.sendRawTransaction(signed).do();
  const txId = sent.txId ?? sent.txid; // algosdk v3 returns lowercase 'txid'
  await algosdk.waitForConfirmation(algod, txId, 10);
  const confirmed = await algod.pendingTransactionInformation(txId).do();
  const round = Number(confirmed.confirmedRound ?? confirmed['confirmed-round'] ?? 0);

  db.prepare(
    'INSERT INTO payments (txid, owner_key, amount, network, round, sender, receiver) VALUES (?,?,?,?,?,?,?)'
  ).run(txId, ownerKey, amount, 'testnet-v1.0', round, wallet.address, PLATFORM_RECEIVER);

  return { txId, sender: wallet.address, round, amount, network: 'testnet-v1.0' };
}

/**
 * POST /api/x402/pay — REAL TestNet payment from the user's mnemonic wallet
 * TO the merchant (platform receiver). No simulation, ever.
 *   - On transient on-chain failures the send is RETRIED up to 3 times.
 *   - Throws NO_WALLET when the user has no mnemonic wallet linked
 *     (they should link one or pay client-side via Pera WalletConnect).
 *   - Throws INSUFFICIENT_FUNDS when the wallet balance can't cover it.
 */
export async function simulateAlgorandPayment(ownerKey, amount = X402.amount) {
  let wallet = null;
  try {
    wallet = getUserWallet(ownerKey);
  } catch (e) {
    console.error(`[x402] ${ownerKey}: wallet load failed:`, e.message);
  }

  if (!wallet || !wallet.mnemonic) {
    throw new Error('NO_WALLET: no mnemonic wallet linked for this account — link a TestNet mnemonic (Register/Profile) or connect Pera Wallet.');
  }

  let lastErr = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const real = await realAlgorandPayment(ownerKey, amount);
      if (real) return real;
      // null = balance check failed inside → insufficient funds
      throw new Error(`INSUFFICIENT_FUNDS: wallet ${wallet.address} cannot cover ${amount} ALGO + fee`);
    } catch (e) {
      if (e.message.startsWith('INSUFFICIENT_FUNDS')) throw e;
      lastErr = e;
      console.error(`[x402] ${ownerKey}: real payment attempt ${attempt}/3 failed: ${e.message}`);
      if (attempt < 3) await new Promise((r) => setTimeout(r, 800));
    }
  }
  throw new Error(`PAYMENT_FAILED: on-chain send failed after 3 attempts — ${lastErr?.message || 'unknown error'}`);
}

/**
 * Verify an X-Pay-Signature proof (base64url {txId, sender, network}).
 * One-time use: the payment row is deleted after a successful verification.
 */
export function verifyPaymentProof(signatureHeader, ownerKey) {
  try {
    const sig = unb64url(signatureHeader);
    if (!sig.txId || !sig.sender) return { ok: false, reason: 'malformed proof' };
    const tx = db.prepare(
      'SELECT * FROM payments WHERE txid = ? AND owner_key = ?'
    ).get(sig.txId, ownerKey);
    if (!tx) return { ok: false, reason: 'unknown or expired proof' };
    if (tx.sender !== sig.sender) return { ok: false, reason: 'sender mismatch' };
    db.prepare('DELETE FROM payments WHERE txid = ?').run(sig.txId); // one-time use
    return { ok: true, tx };
  } catch {
    return { ok: false, reason: 'invalid signature header' };
  }
}