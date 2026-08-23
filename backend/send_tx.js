import algosdk from 'algosdk';

const merchant = 'NYRK2742GDQ7KIRNGWCHKVUKVUZTFDXVKWXT3N5HTAV6IMWWDSPNT7ZOPM';
const mnemonic = 'brief net busy jungle iron legend ahead bulb bonus mouse bundle impact hedgehog minor wool cupboard pen evolve prevent wedding begin finger exhaust above track';

async function send(amountMicro) {
  const account = algosdk.mnemonicToSecretKey(mnemonic);
  const algod = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
  
  const suggestedParams = await algod.getTransactionParams().do();
  
  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: account.addr,
    receiver: merchant,
    amount: amountMicro,
    suggestedParams,
    note: new TextEncoder().encode('VeriPass product verification report (x402 · Algorand)'),
  });
  
  const signedTxn = txn.signTxn(account.sk);
  const sent = await algod.sendRawTransaction(signedTxn).do();
  const txId = sent.txId ?? sent.txid;
  console.log(`Transaction ID: ${txId}`);
  
  await algosdk.waitForConfirmation(algod, txId, 10);
}

send(2000);
