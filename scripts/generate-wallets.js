#!/usr/bin/env node
/**
 * VeriPass — Generate wallets for all users + platform receiver
 * Funds each wallet with 10 ALGO from the existing testnet account
 */
import algosdk from 'algosdk';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'backend', 'data');
const WALLET_FILE = path.join(DATA_DIR, 'wallets.json');
const ACCOUNT_FILE = path.join(DATA_DIR, 'testnet-account.json');
const ALGOD_URL = 'https://testnet-api.algonode.cloud';
const FUND_AMOUNT = 10_000_000; // 10 ALGO in microAlgos

// Existing funded account (sender)
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

// Generate a new testnet wallet
function generateWallet(label) {
  const account = algosdk.generateAccount();
  const mnemonic = algosdk.secretKeyToMnemonic(account.sk);
  return {
    label,
    address: account.address,
    mnemonic,
    sk: Buffer.from(account.sk).toString('base64'),
  };
}

// Fund a wallet from the sender account
async function fundWallet(algod, senderMnemonic, receiverAddress, amount) {
  const sender = algosdk.mnemonicToSecretKey(senderMnemonic);
  const params = await algod.getTransactionParams().do();
  
  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: sender.address,
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
  
  // Load existing account
  const existing = loadExistingAccount();
  if (!existing) {
    console.error('❌ No existing funded account found at', ACCOUNT_FILE);
    console.log('   Run: node scripts/setup-testnet.js first');
    process.exit(1);
  }
  
  console.log('📋 Existing account:', existing.address);
  
  const algod = new algosdk.Algodv2('', ALGOD_URL, '');
  
  // Check existing balance
  try {
    const info = await algod.accountInformation(existing.address).do();
    const balance = Number(info.amount || 0) / 1_000_000;
    console.log(`💰 Existing balance: ${balance} ALGO\n`);
    
    if (balance < 60) {
      console.warn('⚠️  Warning: Need at least 60 ALGO to fund 6 wallets (10 ALGO each + fees)');
      console.warn('   Continuing anyway...\n');
    }
  } catch (e) {
    console.warn('⚠️  Could not check balance:', e.message);
  }
  
  // Define wallets to generate
  const walletDefs = [
    { label: 'platform-receiver', userId: null },  // Platform wallet (receives payments)
    { label: 'user', userId: 'user' },              // Consumer demo
    { label: 'pro', userId: 'pro' },                // Producer
    { label: 'log', userId: 'log' },                // Logistics
    { label: 'ret', userId: 'ret' },                // Retailer
    { label: 'ravi', userId: 'ravi' },              // Consumer
  ];
  
  // Generate wallets
  const wallets = {};
  for (const def of walletDefs) {
    const wallet = generateWallet(def.label);
    wallets[def.label] = {
      address: wallet.address,
      mnemonic: wallet.mnemonic,
      userId: def.userId,
    };
    console.log(`✅ Generated ${def.label}: ${wallet.address}`);
  }
  
  console.log('\n💸 Funding wallets with 10 ALGO each...\n');
  
  // Fund each wallet
  for (const [label, wallet] of Object.entries(wallets)) {
    try {
      const txId = await fundWallet(algod, existing.mnemonic, wallet.address, FUND_AMOUNT);
      wallet.funded = true;
      wallet.fundTxId = txId;
      console.log(`✅ Funded ${label}: ${wallet.address}`);
      console.log(`   TX: https://lora.algokit.io/testnet/transaction/${txId}`);
    } catch (e) {
      wallet.funded = false;
      wallet.fundError = e.message;
      console.error(`❌ Failed to fund ${label}:`, e.message);
    }
    
    // Small delay between transactions
    await new Promise(r => setTimeout(r, 1000));
  }
  
  // Save wallets file
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(WALLET_FILE, JSON.stringify(wallets, null, 2));
  console.log(`\n💾 Wallets saved to ${WALLET_FILE}`);
  
  // Summary
  console.log('\n📊 Summary:');
  console.log('━'.repeat(60));
  console.log(`Platform Receiver: ${wallets['platform-receiver'].address}`);
  console.log('━'.repeat(60));
  for (const [label, wallet] of Object.entries(wallets)) {
    if (label === 'platform-receiver') continue;
    const status = wallet.funded ? '✅' : '❌';
    console.log(`${status} ${label.padEnd(12)} ${wallet.address}`);
  }
  console.log('━'.repeat(60));
  
  // Show mnemonic for backup
  console.log('\n🔐 Mnemonics (BACKUP SECURELY):');
  for (const [label, wallet] of Object.entries(wallets)) {
    console.log(`\n--- ${label} ---`);
    console.log(wallet.mnemonic);
  }
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
