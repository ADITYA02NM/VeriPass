# 🎬 VeriPass — Demo Day Cheat Sheet

> **IP ADDRESS — see [`ips.md`](ips.md) (single source of truth).** If the laptop's Wi-Fi IP changes, update `ips.md` and run `bash scripts/regenerate-qrs.sh`.

---

## 1. Start everything — ONE command

```bash
bash /home/ego/Documents/VeriPass/scripts/run.sh
```

`run.sh` = stops all old servers → starts a fresh one (verbose log in `backend/server.log`) → health-checks → prints this cheatsheet in the terminal.

Manual fallback:
```bash
cd /home/ego/Documents/VeriPass/backend
node server.js          # binds 0.0.0.0:8080 (http) + 0.0.0.0:8443 (https)
```

Check it's up: `curl -s -o /dev/null -w '%{http_code}' http://localhost:8080` → `200`

---

## 2. URLs

| What | URL |
|---|---|
| App (phones) | `http://192.168.1.62:8080` |
| Judge page — tiled grid (13 products) | `http://192.168.1.62:8080/demo` |
| Big QR — any product | `http://192.168.1.62:8080/demo/1` … `/demo/13` |
| Big QR — product 1/2/3 (shortcuts) | `http://192.168.1.62:8080/demo1` · `/demo2` · `/demo3` |
| **Admin dashboard (proof)** | `http://192.168.1.62:8080/dashboard` |
| Print-ready QRs (13 use cases) | `qrcode/1.png` … `qrcode/13.png` |

> Phones must be on the **same Wi-Fi** as the laptop. Camera on Android: open `chrome://flags` → "Insecure origins treated as secure" → Enabled → add `http://192.168.1.62:8080` → Relaunch.

---

## 3. Demo accounts

| Account | Passkey | Role | Vault (bookmarks) |
|---|---|---|---|
| `user` | `user` | Consumer | **EMPTY** (starts clean) |
| `pro` | `pro` | Producer | 2 items |
| `log` | `log` | Logistics | 2 items |
| `ret` | `ret` | Retailer | 2 items |
| `ravi` | `ravi` | Consumer | 2 items |

---

## 4. Demo flow (5 minutes)

1. **Phone 1** (logged in as `user/user`) scans **QR 1** (tea) → ✅ **AUTHENTIC** (3/3 signatures)
2. **Phone 1** scans **QR 3** (fake watch) → ❌ **NOT GENUINE** (tamper alert)
3. **Phone 2** (logged in as `pro/pro`) scans **QR 2** (sensor) → signs it LIVE → **Production Signed**
4. **Phone 2** → `log/log` signs → **Shipment Signed** → `ret/ret` signs → **Receipt Signed** → 3/3 → **AUTHENTIC**
5. **Phone 1** re-scans **QR 2** → full chain visible (producer → logistics → retailer)
6. **4th scan** → free tier exhausted → **PAY 0.001 ALGO** (x402) → real TestNet transaction on-chain
7. Judges watch `/demo` (tiled grid of 13 use cases, auto-refreshes every 4s) or `/demo/1`–`/demo/13` for big QRs
8. **Proof**: open `/dashboard` — all payments (txid + SHA-256 proof hash), plan purchases, chain-of-custody hashes, usage per person
9. **AI Assistant**: tap the **avatar circle (top-right)** → ask "How many products are in the inventory?" or "Status of AS-SENSOR-2026-001?" — **0.001 ALGO per question (x402 pay-per-use, separate from verification credits)**; pay via the **PAY 0.001 ALGO** banner → answer unlocks
10. **Agent Network Monitor**: open `/agent` → **Run Research Agent** (keywords + research type) → watch it pay 3 services in sequence (market-data → news-summary → report-generate, 0.001 ALGO each, spend-policy guard) → final report; **Price Check** / **Product Info** single-service agents; **Fund with Lora** → https://lora.algokit.io/testnet/fund (real TestNet ALGO, needs AlgoKit login)

---

## 5. Free limit, credits & reset

- **3 free verifies per account** (`FREE_SCAN_LIMIT = 3`), then **1 purchased credit per scan**.
- **Plans (business model)** — buy from the **hourglass icon (top-left) → Billing** (simulated card payment, any 12+ digit number):

  | Plan | Credits | Price |
  |---|---|---|
  | Starter 100 | 100 verifications | ₹99 |
  | Pro 200 | 200 verifications | ₹179 |
  | Enterprise 300 | 300 verifications | ₹249 |

- After credits run out → x402 payment of **0.001 ALGO** (real TestNet).
- **Logging back in restores the 3 free tokens** (usage resets on every successful login).
- **TERMINATE SESSION** (Profile tab) resets:
  - free tokens → 3
  - vault bookmarks → wiped
  - **QR 2 → back to "signed by producer" only** (shipment + receipt signatures removed, so the chain can be re-done live)

---

## 6. If the Wi-Fi IP changes

```bash
# 1. Edit CURRENT_IP in ips.md
# 2. Regenerate the printed QRs with the new IP baked in:
bash scripts/regenerate-qrs.sh
```

That's it — the app, `/api/qr/:code.png` and `/demo*` pages follow the IP automatically (they use the request's Host header). No server restart needed.

---

## 7. Quick checks before judges arrive

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8080        # 200
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8080/demo    # 200
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8080/demo/5  # 200
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8080/dashboard  # 200
find /home/ego/Documents/VeriPass -not -user ego | wc -l              # 0 (all files ego-owned)
```
### Multi-Agent AI Pricing (Per Question)
- **Inventory/Passport/Usage**: 1 credit (0.001 ALGO)
- **Market/Proof/Guide**: 2 credits (0.002 ALGO)
- **Search/Compare**: 5 credits (0.005 ALGO)
*Note: Credits are consumed first. If empty, server issues a 402 challenge for 0.005 ALGO to cover max possible cost.*

### Theming (Voxel-State Heritage)
- Toggle dark mode in app Preferences or via the 🌙 icon on server pages.
- State is persisted in `localStorage` under `veripass_theme`.
