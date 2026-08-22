// VeriPass AI — agentic orchestrator managing 8 specialist agents, paid via credits or x402 (Algorand).
// 1–5 credits per question (0.001–0.005 ALGO via x402) depending on the agent used.
import { GoogleGenAI, Type } from '@google/genai';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  db,
  getProductByCode,
  getCheckpoints,
  getUsage,
  getPlans,
  getCredits,
  getPlanPurchases,
  getBookmarkedProductIds,
  consumeCredits,
  recordAgentUse,
  getAgentUsage,
  FREE_SCAN_LIMIT,
} from './db.js';
import { paymentChallenge, verifyPaymentProof } from './x402.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const GEMINI_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_KEY) {
  if (process.env.NODE_ENV === 'production') throw new Error('GEMINI_API_KEY env var is required');
  console.warn('[ai] GEMINI_API_KEY not set — AI features will fail in production');
}
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });

// ---- tiny verdict helper (mirrors server.js computeVerdict) ----
function verdictOf(product, cps) {
  if (product.fake) return { label: 'NOT GENUINE', score: 12, color: '#E91E63' };
  const signed = new Set(cps.filter((c) => c.signed_by).map((c) => c.kind));
  if (signed.size === 3) return { label: 'AUTHENTIC', score: 98, color: '#41ad31' };
  if (signed.size === 0) return { label: 'UNVERIFIED', score: 20, color: '#767683' };
  return { label: 'IN TRANSIT', score: 54, color: '#fe9832' };
}

export const AGENTS = [
  { id: 'inventory', name: 'Inventory Agent', priceAlgo: '0.001', credits: 1, description: 'Lists your bookmarked products with live verdicts, scores and signature counts.', tools: ['getProducts'] },
  { id: 'passport', name: 'Passport Agent', priceAlgo: '0.001', credits: 1, description: 'Fetches the full chain-of-custody passport of one bookmarked product.', tools: ['getProductStatus'] },
  { id: 'market', name: 'Market Agent', priceAlgo: '0.002', credits: 2, description: 'Looks up the VeriPass market price (INR) of a product.', tools: ['getMarketPrice'] },
  { id: 'usage', name: 'Usage Agent', priceAlgo: '0.001', credits: 1, description: 'Reports your free-scan usage, credit balance and pricing plans.', tools: ['getUsage', 'getPlans'] },
  { id: 'proof', name: 'Proof Agent', priceAlgo: '0.002', credits: 2, description: 'Summarises the live proof panel: payments, purchases, signatures and product stats.', tools: ['getDashboardStats'] },
  { id: 'guide', name: 'Guide Agent', priceAlgo: '0.002', credits: 2, description: 'Answers questions about the demo, IP addresses and project guides.', tools: ['getGuide'] },
  { id: 'search', name: 'Search Agent', priceAlgo: '0.005', credits: 5, description: 'Complex search across the full product catalogue by name, code, batch, origin or details.', tools: ['searchProducts'] },
  { id: 'compare', name: 'Compare Agent', priceAlgo: '0.005', credits: 5, description: 'Complex side-by-side comparison of two product passports.', tools: ['compareProducts'] },
];

// ---- tools the agent can call ----
const TOOLS = {
  async getProducts(_args, ownerKey) {
    const bookmarked = new Set(getBookmarkedProductIds(ownerKey));
    const rows = db.prepare('SELECT * FROM products ORDER BY id').all().filter((p) => bookmarked.has(p.id));
    if (!rows.length) {
      return { note: 'Your inventory is empty \u2014 bookmark products from the Scan screen first.', products: [] };
    }
    return {
      products: rows.map((p) => {
        const cps = getCheckpoints(p.id);
        const v = verdictOf(p, cps);
        return {
          code: p.code,
          name: p.name,
          verdict: v.label,
          score: v.score,
          signatures: cps.filter((c) => c.signed_by).length,
          fake: !!p.fake,
        };
      }),
    };
  },
  async getProductStatus(args, ownerKey) {
    const p = getProductByCode(String(args.code || '').trim().toUpperCase());
    if (!p) return { error: `product ${args.code} not found` };
    if (!getBookmarkedProductIds(ownerKey).includes(p.id)) {
      return { error: `product ${p.code} is not in your inventory \u2014 bookmark it first from the Scan screen` };
    }
    const cps = getCheckpoints(p.id);
    const v = verdictOf(p, cps);
    return {
      code: p.code,
      name: p.name,
      batch: p.batch_id,
      origin: p.origin,
      details: p.details,
      verdict: v.label,
      score: v.score,
      chain: cps.map((c) => ({
        kind: c.kind,
        label: c.label,
        signedBy: c.signed_by || null,
        role: c.signer_role || null,
        timestamp: c.timestamp,
        note: c.note,
      })),
    };
  },
  async getUsage(_args, ownerKey) {
    const r = db.prepare('SELECT owner_key, used FROM usage WHERE owner_key = ?').get(ownerKey);
    return {
      owner: ownerKey,
      freeUsed: r ? r.used : 0,
      freeLimit: FREE_SCAN_LIMIT,
      credits: getCredits(ownerKey),
    };
  },
  async getPlans(_args, _ownerKey) {
    return getPlans();
  },
  async getMarketPrice(args) {
    const p = getProductByCode(String(args.code || '').trim().toUpperCase());
    if (!p) return { error: `product ${args.code} not found` };
    return {
      code: p.code,
      name: p.name,
      marketPriceInr: p.market_price || 0,
      currency: 'INR',
      note: 'VeriPass market index (demo estimate)',
    };
  },
  async getDashboardStats(_args, _ownerKey) {
    const payments = db.prepare('SELECT COUNT(*) n, COALESCE(SUM(amount),0) total FROM payments').get();
    const purchases = getPlanPurchases();
    const checkpoints = db.prepare('SELECT COUNT(*) n FROM checkpoints WHERE signed_by IS NOT NULL').get();
    return {
      x402Payments: payments.n,
      totalAlgoPaid: payments.total,
      planPurchases: purchases.length,
      signedCheckpoints: checkpoints.n,
      products: db.prepare('SELECT COUNT(*) n FROM products').get().n,
    };
  },
  async getGuide(args) {
    const topic = String(args.topic || '').toLowerCase();
    const files = {
      guide: 'guid.md',
      cheatsheet: 'cheatsheet.md',
      ips: 'ips.md',
      veripass: 'VeriPass.md',
    };
    const name = files[topic] || (topic ? null : 'cheatsheet.md');
    if (!name) return { error: `unknown guide topic '${args.topic}'. Available: guide, cheatsheet, ips, veripass` };
    try {
      const text = fs.readFileSync(path.join(ROOT, name), 'utf8');
      return { file: name, excerpt: text.slice(0, 8000) };
    } catch (e) {
      return { error: `cannot read ${name}: ${e.message}` };
    }
  },
  async searchProducts(args) {
    const q = String(args.query || '').trim().toLowerCase();
    if (!q) return { error: 'query required' };
    const rows = db.prepare('SELECT * FROM products').all().filter((p) =>
      [p.code, p.name, p.batch_id, p.origin, p.details].join(' ').toLowerCase().includes(q)
    );
    if (!rows.length) return { note: `No products match "${args.query}".`, products: [] };
    return {
      products: rows.map((p) => {
        const cps = getCheckpoints(p.id);
        const v = verdictOf(p, cps);
        return { code: p.code, name: p.name, verdict: v.label, score: v.score, signatures: cps.filter((c) => c.signed_by).length, fake: !!p.fake };
      }),
    };
  },
  async compareProducts(args) {
    const a = getProductByCode(String(args.codeA || '').trim().toUpperCase());
    const b = getProductByCode(String(args.codeB || '').trim().toUpperCase());
    if (!a) return { error: `product ${args.codeA} not found` };
    if (!b) return { error: `product ${args.codeB} not found` };
    const passport = (p) => {
      const cps = getCheckpoints(p.id);
      const v = verdictOf(p, cps);
      return { code: p.code, name: p.name, batch: p.batch_id, origin: p.origin, details: p.details, verdict: v.label, score: v.score, chain: cps.map((c) => ({ kind: c.kind, label: c.label, signedBy: c.signed_by, role: c.signer_role, timestamp: c.timestamp })) };
    };
    return { productA: passport(a), productB: passport(b) };
  },
};

const DECLARATIONS = [
  {
    name: 'getProducts',
    description: 'List the products in THIS user\'s inventory (bookmarked products only) with verdict (AUTHENTIC / IN TRANSIT / NOT GENUINE / UNVERIFIED), score, signature count and fake flag.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: 'getProductStatus',
    description: 'Get the full supply-chain passport of one bookmarked product: chain-of-custody checkpoints, signers, timestamps, verdict and score.',
    parameters: {
      type: Type.OBJECT,
      properties: { code: { type: Type.STRING, description: 'Product code, e.g. DJ-TEA-2023-8991' } },
      required: ['code'],
    },
  },
  {
    name: 'getUsage',
    description: 'This user\'s own API usage: free scans used vs limit and purchased credit balance.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: 'getPlans',
    description: 'The pricing plans (credits per plan and price in INR).',
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: 'getMarketPrice',
    description: 'Get the VeriPass market price (INR) of one product \u2014 the live market index for a product code.',
    parameters: {
      type: Type.OBJECT,
      properties: { code: { type: Type.STRING, description: 'Product code, e.g. DJ-TEA-2023-8991' } },
      required: ['code'],
    },
  },
  {
    name: 'getDashboardStats',
    description: 'Aggregate proof stats: number of x402 payments, total ALGO paid, plan purchases, signed checkpoints, product count.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: 'getGuide',
    description: 'Read a project guide file. Topics: guide (landing-page guide), cheatsheet (demo-day cheat sheet), ips (IP addresses), veripass (main project doc).',
    parameters: {
      type: Type.OBJECT,
      properties: { topic: { type: Type.STRING, description: 'guide | cheatsheet | ips | veripass' } },
      required: ['topic'],
    },
  },
  {
    name: 'searchProducts',
    description: 'Search the full VeriPass product catalogue (all products, not just bookmarked) by name, code, batch, origin or details. Returns matches with verdicts.',
    parameters: {
      type: Type.OBJECT,
      properties: { query: { type: Type.STRING, description: 'Search text, e.g. "tea" or "2026-004"' } },
      required: ['query'],
    },
  },
  {
    name: 'compareProducts',
    description: 'Compare two product passports side by side (chain-of-custody, verdicts, scores).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        codeA: { type: Type.STRING, description: 'First product code' },
        codeB: { type: Type.STRING, description: 'Second product code' },
      },
      required: ['codeA', 'codeB'],
    },
  },
];

function buildSystemPrompt(u) {
  return `You are VeriPass AI \u2014 the agentic orchestrator of VeriPass, an anti-counterfeit product-passport platform on Algorand.
You manage 8 specialist agents, each with its own price (1 credit = 0.001 ALGO):
- Inventory Agent (0.001 ALGO) \u2014 lists THIS user's bookmarked products with live verdicts.
- Passport Agent (0.001 ALGO) \u2014 full chain-of-custody passport of one bookmarked product.
- Market Agent (0.002 ALGO) \u2014 market price (INR) of a product.
- Usage Agent (0.001 ALGO) \u2014 this user's free-scan usage, credit balance and pricing plans.
- Proof Agent (0.002 ALGO) \u2014 live proof panel stats (payments, purchases, signatures).
- Guide Agent (0.002 ALGO) \u2014 demo, IP addresses and project guides.
- Search Agent (0.005 ALGO) \u2014 complex search across the full product catalogue.
- Compare Agent (0.005 ALGO) \u2014 side-by-side comparison of two product passports.
Rules:
- ALWAYS route the question to the right agent by calling its tool \u2014 never invent numbers, verdicts or products.
- The user is ${u.identifier} with ${getCredits(u.identifier)} credits. Personalise the answer for them; only their bookmarked products are visible.
- Answer concisely and helpfully, in plain language. Use short bullet lists when useful. Format prices in \u20b9 (INR) and ALGO.
- If the user asks about pricing or buying credits, use getPlans and mention the avatar/hourglass \u2192 billing screen.
- If the user asks about a product's market price, use getMarketPrice with its exact code.
- If the user asks about the demo or IP addresses, use getGuide.
- If a tool returns an error, tell the user what went wrong and suggest a fix.`;
}

// ---- route registration (called from server.js) ----
export function registerAiRoutes(app, auth) {
  app.get('/api/ai/agents', (c) => c.json({ agents: AGENTS }));

  app.post('/api/ai/chat', async (c) => {
    const u = auth(c);
    if (!u) return c.json({ error: 'unauthorized' }, 401);
    const { message, history = [] } = await c.req.json().catch(() => ({}));
    if (!message || !String(message).trim()) return c.json({ error: 'message required' }, 400);

    // ---- payment gate: Agentic AI costs 1\u20135 credits per question (0.001\u20130.005 ALGO via x402) ----
    // The most expensive agent used in the turn sets the price; credits are consumed after the turn.
    const sigHeader = c.req.header('x-pay-signature');
    let paidViaX402 = false;
    if (sigHeader) {
      const proof = verifyPaymentProof(sigHeader, u.identifier);
      if (!proof.ok) {
        return c.json({ error: `Payment not valid: ${proof.reason}`, ...paymentChallenge('0.005') }, 402);
      }
      paidViaX402 = true;
    } else if (getCredits(u.identifier) < 1) {
      return c.json({
        error: 'Agentic AI: 1\u20135 credits per question (0.001\u20130.005 ALGO via x402) depending on the agent. Buy credits or pay to ask.',
        ...paymentChallenge('0.005'),
      }, 402);
    }

    try {
      const contents = [
        ...(Array.isArray(history) ? history : []).map((h) => ({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: String(h.content || '') }],
        })),
        { role: 'user', parts: [{ text: String(message) }] },
      ];

      let response = await ai.models.generateContent({
        model: MODEL,
        contents,
        config: {
          systemInstruction: buildSystemPrompt(u),
          tools: [{ functionDeclarations: DECLARATIONS }],
        },
      });

      let guard = 0;
      const agentByTool = {};
      for (const a of AGENTS) for (const t of a.tools) agentByTool[t] = a.id;
      const usedAgents = new Set();
      let maxCost = 0;
      while (response.functionCalls && guard < 6) {
        // Echo the model's function-call parts back, preserving the opaque
        // thoughtSignature the API requires on multi-turn tool use.
        const rawParts = response.candidates?.[0]?.content?.parts || [];
        const modelParts = rawParts
          .filter((p) => p.functionCall)
          .map((p) => ({
            functionCall: { name: p.functionCall.name, args: p.functionCall.args || {} },
            ...(p.thoughtSignature ? { thoughtSignature: p.thoughtSignature } : {}),
          }));
        const toolParts = [];
        for (const fc of response.functionCalls) {
          const fn = TOOLS[fc.name];
          let output;
          try {
            output = fn ? await fn(fc.args || {}, u.identifier) : { error: `unknown tool ${fc.name}` };
          } catch (e) {
            output = { error: String((e && e.message) || e) };
          }
          const agentId = agentByTool[fc.name];
          if (agentId) {
            usedAgents.add(agentId);
            const agent = AGENTS.find((a) => a.id === agentId);
            if (agent && agent.credits > maxCost) maxCost = agent.credits;
            recordAgentUse(agentId, agent ? agent.credits : 0);
          }
          toolParts.push({ functionResponse: { name: fc.name, response: { output } } });
        }
        contents.push({ role: 'model', parts: modelParts });
        contents.push({ role: 'user', parts: toolParts });
        response = await ai.models.generateContent({
          model: MODEL,
          contents,
          config: {
            systemInstruction: buildSystemPrompt(u),
            tools: [{ functionDeclarations: DECLARATIONS }],
          },
        });
        guard += 1;
      }

      if (!paidViaX402 && maxCost > 0) consumeCredits(u.identifier, maxCost);
      const reply = response.text || 'Hmm, I could not produce an answer. Try rephrasing your question.';
      return c.json({ ok: true, reply, cost: maxCost, credits: getCredits(u.identifier) });
    } catch (e) {
      console.error('[ai] error:', e && e.message);
      return c.json({ error: `AI service error: ${(e && e.message) || e}` }, 500);
    }
  });
}
