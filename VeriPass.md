# VeriPass — Digital Product Passport (Algorand · x402)

**Hackathon demo project · 2026-08-19 · Everything runs as user `ego`**

VeriPass is a **Digital Product Passport** system: every physical product gets a QR code that opens its full supply-chain passport — who produced it, who shipped it, who received it — with cryptographic-style signatures at each checkpoint. Counterfeit units are flagged **NOT GENUINE**. Verification is monetized via the **x402 protocol on Algorand**: the first 3 verifications are free, then each report costs **0.001 ALGO**.

---

## 1. Overview

| | |
|---|---|
| **Product** | Digital Product Passport for physical goods (anti-counterfeit) |
| **Blockchain** | Algorand (x402 payment rail) |
| **Paid endpoint** | `GET /api/verify/:code` — x402-enabled (hackathon requirement ✅) |
| **Demo** | 2 phones + 3 printed QR codes, live signing in front of judges |
| **Host** | `0.0.0.0:8080` → phones reach it at `http://192.168.1.62:8080` |

### The 3 demo products
| QR | Code | Story | Verdict |
|---|---|---|---|
| **#1** | `DJ-TEA-2023-8991` | Organic Darjeeling Tea — fully signed chain | ✅ **AUTHENTIC** |
| **#2** | `AS-SENSOR-2026-001` | AstraSense Industrial Sensor — producer signed, **logistics signs LIVE** | 🚚 **IN TRANSIT** → AUTHENTIC |
| **#3** | `FAKE-WATCH-7` | "Pharma Component X" counterfeit | 🚫 **NOT GENUINE** |

---

## 2. Tech Stack

- **Backend:** Node.js v26 (built-in `node:sqlite` — zero native deps) + Express 4 + `qrcode`
- **Database:** SQLite (WAL) at `backend/data/veripass.db`
- **Frontend:** React 19 + Vite 6 + TypeScript + Tailwind CSS v4 (voxel design system, VT323 pixel font)
- **Blockchain:** Algorand — `algosdk` installed; x402 payment flow (**real TestNet when funded**, simulated fallback for demo)
- **Auth:** HMAC-signed bearer tokens (24 h expiry), 4 roles

---

## 3. Architecture

```
┌─────────────┐   QR scan (camera app)    ┌──────────────────────────────┐
│  Phone 1/2  │ ── http://IP:8080/?qr=CODE ─▶  Express server (0.0.0.0:8080)
│  (React SPA)│ ◀── JSON API ──────────────▶  ├─ server.js  (routes, auth, verdicts)
└─────────────┘                              ├─ db.js      (SQLite: users, products,
                                              │              checkpoints, usage, payments,
                                              │              bookmarks)
                                              ├─ x402.js    (Algorand payment challenge,
                                              │              proof verification)
                                              └─ dist/      (built React app, served statically)
```

**Flow:** scan QR → app auto-opens with `?qr=CODE` → `GET /api/verify/:code` → product info + supply-chain timeline + verdict badge. Supply-chain roles (producer/logistics/retailer) can **sign** checkpoints; consumers can **bookmark** products into their vault.

---

## 4. Database Schema

- `users(id, identifier UNIQUE, passkey, name, role CHECK(User|Producer|Logistics|Retailer), origin, created_at)`
- `products(id, code UNIQUE, name, batch_id, origin, details, icon, created_at, fake)` — `fake=1` = counterfeit
- `checkpoints(id, product_id, kind CHECK(production|shipment|receipt|alert), label, signed_by, signer_role, timestamp, note)` — UNIQUE(product_id, kind): each kind signed once
- `usage(id, owner_key UNIQUE, used)` — per-owner free-scan counter
- `payments(id, txid UNIQUE, owner_key, amount, network, round, sender, receiver, created_at)` — one-time-use payment proofs
- `bookmarks(id, owner_key, product_id, created_at, UNIQUE(owner_key, product_id))` — user vault

---

## 5. API Contract

```
POST /api/auth/login              {identifier, passkey} → {token, user}
GET  /api/me                      (Bearer) → user
GET  /api/products                (Bearer) → role-based inventory
                                   · User → bookmarked products only (vault)
                                   · Producer/Logistics/Retailer → all non-fake products
GET  /api/verify/:code            public → product info + timeline + verdict
                                   ← x402-gated: 3 free, then HTTP 402
POST /api/products/:code/sign     (Bearer) → sign checkpoint (role → kind)
                                   · Producer→production, Logistics→shipment, Retailer→receipt
                                   · fake product → 403 COUNTERFEIT
POST /api/products/:code/bookmark (Bearer) → add to user vault
GET  /api/usage                   (Bearer/anon) → {freeLimit: 3, used, charged, priceAlgo}
POST /api/x402/pay                (Bearer) → Algorand payment (real TestNet when funded, sim fallback) → {txId, round, sender, xPaySignature}
GET  /api/qr/:code.png            → QR PNG encoding http://HOST/?qr=CODE
GET  /demo                        → judge demo page (3 QRs + live status, auto-refresh 4s)
```

### Verdict engine
| Condition | Verdict | Color |
|---|---|---|
| `fake=1` | **NOT GENUINE** | `#E91E63` red |
| all 3 kinds signed | **AUTHENTIC** | `#41ad31` green |
| 0 signed | **UNVERIFIED** | `#767683` gray |
| partial | **IN TRANSIT** | `#fe9832` saffron |

---

## 6. x402 · Algorand Integration (the hackathon requirement)

**`GET /api/verify/:code` is the x402-enabled endpoint.**

1. First **3 verifications are FREE** per owner (tracked in `usage`).
2. 4th verification → **HTTP 402** with:
   - `X-Pay-Provider: algorand`
   - `X-Pay-Payload` (base64url JSON: `{amount: "0.001", receiverAddress, description, network}`)
   - `Retry-After: 0`
3. Client calls `POST /api/x402/pay` → a payment transaction is created on the Algorand ledger (**real TestNet via algosdk when the account is funded** — 0.001 ALGO self-payment, confirmed on-chain; simulated fallback txid `ALG-…` when unfunded) → returns `xPaySignature`.
4. Client retries verify with `X-Pay-Signature` header → server validates the tx against the ledger, **deletes it (one-time use)** → returns the full report.

**Real TestNet mode is IMPLEMENTED** — `backend/x402.js` uses `algosdk` against `testnet-api.algonode.cloud` (payment) with automatic fallback to the simulated ledger when the account is unfunded, so the demo never breaks:

- Address: `QXEMYGSAHRJPLX3XPNRNPFNDPKTMAWKDDNZSOG7HICAJTK5AB636DZD6JI`
- Mnemonic: `backend/data/testnet-account.json` (written, ego-owned)
- ✅ **Funded & VERIFIED on-chain**: 10 ALGO received (dispenser tx `WW3H33OOYV5GLSURLLJ7Q7L3TT3OD7A52SZARUHHBNYYHEH2JXEQ`); end-to-end test confirmed a real x402 payment (tx `HQXWWVX4PZAAF7RF43Q7PWDX4FW654WVZ7RCVO2VBLHXTGLOTPOQ`, round 66471036, 0.001 ALGO) verified via the TestNet indexer.
- Once funded, every x402 payment is a **real on-chain TestNet transaction** (0.001 ALGO self-payment, confirmed via `waitForConfirmation`, network `testnet-v1.0`); payment proofs are still one-time-use.

---

## 7. Demo Accounts

| identifier | passkey | role | phone |
|---|---|---|---|
| `user` | `user` | User (consumer) | 📱 Phone 1 |
| `producer` | `producer` | Producer — AstraSense Industries (Pune) | 📱 Phone 2 |
| `logistics` | `logistics` | Logistics — BlueDart Logistics | switchable |
| `retailer` | `retailer` | Retailer — Metro Mega Store | switchable |

---

## 8. Live Demo Script (2 phones, judges)

1. **Phone 1** → `http://192.168.1.62:8080`, login `user` / `user` → vault is **EMPTY**.
2. Scan **QR #1** (`DJ-TEA-2023-8991`) → ✅ **AUTHENTIC** — full chain: production → shipment → receipt.
3. Scan **QR #2** (`AS-SENSOR-2026-001`) → 🚚 **IN TRANSIT** — *"signed by producer, not by retailer yet"*.
4. **Phone 2** → login `log` / `log` → scan QR #2 → **Sign to Verify** → live signature with real time & date.
5. **Phone 1** → rescan QR #2 → status flipped to **AUTHENTIC**, new logistics checkpoint live on the timeline.
6. Tap **Bookmark** → product appears in the vault.
7. Scan **QR #3** (`FAKE-WATCH-7`) → 🚫 **NOT GENUINE** — cannot be signed.
8. *(Optional)* Scan any product 3× free → 4th scan consumes **1 purchased credit** (buy plans from the hourglass icon → Billing) → when credits run out → **PAID (x402 · ALGORAND)** bar → **PAY 0.001 ALGO** → opens the **payment page** (invoice: amount, receiver, network) → tap PAY → tx confirmed (txId + round) → auto-return → report unlocked.
9. *(Judges)* Watch the **tiled `/demo` grid** (13 use cases) or `/demo/{n}` big QRs, and open **`/dashboard`** for the proof: payments, hashes, plan purchases, usage per person.

---

## 9. Run Instructions

```bash
# one command (everything is already built & owned by ego)
cd /home/ego/Documents/VeriPass/backend && node server.js
```

> **IP ADDRESS — see [`ips.md`](ips.md) (single source of truth).** If the laptop's Wi-Fi IP changes, update `ips.md` and run `bash scripts/regenerate-qrs.sh`.

- App (phones): **https://192.168.1.62:8443** (camera scanning — accept the self-signed cert warning: Advanced → Proceed) · plain HTTP fallback: **http://192.168.1.62:8080** (no camera)
- Judge page (auto-refresh): **http://192.168.1.62:8080/demo** · HTTPS: **https://192.168.1.62:8443/demo** — tiled grid of **13 use-case products** (UC-01…UC-13); tap a tile → `/demo/{n}` full-screen QR with prev/next + back to grid (`/demo1`–`/demo3` redirect there)
- **Admin dashboard (proof for judges)**: **http://192.168.1.62:8080/dashboard** — Algorand x402 payments (txid + SHA-256 proof hash), plan purchases, chain-of-custody checkpoint hashes, usage per person, users, products
- **Testing loop**: 3 free verifies per account, then **1 purchased credit per scan** (business model: **Starter 100 ₹99 · Pro 200 ₹179 · Enterprise 300 ₹249** — buy from the hourglass icon → Billing, simulated card payment, any 12+ digit number), then x402 PAY 0.001 ALGO (real TestNet). **The avatar circle (top-right) opens the AI Assistant** — **pay-per-use 0.001 ALGO per question (x402, separate from verification credits)**. **Agent Network Monitor at `/agent`** — Research Agent pays 3 services in sequence (market-data → news-summary → report-generate, spend-policy guard, live payment log) + Price Check / Product Info agents + Fund with Lora link. **Logging back in restores the 3 free tokens**. **TERMINATE SESSION** (Profile tab) = **logout only** (no data reset — the admin dashboard has a **Reset** button for full reset). Vaults: `user` empty · `pro`/`log`/`ret`/`ravi` 2 items each.
- **Demo accounts**: `user/user` (Consumer, empty vault) · `pro/pro` (Producer) · `log/log` (Logistics) · `ret/ret` (Retailer) · `ravi/ravi` (Consumer) — see [`cheatsheet.md`](cheatsheet.md) for the full demo-day runbook.
- **13 QR codes to print** (embed http:// so any camera app opens them): `qrcode/1.png … qrcode/13.png` (regenerate with `bash scripts/regenerate-qrs.sh` after an IP change)

### Rebuild frontend (if you change `veripass/src/`)
```bash
cd /home/ego/Documents/VeriPass/veripass && npm run lint && npm run build
```

### Restart server as ego
```bash
pkill -f "[n]ode server.js"
sudo -u ego sh -c 'cd /home/ego/Documents/VeriPass/backend && nohup setsid node server.js > /home/ego/Documents/VeriPass/backend/server.log 2>&1 < /dev/null & disown'
```

---

## 10. Project Layout

```
VeriPass/
├── backend/
│   ├── server.js          # Express app: auth, products, verify (x402), sign, bookmark, QR, /demo
│   ├── db.js              # SQLite schema + idempotent seed + queries
│   ├── x402.js            # x402 protocol on Algorand (real TestNet via algosdk, sim fallback)
│   ├── data/veripass.db   # SQLite database (WAL)
│   └── server.log         # runtime log
├── veripass/              # React 19 + Vite + TS + Tailwind v4 frontend
│   ├── src/lib/api.ts     # typed API client (auth, verify, pay, sign, bookmark)
│   ├── src/screens/       # Login, Scan (x402 bar + camera), Payment (x402 invoice), Inventory, …
│   └── dist/              # built SPA (served by Express)
├── qrcode/                # printable QR PNGs: 1.png (tea) · 2.png (sensor) · 3.png (fake)
├── VeriPass.md            # this document
└── log.md                 # build log & task execution
```

---

## 11. Pitch + Demo Script

### The idea (one-liner)
**VeriPass** — an India import/export monitoring platform where every verification, AI answer and market-research step is a **paid micro-transaction on Algorand (x402)**, and autonomous **agents pay for data as they work** — no subscriptions, no accounts-with-cards, just per-use micropayments.

### Why it matters
- India's import/export ecosystem (FSSAI, BIS, customs, cold-chain) runs on paper certificates that are easy to fake — VeriPass puts **chain-of-custody signatures + tamper-evident QR codes** on every product.
- Existing verification platforms charge subscriptions; VeriPass charges **0.001 ALGO per use** — a price so small that buyers pay per report and agents pay per data call.
- **x402 agentic commerce**: AI agents (research, price-check, product-info) pay for each service they consume, with a **spend-policy guard** (max 3 paid calls) checked before every payment — the same pattern as the x402 Agentic Payments Kit demo.

### The prototype (what's built)
- **13 use-case products** (tea, vaccine cold-chain, fake watch, electronics, food, jewellery, documents, spare parts, agro, textiles, beverages…) each with a QR code, verdict (Authentic / In Transit / Not Genuine / Unverified) and a signed chain-of-custody (production → shipment → receipt).
- **Scan → verify**: 3 free scans per login → 1 credit per report (plans: Starter 100 ₹99 · Pro 200 ₹179 · Enterprise 300 ₹249) → x402 **0.001 ALGO** per report on **real TestNet**.
- **AI Assistant** (avatar circle): pay-per-use **0.001 ALGO per question** — separate from verification credits; answers with live tool calls over the inventory.
- **Agent Network Monitor** (`/agent`): a Research Agent that **pays 3 services in sequence** — `market-data` → `news-summary` (real Hacker News headlines) → `report-generate` (Gemini compiles the final report) — with a **spend-policy guard** (max 3 paid calls, checked before every payment) and a live payment log. Plus single-service agents: **Price Check** and **Product Info**.
- **Admin dashboard** (`/dashboard`): live proof panel — x402 payments (txid + SHA-256 proof hash), plan purchases, checkpoint hashes, usage per person, users, products; **Refresh** + **Reset** buttons; auto-refresh 4s.
- **Terminate session** = logout only; full reset lives on the admin dashboard.

### Demo script (from the /agent page — the money shot)
1. Open **http://192.168.1.62:8080/agent** — the Agent Network Monitor.
2. Type keywords: `supply chain India` → research type **Balanced** → **Run Research Agent**.
3. Watch the live log: the agent **pays 0.001 ALGO** for `market-data` (round 66489991) → pays for `news-summary` (round 66489993, real headlines: *"Apple Suppliers Boost South India Investments…"*) → pays for `report-generate` (round 66490000) → the final report renders: MARKET SNAPSHOT (13 products, 38% Authentic, 5 verified at score 98), PRICE & PLANS, NEWS WATCH, RECOMMENDATION.
4. Show the **spend-policy guard**: budget `{maxCalls: 3, spent: 3, remaining: 0}` — a 4th call is refused with a 402 until the user funds via **Lora** (https://lora.algokit.io/testnet/fund).
5. Then demo the consumer loop: scan a QR (3 free) → buy credits (hourglass → Billing) → ask the AI Assistant a question (0.001 ALGO, pay-per-use) → watch the payment land on the **admin dashboard** (txid + proof hash).
6. Close with the judge page (`/demo`): 13 products, verdicts, signatures — and the dashboard's proof trail.

### Alignment with the x402 kit (scorecard)
| Criterion | x402 kit | VeriPass | Score |
|---|---|---|---|
| Paid endpoint (402 → pay → 200) | ✅ | ✅ verify/AI/agent | 10/10 |
| Agent pays services in sequence | ✅ | ✅ 3-service research agent | 10/10 |
| Spend-policy guard before every payment | ✅ | ✅ max 3 calls, checked pre-payment | 10/10 |
| Real Algorand settlement | ✅ TestNet | ✅ testnet-v1.0 (real txns) | 10/10 |
| No smart contract needed (plain x402 route) | ✅ rule | ✅ (usage/subscription done off-chain in SQLite) | 10/10 |
| Templates used | — | ✅ reviewed (usage-counter, escrow, subscription notes) | 8/10 |
| **Total** | | | **58/60** |

### Lora setup (testnet funding)
1. Log in at **https://lora.algokit.io** (AlgoKit account).
2. Go to **Fund** → paste the TestNet wallet address from `backend/data/testnet-account.json` (the `address` field).
3. Request testnet ALGO (daily limits apply) — the backend already tries **real TestNet first** (algosdk + Algonode) and falls back to the simulated ledger only when the account is unfunded.
### Agentic Orchestrator (New!)
VeriPass AI now routes queries to 8 specialist agents. Users only pay for the complexity they use (1 to 5 credits / 0.001 to 0.005 ALGO). The system features full per-user scoping, meaning the AI only "sees" products the logged-in user has actively scanned and bookmarked.
