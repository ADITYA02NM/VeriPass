// backend/agents.js — x402 Agentic Payments: multiple agents that pay per-use
// for priced services (market-data, news-summary, report-generate) with a
// spend-policy guard checked BEFORE every payment, then return a final report.
// Mirrors the x402 Agentic Payments Kit demo (https://x402-kit-kappa.vercel.app/agent).
// Hono conversion - route handlers use Hono context (c) instead of Express (req, res).

import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { db, getProductByCode, getCheckpoints, getPlans } from './db.js';
import { paymentChallenge, simulateAlgorandPayment } from './x402.js';
import { signToken, auth as _auth, ownerKey as _ownerKey } from './auth.js';

const auth = _auth;
const ownerKey = _ownerKey;

const GEMINI_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_KEY) {
  if (process.env.NODE_ENV === 'production') throw new Error('GEMINI_API_KEY env var is required');
  console.warn('[agents] GEMINI_API_KEY not set — AI features will fail in production');
}
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });

const PRICE = '0.003'; // ALGO per service call
const MAX_CALLS = 3; // spend-policy guard: max paid service calls per run
const RESEARCH_TYPES = ['Balanced', 'Market-Focused', 'News-Focused', 'Deep Dive'];

// ---------------- auth (imported from shared auth.js) ----------------

// ---------------- verdict (same logic as ai.js) ----------------
function verdictOf(product, cps) {
  if (product.fake) return { label: 'NOT GENUINE', score: 12, color: '#E91E63' };
  const kinds = new Set(cps.map(c => c.kind));
  if (kinds.size >= 3) return { label: 'AUTHENTIC', score: 98, color: '#41ad31' };
  if (cps.length === 0) return { label: 'UNVERIFIED', score: 20, color: '#767683' };
  return { label: 'IN TRANSIT', score: 54, color: '#fe9832' };
}

// ---------------- priced services ----------------
// Service 1: market-data — live inventory + verdicts + plan pricing (market context)
async function serviceMarketData() {
  const products = db.prepare('SELECT * FROM products ORDER BY id').all();
  const plans = getPlans();
  const rows = products.map((p) => {
    const cps = getCheckpoints(p.id);
    const v = verdictOf(p, cps);
    return {
      code: p.code,
      name: p.name,
      verdict: v.label,
      score: v.score,
      signatures: cps.length,
      fake: !!p.fake,
    };
  });
  return {
    products: rows,
    plans: plans.map((p) => ({ name: p.name, credits: p.credits, priceInr: p.price_inr })),
  };
}

// Service 2: news-summary — REAL headlines via Hacker News Algolia (free, no key),
// Gemini fallback if the network is unavailable.
async function serviceNewsSummary(keywords, researchType) {
  try {
    const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(keywords)}&hitsPerPage=5`;
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (r.ok) {
      const j = await r.json();
      const hits = (j.hits || []).filter((h) => h.title).slice(0, 5);
      if (hits.length) {
        return { headlines: hits.map((h) => h.title), source: 'Hacker News (live)' };
      }
    }
  } catch {
    /* fall through to AI-generated */
  }
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: `You are a market news desk. Generate 5 realistic, concise news headlines about: "${keywords}" (research type: ${researchType}). One headline per line, numbered.`,
  });
  return {
    headlines: (res.text || '').split('\n').map((l) => l.replace(/^\d+[.)]\s*/, '')).filter(Boolean).slice(0, 5),
    source: 'AI-generated (fallback)',
  };
}

// Service 3: report-generate — Gemini compiles the final report from both services
async function serviceReportGenerate(keywords, researchType, marketData, news) {
  const marketLines = marketData.products
    .map((p) => `- ${p.code} ${p.name}: ${p.verdict} (score ${p.score}, ${p.signatures} signatures${p.fake ? ', ⚠FAKE' : ''})`)
    .join('\n');
  const planLines = marketData.plans.map((p) => `- ${p.name}: ${p.credits} credits ₹${p.priceInr}`).join('\n');
  const newsLines = (news.headlines || []).map((h) => `- ${h}`).join('\n');
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: `You are a supply-chain market research analyst. Research topic: "${keywords}" (type: ${researchType}).
Compile a concise final report (max 220 words) with sections: MARKET SNAPSHOT (verdict mix from inventory), PRICE & PLANS (pricing context), NEWS WATCH (headlines), RECOMMENDATION (what a buyer should do).

INVENTORY:
${marketLines}

PLANS:
${planLines}

HEADLINES (${news.source}):
${newsLines}`,
  });
  return { report: res.text || 'Report generation failed.' };
}

// ---------------- payment helper (spend-policy guard checked by caller) ----------------
async function payForService(owner, serviceName) {
  const pay = await simulateAlgorandPayment(owner);
  return { service: serviceName, status: 'paid', amount: PRICE, txId: pay.txId, network: pay.network, round: pay.round };
}

// ---------------- routes ----------------
export function registerAgentRoutes(app) {
  // POST /api/agent/run — the research agent pays 3 services in sequence
  app.post('/api/agent/run', async (c) => {
    const owner = ownerKey(c);
    const { keywords, researchType } = await c.req.json().catch(() => ({}));
    if (!keywords || typeof keywords !== 'string' || !keywords.trim()) {
      return c.json({ error: 'keywords required' }, 400);
    }
    const type = RESEARCH_TYPES.includes(researchType) ? researchType : 'Balanced';
    const steps = [];
    let spent = 0;

    // Spend-policy guard: refuse BEFORE any payment once the budget is exhausted
    const guard = () => {
      if (spent >= MAX_CALLS) {
        return c.json({
          error: `Spend policy exhausted: ${spent}/${MAX_CALLS} paid calls used. Fund with Lora or try again later.`,
          ...paymentChallenge(),
        }, 402);
      }
      return null;
    };

    try {
      // 1. market-data
      const g1 = guard(); if (g1) return g1;
      steps.push({ ...(await payForService(owner, 'market-data')), result: await serviceMarketData() });
      spent++;

      // 2. news-summary
      const g2 = guard(); if (g2) return g2;
      steps.push({ ...(await payForService(owner, 'news-summary')), result: await serviceNewsSummary(keywords, type) });
      spent++;

      // 3. report-generate
      const g3 = guard(); if (g3) return g3;
      steps.push({
        ...(await payForService(owner, 'report-generate')),
        result: await serviceReportGenerate(keywords, type, steps[0].result, steps[1].result),
      });
      spent++;

      return c.json({
        ok: true,
        agent: 'research',
        steps,
        report: steps[2].result.report,
        budget: { maxCalls: MAX_CALLS, spent, remaining: MAX_CALLS - spent, pricePerCall: PRICE },
      });
    } catch (e) {
      return c.json({ error: 'Agent error: ' + e.message }, 500);
    }
  });

  // POST /api/agent/price-check — single-service agent (market-data only)
  app.post('/api/agent/price-check', async (c) => {
    const owner = ownerKey(c);
    try {
      const pay = await payForService(owner, 'market-data');
      const result = await serviceMarketData();
      return c.json({ ok: true, agent: 'price-check', steps: [{ ...pay, result }], budget: { maxCalls: MAX_CALLS, spent: 1, remaining: MAX_CALLS - 1, pricePerCall: PRICE } });
    } catch (e) {
      return c.json({ error: 'Agent error: ' + e.message }, 500);
    }
  });

  // POST /api/agent/info — single-service agent (product info + chain of custody)
  app.post('/api/agent/info', async (c) => {
    const owner = ownerKey(c);
    const { code } = await c.req.json().catch(() => ({}));
    if (!code || typeof code !== 'string') return c.json({ error: 'code required' }, 400);
    try {
      const pay = await payForService(owner, 'product-info');
      const product = getProductByCode(code);
      if (!product) return c.json({ error: `Unknown product code: ${code}` }, 404);
      const cps = getCheckpoints(product.id);
      const v = verdictOf(product, cps);
      const result = {
        code: product.code,
        name: product.name,
        batch: product.batch_id,
        origin: product.origin,
        details: product.details,
        verdict: v.label,
        score: v.score,
        chain: cps.map((cp) => ({ kind: cp.kind, label: cp.label, signedBy: cp.signed_by, role: cp.signer_role, timestamp: cp.timestamp, note: cp.note })),
      };
      return c.json({ ok: true, agent: 'info', steps: [{ ...pay, result }], budget: { maxCalls: MAX_CALLS, spent: 1, remaining: MAX_CALLS - 1, pricePerCall: PRICE } });
    } catch (e) {
      return c.json({ error: 'Agent error: ' + e.message }, 500);
    }
  });

  // GET /agent — Agent Network Monitor page (mirrors the x402 kit demo)
  app.get('/agent', (c) => {
    return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>VeriPass — Agent Network Monitor</title>
<style>
  body { background:#fff9ec; color:#010766; font-family:system-ui,sans-serif; margin:0; padding:24px; }
  .wrap { max-width:900px; margin:0 auto; }
  h1 { font-size:30px; margin:0 0 4px; }
  h2 { font-size:17px; color:#464651; margin:0 0 16px; font-weight:600; }
  .sec { background:#fff; border:3px solid #010766; box-shadow:4px 4px 0 #010766; padding:16px; margin-bottom:20px; }
  label { font-weight:700; font-size:14px; display:block; margin-bottom:6px; }
  input, select { font-size:15px; padding:10px; border:2px solid #010766; background:#fff; color:#010766; width:100%; box-sizing:border-box; margin-bottom:12px; }
  .row { display:flex; gap:12px; flex-wrap:wrap; }
  .row > div { flex:1; min-width:220px; }
  .btn { background:#010766; color:#fff; border:2px solid #010766; font-size:15px; font-weight:700; padding:10px 18px; cursor:pointer; box-shadow:3px 3px 0 #010766; }
  .btn:hover { transform:translate(1px,1px); box-shadow:2px 2px 0 #010766; }
  .btn.orange { background:#fe9832; color:#000; }
  .btn.pink { background:#E91E63; color:#fff; }
  .btn:disabled { opacity:.5; cursor:wait; }
  #log { font-family:monospace; font-size:14px; line-height:1.7; background:#010766; color:#00E5FF; padding:14px; min-height:120px; max-height:320px; overflow-y:auto; white-space:pre-wrap; }
  #report { font-size:15px; line-height:1.6; white-space:pre-wrap; background:#fff; border:2px solid #010766; padding:14px; display:none; }
  .sum { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:16px; }
  .sum .card { background:#fff; border:3px solid #010766; box-shadow:3px 3px 0 #010766; padding:10px 14px; }
  .sum .n { font-size:20px; font-weight:800; }
  .sum .l { font-size:12px; color:#464651; }
  a { color:#010766; }
  .foot { margin-top:16px; font-size:13px; color:#464651; }
  @media (prefers-color-scheme: dark) {
    body { background:#0a0a1a; color:#e0e0f0; }
    .sec { background:#141428; border-color:#00E5FF; box-shadow:4px 4px 0 #00E5FF; }
    h1 { color:#00E5FF; }
    h2 { color:#a0a0c0; }
    input, select { background:#1a1a2e; color:#e0e0f0; border-color:#00E5FF; }
    .btn { border-color:#00E5FF; }
    .btn.orange { background:#fe9832; color:#000; }
    .btn.pink { background:#E91E63; color:#fff; }
    #report { background:#1a1a2e; border-color:#00E5FF; color:#e0e0f0; }
    .sum .card { background:#141428; border-color:#00E5FF; box-shadow:3px 3px 0 #00E5FF; }
    .sum .l { color:#a0a0c0; }
    a { color:#00E5FF; }
    .foot { color:#a0a0c0; }
  }
</style>
</head>
<body>
<div class="wrap">
  <h1>🤖 VeriPass — Agent Network Monitor</h1>
  <h2>x402 agentic payments · agents pay 0.003 ALGO per service · spend-policy guard before every payment</h2>

  <div class="sum">
    <div class="card"><div class="n">3</div><div class="l">priced services</div></div>
    <div class="card"><div class="n">0.003</div><div class="l">ALGO per call</div></div>
    <div class="card"><div class="n">3</div><div class="l">max calls / run</div></div>
    <div class="card"><div class="n">13</div><div class="l">products monitored</div></div>
  </div>

  <div class="sec">
    <h2>🧪 Research Agent — pays 3 priced services in sequence (market-data → news-summary → report-generate), checking the spend-policy guard before every payment, then returns one final report.</h2>
    <div class="row">
      <div>
        <label for="kw">News search keywords (short — used to fetch real headlines)</label>
        <input id="kw" placeholder="e.g. supply chain India" value="supply chain India">
      </div>
      <div>
        <label for="type">Research type</label>
        <select id="type">
          <option>Balanced</option>
          <option>Market-Focused</option>
          <option>News-Focused</option>
          <option>Deep Dive</option>
        </select>
      </div>
    </div>
    <button class="btn orange" id="run">▶ Run Research Agent</button>
    <button class="btn" id="price">💹 Price Check Agent</button>
    <button class="btn pink" id="info">🔍 Product Info Agent</button>
    <input id="pcode" placeholder="product code (e.g. AS-SENSOR-2026-001)" style="margin-top:12px">
  </div>

  <div class="sec">
    <h2>📡 Agent activity log</h2>
    <div id="log">// agents idle — waiting for a run…</div>
  </div>

  <div class="sec">
    <h2>📄 Final report</h2>
    <div id="report"></div>
  </div>

  <div class="sec">
    <h2>💰 Funding</h2>
    <p style="font-size:14px">Agents pay 0.003 ALGO per service on Algorand (simulated ledger in demo mode). For real TestNet ALGO, fund your account with <a href="https://lora.algokit.io/testnet/fund" target="_blank"><b>Lora — AlgoKit testnet faucet</b></a> (requires AlgoKit login).</p>
    <a class="btn" href="https://lora.algokit.io/testnet/fund" target="_blank">Fund with Lora →</a>
    <a class="btn" href="/dashboard" style="margin-left:8px">📊 Admin Dashboard</a>
    <a class="btn" href="/demo" style="margin-left:8px">🧪 Judge Demo</a>
  </div>

  <div class="foot">VeriPass · x402 Agentic Payments Kit · demo payments are simulated — no real charge</div>
</div>

<script>
const logEl = document.getElementById('log');
const reportEl = document.getElementById('report');
const log = (line) => { logEl.textContent += '\\n' + line; logEl.scrollTop = logEl.scrollHeight; };
const setBusy = (b) => { document.querySelectorAll('button').forEach(x => x.disabled = b); };

async function runAgent(path, body) {
  setBusy(true);
  reportEl.style.display = 'none';
  logEl.textContent = '// run started — spend-policy guard armed (max 3 paid calls)…';
  try {
    const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json();
    if (!r.ok) { log('✖ ' + (j.error || 'agent failed')); return; }
    for (const s of j.steps) {
      log('💸 agent paid ' + s.service + ' — ' + s.amount + ' ALGO — tx ' + s.txId + ' (' + s.network + ', round ' + s.round + ')');
      await new Promise(res => setTimeout(res, 600));
    }
    log('✅ budget: ' + j.budget.spent + '/' + j.budget.maxCalls + ' calls · remaining ' + j.budget.remaining + ' · ' + j.budget.pricePerCall + ' ALGO/call');
    if (j.report) { reportEl.textContent = j.report; reportEl.style.display = 'block'; }
    if (j.steps[0] && j.steps[0].result && j.steps[0].result.products) {
      log('📦 market-data: ' + j.steps[0].result.products.length + ' products · ' + j.steps[0].result.products.filter(p => p.verdict === 'AUTHENTIC').length + ' authentic');
    }
    if (j.steps[1] && j.steps[1].result && j.steps[1].result.headlines) {
      log('📰 news-summary (' + j.steps[1].result.source + '): ' + j.steps[1].result.headlines.length + ' headlines');
    }
  } catch (e) {
    log('✖ network error: ' + e.message);
  } finally {
    setBusy(false);
  }
}

document.getElementById('run').onclick = () => runAgent('/api/agent/run', { keywords: document.getElementById('kw').value, researchType: document.getElementById('type').value });
document.getElementById('price').onclick = () => runAgent('/api/agent/price-check', {});
document.getElementById('info').onclick = () => runAgent('/api/agent/info', { code: document.getElementById('pcode').value || 'AS-SENSOR-2026-001' });
</script>
</body>
</html>`);
  });
}