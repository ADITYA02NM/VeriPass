#!/usr/bin/env node
/**
 * VeriPass — Generate wallets for all users + platform receiver
 * Funds each wallet from the existing testnet account
 */
import algosdk from 'algosdk';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const WALLET_FILE = path.join(DATA_DIR, 'wallets.json');
const ACCOUNT_FILE = path.join(DATA_DIR, 'testnet-account.json');
const ALGOD_URL = 'https://testnet-api.algonode.cloud';
const FUND_AMOUNT = 10_000_000; // 10 ALGO in microAlgos
const FEE = 1000;

function loadExistingAccount() {
  try {
    const acc = JSON.parse(fs.readFileSync(ACCOUNT_FILE, 'utf8'));
    if (!acc.address || !acc.mnemonic) return null;
    return acc;
  } catch (e) {
    console.error('Failed to load existing account:', e.message);
    return null;
  }
}

function generateWallet(label) {
  const account = algosdk.generateAccount();
  const mnemonic = algosdk.secretKeyToMnemonic(account.sk);
  // algosdk v3 uses 'addr' not 'address'
  const address = account.addr || account.address;
  return { label, address, mnemonic };
}

async function fundWallet(algod, senderMnemonic, receiverAddress, amount) {
  const sender = algosdk.mnemonicToSecretKey(senderMnemonic);
  const params = await algod.getTransactionParams().do();
  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: sender.addr || sender.address,
    receiver: receiverAddress,
    amount,
    suggestedParams: params,
  });
  const signed = txn.signTxn(sender.sk);
  const sent = await algod.sendRawTransaction(signed).do();
  const txId = sent.txId ?? sent.txid;
  await algosdk.waitForConfirmation(algod, txId, 4);
  return txId;
}

async function main() {
  console.log('🔑 VeriPass Wallet Generator\n');
  
  const existing = loadExistingAccount();
  if (!existing) {
    console.error('❌ No existing funded account found at', ACCOUNT_FILE);
    process.exit(1);
  }
  
  const algod = new algosdk.Algodv2('', ALGOD_URL, '');
  
  // Check balance
  const info = await algod.accountInformation(existing.address).do();
  const balanceMicro = Number(info.amount || 0);
  const balance = balanceMicro / 1_000_000;
  console.log(`📋 Sender: ${existing.address}`);
  console.log(`💰 Balance: ${balance} ALGO\n`);
  
  // Calculate how many we can fund
  // 5 new wallets × (10 ALGO + 0.001 fee) = ~50.005 ALGO needed
  // We have ~19.97 ALGO
  const perWallet = balance > 55 ? 10_000_000 : 
                    balance > 10 ? Math.floor((balance / 6) * 1_000_000) - FEE :
                    500_000; // 0.5 ALGO minimum
  
  const walletsToCreate = [
    { label: 'platform-receiver', userId: null },
    { label: 'user', userId: 'user' },
    { label: 'pro', userId: 'pro' },
    { label: 'log', userId: 'log' },
    { label: 'ret', userId: 'ret' },
    { label: 'ravi', userId: 'ravi' },
  ];
  
  console.log(`💸 Will fund each wallet with ${(perWallet / 1_000_000).toFixed(2)} ALGO\n`);
  
  const wallets = {};
  
  for (const def of walletsToCreate) {
    const wallet = generateWallet(def.label);
    wallets[def.label] = {
      address: wallet.address,
      mnemonic: wallet.mnemonic,
      userId: def.userId,
    };
    console.log(`✅ Generated ${def.label}: ${wallet.address}`);
  }
  
  console.log('\n💸 Funding wallets...\n');
  
  for (const [label, wallet] of Object.entries(wallets)) {
    try {
      const txId = await fundWallet(algod, existing.mnemonic, wallet.address, perWallet);
      wallet.funded = true;
      wallet.fundTxId = txId;
      wallet.fundAmount = perWallet;
      console.log(`✅ Funded ${label}: ${wallet.address}`);
      console.log(`   TX: https://lora.algokit.io/testnet/transaction/${txId}`);
    } catch (e) {
      wallet.funded = false;
      wallet.fundError = e.message;
      console.error(`❌ Failed to fund ${label}:`, e.message);
    }
    await new Promise(r => setTimeout(r, 1200));
  }
  
  // Save wallets
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(WALLET_FILE, JSON.stringify(wallets, null, 2));
  console.log(`\n💾 Saved to ${WALLET_FILE}`);
  
  // Summary
  console.log('\n' + '═'.repeat(65));
  console.log(' VERIPASS WALLET SUMMARY');
  console.log('═'.repeat(65));
  console.log(`\n🏦 Platform Receiver (takes fees):`);
  console.log(`   ${wallets['platform-receiver'].address}`);
  console.log(`\n👤 User Wallets (send payments):`);
  for (const [label, wallet] of Object.entries(wallets)) {
    if (label === 'platform-receiver') continue;
    const status = wallet.funded ? '✅' : '❌';
    const amt = wallet.fundAmount ? ` (${(wallet.fundAmount/1_000_000).toFixed(2)} ALGO)` : '';
    console.log(`   ${status} ${label.padEnd(12)} ${wallet.address}${amt}`);
  }
  console.log('\n' + '═'.repeat(65));
  
  // Sender remaining balance
  try {
    const newInfo = await algod.accountInformation(existing.address).do();
    const newBal = Number(newInfo.amount || 0) / 1_000_000;
    console.log(`\n💰 Sender remaining balance: ${newBal.toFixed(4)} ALGO`);
  } catch {}
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
