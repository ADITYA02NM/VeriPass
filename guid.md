# VeriPass — Landing Page Guide (guid.md)

> Build a public marketing/landing page for VeriPass. This guide gives you the structure, copy, and sections — plug in your own styling (Tailwind/Next.js recommended).

## 1. Page structure (top → bottom)

| # | Section | Purpose |
|---|---------|---------|
| 1 | Navbar | Logo + links (How it works, Use cases, Pricing, Demo) + "Open App" CTA |
| 2 | Hero | One-line pitch + phone mockup showing a scan + 2 CTAs |
| 3 | Problem | Why fake products are a ₹1 lakh crore problem in India |
| 4 | How it works | 4-step flow: Mint QR → Sign chain → Scan → Verify |
| 5 | Use cases | The 13 demo products as a grid (UC-1 … UC-13) |
| 6 | Pricing | 3 plans (Starter 100 / Pro 200 / Enterprise 300) |
| 7 | Live demo | Big QR + link to the running app + judge dashboard |
| 8 | Tech stack | Algorand x402, SHA-256 chain-of-custody, QR, React |
| 9 | Footer | Contact, repo, disclaimer (demo project) |

## 2. Copy (ready to paste)

### Hero
- **Headline:** "Every product. One QR. Zero fakes."
- **Sub:** "VeriPass mints a tamper-proof digital passport for every product — signed by producer → logistics → retailer, verified by anyone in one scan."
- **CTA 1:** "Try the live demo" → `http://192.168.1.62:8080`
- **CTA 2:** "See the proof" → `http://192.168.1.62:8080/dashboard`

### Problem
- "Counterfeit goods cost India's economy **₹1 lakh crore+ every year** — fake medicines, electronics, food, and documents reach consumers because nobody can verify a product's journey."
- "Barcodes can be copied. Paper certificates can be forged. **Trust needs a chain, not a sticker.**"

### How it works (4 steps)
1. **Mint** — Producer registers the product; a unique QR + SHA-256 hash is created.
2. **Sign** — Each handler (Producer → Logistics → Retailer) signs the chain-of-custody checkpoint.
3. **Scan** — Anyone scans the QR with their phone camera — no app install needed.
4. **Verify** — Live verdict: AUTHENTIC (3/3 signatures) · IN TRANSIT · NOT GENUINE (tamper alert).

### Use cases (13 demo products)
| UC | Product | Status |
|----|---------|--------|
| 1 | Organic Darjeeling Tea | AUTHENTIC (3/3) |
| 2 | AstraSense Industrial Sensor | Live-sign demo |
| 3 | Pharma Component X | ⚠ NOT GENUINE |
| 4 | Cold-Chain Vaccine Vial | AUTHENTIC (3/3) |
| 5 | Smartphone Battery Pack | In transit |
| 6 | Organic Skincare Serum | In transit |
| 7 | Basmati Rice 5kg | AUTHENTIC (3/3) |
| 8 | 22k Gold Necklace | In transit |
| 9 | Degree Certificate | AUTHENTIC (3/3) |
| 10 | Auto Spare Part OEM | Unverified |
| 11 | Organic Fertilizer Bag | In transit |
| 12 | Handloom Cotton Saree | AUTHENTIC (3/3) |
| 13 | Energy Drink | ⚠ NOT GENUINE |

### Pricing
| Plan | Credits | Price | Tagline |
|------|---------|-------|---------|
| Starter 100 | 100 verifications | ₹99 | Perfect for a small demo |
| Pro 200 | 200 verifications | ₹179 | Most popular |
| Enterprise 300 | 300 verifications | ₹249 | Full demo day |

- **1 credit = 1 verification.** Free trial: 3 scans per login. Payments are simulated in the demo.

### Tech stack
- **Blockchain:** Algorand TestNet — x402 pay-per-request (0.001 ALGO per report after credits run out)
- **Integrity:** SHA-256 hashes on every checkpoint, payment, and signature
- **Frontend:** React + Vite + TypeScript (mobile-first, voxel design)
- **Backend:** Node.js + Express + SQLite
- **QR:** Camera-app friendly, embeds the live app URL

## 3. Design notes
- Keep the voxel/8-bit aesthetic (bg `#fff9ec`, ink `#010766`, accents `#41ad31` green / `#fe9832` orange / `#E91E63` pink) — it's the VeriPass brand.
- Mobile-first: judges and users will open it on phones.
- The live demo links are the strongest proof — put them above the fold.

## 4. Live URLs to embed
- App: `http://192.168.1.62:8080`
- Judge demo grid: `http://192.168.1.62:8080/demo`
- Admin dashboard (proof): `http://192.168.1.62:8080/dashboard`
- Print QRs: `qrcode/1.png … 13.png` (regenerate with `bash scripts/regenerate-qrs.sh` after IP changes)

## 5. IP changes
If the laptop's Wi-Fi IP changes: edit `CURRENT_IP` in `ips.md` → run `bash scripts/regenerate-qrs.sh` → update the URLs above.