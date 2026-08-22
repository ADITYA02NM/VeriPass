# DDP-X — VeriPass: Digital Product Passport for India

**Master executable plan** · **Demo in 3 DAYS** · Build sprint: Day 1 → Day 2 → Day 3 (demo)
**Scope:** 3D landing page + 2D B2B web app (inventory & tracking) + Android app (scan/verify/sign/pay)
**Market:** India — import/export monitoring, "Made in India" verification (the Indian answer to the EU Digital Product Passport)
**NOT about EV batteries.** This is a product-monitoring platform for the Indian market.

---

# 0. EXECUTIVE LAYER — PEAK CONCEPT

**One line:** Give every physical product a QR-scannable digital passport that proves authenticity and tracks its journey — factory → logistics → retailer → customer — for the Indian import/export market.

**The loop (demo must show):**
```
Physical product → QR → Digital Passport
  → Provenance events (factory signs → logistics signs → retailer signs)
  → Verification engine (AUTHENTIC / SUSPICIOUS / TAMPERED / IN_TRANSIT / DELIVERED / RECALLED)
  → Consumer scans on Android → verdict + timeline + bookmark + pay (mock)
  → B2B web app manages inventory, generates QRs, signs checkpoints
  → 3D landing page sells the story: "Made in India. Verified for the world."
```

**Locked decisions (user-confirmed):**

| Decision | Choice |
|---|---|
| Market | **India** — import/export monitoring, "Made in India" initiative (EU DPP is the inspiration, NOT the target) |
| Deliverables | **3D landing (pixelated/vibrant/animated) + 2D web app (minimal B2B) + Android app (scan/verify/sign/pay)** |
| Android roles | Consumer (scan+result+bookmark+pay) · Factory · Logistics · Retailer (sign checkpoints) · **Debug mode** (tamper simulation, live demo) |
| Backend | **Mock-first** — all apps work offline with seeded data; real API optional if time permits |
| Blockchain | **Optional stretch** — Algorand TestNet anchoring only if Day 1-2 core is done (NOT demo-critical) |
| Payments | **Mock UPI-style sheet** in Android app (₹5 detailed report) — clearly labeled demo, no real money |
| Demo style | **Judge-driven self-serve** — judges scan QR cards, flip roles, trigger tamper themselves |
| Name | **VeriPass** (folder: DDP-X) |

---

# 1. USECASE LAYER — PEAK USECASE

**The story (India context):**
- The EU is rolling out Digital Product Passports (ESPR) — batteries 2027, textiles, tyres, aluminium, furniture, ICT by 2029. India's exporters will need DPP-ready infrastructure to sell into the EU.
- India's answer: **"Made in India"** — prove origin, prove quality, fight counterfeits, and give importers/exporters a single tracking + compliance layer.
- VeriPass = the platform: factories create passports, logistics signs movements, retailers sign receipts, consumers scan and trust.

**Use cases to demo:**
1. **Consumer trust** — scan QR → AUTHENTIC vs TAMPERED verdict
2. **Made in India proof** — verified origin for exporters; importers verify what they buy
3. **Supply-chain tracking** — factory → logistics → retailer, every checkpoint signed
4. **Anti-counterfeit** — tamper detection + status propagation
5. **Import/Export readiness** — documents + compliance records in one place

**Demo data (fictional):** AstraSense Industrial Sensor, batch AS-2026-001, origin Pune (Maharashtra).
Product A = AUTHENTIC 98/100 · Product B = TAMPERED 54/100 (document modified after signing).

---

# 2. ARCHITECTURE LAYER

```
┌─────────────────────────── VeriPass ───────────────────────────┐
│                                                               │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐  │
│  │ 3D Landing   │   │ 2D Web App   │   │ Android App      │  │
│  │ (Next.js +   │   │ (Next.js +   │   │ (Kotlin +        │  │
│  │  R3F, pixel) │   │  Tailwind,   │   │  Compose, ML Kit)│  │
│  │  marketing   │   │  minimal B2B)│   │  scan/sign/pay   │  │
│  └──────┬───────┘   └──────┬───────┘   └────────┬─────────┘  │
│         └──────────────────┼────────────────────┘            │
│                            ▼                                 │
│              ┌─────────────────────────┐                     │
│              │ Mock data layer (seed)  │  ← offline-safe     │
│              │ (optional: FastAPI API  │  ← stretch goal     │
│              │  + PostgreSQL + Redis)  │                     │
│              └─────────────────────────┘                     │
│                            │                                 │
│              ┌─────────────▼─────────────┐                   │
│              │ Verification engine       │                   │
│              │ (score + status,          │                   │
│              │  deterministic)           │                   │
│              └───────────────────────────┘                   │
└───────────────────────────────────────────────────────────────┘
```

**Repo layout:**
```
DDP-X/
├── prompt3D.md      # generation prompt: 3D landing page
├── prompt2D.md      # generation prompt: 2D B2B web app
├── promptapp.md     # generation prompt: Android app
├── web-landing/     # 3D landing (Next.js + React Three Fiber)
├── web-app/         # 2D B2B app (Next.js + Tailwind + shadcn/ui)
├── android/         # Android app (Kotlin + Jetpack Compose)
├── shared/          # mock data + status/verification logic (single source of truth)
└── DDPX.md          # this plan
```

**Status model (shared everywhere):** `AUTHENTIC` · `SUSPICIOUS` · `TAMPERED` · `IN_TRANSIT` · `DELIVERED` · `RECALLED` · `UNKNOWN` — always shown with icon + text + color (never color alone).

---

# 3. DELIVERABLE 1 — 3D LANDING PAGE (`prompt3D.md`)

- **Style:** pixelated/voxel retro-futuristic, vibrant Indian palette (saffron `#FF9933`, green `#138808`, deep blue, magenta, cyan), animated light beams, free-flowing particles, mouse parallax
- **Stack:** Next.js + React Three Fiber + drei + Tailwind + Framer Motion
- **Sections:** Hero (rotating voxel QR cube) → marquee → story → features → **live demo section** (scan → AUTHENTIC / TAMPERED, pure frontend) → Made in India → CTA/footer
- **Rule:** zero backend, offline-safe, 60fps, demo-ready in one sitting

---

# 4. DELIVERABLE 2 — 2D WEB APP (`prompt2D.md`)

- **Style:** minimal, clean, light theme, saffron/green accents only
- **Stack:** Next.js + Tailwind + shadcn/ui + qrcode
- **Pages:** Login (role picker) · Dashboard · Products/Inventory · Product Detail + Passport + Timeline · Shipments/Tracking · Import/Export · Admin (audit + tamper simulation)
- **Demo flow:** login → create product → QR → ship → receive → tamper → verify — all mock, under 2 minutes

---

# 5. DELIVERABLE 3 — ANDROID APP (`promptapp.md`)

- **Stack:** Kotlin + Jetpack Compose (Material 3, dark) + CameraX + ML Kit barcode + Room
- **Screens:** Onboarding/Login (any OTP) · Home · Scan (camera + gallery) · Result/Passport (verdict hero + timeline) · Bookmarks · Pay (mock UPI ₹5) · Sign (role checkpoints) · Debug mode
- **Roles:** Consumer (scan/result/bookmark/pay) · Factory (create + sign production) · Logistics (sign pickup/delivery) · Retailer (receive & sign)
- **Debug mode (the "debug app"):** simulate tamper, force status, reset data — for the live demo
- **Rule:** fully offline, APK ready, no crashes

---

# 6. DEMO LAYER — JUDGE-DRIVEN, 3-DAY SPRINT

**Principle:** judges DO things; we narrate. Everything reachable in ≤ 2 taps/clicks.

**Demo script (60–90 seconds):**
1. Landing page opens → hero wow (5s)
2. Scroll to live demo → scan → AUTHENTIC (10s)
3. Open web app → one-click login as Factory → create product → QR (20s)
4. Switch role → Logistics signs shipment → Retailer receives (15s)
5. Open Android app → scan QR card → AUTHENTIC + timeline (10s)
6. Debug mode → simulate tamper → rescan → TAMPERED alarm (10s)
7. Bookmark + mock pay → detailed report (10s)

**QR cards:** printed cards per product: QR → `/verify/VP-...` + product name + serial. QR is an identifier, not proof — stated on the card.

---

# 7. IMPLEMENTATION LAYER — 3-DAY SPRINT

**Every session ends with:** builds pass → commit → status report (TASK / STATUS / FILES / RESULT / NEXT).

### Day 1 — Foundations + Landing
- [ ] Scaffold `web-landing` (Next.js + R3F) from `prompt3D.md`
- [ ] Hero voxel QR cube + particles + light beams working
- [ ] All sections built with mock data
- [ ] Scaffold `shared/` mock data + status logic
- **DoD:** landing page fully animated, offline, no console errors

### Day 2 — Web App + Android start
- [ ] Scaffold `web-app` from `prompt2D.md`: login, dashboard, products, passport, shipments, import/export, admin
- [ ] QR generation + `/verify/[id]` page
- [ ] Scaffold `android/` from `promptapp.md`: login, home, scan (camera), result
- **DoD:** web app demo flow works end-to-end; Android scans a printed QR and shows verdict

### Day 3 — Android complete + Polish + Rehearse
- [ ] Android: bookmarks, pay (mock), role modes, sign flow, debug mode
- [ ] Print QR cards; install APK on demo phone
- [ ] Rehearse the 90-second script; fix top issues
- [ ] Offline test: kill Wi-Fi → everything still works
- **DoD:** full demo script passes twice in a row

---

# 8. FAILURE-PROOFING

| Failure | Backup |
|---|---|
| Venue has no internet | Everything is offline-safe (mock data, local assets, no CDN) |
| Demo phone camera fails | Gallery-picker scan fallback in Android app |
| Projector/laptop weak GPU | Landing page lazy-loads 3D → CSS fallback; reduce particles |
| Judge has no phone | Web app `/verify/[id]` page shows the same passport |
| QR card lost | Web app regenerates QR on the spot |
| Android build breaks | APK from previous working build + web fallback |

**Rule:** recorded evidence is clearly labeled; live demo uses live components.

---

# 9. SECURITY & HONESTY RULES (condensed, non-negotiable)

- Mock payments are **clearly labeled** "Demo payment — no real money"
- No fake "blockchain verified" claims unless a real anchor exists (stretch goal only)
- Statuses always icon + text + color
- No secrets in code; `.env` git-ignored if a real API is added
- Verification logic deterministic and shared across all three apps (`shared/`)

---

# 10. PITCH LAYER

**30 seconds:**
> Counterfeit products and invisible supply chains cost Indian businesses and consumers every day. VeriPass gives every Made-in-India product a QR-scannable digital passport. Factories create it, logistics and retailers sign it at every checkpoint, and anyone can scan to see the product's true journey — authentic or tampered, in one second. Built for India's import/export market, ready for the world's product-passport future.

**Judging hook:** "The EU is mandating product passports. India can lead its own — VeriPass is the platform."

---

**FINAL OBJECTIVE:** a judge can, in 90 seconds, see the 3D story, create and track a product in the web app, scan it with the Android app, get an AUTHENTIC verdict, trigger a tamper, and watch it flip to TAMPERED — all offline, all mock, all impressive.