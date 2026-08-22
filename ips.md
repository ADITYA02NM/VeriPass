# VeriPass — IP Address (SINGLE SOURCE OF TRUTH)

> **This file is the ONE place to change the IP.** Everything else in the project
> references this file. If the laptop's Wi-Fi IP changes (DHCP), update `CURRENT_IP`
> below, then run the QR regeneration script — done.

## Current IP

| Field | Value |
|---|---|
| **CURRENT_IP** | `192.168.1.62` |
| **PORT** | `8080` |
| **HTTPS_PORT** | `8443` |
| **APP URL** | `http://192.168.1.62:8080` |
| **HTTPS APP URL** | `https://192.168.1.62:8443` |
| **JUDGE PAGE** | `http://192.168.1.62:8080/demo` (tiled grid — 13 products) |
| **HTTPS JUDGE PAGE** | `https://192.168.1.62:8443/demo` |
| **BIG-QR PAGES** | `/demo/1` … `/demo/13` (prev/next + back to grid) · `/demo1`–`/demo3` redirect there |
| **ADMIN DASHBOARD** | `http://192.168.1.62:8080/dashboard` (judges: hashes, payments, proof) |
| **PRINT QRs** | `qrcode/1.png` … `qrcode/13.png` (13 use-case products) |

## How to find the current IP (when it changes)

```bash
ip -4 addr show | grep inet
# look for the wlan0/eth0 entry, e.g. inet 192.168.1.62/20
```

## How to update (3 steps)

1. Edit this file → change `CURRENT_IP` to the new address.
2. Regenerate the printable QR codes (they embed the IP):

   ```bash
   bash /home/ego/Documents/VeriPass/scripts/regenerate-qrs.sh
   ```

3. Done. The app itself, `/api/qr/:code.png`, and `/demo` are all host-dynamic
   (they use the request's Host header) — no other changes needed.

## Notes

- The server binds `0.0.0.0:8080` (HTTP) and `0.0.0.0:8443` (HTTPS) — no firewall rules block them.
- **DEMO SETUP (Android phone): camera works on plain HTTP** via Chrome's
  "insecure origins treated as secure" flag:
  1. On the phone's Chrome: open `chrome://flags`
  2. Search **"Insecure origins treated as secure"** → **Enabled**
  3. In the text box add exactly: `http://192.168.1.62:8080`
  4. Tap **Relaunch** → open `http://192.168.1.62:8080` → camera prompt appears.
  - The printable QRs embed `http://192.168.1.62:8080/?qr=<CODE>` so ANY phone's
    camera app can scan them (opens the page, auto-verifies — no flag needed to view).
- HTTPS (`https://192.168.1.62:8443`) still works as an alternative, but most
  phones refuse the self-signed cert (iOS especially) — the flag trick above is
  the reliable demo path.
- Phones must be on the **same Wi-Fi/LAN** as this laptop.
- **Testing loop**: each account gets **3 free verifies** (`FREE_SCAN_LIMIT`), then
  **1 purchased credit per scan** (business model: Starter 100 ₹99 / Pro 200 ₹179 /
  Enterprise 300 ₹249 — buy from the hourglass icon (top-left) → Billing; simulated
  card payment, any 12+ digit number), then x402 payment (0.001 ALGO, real
  TestNet). **The avatar circle (top-right) opens the AI Assistant** — pay-per-use
  0.001 ALGO per question (x402, separate from verification credits). **Agent
  Network Monitor at `/agent`** — Research Agent pays 3 services in sequence
  (market-data → news-summary → report-generate, spend-policy guard) + Price
  Check / Product Info agents + Fund with Lora link. **TERMINATE SESSION** =
  logout only (admin dashboard has Reset).
  when credits run out). **Logging back in restores the 3 free tokens** (usage resets on every
  successful login). **TERMINATE SESSION** (Profile tab) resets free tokens back
  to 3, wipes the vault bookmarks, AND resets QR 2 (AS-SENSOR-2026-001) back to
  **"signed by producer" only** (shipment + receipt signatures removed so the
  chain can be re-done live) — unlimited testing.
- Demo accounts: `user`/`user` (vault **EMPTY**) · `pro`/`pro` · `log`/`log` ·
  `ret`/`ret` · `ravi`/`ravi` (each with **2 bookmarked items** — tea + sensor).
- **Demo-day cheat sheet: [`cheatsheet.md`](cheatsheet.md)** — accounts, URLs,
  demo flow, IP-change procedure.
- The IP is DHCP-assigned and can change on every reconnect — check this file
  before demo day.