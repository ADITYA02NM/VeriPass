/**
 * VeriPass Backend — Hono + x402 (GoPlausible facilitator)
 * Serves: REST API + x402 paid endpoint + QR PNGs + /demo judge page + built frontend
 * Host: 0.0.0.0:8080
 */
import { Hono } from 'hono';
import { serve, getRequestListener } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import path from 'node:path';
import fs from 'node:fs';
import https from 'node:https';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import QRCode from 'qrcode';
import {
  db, getProductByCode, getCheckpoints, getUsage, bumpUsage, FREE_SCAN_LIMIT,
  addBookmark, removeBookmark, isBookmarked, getBookmarkedProductIds, resetOwnerData, resetDemoProductSignatures,
  getAgentUsage,
} from './db.js';
import { X402, paymentChallenge, simulateAlgorandPayment, verifyPaymentProof } from './x402.js';
import { signToken, auth as _auth, ownerKey as _ownerKey } from './auth.js';
import { registerAiRoutes, AGENTS } from './ai.js';
import { registerAgentRoutes } from './agents.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = new Hono();
const PORT = process.env.PORT || 8080;
const ADMIN_TOKEN = process.env.VERIPASS_ADMIN_TOKEN || null;
const CORS_ORIGINS = (process.env.VERIPASS_CORS || '*').split(',').map(s => s.trim());

// ---- shared theme (Voxel-State Heritage + dark mode) for server-rendered pages ----
const THEME_CSS = `
:root{--bg:#fff9ec;--card:#fff;--ink:#010766;--text:#010766;--muted:#464651;--muted2:#555;--line:#ddd;--magenta:#E91E63;--saffron:#fe9832;--cyan:#00E5FF}
html.dark{--bg:#121218;--card:#1e1e26;--ink:#010766;--text:#bdc2ff;--muted:#c6c5d3;--muted2:#8f8f9d;--line:#2a2a35;--magenta:#ff6b8a;--saffron:#fea85a}
body{font-family:Inter,system-ui;background:var(--bg);margin:0;padding:24px;color:var(--text)}
.theme-toggle{position:fixed;top:14px;right:14px;z-index:99;border:2px solid var(--ink);background:var(--card);color:var(--text);font-size:18px;cursor:pointer;padding:6px 10px;box-shadow:3px 3px 0 var(--ink)}
`;
const THEME_SCRIPT = `<script>(function(){if(localStorage.getItem('veripass_theme')==='dark')document.documentElement.classList.add('dark')})();function toggleTheme(){const d=document.documentElement.classList.toggle('dark');localStorage.setItem('veripass_theme',d?'dark':'light')}</script>`;

// ---------------- CORS middleware (configurable origins) ----------------
app.use('*', async (c, next) => {
  const origin = c.req.header('origin') || '';
  const allowed = CORS_ORIGINS.includes('*') ? (origin || '*') : (CORS_ORIGINS.includes(origin) ? origin : null);
  if (allowed) c.header('Access-Control-Allow-Origin', allowed);
  c.header('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Pay-Signature, X-User-Id');
  c.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  c.header('Access-Control-Allow-Credentials', 'true');
  if (c.req.method === 'OPTIONS') return c.body(null, 204);
  await next();
});

// Auth functions imported from ./auth.js (signToken, auth as _auth, ownerKey as _ownerKey)
// Local aliases for route code readability:
const auth = _auth;
const ownerKey = _ownerKey;


// ---------------- Verdict engine ----------------
const ROLE_TO_KIND = { Producer: 'production', Logistics: 'shipment', Retailer: 'receipt' };
const KIND_LABEL = {
  production: 'Production Signed', shipment: 'Shipment Signed', receipt: 'Receipt Signed',
};
const KIND_ICON = { production: 'factory', shipment: 'local_shipping', receipt: 'storefront' };

function computeVerdict(product, checkpoints) {
  const signed = new Set(checkpoints.filter((c) => c.signed_by).map((c) => c.kind));
  if (product.fake) {
    return { status: 'NOT_GENUINE', label: 'NOT GENUINE', color: '#E91E63', icon: 'block',
      score: 12, reason: 'No valid signatures on record — unit is not traceable to any registered producer.' };
  }
  const need = ['production', 'shipment', 'receipt'];
  const missing = need.filter((k) => !signed.has(k));
  if (missing.length === 0) {
    return { status: 'AUTHENTIC', label: 'AUTHENTIC', color: '#41ad31', icon: 'verified',
      score: 98, reason: 'Full supply-chain chain-of-custody verified: producer → logistics → retailer.' };
  }
  if (signed.size === 0) {
    return { status: 'UNVERIFIED', label: 'UNVERIFIED', color: '#767683', icon: 'help',
      score: 20, reason: 'Registered but no entity has signed this passport yet.' };
  }
  return { status: 'PARTIALLY_SIGNED', label: 'IN TRANSIT', color: '#fe9832', icon: 'local_shipping',
    score: 54, reason: `Partial signatures (${signed.size}/3): missing ${missing.map((k) => KIND_LABEL[k]).join(', ')}.` };
}

function productPayload(product, checkpoints, usage) {
  const verdict = computeVerdict(product, checkpoints);
  return {
    code: product.code,
    name: product.name,
    batchId: product.batch_id,
    origin: product.origin,
    details: product.details,
    icon: product.icon,
    verdict,
    timeline: checkpoints.map((c) => ({
      id: c.id,
      kind: c.kind,
      label: c.label || KIND_LABEL[c.kind],
      signedBy: c.signed_by,
      signerRole: c.signer_role,
      timestamp: c.timestamp,
      note: c.note,
      icon: KIND_ICON[c.kind] || 'info',
    })),
    x402: { provider: X402.provider, freeLimit: FREE_SCAN_LIMIT, used: usage },
  };
}

// ================= AUTH =================
app.post('/api/auth/login', async (c) => {
  const { identifier, passkey } = await c.req.json().catch(() => ({})) || {};
  if (!identifier || !passkey) return c.json({ error: 'identifier and passkey required' }, 400);
  const user = db.prepare('SELECT * FROM users WHERE identifier = ? AND passkey = ?').get(String(identifier).toLowerCase(), String(passkey));
  if (!user) return c.json({ error: 'Invalid credentials' }, 401);
  // every successful login restores the free scan tokens (demo convenience)
  db.prepare('INSERT INTO usage (owner_key, used) VALUES (?,0) ON CONFLICT(owner_key) DO UPDATE SET used = 0').run(user.identifier);
  return c.json({
    token: signToken(user.identifier, user.role),
    user: { identifier: user.identifier, name: user.name, role: user.role, origin: user.origin },
  });
});

// Wallet-based login — Pera WalletConnect / embedded wallet
app.post('/api/auth/wallet', async (c) => {
  const { walletAddress } = await c.req.json().catch(() => ({})) || {};
  if (!walletAddress || typeof walletAddress !== 'string') return c.json({ error: 'walletAddress required' }, 400);
  const addr = walletAddress.trim();
  if (addr.length < 32 || addr.length > 64) return c.json({ error: 'invalid wallet address' }, 400);
  // Find existing user by wallet_address
  let user = db.prepare('SELECT * FROM users WHERE wallet_address = ?').get(addr);
  if (!user) {
    // Auto-create a new user with this wallet
    const id = `wallet-${addr.slice(0, 8).toLowerCase()}`;
    const displayName = `Wallet ${addr.slice(0, 6)}…${addr.slice(-4)}`;
    try {
      db.prepare('INSERT INTO users (identifier, passkey, name, role, origin, wallet_address) VALUES (?,?,?,?,?,?)')
        .run(id, 'wallet-session', displayName, 'User', 'Pera Wallet', addr);
      user = db.prepare('SELECT * FROM users WHERE identifier = ?').get(id);
    } catch {
      return c.json({ error: 'failed to create wallet user' }, 500);
    }
  }
  // Reset free scan tokens on wallet login
  db.prepare('INSERT INTO usage (owner_key, used) VALUES (?,0) ON CONFLICT(owner_key) DO UPDATE SET used = 0').run(user.identifier);
  return c.json({
    token: signToken(user.identifier, user.role),
    user: { identifier: user.identifier, name: user.name, role: user.role, origin: user.origin, walletAddress: user.wallet_address },
  });
});

// Register a new entity — creates a real row in the users table (DB-backed login/register)
app.post('/api/auth/register', async (c) => {
  const { identifier, passkey, name, role, origin } = await c.req.json().catch(() => ({})) || {};
  if (!identifier || !passkey) return c.json({ error: 'identifier and passkey required' }, 400);
  const id = String(identifier).toLowerCase().trim();
  if (!/^[a-z0-9._-]{3,32}$/.test(id)) return c.json({ error: 'identifier must be 3–32 chars: letters, digits, . _ -' }, 400);
  if (String(passkey).length < 4) return c.json({ error: 'passkey must be at least 4 characters' }, 400);
  const exists = db.prepare('SELECT identifier FROM users WHERE identifier = ?').get(id);
  if (exists) return c.json({ error: 'identifier already registered — try logging in' }, 409);
  const roleVal = ['User', 'Producer', 'Logistics', 'Retailer'].includes(role) ? role : 'User';
  const displayName = String(name || id).slice(0, 60);
  db.prepare('INSERT INTO users (identifier, passkey, name, role, origin) VALUES (?,?,?,?,?)')
    .run(id, String(passkey), displayName, roleVal, origin || null);
  return c.json({
    token: signToken(id, roleVal),
    user: { identifier: id, name: displayName, role: roleVal, origin: origin || null },
  });
});

app.get('/api/me', async (c) => {
  const u = auth(c);
  if (!u) return c.json({ error: 'unauthorized' }, 401);
  const user = db.prepare('SELECT identifier, name, role, origin, wallet_address FROM users WHERE identifier = ?').get(u.identifier);
  if (!user) return c.json({ error: 'unauthorized' }, 401);
  return c.json({ user });
});

// ================= PRODUCTS (role-based inventory) =================
app.get('/api/products', async (c) => {
  const u = auth(c);
  if (!u) return c.json({ error: 'unauthorized' }, 401);
  // demo rule: plain Users see ONLY their bookmarked products (bookmark = the demo's
  // "save to vault" flow); Producer/Logistics/Retailer see the real inventory
  let rows;
  if (u.role === 'User') {
    const ids = getBookmarkedProductIds(u.identifier);
    rows = ids.length ? db.prepare(`SELECT * FROM products WHERE id IN (${ids.map(() => '?').join(',')})`).all(...ids) : [];
  } else {
    rows = db.prepare('SELECT * FROM products WHERE fake = 0 ORDER BY id').all();
  }
  return c.json({
    products: rows.map((p) => {
      const cps = getCheckpoints(p.id);
      const v = computeVerdict(p, cps);
      return {
        id: p.code, code: p.code, name: p.name, batchId: p.batch_id, origin: p.origin,
        scannedAt: p.created_at, icon: p.icon, status: v.status, verdict: v.label, color: v.color,
        signedCount: cps.filter((c) => c.signed_by).length,
      };
    }),
    role: u.role,
  });
});

// ================= VERIFY (the x402 PAID endpoint) =================
app.get('/api/verify/:code', async (c) => {
  const code = String(c.req.param('code')).trim();
  const ok = ownerKey(c);
  const product = getProductByCode(code);
  if (!product) return c.json({ error: 'Unknown QR code. Not a VeriPass passport.' }, 404);

  const used = getUsage(ok);
  const sigHeader = c.req.header('x-pay-signature');

  // Paid path: valid payment proof → serve without consuming free tier
  if (sigHeader) {
    const proof = verifyPaymentProof(sigHeader, ok);
    if (!proof.ok) {
      return c.json({ error: `Payment not valid: ${proof.reason}` }, 402, paymentChallenge());
    }
    const cps = getCheckpoints(product.id);
    return c.json(productPayload(product, cps, used));
  }

  // Free tier: first 3 verifies free
  if (used < FREE_SCAN_LIMIT) {
    bumpUsage(ok);
    const cps = getCheckpoints(product.id);
    return c.json(productPayload(product, cps, used + 1));
  }

  // Charged: HTTP 402 + x402 challenge (Algorand) — pure pay-per-use, no credits
  return c.json({
    error: 'Free tier exhausted. Pay with Algorand (x402) to unlock this verification report.',
    x402: paymentChallenge(),
  }, 402);
});

// ================= HEALTH CHECK =================
app.get('/api/health', (c) => c.json({ status: 'ok' }));

// ================= USAGE (api-usage bar data) =================
app.get('/api/usage', async (c) => {
  const ok = ownerKey(c);
  const used = getUsage(ok);
  return c.json({ ownerKey: ok, freeLimit: FREE_SCAN_LIMIT, used, charged: used >= FREE_SCAN_LIMIT, priceAlgo: X402.amount });
});

// ================= AI ASSISTANT (agentic, paid via x402) =================
registerAiRoutes(app, auth);
registerAgentRoutes(app);

// ================= x402: Algorand payment (real TestNet, sim fallback) =================
app.post('/api/x402/pay', async (c) => {
  const ok = ownerKey(c);
  const body = await c.req.json().catch(() => ({})) || {};
  const purpose = body.purpose || 'verify';
  const amount = purpose === 'ai' ? '0.003' : X402.amount; // AI question = 0.003 ALGO
  const used = getUsage(ok);
  // Free-scan gate applies ONLY to verification reports ('verify').
  // AI Assistant and Agent services are pay-per-use (x402) — always payable.
  if (purpose === 'verify' && used < FREE_SCAN_LIMIT) {
    return c.json({ error: 'You still have free scans left — no payment needed.' }, 409);
  }
  const tx = await simulateAlgorandPayment(ok, amount);
  const signaturePayload = b64url({ txId: tx.txId, sender: tx.sender, network: tx.network });
  return c.json({
    ok: true,
    txId: tx.txId,
    round: tx.round,
    amount: tx.amount,
    network: tx.network,
    sender: tx.sender,
    receiver: X402.receiverAddress,
    xPaySignature: signaturePayload, // send this as X-Pay-Signature header
    note: tx.network === 'testnet-v1.0'
      ? 'Real Algorand TestNet payment confirmed on-chain.'
      : 'Simulated Algorand payment tx committed to local ledger (demo). TestNet-ready.',
  });
});
function b64url(o) { return Buffer.from(JSON.stringify(o)).toString('base64url'); }

// ================= SIGN (live signing on phone 2) =================
app.post('/api/products/:code/sign', async (c) => {
  const u = auth(c);
  if (!u) return c.json({ error: 'unauthorized' }, 401);
  const product = getProductByCode(String(c.req.param('code')).trim());
  if (!product) return c.json({ error: 'Unknown product' }, 404);
  if (product.fake) return c.json({ error: 'COUNTERFEIT UNIT — cannot sign. This passport is flagged as not genuine.' }, 403);

  const kind = ROLE_TO_KIND[u.role];
  if (!kind) return c.json({ error: `Your role (${u.role}) cannot sign products. Only Producer / Logistics / Retailer can.` }, 403);

  const cps = getCheckpoints(product.id);
  if (cps.some((c) => c.kind === kind && c.signed_by)) {
    return c.json({ error: `This passport already has a ${KIND_LABEL[kind]} checkpoint.` }, 409);
  }
  const user = db.prepare('SELECT name FROM users WHERE identifier = ?').get(u.identifier);
  const body = await c.req.json().catch(() => ({})) || {};
  const note = body.note || '';
  db.prepare(`INSERT INTO checkpoints (product_id, kind, label, signed_by, signer_role, timestamp, note)
    VALUES (?,?,?,?,?,datetime('now'),?)`)
    .run(product.id, kind, KIND_LABEL[kind], user?.name || u.identifier, u.role, note);
  const now = getCheckpoints(product.id);
  return c.json({
    ok: true,
    signedBy: user?.name || u.identifier,
    signerRole: u.role,
    checkpoint: KIND_LABEL[kind],
    product: productPayload(product, now, getUsage(u.identifier)),
  });
});

// ================= BOOKMARK (user vault — toggle) =================
app.post('/api/products/:code/bookmark', async (c) => {
  const ok = ownerKey(c);
  if (!ok || ok === 'anon') return c.json({ error: 'unauthorized' }, 401);
  const product = getProductByCode(String(c.req.param('code')).trim());
  if (!product) return c.json({ error: 'Unknown QR code.' }, 404);
  const already = isBookmarked(ok, product.id);
  if (already) {
    removeBookmark(ok, product.id);
    return c.json({ ok: true, bookmarked: false, code: product.code });
  }
  addBookmark(ok, product.id);
  return c.json({ ok: true, bookmarked: true, code: product.code });
});

// ================= TERMINATE SESSION (logout + reset free-scan counter) =================
app.post('/api/session/terminate', async (c) => {
  const u = auth(c);
  if (!u) return c.json({ error: 'unauthorized' }, 401);
  // Reset the free-scan counter so the next login starts fresh
  db.prepare('UPDATE usage SET used = 0 WHERE owner_key = ?').run(u.identifier);
  return c.json({ ok: true, reset: true, ownerKey: u.identifier });
});

// ================= ADMIN RESET (full reset — dashboard Reset button) =================
// Requires x-admin-token header matching VERIPASS_ADMIN_TOKEN env var.
app.post('/api/admin/reset', async (c) => {
  if (ADMIN_TOKEN) {
    const token = c.req.header('x-admin-token');
    if (token !== ADMIN_TOKEN) return c.json({ error: 'forbidden' }, 403);
  }
  const owners = db.prepare('SELECT identifier FROM users').all();
  for (const o of owners) resetOwnerData(o.identifier);
  resetDemoProductSignatures();
  // FULL reset: Algorand payments + user data
  db.prepare('DELETE FROM payments').run();
  return c.json({ ok: true, reset: true, owners: owners.length });
});

// ================= SPENDING LIMIT (AI spend cap) =================
app.get('/api/spending', async (c) => {
  const ok = ownerKey(c);
  if (!ok) return c.json({ error: 'unauthorized' }, 401);
  const user = db.prepare('SELECT spend_limit, total_spent, wallet_address FROM users WHERE identifier = ?').get(ok);
  if (!user) return c.json({ error: 'unauthorized' }, 401);
  return c.json({
    spendLimit: user.spend_limit || 0.05,
    totalSpent: user.total_spent || 0,
    walletAddress: user.wallet_address || null,
    remaining: Math.max(0, (user.spend_limit || 0.05) - (user.total_spent || 0)),
  });
});

app.post('/api/spending/limit', async (c) => {
  const ok = ownerKey(c);
  if (!ok) return c.json({ error: 'unauthorized' }, 401);
  const body = await c.req.json().catch(() => ({})) || {};
  const limit = Number(body.limit);
  if (!limit || limit <= 0 || limit > 99) return c.json({ error: 'limit must be between 0 and 99 ALGO' }, 400);
  db.prepare('UPDATE users SET spend_limit = ? WHERE identifier = ?').run(limit, ok);
  return c.json({ ok: true, spendLimit: limit });
});

// ================= PAYMENTS HISTORY (with lora.algorand tx links) =================
app.get('/api/payments', async (c) => {
  const ok = ownerKey(c);
  if (!ok) return c.json({ error: 'unauthorized' }, 401);
  const payments = db.prepare('SELECT * FROM payments WHERE owner_key = ? ORDER BY id DESC LIMIT 50').all(ok);
  return c.json({
    payments: payments.map((p) => ({
      txid: p.txid,
      amount: p.amount,
      network: p.network,
      round: p.round,
      sender: p.sender,
      receiver: p.receiver,
      createdAt: p.created_at,
      loraUrl: p.network === 'testnet-v1.0' && p.txid
        ? `https://lora.algokit.io/testnet/transaction/${p.txid}`
        : null,
    })),
  });
});

// ================= /dashboard — judge/admin proof panel =================
function sha(s) { return createHash('sha256').update(String(s)).digest('hex'); }

function tbl(rows, headers) {
  if (!rows.length) return '<p style="color:var(--muted);font-size:14px">No records yet.</p>';
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;font-family:monospace">
    <tr>${headers.map((h) => `<th style="text-align:left;padding:8px;border-bottom:3px solid var(--ink);background:var(--ink);color:#fff">${h}</th>`).join('')}</tr>
    ${rows.map((r) => `<tr>${r.map((c) => `<td style="padding:8px;border-bottom:1px solid var(--line);vertical-align:top">${c}</td>`).join('')}</tr>`).join('')}
  </table>`;
}

app.get('/dashboard', async (c) => {
  const payments = db.prepare('SELECT * FROM payments ORDER BY id DESC LIMIT 40').all();
  const checkpoints = db.prepare(
    `SELECT c.*, p.code AS pcode FROM checkpoints c JOIN products p ON p.id = c.product_id ORDER BY c.id DESC LIMIT 60`
  ).all();
  const usageRows = db.prepare('SELECT owner_key, used FROM usage ORDER BY owner_key').all();
  const users = db.prepare('SELECT identifier, name, role FROM users ORDER BY id').all();
  const products = db.prepare('SELECT * FROM products ORDER BY id').all();

  const payRows = payments.map((p) => [
    `<code title="${p.txid}">${String(p.txid).slice(0, 18)}…</code>`,
    `<b>${sha(p.txid + p.owner_key + p.amount).slice(0, 16)}</b>`,
    p.owner_key, p.amount, p.network, p.round ?? '—', p.created_at,
  ]);
  const cpRows = checkpoints.map((c) => [
    `<code title="${sha(`${c.pcode}|${c.kind}|${c.signed_by || 'none'}|${c.timestamp}`)}">${sha(`${c.pcode}|${c.kind}|${c.signed_by || 'none'}|${c.timestamp}`).slice(0, 16)}</code>`,
    c.pcode, c.kind, c.signed_by || '<i>—</i>', c.signer_role || '<i>—</i>', c.timestamp,
  ]);
  const usageHtml = usageRows.map((r) => {
    return `<tr><td style="padding:8px;border-bottom:1px solid var(--line)">${r.owner_key}</td>
      <td style="padding:8px;border-bottom:1px solid var(--line)">${r.used}/${FREE_SCAN_LIMIT} free</td></tr>`;
  }).join('');
  const userRows = users.map((u) => [
    u.identifier, u.name, u.role,
  ]);
  const productRows = products.map((p) => {
    const cps = getCheckpoints(p.id);
    const v = computeVerdict(p, cps);
    return [
      p.code,
      `<span style="background:${v.color};color:#fff;font-weight:700;padding:2px 6px;font-size:10px">${v.label}</span>`,
      `${cps.filter((c) => c.signed_by).length}/3`, p.fake ? '⚠ FAKE' : 'OK',
    ];
  });
  const agentUsage = getAgentUsage();
  const agentRows = AGENTS.map((a) => {
    const u = agentUsage.find((x) => x.agent_id === a.id);
    return [a.name, `${a.priceAlgo} ALGO`, u?.calls ?? 0];
  });

  return c.html(`<!doctype html><html><head><meta charset="utf-8"><title>VeriPass Dashboard — Admin Proof Panel</title>
  <meta http-equiv="refresh" content="20"><meta name="viewport" content="width=device-width,initial-scale=1">
  <style>${THEME_CSS}
  h1{font-size:30px;margin:0 0 4px}h2{font-size:17px;font-weight:600;color:var(--muted);margin:0 0 8px}
  .sec{border:3px solid var(--ink);background:var(--card);box-shadow:4px 4px 0 var(--ink);padding:16px;margin-bottom:20px;overflow-x:auto}
  a{color:var(--text);font-weight:700}
  .btn{display:inline-block;border:2px solid var(--ink);background:var(--ink);color:#fff;font-weight:700;padding:8px 14px;cursor:pointer;font-size:15px;box-shadow:3px 3px 0 var(--ink);margin-right:8px}
  .btn.orange{background:var(--saffron);color:#000}
  .sum{display:flex;flex-wrap:wrap;gap:10px;margin:12px 0 20px}
  .sum div{border:2px solid var(--ink);background:var(--card);padding:10px 14px;font-size:18px;font-weight:700;box-shadow:3px 3px 0 var(--ink)}
  .sum span{display:block;font-size:12px;font-weight:600;color:var(--muted)}</style>${THEME_SCRIPT}</head><body>
  <button class="theme-toggle" onclick="toggleTheme()">🌙</button>
  <h1>📊 VeriPass — Admin Dashboard</h1>
  <h2>Live proof panel for judges · auto-refreshes every 20s · <a href="/demo">→ judge demo page</a></h2>
  <div style="margin:12px 0">
    <a class="btn orange" href="/demo">▶ Demo</a>
    <button class="btn orange" onclick="location.reload()">⟳ Refresh</button>
    <button class="btn" onclick="if(confirm('Reset ALL users (free tokens + bookmarks) and demo product signatures?')){fetch('/api/admin/reset',{method:'POST'}).then(r=>r.json()).then(d=>{alert('Reset done — '+d.owners+' owners');location.reload()})}">🗑 Reset All</button>
  </div>
  <div class="sum">
    <div>💸 <span>payments</span>${payments.length}</div>
    <div>✍️ <span>signatures</span>${checkpoints.length}</div>
    <div>👤 <span>users</span>${users.length}</div>
    <div>📦 <span>products</span>${products.length}</div>
  </div>

  <div class="sec"><h2>💸 Algorand x402 payments (${payments.length}) — txid + proof hash</h2>${tbl(payRows, ['txid', 'proof hash', 'owner', 'amount', 'network', 'round', 'time'])}</div>
  <div class="sec"><h2>✍️ Signatures / checkpoints (${checkpoints.length}) — chain-of-custody hashes</h2>${tbl(cpRows, ['hash', 'product', 'kind', 'signed_by', 'role', 'time'])}</div>
  <div class="sec"><h2>🔢 Usage per person (free tier)</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;font-family:monospace">
      <tr><th style="text-align:left;padding:8px;border-bottom:3px solid var(--ink);background:var(--ink);color:#fff">owner</th>
      <th style="text-align:left;padding:8px;border-bottom:3px solid var(--ink);background:var(--ink);color:#fff">free</th></tr>
      ${usageHtml}
    </table></div>
  <div class="sec"><h2>🤖 Agentic AI — 7 specialist agents · prices + usage</h2>${tbl(agentRows, ['agent', 'price', 'calls'])}</div>
  <div class="sec"><h2>👤 Users</h2>${tbl(userRows, ['identifier', 'name', 'role'])}</div>
  <div class="sec"><h2>📦 Products (${products.length})</h2>${tbl(productRows, ['code', 'verdict', 'signatures', 'flags'])}</div>
  </body></html>`);
});

// ================= QR PNGs (scan with any camera app → /?qr=CODE) =================
app.get('/api/qr/:code', async (c) => {
  const code = String(c.req.param('code')).replace(/\.png$/, '');
  const product = getProductByCode(code);
  if (!product) return c.json({ error: 'unknown product' }, 404);
  // In Hono, we construct the URL manually
  const host = c.req.header('host') || `localhost:${PORT}`;
  const protocol = c.req.header('x-forwarded-proto') || 'http';
  const url = `${protocol}://${host}/?qr=${code}`;
  try {
    const png = await QRCode.toBuffer(url, { width: 420, margin: 2, errorCorrectionLevel: 'M' });
    return new Response(png, { headers: { 'Content-Type': 'image/png' } });
  } catch (e) {
    console.error('[qr]', e);
    return c.json({ error: 'qr render failed' }, 500);
  }
});

// ================= /demo — judge self-serve pages (tiled grid of all products) =================
const DEMO_PRODUCTS = db.prepare('SELECT * FROM products ORDER BY id').all();
const DEMO_CODES = DEMO_PRODUCTS.map((p) => p.code);

// grid tile: name, verdict badge, small QR, signatures — click → /demo/{n}
function demoCardHtml(code, idx) {
  const p = getProductByCode(code);
  const cps = getCheckpoints(p.id);
  const v = computeVerdict(p, cps);
  return `
    <a href="/demo/${idx}" style="text-decoration:none;color:var(--text);border:3px solid var(--ink);background:var(--card);padding:14px;box-shadow:4px 4px 0 var(--ink);display:flex;flex-direction:column;gap:8px;width:230px;cursor:pointer;transition:transform .1s">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
        <strong style="font-size:12px;line-height:1.3">UC-${String(idx).padStart(2, '0')} · ${p.name.replace(/^Use Case \d+ · /, '')}</strong>
        <span style="background:${v.color};color:#fff;font-weight:800;padding:3px 6px;font-size:10px;white-space:nowrap">${v.label}</span>
      </div>
      <div style="font-family:monospace;font-size:10px;color:var(--muted2)">${p.code}</div>
      <img src="/api/qr/${code}.png" alt="QR ${code}" style="width:100%;image-rendering:pixelated"/>
      <div style="font-size:10px;color:var(--muted2);font-family:monospace">${cps.filter(c=>c.signed_by).length}/3 signatures</div>
      <div style="text-align:center;background:var(--ink);color:#fff;font-weight:800;padding:8px;font-size:12px">OPEN QR →</div>
    </a>`;
}

// one big-QR page per product: back to grid + prev/next navigation
function demoBigPageHtml(activeCode) {
  const p = getProductByCode(activeCode);
  const cps = getCheckpoints(p.id);
  const v = computeVerdict(p, cps);
  const idx = DEMO_CODES.indexOf(activeCode) + 1;
  const prevIdx = ((idx - 2 + DEMO_CODES.length) % DEMO_CODES.length) + 1;
  const nextIdx = (idx % DEMO_CODES.length) + 1;
  return `<!doctype html><html><head><meta charset="utf-8"><title>VeriPass Demo — ${p.name}</title>
  <meta http-equiv="refresh" content="20"><meta name="viewport" content="width=device-width,initial-scale=1">
  <style>${THEME_CSS}
  h1{font-size:20px;margin:0 0 4px}h2{font-size:13px;font-weight:600;color:var(--muted);margin:0 0 16px}
  .card{border:3px solid var(--ink);background:var(--card);padding:20px;box-shadow:4px 4px 0 var(--ink);max-width:520px;margin:0 auto;display:flex;flex-direction:column;gap:12px}
  .qr{width:100%;image-rendering:pixelated}
  .btns{display:flex;gap:12px;margin-top:16px;max-width:520px;margin-left:auto;margin-right:auto}
  .btn{flex:1;display:block;text-align:center;background:var(--ink);color:#fff;text-decoration:none;font-weight:800;padding:14px;font-size:15px;box-shadow:4px 4px 0 var(--ink)}
  .back{display:block;text-align:center;color:var(--text);font-weight:700;margin-top:14px;font-size:13px}
  .badge{background:${v.color};color:#fff;font-weight:800;padding:4px 10px;font-size:12px}</style>${THEME_SCRIPT}</head><body>
  <button class="theme-toggle" onclick="toggleTheme()">🌙</button>
  <h1>⚡ VeriPass — Big QR <span style="color:var(--muted);font-size:13px">(${idx}/${DEMO_CODES.length})</span></h1>
  <h2>${p.name} · scan with any camera app → opens VeriPass &amp; verifies live · auto-refreshes every 20s</h2>
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <strong style="font-size:16px">${p.name}</strong>
      <span class="badge">${v.label}</span>
    </div>
    <div style="font-family:monospace;font-size:13px;color:var(--muted2)">${p.code} · ${p.batch_id}</div>
    <img class="qr" src="/api/qr/${activeCode}.png" alt="QR ${activeCode}"/>
    <div style="font-size:12px;color:var(--muted2);font-family:monospace">${cps.filter(c=>c.signed_by).length}/3 signatures · score ${v.score}/100</div>
  </div>
  <div class="btns">
    <a class="btn" href="/demo/${prevIdx}">← UC-${String(prevIdx).padStart(2, '0')}</a>
    <a class="btn" href="/demo/${nextIdx}">UC-${String(nextIdx).padStart(2, '0')} →</a>
  </div>
  <a class="back" href="/demo">← ALL ${DEMO_CODES.length} PRODUCTS</a>
  </body></html>`;
}

app.get('/demo', async (c) => {
  const cards = DEMO_CODES.map((code, i) => demoCardHtml(code, i + 1)).join('');
  return c.html(`<!doctype html><html><head><meta charset="utf-8"><title>VeriPass Demo — Judge Page</title>
  <meta http-equiv="refresh" content="20"><meta name="viewport" content="width=device-width,initial-scale=1">
  <style>${THEME_CSS}
  h1{font-size:22px;margin:0 0 4px}h2{font-size:13px;font-weight:600;color:var(--muted);margin:0 0 16px}
  .grid{display:flex;flex-wrap:wrap;gap:20px}
  .top{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:16px}
  .dash{display:inline-block;background:var(--magenta);color:#fff;text-decoration:none;font-weight:800;padding:10px 14px;font-size:13px;border:2px solid var(--ink);box-shadow:3px 3px 0 var(--ink)}</style>${THEME_SCRIPT}</head><body>
  <button class="theme-toggle" onclick="toggleTheme()">🌙</button>
  <div class="top">
    <div>
      <h1>⚡ VeriPass — Judge Demo Page</h1>
      <h2>Tap any tile → full-screen QR for phones · auto-refreshes every 20s</h2>
    </div>
    <a class="dash" href="/dashboard">📊 ADMIN DASHBOARD</a>
  </div>
  <div class="grid">${cards}</div>
  <p style="font-size:12px;color:var(--muted);margin-top:18px">Demo accounts: user/user · pro/pro · log/log · ret/ret · ravi/ravi — sign the middle product LIVE from phone 2, then re-scan on phone 1.</p>
  </body></html>`);
});

app.get('/demo/:n', async (c) => {
  const n = parseInt(c.req.param('n'), 10);
  const code = DEMO_CODES[n - 1];
  if (!code) return c.redirect('/demo');
  return c.html(demoBigPageHtml(code));
});

// backward-compat aliases (old 3-product links)
app.get('/demo1', async (c) => c.redirect('/demo/1'));
app.get('/demo2', async (c) => c.redirect('/demo/2'));
app.get('/demo3', async (c) => c.redirect('/demo/3'));

// ================= Serve built frontend (SPA) =================
const distDir = path.join(__dirname, '..', 'veripass', 'dist');

// Serve static files from the dist directory (skip /api, /demo, /dashboard, /agent paths)
app.use('/*', async (c, next) => {
  const reqPath = c.req.path;
  if (reqPath.startsWith('/api/') || reqPath.startsWith('/demo') || reqPath === '/dashboard' || reqPath === '/agent') {
    return next();
  }
  return serveStatic({ root: distDir })(c, next);
});

// SPA fallback: any non-API, non-demo route serves index.html
app.get('*', async (c) => {
  const reqPath = c.req.path;
  if (reqPath.startsWith('/api/') || reqPath.startsWith('/demo') || reqPath === '/dashboard' || reqPath === '/agent') {
    return c.notFound();
  }
  const indexPath = path.join(distDir, 'index.html');
  try {
    const html = fs.readFileSync(indexPath, 'utf8');
    return c.html(html);
  } catch {
    return c.html('Frontend not built yet — run: cd veripass && npm run build', 404);
  }
});

// ================= Start HTTP server =================
serve({ fetch: app.fetch, port: PORT, hostname: '0.0.0.0' }, () => {
  console.log(`\n  ⚡ VeriPass backend + frontend running on http://0.0.0.0:${PORT}`);
  console.log(`  📱 Open on phones:  http://<this-machine-ip>:${PORT}   (demo page: /demo)\n`);
});

// ================= HTTPS (self-signed) — camera needs a secure context =================
const HTTPS_PORT = process.env.HTTPS_PORT || 8443;
const certDir = path.join(__dirname, 'certs');
const certPath = path.join(certDir, 'cert.pem');
const keyPath = path.join(certDir, 'key.pem');
if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  const httpsServer = https.createServer(
    { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) },
    getRequestListener(app.fetch)
  );
  httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
    console.log(`  🔒 HTTPS (camera-enabled) on https://0.0.0.0:${HTTPS_PORT} — self-signed, accept the warning on phones`);
  });
} else {
  console.log(`  ⚠️  No certs in ${certDir} — HTTPS disabled. Generate: openssl req -x509 -newkey rsa:2048 -nodes -keyout ${keyPath} -out ${certPath} -days 30 -subj "/CN=<ip>"`);
}
