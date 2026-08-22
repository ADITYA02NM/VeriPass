/**
 * VeriPass — database layer (node:sqlite built-in, zero native deps)
 * Tables: users, products, checkpoints, usage, payments
 */
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
mkdirSync(DATA_DIR, { recursive: true });

export const db = new DatabaseSync(path.join(DATA_DIR, 'veripass.db'));

db.exec(`
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  identifier TEXT UNIQUE NOT NULL,
  passkey    TEXT NOT NULL,
  name       TEXT NOT NULL,
  role       TEXT NOT NULL CHECK (role IN ('User','Producer','Logistics','Retailer')),
  origin     TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  code       TEXT UNIQUE NOT NULL,
  name       TEXT NOT NULL,
  batch_id   TEXT NOT NULL,
  origin     TEXT,
  details    TEXT,
  icon       TEXT DEFAULT 'inventory_2',
  created_at TEXT DEFAULT (datetime('now')),
  fake       INTEGER DEFAULT 0        -- 1 = counterfeit demo product (no signatures possible)
);

CREATE TABLE IF NOT EXISTS checkpoints (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id  INTEGER NOT NULL REFERENCES products(id),
  kind        TEXT NOT NULL CHECK (kind IN ('production','shipment','receipt','alert')),
  label       TEXT NOT NULL,
  signed_by   TEXT,
  signer_role TEXT,
  timestamp   TEXT DEFAULT (datetime('now')),
  note        TEXT
);

-- one checkpoint per (product, kind) — makes the seed idempotent and enforces
-- the "each kind signed once" rule at the DB level too
CREATE UNIQUE INDEX IF NOT EXISTS idx_checkpoint_kind ON checkpoints(product_id, kind);

CREATE TABLE IF NOT EXISTS usage (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_key  TEXT NOT NULL,            -- user identifier or 'anon'
  used       INTEGER DEFAULT 0
);

-- one usage counter per owner (required by bumpUsage ON CONFLICT)
CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_owner ON usage(owner_key);

CREATE TABLE IF NOT EXISTS payments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  txid        TEXT UNIQUE NOT NULL,
  owner_key   TEXT NOT NULL,
  amount      TEXT NOT NULL,
  network     TEXT NOT NULL,           -- 'algorand-sim'
  round       INTEGER,
  sender      TEXT,
  receiver    TEXT,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS agent_usage (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id         TEXT NOT NULL UNIQUE,
  calls            INTEGER DEFAULT 0,
  credits_consumed INTEGER DEFAULT 0,
  updated_at       TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_key   TEXT NOT NULL,
  product_id  INTEGER NOT NULL REFERENCES products(id),
  created_at  TEXT DEFAULT (datetime('now')),
  UNIQUE (owner_key, product_id)
);

-- business model: plan catalog (1 credit = 1 use) + purchase ledger
CREATE TABLE IF NOT EXISTS plans (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT UNIQUE NOT NULL,
  credits    INTEGER NOT NULL,
  price_inr  INTEGER NOT NULL,
  tagline    TEXT
);

CREATE TABLE IF NOT EXISTS plan_purchases (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_key   TEXT NOT NULL,
  plan_name   TEXT NOT NULL,
  credits     INTEGER NOT NULL,
  amount_inr  INTEGER NOT NULL,
  card_last4  TEXT,
  created_at  TEXT DEFAULT (datetime('now'))
);
`);

// migration: add credits column to users (existing DBs created before plans existed)
try { db.exec('ALTER TABLE users ADD COLUMN credits INTEGER DEFAULT 0'); } catch (e) {
  if (!String(e?.message || '').includes('duplicate column')) throw e;
}

// migration: market price per product (for the AI market-price tool)
try { db.exec('ALTER TABLE products ADD COLUMN market_price INTEGER DEFAULT 0'); } catch (e) {
  if (!String(e?.message || '').includes('duplicate column')) throw e;
}
// Deterministic seed prices — only set once (when zero), don't re-randomize on restart
db.exec(`UPDATE products SET market_price =
  CASE
    WHEN code LIKE 'DJ-%' THEN 899
    WHEN code LIKE 'AS-%' THEN 4599
    WHEN code LIKE 'FAKE-%' THEN 199
    WHEN code LIKE 'MED-%' THEN 2499
    WHEN code LIKE 'ELEC-%' THEN 12999
    WHEN code LIKE 'COSM-%' THEN 1599
    WHEN code LIKE 'FOOD-%' THEN 449
    WHEN code LIKE 'JEWEL-%' THEN 85999
    WHEN code LIKE 'DOC-%' THEN 0
    WHEN code LIKE 'SPARE-%' THEN 3299
    WHEN code LIKE 'AGRO-%' THEN 649
    WHEN code LIKE 'TEXT-%' THEN 2899
    WHEN code LIKE 'BEV-%' THEN 249
    WHEN code LIKE 'PHARMA-%' THEN 399
    WHEN code LIKE 'AUTO-%' THEN 5499
    ELSE 999
  END
WHERE market_price = 0 OR market_price IS NULL`);

// ---------------- Seed (idempotent) ----------------
function seed() {
  // migrate old demo identifiers → short ones (idempotent; safe to re-run)
  const MIGRATE = [
    ['producer', 'pro'], ['logistics', 'log'], ['retailer', 'ret'],
  ];
  for (const [oldId, newId] of MIGRATE) {
    db.prepare('UPDATE users SET identifier = ?, passkey = ? WHERE identifier = ? AND NOT EXISTS (SELECT 1 FROM users WHERE identifier = ?)').run(newId, newId, oldId, newId);
    db.prepare('UPDATE usage SET owner_key = ? WHERE owner_key = ? AND NOT EXISTS (SELECT 1 FROM usage WHERE owner_key = ?)').run(newId, oldId, newId);
    db.prepare('UPDATE bookmarks SET owner_key = ? WHERE owner_key = ? AND NOT EXISTS (SELECT 1 FROM bookmarks WHERE owner_key = ?)').run(newId, oldId, newId);
  }

  const users = [
    ['user', 'user', 'Consumer Demo', 'User', 'India'],
    ['pro', 'pro', 'AstraSense Industries (Pune)', 'Producer', 'Pune, Maharashtra'],
    ['log', 'log', 'BlueDart Logistics', 'Logistics', 'Mumbai, Maharashtra'],
    ['ret', 'ret', 'Metro Mega Store', 'Retailer', 'Delhi NCR'],
    ['ravi', 'ravi', 'Ravi Kumar', 'User', 'India'],
  ];
  for (const [identifier, passkey, name, role, origin] of users) {
    db.prepare(
      'INSERT OR IGNORE INTO users (identifier, passkey, name, role, origin) VALUES (?,?,?,?,?)'
    ).run(identifier, passkey, name, role, origin);
  }

  // 15 use-case products (1-3 are the demo stars; 4-15 add breadth for the tiled /demo grid)
  const products = [
    ['DJ-TEA-2023-8991', 'Use Case 1 · Organic Darjeeling Tea', 'DJ-2023-8991', 'Makaibari Estate, Darjeeling', 'First-flush organic black tea, USDA Organic + Fair Trade certified. Fully signed supply chain.', 'emoji_food_beverage', 0],
    ['AS-SENSOR-2026-001', 'Use Case 2 · AstraSense Industrial Sensor', 'AS-2026-001', 'AstraSense Factory, Pune', 'Industrial IoT temperature sensor. Producer signs the batch LIVE during the demo.', 'sensors', 0],
    ['FAKE-WATCH-7', 'Use Case 3 · Pharma Component X (Counterfeit)', 'RX-0012-ERR', 'Unknown (grey market)', 'Counterfeit unit found on grey market. No valid signatures on record — DO NOT TRUST.', 'medication', 1],
    ['MED-2026-004', 'Use Case 4 · Cold-Chain Vaccine Vial', 'MED-2026-004', 'Serum Institute, Pune', 'Temperature-logged vaccine vial, cold chain verified end-to-end.', 'vaccines', 0],
    ['ELEC-2026-005', 'Use Case 5 · Smartphone Battery Pack', 'ELEC-2026-005', 'Samsung SDI, Chennai', 'Li-ion battery pack with tamper-evident seal.', 'battery_charging_full', 0],
    ['COSM-2026-006', 'Use Case 6 · Organic Skincare Serum', 'COSM-2026-006', 'Forest Essentials, Uttarakhand', 'Handcrafted ayurvedic serum, cruelty-free batch.', 'spa', 0],
    ['FOOD-2026-007', 'Use Case 7 · Basmati Rice 5kg', 'FOOD-2026-007', 'KRBL Ltd, Amritsar', 'Aged basmati, FSSAI certified, export-grade lot.', 'rice_bowl', 0],
    ['JEWEL-2026-008', 'Use Case 8 · 22k Gold Necklace', 'JEWEL-2026-008', 'Tanishq, Jaipur', 'BIS-hallmarked 22k gold, certificate of purity attached.', 'diamond', 0],
    ['DOC-2026-009', 'Use Case 9 · Degree Certificate', 'DOC-2026-009', 'IIT Delhi', 'Digitally signed academic credential with QR verification.', 'school', 0],
    ['SPARE-2026-010', 'Use Case 10 · Auto Spare Part (OEM)', 'SPARE-2026-010', 'Bosch, Bengaluru', 'OEM brake assembly — registered, awaiting first signature.', 'settings', 0],
    ['AGRO-2026-011', 'Use Case 11 · Organic Fertilizer Bag', 'AGRO-2026-011', 'IFFCO, Kandla', 'Neem-coated urea, traceable from plant to distributor.', 'agriculture', 0],
    ['TEXT-2026-012', 'Use Case 12 · Handloom Cotton Saree', 'TEXT-2026-012', 'Weavers Co-op, Varanasi', 'GI-tagged handloom saree, artisan-signed provenance.', 'checkroom', 0],
    ['BEV-2026-013', 'Use Case 13 · Energy Drink (Counterfeit)', 'BEV-2026-013', 'Unknown (grey market)', 'Counterfeit energy drink — label mismatch, no valid signatures.', 'local_drink', 1],
    ['PHARMA-2026-014', 'Use Case 14 · Pharma Strip (Wrongly Signed)', 'PHARMA-2026-014', 'Metro Pharma, Mumbai', 'Strip with swapped sticker — receipt signature does not match the batch.', 'medication', 1],
    ['AUTO-2026-015', 'Use Case 15 · Auto Component (Not Signed)', 'AUTO-2026-015', 'Bosch, Bengaluru', 'OEM brake valve — QR minted, awaiting producer signature.', 'settings', 0],
  ];
  for (const [code, name, batch, origin, details, icon, fake] of products) {
    db.prepare(`INSERT OR IGNORE INTO products (code, name, batch_id, origin, details, icon, fake)
      VALUES (?,?,?,?,?,?,?)`)
      .run(code, name, batch, origin, details, icon, fake);
  }

  const byCode = (code) => db.prepare('SELECT id FROM products WHERE code = ?').get(code);
  const p1 = byCode('DJ-TEA-2023-8991');
  const p2 = byCode('AS-SENSOR-2026-001');
  const p3 = byCode('FAKE-WATCH-7');
  const addCp = (code, kind, label, by, role, ts, note) => {
    const p = byCode(code);
    if (!p) return;
    db.prepare(`INSERT OR IGNORE INTO checkpoints (product_id, kind, label, signed_by, signer_role, timestamp, note)
      VALUES (?,?,?,?,?,?,?)`).run(p.id, kind, label, by, role, ts, note);
  };

  // fully signed chains (AUTHENTIC): 1, 4, 7, 9, 12
  for (const code of ['DJ-TEA-2023-8991', 'MED-2026-004', 'FOOD-2026-007', 'DOC-2026-009', 'TEXT-2026-012']) {
    addCp(code, 'production', 'Production Signed — harvested & certified', 'AstraSense Industries (Pune)', 'Producer', '2026-08-10 09:14:00', 'Batch certified by FSSAI-grade QA');
    addCp(code, 'shipment', 'Shipment Signed — left warehouse', 'BlueDart Logistics', 'Logistics', '2026-08-12 06:40:00', 'Seal #LD-4471, temp logged');
    addCp(code, 'receipt', 'Receipt Signed — delivered to store', 'Metro Mega Store', 'Retailer', '2026-08-15 11:05:00', 'Shelf acceptance verified');
  }
  // production only (IN TRANSIT 1/3): 5, 8
  for (const code of ['ELEC-2026-005', 'JEWEL-2026-008']) {
    addCp(code, 'production', 'Production Signed — certified', 'AstraSense Industries (Pune)', 'Producer', '2026-08-14 10:00:00', 'Batch certified by QA');
  }
  // production + shipment (IN TRANSIT 2/3): 6, 11
  for (const code of ['COSM-2026-006', 'AGRO-2026-011']) {
    addCp(code, 'production', 'Production Signed — certified', 'AstraSense Industries (Pune)', 'Producer', '2026-08-14 10:00:00', 'Batch certified by QA');
    addCp(code, 'shipment', 'Shipment Signed — left warehouse', 'BlueDart Logistics', 'Logistics', '2026-08-16 08:20:00', 'Seal verified, temp logged');
  }
  // registered only (UNVERIFIED): 2 (live-sign demo), 10
  addCp('AS-SENSOR-2026-001', 'alert', 'Registered — awaiting producer signature', null, null, '2026-08-19 10:00:00', 'QR minted, passport open. Producer signs live during demo.');
  addCp('SPARE-2026-010', 'alert', 'Registered — awaiting first signature', null, null, '2026-08-19 10:00:00', 'QR minted, passport open.');
  // counterfeit (NOT GENUINE): 3, 13
  addCp('FAKE-WATCH-7', 'alert', 'Tamper alert — no valid signatures found', null, null, '2026-08-19 10:00:00', 'Unit not traceable to any registered producer.');
  addCp('BEV-2026-013', 'alert', 'Tamper alert — no valid signatures found', null, null, '2026-08-19 10:00:00', 'Label mismatch, unit not traceable.');
  // wrongly signed (NOT GENUINE): 14 — receipt exists but no production signature
  addCp('PHARMA-2026-014', 'receipt', 'Receipt Signed — delivered to store', 'Metro Mega Store', 'Retailer', '2026-08-18 14:30:00', 'Sticker swapped — signature does not match batch');
  // registered only (UNVERIFIED): 15
  addCp('AUTO-2026-015', 'alert', 'Registered — awaiting signature', null, null, '2026-08-19 10:00:00', 'QR minted, passport open — no signatures yet');

  // usage rows for all users + anon
  for (const id of ['user', 'pro', 'log', 'ret', 'ravi', 'anon']) {
    db.prepare('INSERT OR IGNORE INTO usage (owner_key, used) VALUES (?,0)').run(id);
  }

  // plans catalog (business model: 1 credit = 1 use)
  const plans = [
    ['Starter 100', 100, 50, '100 credits — 100 verifications or 33 AI questions'],
    ['Pro 200', 200, 120, '200 credits — most popular'],
    ['Enterprise 300', 300, 190, '300 credits — full demo day'],
  ];
  for (const [name, credits, price, tagline] of plans) {
    db.prepare('INSERT OR IGNORE INTO plans (name, credits, price_inr, tagline) VALUES (?,?,?,?)')
      .run(name, credits, price, tagline);
  }
  // migration: enforce current pricing on existing rows (INSERT OR IGNORE won't update)
  for (const [name, credits, price, tagline] of plans) {
    db.prepare('UPDATE plans SET credits = ?, price_inr = ?, tagline = ? WHERE name = ?')
      .run(credits, price, tagline, name);
  }

  // demo bookmarks: pro/log/ret/ravi each have a few items in the vault, user stays EMPTY
  if (p1 && p2) {
    for (const owner of ['pro', 'log', 'ret', 'ravi']) {
      db.prepare('INSERT OR IGNORE INTO bookmarks (owner_key, product_id) VALUES (?,?)').run(owner, p1.id);
      db.prepare('INSERT OR IGNORE INTO bookmarks (owner_key, product_id) VALUES (?,?)').run(owner, p2.id);
    }
  }
}
seed();

export function getProductByCode(code) {
  return db.prepare('SELECT * FROM products WHERE code = ?').get(code);
}

export function getCheckpoints(productId) {
  return db.prepare(
    'SELECT * FROM checkpoints WHERE product_id = ? ORDER BY id ASC'
  ).all(productId);
}

export function addBookmark(ownerKey, productId) {
  db.prepare('INSERT OR IGNORE INTO bookmarks (owner_key, product_id) VALUES (?,?)').run(ownerKey, productId);
}

export function removeBookmark(ownerKey, productId) {
  db.prepare('DELETE FROM bookmarks WHERE owner_key = ? AND product_id = ?').run(ownerKey, productId);
}

export function isBookmarked(ownerKey, productId) {
  return !!db.prepare('SELECT 1 FROM bookmarks WHERE owner_key = ? AND product_id = ?').get(ownerKey, productId);
}

export function getBookmarkedProductIds(ownerKey) {
  return db.prepare('SELECT product_id FROM bookmarks WHERE owner_key = ?').all(ownerKey).map((r) => r.product_id);
}

export function getUsage(ownerKey) {
  const row = db.prepare('SELECT used FROM usage WHERE owner_key = ?').get(ownerKey);
  if (!row) {
    db.prepare('INSERT INTO usage (owner_key, used) VALUES (?,0)').run(ownerKey);
    return 0;
  }
  return row.used;
}

export function bumpUsage(ownerKey) {
  db.prepare(
    'INSERT INTO usage (owner_key, used) VALUES (?,1) ON CONFLICT(owner_key) DO UPDATE SET used = used + 1'
  ).run(ownerKey);
}

export const FREE_SCAN_LIMIT = 3;

// Terminate session: reset free tokens + wipe bookmarks for one owner
export function resetOwnerData(ownerKey) {
  db.prepare('INSERT INTO usage (owner_key, used) VALUES (?,0) ON CONFLICT(owner_key) DO UPDATE SET used = 0').run(ownerKey);
  db.prepare('DELETE FROM bookmarks WHERE owner_key = ?').run(ownerKey);
}

// Terminate also resets the LIVE-SIGN demo product (AS-SENSOR-2026-001):
// keeps the producer's production signature, wipes logistics shipment + retailer
// receipt so the chain can be re-run from "signed by producer" during the demo.
export function resetDemoProductSignatures() {
  const p2 = db.prepare("SELECT id FROM products WHERE code = 'AS-SENSOR-2026-001'").get();
  if (!p2) return;
  db.prepare("DELETE FROM checkpoints WHERE product_id = ? AND kind IN ('shipment','receipt')").run(p2.id);
  db.prepare(`INSERT OR IGNORE INTO checkpoints (product_id, kind, label, signed_by, signer_role, timestamp, note)
    VALUES (?,?,?,?,?,?,?)`)
    .run(p2.id, 'production', 'Production Signed — harvested & certified', 'AstraSense Industries (Pune)', 'Producer', '2026-08-19 10:30:00',
      'Batch certified by QA — awaiting logistics shipment');
}

// ---------------- Business model: credits (1 credit = 1 use) ----------------
export function getCredits(ownerKey) {
  const row = db.prepare('SELECT credits FROM users WHERE identifier = ?').get(ownerKey);
  return row ? (row.credits || 0) : 0;
}

export function consumeCredit(ownerKey) {
  const r = db.prepare('UPDATE users SET credits = credits - 1 WHERE identifier = ? AND credits > 0').run(ownerKey);
  return r.changes > 0;
}

export function consumeCredits(ownerKey, n) {
  const r = db.prepare('UPDATE users SET credits = credits - ? WHERE identifier = ? AND credits >= ?').run(n, ownerKey, n);
  return r.changes > 0;
}

export function addCredits(ownerKey, amount) {
  db.prepare('UPDATE users SET credits = credits + ? WHERE identifier = ?').run(amount, ownerKey);
}

export function getPlans() {
  return db.prepare('SELECT * FROM plans ORDER BY credits ASC').all();
}

export function getPlanById(id) {
  return db.prepare('SELECT * FROM plans WHERE id = ?').get(id);
}

export function recordPlanPurchase(ownerKey, plan, cardLast4) {
  db.prepare('INSERT INTO plan_purchases (owner_key, plan_name, credits, amount_inr, card_last4) VALUES (?,?,?,?,?)')
    .run(ownerKey, plan.name, plan.credits, plan.price_inr, cardLast4);
}

export function getPlanPurchases() {
  return db.prepare('SELECT * FROM plan_purchases ORDER BY id DESC').all();
}

export function recordAgentUse(agentId, credits) {
  db.prepare(
    'INSERT INTO agent_usage (agent_id, calls, credits_consumed) VALUES (?, 1, ?) ' +
    'ON CONFLICT(agent_id) DO UPDATE SET calls = calls + 1, credits_consumed = credits_consumed + excluded.credits_consumed, updated_at = datetime(\'now\')'
  ).run(agentId, credits);
}

export function getAgentUsage() {
  return db.prepare('SELECT * FROM agent_usage ORDER BY calls DESC').all();
}
