#!/usr/bin/env bash
# ============================================================
#  VeriPass — DEMO DAY one-command launcher
#  1) stops all old servers  2) starts fresh (verbose log)
#  3) health-checks  4) prints the demo cheatsheet
# ============================================================
set -u
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# ---------- 1. STOP old processes ----------
echo "⏹  Stopping old VeriPass servers..."
if pkill -f "[n]ode server.js" 2>/dev/null; then
  echo "   ✓ killed old server(s)"
else
  echo "   (none running)"
fi
sleep 1

# ---------- 2. START new server (verbose) ----------
echo "🚀 Starting VeriPass server (verbose → backend/server.log)..."
cd "$ROOT/backend"
nohup node server.js > server.log 2>&1 &
SERVER_PID=$!
disown
sleep 2

# ---------- 3. Health check ----------
HTTP=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8080 || echo 000)
HTTPS=$(curl -sk -o /dev/null -w '%{http_code}' https://localhost:8443 || echo 000)
DEMO=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/demo || echo 000)
echo "   http  :8080 → $HTTP   |   https :8443 → $HTTPS   |   /demo → $DEMO"
echo "   pid $SERVER_PID · live log: tail -f backend/server.log"
echo

# ---------- 4. Cheatsheet display ----------
IP=$(grep -oP 'CURRENT_IP.*?`\K[0-9.]+' "$ROOT/ips.md" | head -1)
[ -z "$IP" ] && IP="<IP from ips.md>"

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                    ⚡ VERIPASS — DEMO CHEATSHEET                  ║"
echo "╠══════════════════════════════════════════════════════════════════╣"
echo "║  PHONES   http://$IP:8080            (camera: Chrome flag trick)  ║"
echo "║  JUDGES   http://$IP:8080/demo       big QR: /demo1 /demo2 /demo3 ║"
echo "║  PRINTS   qrcode/1.png 2.png 3.png   (embed http://$IP:8080)      ║"
echo "╠══════════════════════════════════════════════════════════════════╣"
echo "║  ACCOUNTS  user/user (EMPTY) · pro/pro · log/log · ret/ret ·      ║"
echo "║            ravi/ravi (2 items each)                               ║"
echo "╠══════════════════════════════════════════════════════════════════╣"
echo "║  FLOW  phone1: QR1 AUTHENTIC ✅ → QR3 FAKE ❌                     ║"
echo "║        phone2: pro signs QR2 → log → ret (3/3 AUTHENTIC)         ║"
echo "║        phone1: re-scan QR2 → 4th scan → x402 PAY 0.001 ALGO      ║"
echo "╠══════════════════════════════════════════════════════════════════╣"
echo "║  LIMIT  3 free verifies/account · LOGIN restores · TERMINATE     ║"
echo "║         resets tokens + bookmarks + QR2→producer-signed only     ║"
echo "║  IP CHANGED?  edit ips.md → bash scripts/regenerate-qrs.sh       ║"
echo "╚══════════════════════════════════════════════════════════════════╝"