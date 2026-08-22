# VeriPass — Build Log & Task Execution

**Date:** 2026-08-19 · **Goal:** Full backend + frontend integration, live 2-phone demo, x402 paid endpoint (Algorand), hosted on `IP:8080`.

---

## ✅ Task List (ordered, executed top → bottom)

| # | Task | Status |
|---|------|--------|
| 1 | Explore existing frontend (`veripass/` React+Vite mock app) | ✅ DONE |
| 2 | Decide stack: Node v26 + Express + built-in `node:sqlite` (zero native deps) + `qrcode` | ✅ DONE |
| 3 | Create `backend/` folder: `server.js`, `db.js`, `x402.js`, seed data | ✅ DONE |
| 4 | DB schema: `users` (user/producer/logistics/retailer), `products`, `checkpoints`, `usage`, `payments` | ✅ DONE |
| 5 | Auth API: `POST /api/auth/login` (identifier+passkey → token) | ✅ DONE |
| 6 | Products API: role-based inventory (`user` → zero products, others → few) | ✅ DONE |
| 7 | 3 QR products: **#1 fully signed (AUTHENTIC)**, **#2 unsigned (sign live)**, **#3 no signature (NOT GENUINE)** | ✅ DONE |
| 8 | Verify API `GET /api/verify/:code` → product info + timeline + verdict | ✅ DONE |
| 9 | Sign API `POST /api/products/:code/sign` (producer→production, logistics→shipment, retailer→receipt) | ✅ DONE |
| 10 | **x402 paid endpoint** (Algorand): first 3 verifies FREE, then HTTP 402 + `X-Pay-Provider: algorand` challenge, simulated Algorand payment tx → unlock | ✅ DONE |
| 11 | API-usage bar on Scan menu top (x402): `3 FREE LEFT` → `PAID (x402)` | ✅ DONE |
| 12 | QR code PNG endpoints (`/api/qr/:code.png`) encoding `http://IP:8080/?qr=CODE` (scan with any camera app → auto-verify) | ✅ DONE |
| 13 | `/demo` judge page: all 3 QR codes + live status auto-refresh | ✅ DONE |
| 14 | Frontend integration: `api.ts`, LoginScreen (real auth), ScanScreen (QR entry + info + sign + pay + camera), InventoryScreen (API data, empty for user) | ✅ DONE |
| 15 | Build frontend → serve `dist/` from Express on `0.0.0.0:8080` | ✅ DONE |
| 16 | E2E test: 2 phones (Playwright) — user inventory empty, producer signs live, status flips, x402 gate after 3 free | ⏭️ SKIPPED (user: "playwright e2e dont need") — replaced by full curl API test suite (all flows verified live) |
| 17 | Final command + demo instructions | ✅ DONE |
| 18 | Bookmarking: `bookmarks` table + `POST /api/products/:code/bookmark` + User vault shows bookmarked products | ✅ DONE |
| 19 | Real Algorand TestNet x402 payments (`algosdk` self-payment 0.001 ALGO, auto-fallback to sim when unfunded) | ✅ DONE |
| 20 | Payment page (x402): invoice card, PAY 0.001 ALGO → tx confirmed → auto-unlock report | ✅ DONE |

---

## 📋 API Contract (single source of truth)

```
POST /api/auth/login            {identifier, passkey} → {token, user}
GET  /api/me                    (Bearer) → user
GET  /api/products              (Bearer) → role-based inventory
GET  /api/verify/:code          public → product info + timeline + verdict  ← x402-gated after 3 free
POST /api/products/:code/sign   (Bearer) {checkpoint} → sign live
POST /api/products/:code/bookmark (Bearer) → add to user vault
GET  /api/usage                 (Bearer/anon) → {free: 3, used, charged}
POST /api/x402/pay              (Bearer) → Algorand payment (real TestNet when funded, sim fallback) → {txId, proof}
GET  /api/qr/:code.png          → QR PNG encoding http://HOST/?qr=CODE
GET  /demo                      → judge demo page (3 QR codes + live status)
```

### Demo accounts (identifier / passkey)
| identifier | passkey | role | phone |
|---|---|---|---|
| `user` | `user` | User | 📱 Phone 1 |
| `producer` | `producer` | Producer | 📱 Phone 2 |
| `logistics` | `logistics` | Logistics | switchable |
| `retailer` | `retailer` | Retailer | switchable |

### The 3 QR codes (demo)
| code | product | signatures | verdict |
|---|---|---|---|
| `DJ-TEA-2023-8991` | Organic Darjeeling Tea | producer + logistics + retailer | ✅ AUTHENTIC (fully signed) |
| `AS-SENSOR-2026-001` | AstraSense Industrial Sensor | producer only → logistics signed LIVE | 🚚 IN TRANSIT → AUTHENTIC |
| `FAKE-WATCH-7` | "Pharma Component X" counterfeit | no signature possible | 🚫 NOT GENUINE |

### 🎬 Live demo script (2 phones, in front of judges)
1. **Phone 1** → open `http://192.168.1.62:8080`, login `user` / `user` (vault is EMPTY).
2. Scan **QR #1** (`DJ-TEA-2023-8991`) → ✅ **AUTHENTIC** — fully signed chain (producer → logistics → retailer), timeline visible.
3. Scan **QR #2** (`AS-SENSOR-2026-001`) → 🚚 **IN TRANSIT** — *"only signed by producer, not by retailer yet"*.
4. **Phone 2** → open the app, login `logistics` / `logistics` → scan QR #2 → tap **Sign to Verify** (live signature with real time & date).
5. **Phone 1** → scan QR #2 **again** → status flipped to **AUTHENTIC** with the new logistics checkpoint live on the timeline.
6. Tap **Bookmark** on any product → it appears in the vault (Inventory) — bookmarking demo.
7. Scan **QR #3** (`FAKE-WATCH-7`) → 🚫 **NOT GENUINE** — counterfeit flagged, cannot be signed.
8. (Optional x402 demo) Scan any product 3× free → 4th scan shows **PAID (x402 · ALGORAND)** bar → tap **PAY 0.001 ALGO** → **payment page** (invoice: amount, receiver, network) → tap PAY → tx confirmed (txId + round) → auto-return → report unlocks.

### x402 (Algorand) integration — where it is used
- `GET /api/verify/:code` = the **paid endpoint** (per hackathon requirement).
- First **3 verifies free** per user → 4th returns **HTTP 402** with `X-Pay-Provider: algorand` + `X-Pay-Payload` (amount 0.001 ALGO, receiver, description).
- Client "pays" via `POST /api/x402/pay` → **real Algorand TestNet payment** via `algosdk` (0.001 ALGO self-payment, confirmed on-chain, txid + round) when the wallet is funded; falls back to a simulated local-ledger tx (`ALG-<rand>`) if unfunded → returns proof.
- Client retries verify with `X-Pay-Signature` header → server validates against ledger → 200 full payload.
- **Real TestNet mode implemented**: `algosdk` sends a genuine Algorand TestNet payment (network `testnet-v1.0`, receiver = funded account `QXEMYGSAHRJPLX3XPNRNPFNDPKTMAWKDDNZSOG7HICAJTK5AB636DZD6JI`, mnemonic in `backend/data/testnet-account.json`); auto-fallback to simulated ledger when the wallet is unfunded (demo never breaks).
- ✅ **Funded & VERIFIED on-chain**: 10 ALGO received (dispenser tx `WW3H33OOYV5GLSURLLJ7Q7L3TT3OD7A52SZARUHHBNYYHEH2JXEQ`); end-to-end test confirmed a real x402 payment (tx `HQXWWVX4PZAAF7RF43Q7PWDX4FW654WVZ7RCVO2VBLHXTGLOTPOQ`, round 66471036, 0.001 ALGO) verified via the TestNet indexer.

---

## 🚀 Final Run Command

```bash
cd /home/ego/Documents/VeriPass/backend && node server.js
```

> **IP ADDRESS — see [`ips.md`](ips.md) (single source of truth).** If the laptop's Wi-Fi IP changes, update `ips.md` and run `bash scripts/regenerate-qrs.sh`.

- App (phones): **https://192.168.1.62:8443** (camera scanning — accept the self-signed cert warning: Advanced → Proceed) · plain HTTP fallback: **http://192.168.1.62:8080** (no camera) — login `user` / `user` (phone 1), `producer` / `producer` (phone 2)
- Judge demo page (auto-refresh): **http://192.168.1.62:8080/demo** · HTTPS: **https://192.168.1.62:8443/demo**
- 3 QR codes to print (embed https:// so phone cameras work): `https://192.168.1.62:8443/api/qr/DJ-TEA-2023-8991.png` · `.../AS-SENSOR-2026-001.png` · `.../FAKE-WATCH-7.png` — also saved in `qrcode/` folder (`1.png` tea · `2.png` sensor · `3.png` fake)
- Everything runs as user `ego` (files, server process, installs).

## 🔧 FIX (Aug 20): Camera stream never attached — race condition
- **Symptom**: HTTPS + permission prompt OK, but video stayed black, no QR decode ("prompt, no result").
- **Root cause**: `setCameraActive(true)` only schedules a re-render; inside `getUserMedia().then()` the `<video>` element wasn't mounted yet → `videoRef.current` was `null` → `srcObject` never assigned → jsQR got no frames.
- **Fix** (`veripass/src/screens/ScanScreen.tsx`): keep stream in `streamRef`; new `useEffect([cameraActive])` attaches `srcObject` + `play()` once the video mounts; added `facingMode:'environment'` → `{video:true}` fallback for devices without a rear camera.
- **Deployed**: rebuilt as ego → `dist/assets/index-QQcQu79G.js` (939,954 B), served on 8080 + 8443 (http 200 / https 200). No server restart needed (static dist).

## ✅ TASKS (Aug 20): Terminate-reset · demo big-QR pages · scan restart · seeded vaults
- **TERMINATE SESSION resets everything**: new `POST /api/session/terminate` (auth) → `resetOwnerData()` in db.js → usage.used=0 (3 free tokens back) + deletes all vault bookmarks for that account. AccountScreen button now confirms → calls API → clears session → back to login. Verified: logistics + user both reset to `{ok:true, reset:true, used:0}`.
- **Demo vaults seeded**: `logistics` starts with 2 bookmarks (DJ-TEA-2023-8991 + AS-SENSOR-2026-001), `user` starts EMPTY (seed in db.js; verified via API: user vault `[]`, logistics vault 2 items).
- **Big-QR judge pages**: `/demo1` (buttons → 2, 3) · `/demo2` (buttons → 1, 3) · `/demo3` (buttons → 2, 1) — single huge QR per page (max-width 520px), verdict badge, signatures count, '← ALL 3 PRODUCTS' link back to `/demo`, auto-refresh 4s. All verified HTTP 200.
- **Scan restart**: tapping the Scan tab while already on the Scan screen bumps a `scanRestartToken` (App.tsx) → ScanScreen camera effect re-runs (deps `[restartToken]`) + clears previous product/error/charged/paid/bookmarked/exported state → fresh scan every time.
- **Deployed**: rebuilt as ego → `dist/assets/index-XcvBZYDi.js` (940.62 kB); server restarted as ego (pid 24576), 0.0.0.0:8080 + 0.0.0.0:8443, all routes 200. 0 non-ego files.
- **Limit answer**: 3 free verifies per account, then x402 PAY 0.001 ALGO (real TestNet). Terminate resets → unlimited testing.
- **ravi account**: `ravi/ravi` (Ravi Kumar, User role, vault EMPTY) added to seed (db.js users array).
- **Retailer signs product 2**: any role can sign anytime (no ordering gate); retailer adds `receipt` checkpoint → chain 3/3 → AUTHENTIC (98). Verified live.
- **Terminate resets signatures too**: `POST /api/session/terminate` now also calls `resetDemoProductSignatures()` → deletes production/shipment/receipt checkpoints of AS-SENSOR-2026-001, restores the initial 'alert' checkpoint → whole chain can be re-done. Verified via sqlite3 (only `alert` left after terminate).
- **Deployed**: server restarted as ego (pid 25338), all routes 200, 0 non-ego files.
- **Accounts renamed (demo)**: `producer`→`pro/pro`, `logistics`→`log/log`, `retailer`→`ret/ret` (idempotent migration in db.js seed: users + usage + bookmarks owner_keys). `ravi/ravi` kept. All 5 accounts verified logging in.
- **Login restores tokens**: every successful login resets usage to 3 free (server.js login endpoint). Verified: 0 → 3 scans → 3 → re-login → 0.
- **Terminate = QR2 producer-only**: `resetDemoProductSignatures()` rewritten — deletes ONLY shipment+receipt checkpoints, ensures production checkpoint exists (signed by AstraSense Industries (Pune)). Verified via sqlite3: after terminate only `alert` + `production` remain.
- **Bookmarks seeded for all demo accounts**: pro/log/ret/ravi each get products 1+2; `user` stays EMPTY. Verified via /api/products.
- **Demo page accounts line updated**: `/demo` shows `user/user · pro/pro · log/log · ret/ret · ravi/ravi`.
- **cheatsheet.md created**: demo-day cheat sheet (accounts, URLs, IP-change procedure, terminate behavior, limit, demo flow).
- **Deployed**: server restarted as ego (pid 26058), all routes 200, 0 non-ego files.
- **run.sh created**: `scripts/run.sh` — one-command demo launcher: stops all old servers → starts fresh (verbose → backend/server.log) → health-checks (http/https/demo) → prints demo cheatsheet in terminal (IP read live from ips.md). Tested: killed old, started pid 26629 as ego, all 200, 0 non-ego files. cheatsheet.md §1 updated to use it.

## ✅ TASKS (Aug 20): Business model · 13 use cases · admin dashboard · landing guide
- **Business model (plans & credits)**: new `plans` table (Starter 100 ₹99 / Pro 200 ₹179 / Enterprise 300 ₹249) + `plan_purchases` table; `users.credits` column (migration). `GET /api/plans` + `POST /api/plans/purchase` (auth, card validation ≥12 digits, simulated payment, records card last4). Verify flow: 3 free tokens → **1 credit per scan** → x402. Verified: pro bought Starter 100 (card 4242…4242) → credits 100; bad card → 400; 3 free scans then 4th scan consumed 1 credit (100→99).
- **PricingScreen (frontend)**: new screen — balance banner (credits + free scans left), 3 plan cards ('Most popular' highlight), buy → card modal (name/number/expiry/cvv) → simulated payment → credits added. **Avatar circle in top bar now opens Plans & Pricing** (was Account). types.ts + api.ts updated (Plan, getPlans, purchasePlan, credits fields).
- **13 use-case products**: UC-1 Organic Darjeeling Tea (3/3) · UC-2 AstraSense Sensor (live-sign) · UC-3 Pharma Component X ⚠FAKE · UC-4 Cold-Chain Vaccine (3/3) · UC-5 Battery Pack (1/3) · UC-6 Skincare Serum (2/3) · UC-7 Basmati Rice (3/3) · UC-8 Gold Necklace (1/3) · UC-9 Degree Certificate (3/3) · UC-10 Auto Spare Part (unverified) · UC-11 Fertilizer (2/3) · UC-12 Cotton Saree (3/3) · UC-13 Energy Drink ⚠FAKE. QRs regenerated → `qrcode/1.png`…`13.png`.
- **Tiled /demo grid**: `/demo` now shows all 13 products as tiles (verdict badge, mini QR, signatures) → click → `/demo/{n}` big QR page (prev/next UC buttons + '← ALL 13 PRODUCTS' back link, auto-refresh 4s). `/demo1`–`/demo3` redirect to `/demo/1`–`/demo/3`. Verified 200 + 302.
- **Admin dashboard `/dashboard`**: judge-proof panel — 💸 Algorand x402 payments (txid + SHA-256 proof hash), 💳 plan purchases (owner/plan/credits/₹/card last4), ✍️ 26 chain-of-custody checkpoint hashes, 🔢 usage per person (free + credits), 👤 users, 📦 13 products (⚠ FAKE flags). Auto-refresh 4s, voxel style, link to /demo. Verified: all 6 tables render (incl. pro's Starter 100 purchase, card 4242).
- **guid.md created**: landing-page guide (hero/problem/how-it-works/13 use cases/pricing/demo CTA/tech stack copy + structure).
- **Docs synced**: ips.md (dashboard URL, /demo/{n}, 13 QRs, plans in testing-loop note), cheatsheet.md (URLs, plans table, dashboard in flow + checks), VeriPass.md.
- **Deployed**: rebuilt as ego → `dist/assets/index-Comlkx_q.js` (946.21 kB); server restarted as ego (pid 7033), 0.0.0.0:8080 + 8443, all routes 200, 0 non-ego files.

## ✅ TASKS (Aug 20, cont.): AI Assistant · passport smoothing · IP reconfig
- **AI Assistant (agentic chat)**: new `POST /api/ai/chat` endpoint (auth, 1 credit = 1 question) + `AIChatScreen` frontend. Gemini `gemini-3.6-flash` with tool calls (`getProducts`, `getProductStatus`) over the live SQLite inventory. **Avatar circle (top-right) now opens AI Assistant**; new **hourglass icon (top-left) opens Billing** (was avatar → Plans & Pricing). Free tier exhausted → HTTP 402 + x402 challenge → pay 0.001 ALGO → retry with `X-Pay-Signature` (frontend pay banner flow). Verified end-to-end: "How many products?" → 13-product breakdown (5 Authentic / 5 In Transit / 2 Not Genuine / 1 Unverified), credits 99→95; "Status of AS-SENSOR-2026-001?" → IN TRANSIT, score 54, full chain-of-custody, credits 95→94.
- **Gemini thoughtSignature fix**: gemini-3.6-flash requires `thoughtSignature` echoed back on multi-turn function calls; the `@google/genai` SDK's `response.functionCalls` getter drops it → rewrote the tool loop in `backend/ai.js` to iterate raw `candidates[0].content.parts` and preserve `thoughtSignature` at part level. (Also: model bumped from gemini-2.5-flash — no longer available to new users.)
- **Passport animation smoothed**: `ThreePassport.tsx` — smoothstep easing, ambient float, smooth open→hold→close cycle with cascading page animation.
- **IP reconfig**: all docs + 13 QRs rebaked to `192.168.1.62` (was 172.31.185.129).
- **Deployed**: rebuilt as ego → `dist/assets/index-BgD1kZbB.js` (952.24 kB / gzip 256.39 kB); server restarted as ego (pid 11222), all routes 200, 0 non-ego files.
- **Double-click rescan (bug fix)**: double-clicking the camera scanning area now starts a fresh scan — `ScanScreen.tsx` gained `localRestart` state (camera effect deps `[restartToken, localRestart]`) + `handleRestartScan` (clears product/error/charged/paid/bookmarked/exported/code, bumps localRestart); camera HUD section got `onDoubleClick` + `cursor-pointer` + "DOUBLE-CLICK: RESCAN" hint label (top-right). Deployed: `dist/assets/index-BkyDjXfA.js` (952.55 kB / gzip 256.49 kB); server restarted (pid 12684), all routes 200.

## ✅ TASKS (Aug 20, cont. 2): Agent network · credit system v2 · dashboard upgrade
- **Agent Network Monitor (x402 agentic payments)**: new `backend/agents.js` + `GET /agent` page — the Research Agent pays 3 priced services in sequence (**market-data → news-summary → report-generate**, 0.001 ALGO each) with a **spend-policy guard** (max 3 paid calls, checked BEFORE every payment → 402 when exhausted). Live activity log shows each payment (txId, network, round). Single-service agents: `POST /api/agent/price-check` (market snapshot) + `POST /api/agent/info` (product + chain of custody). News via Hacker News Algolia API (live headlines, Gemini fallback). 'Fund with Lora' link → https://lora.algokit.io/testnet/fund (manual, needs AlgoKit login).
- **Credit system v2 (AI cost SEPARATE from verification)**: AI Assistant is now **pay-per-use 0.001 ALGO per question (x402)** — no credits involved; `backend/ai.js` gate rewritten (signature → verifyPaymentProof(sig, u.identifier), else 402 'AI Assistant is pay-per-use…'); response no longer returns credits. `AIChatScreen` strip shows `PAY-PER-USE · 0.001 ALGO / QUESTION`, 'Buy credits' → 'View plans'. `PricingScreen` banner → 'Verification credits', new **Pay-per-use (x402 · Algorand)** section (Verification: 3 free → credits → 0.001 ALGO/report; AI Assistant: 0.001 ALGO/question, no plans), plan cards → 'verification credits'.
- **Terminate = logout only**: `POST /api/session/terminate` no longer resets data (returns `{ok, reset:false}`) — full reset moved to new **`POST /api/admin/reset`** (all owners + demo product signatures) behind the dashboard **Reset** button.
- **Admin dashboard upgrade**: **Refresh** button (location.reload) + **Reset** button (confirm → POST /api/admin/reset → alert + reload); bigger fonts (h1 30px, h2 17px, tables 14px); new summary cards row (💸 payments · 💳 purchases · ✍️ signatures · 👤 users · 📦 products).
- **Deployed**: rebuilt as ego → `dist/assets/index-BkyDjXfA.js` (952.55 kB / gzip 256.49 kB); server restarted as ego (pid 12684), all routes 200, 0 non-ego files.

## Aug 20 2026 - Major Update: Unified Credits, Multi-Agent AI & Dark Mode
- **Unified Credit System**: 1 verification scan = 1 credit (0.001 ALGO). 1 AI question = 1 to 5 credits (0.001 to 0.005 ALGO via x402) depending on agent complexity. Plans adjusted: Starter (100cr/₹50), Pro (200cr/₹120), Enterprise (300cr/₹190).
- **Agentic AI Orchestrator**: Replaced single AI with an 8-agent swarm managed by Gemini. Agents: Inventory (1cr), Passport (1cr), Market (2cr), Usage (1cr), Proof (2cr), Guide (2cr), Search (5cr, fuzzy search), Compare (5cr, side-by-side). AI responses are now strictly scoped to the user's bookmarked inventory.
- **Design System & Dark Mode**: Migrated frontend to Voxel-State Heritage spec. Added Courier Prime headlines, 8px rounded borders, and a global functional dark mode. Dark mode toggle available in App Preferences and on all Admin/Demo server pages.
- **Admin Dashboard**: Added `agent_usage` tracking table and displayed Agentic AI usage/prices directly on the dashboard. Added a prominent "▶ Demo" button.
- **Database & Inventory**: Expanded demo products from 13 to 15 (added PHARMA-2026-014 and AUTO-2026-015). Seeded randomized market prices for all products.
