#!/usr/bin/env bash
# VeriPass — regenerate printable QR codes from the IP in ips.md
# Usage: bash scripts/regenerate-qrs.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IPS_FILE="$ROOT/ips.md"
QR_DIR="$ROOT/qrcode"
PORT=8080   # HTTP port — QRs embed http:// so ANY phone's camera app can open them (no cert needed); the demo phone uses Chrome's "insecure origins treated as secure" flag to enable the in-app camera on http

# --- read CURRENT_IP from ips.md (single source of truth) ---
IP="$(grep -oP 'CURRENT_IP.*?`\K[0-9.]+' "$IPS_FILE" | head -1)"
if [ -z "$IP" ]; then
  echo "ERROR: could not read CURRENT_IP from $IPS_FILE" >&2
  exit 1
fi
echo "Using IP: $IP (from ips.md)"

# --- 13 use-case products in demo order ---
declare -A PRODUCTS=(
  [1]="DJ-TEA-2023-8991"
  [2]="AS-SENSOR-2026-001"
  [3]="FAKE-WATCH-7"
  [4]="MED-2026-004"
  [5]="ELEC-2026-005"
  [6]="COSM-2026-006"
  [7]="FOOD-2026-007"
  [8]="JEWEL-2026-008"
  [9]="DOC-2026-009"
  [10]="SPARE-2026-010"
  [11]="AGRO-2026-011"
  [12]="TEXT-2026-012"
  [13]="BEV-2026-013"
)

mkdir -p "$QR_DIR"
for n in $(seq 1 13); do
  code="${PRODUCTS[$n]}"
  out="$QR_DIR/$n.png"
  curl -s -m 10 -H "Host: $IP:$PORT" \
    "http://localhost:$PORT/api/qr/$code.png" -o "$out"
  if file "$out" | grep -q PNG; then
    echo "  OK  $out  ($code)"
  else
    echo "  FAIL $out  ($code) — server up? (cd backend && node server.js)" >&2
    exit 1
  fi
done

chown -R ego:ego "$QR_DIR"
echo "Done. QRs embed http://$IP:$PORT/?qr=<CODE> — print qrcode/1.png … 13.png"