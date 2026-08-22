# PROMPT 2D — VeriPass Web App (Inventory + Tracking · Minimal B2B)

> Feed this prompt to your AI builder (v0 / Bolt / Cursor / Claude) to generate the 2D web app.
> **Demo deadline: 3 days.** Mock data, local-only, no real backend required.

---

## 1. PROJECT CONTEXT (paste into every generation)

**Product:** VeriPass — Digital Product Passport for India.
**Mission:** B2B web app for manufacturers, importers, and exporters to maintain inventory and track products across the supply chain (factory → logistics → retailer). Each product has a QR-scannable digital passport proving authenticity and origin ("Made in India").
**Users:** Factory managers, logistics operators, retailer admins, and a super-admin demo account.
**Demo goal:** A judge logs in → sees a clean dashboard → creates a product → gets a QR → simulates a shipment → sees the tracking timeline. All in under 2 minutes.

---

## 2. DESIGN DIRECTION

| Aspect | Requirement |
|---|---|
| **Style** | **Minimal, clean, professional** — light theme, generous whitespace, subtle borders. NOT flashy (the 3D landing is the flashy one) |
| **Accent** | Saffron `#FF9933` + India Green `#138808` as the only accent colors; neutral grays for everything else |
| **Typography** | Inter / system sans; tight, readable tables |
| **Components** | shadcn/ui style: cards, tables, badges, dialogs, toasts |
| **Status colors** | Always text + icon + color (never color alone): `AUTHENTIC` (green shield), `SUSPICIOUS` (amber), `TAMPERED` (red), `IN_TRANSIT` (blue), `DELIVERED` (green), `RECALLED` (red) |
| **Language** | English UI, with Hindi hints optional (e.g. "मेड इन इंडिया" badge on product cards) |

---

## 3. TECH STACK

- **Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui**
- **State:** React context or Zustand (no server needed)
- **QR:** `qrcode` npm package (generate PNG/SVG client-side)
- **Data:** mock seed data in `lib/mock-data.ts` (products, batches, events, users)
- **Auth:** fake login (any email + password works; role picker on login screen for demo)

---

## 4. PAGES

### 4.1 Login
- Minimal centered card: logo, email, password, `Sign in` button
- **Demo role picker** (subtle, below the form): `Factory · Logistics · Retailer · Admin` — instantly logs in as that role (one-click demo)
- Hint text: "Demo — any credentials work"

### 4.2 Dashboard (role-aware)
- Stat cards row: **Total Products · In Stock · In Transit · Verified · Suspicious**
- Recent activity feed (last 8 events: created, shipped, received, verified)
- Quick actions: `+ New Product`, `Generate QR`, `New Shipment`
- Low-stock / attention list (products needing action)

### 4.3 Products / Inventory
- Table: Product ID (`VP-2026-XXXX`), Name, Batch, Origin (State), Status badge, Stock, Updated
- Search + filters (status, origin, batch)
- Row click → product detail
- `+ New Product` dialog: name, SKU, batch, origin state, price, quantity → creates product + QR + passport

### 4.4 Product Detail + Passport
- Header: name, ID, status badge, `Made in India` badge, QR code (downloadable PNG)
- **Passport panel** (the core): manufacturer, batch, origin, manufacturing date, materials, certifications
- **Timeline tab:** full journey — Factory created ✓ → Logistics picked up ✓ → Retailer received ✓ (each with actor, timestamp, signature status)
- **Documents tab:** uploaded docs (certificates, invoices) with SHA-256 hash shown
- Actions (role-based): Factory can `Sign production` · Logistics can `Start shipment` / `Mark delivered` · Retailer can `Receive & sign`

### 4.5 Shipments / Tracking
- List of shipments: ID, from → to, product count, status, ETA
- Shipment detail: timeline of checkpoints, each with signer + timestamp
- `New Shipment` dialog: select products, origin, destination, carrier → generates tracking events

### 4.6 Import / Export
- Two tabs: **Exports** (products leaving India) and **Imports** (products entering)
- Table: product, partner country, documents status (Invoice ✓ / Certificate ✓ / Customs), compliance badge
- Purpose: show the "Made in India, verified for the world" story — exporters prove origin, importers verify authenticity

### 4.7 Admin (super-admin only)
- All users/roles, audit log (who signed what when), verification stats, tamper simulation button (`Simulate tamper on Product X` → flips status to TAMPERED — for the live demo)

---

## 5. DEMO FLOW (must work end-to-end, mock data)

1. Login as **Factory** (one click)
2. Dashboard loads with stats
3. Create product → QR generated instantly
4. Open passport → see timeline with Factory signature
5. Switch role to **Logistics** → start shipment → sign checkpoint
6. Switch role to **Retailer** → receive & sign → status DELIVERED
7. Admin → simulate tamper → product shows TAMPERED
8. Scan the QR with phone → opens `/verify/[id]` page showing the passport + status

---

## 6. DATA MODEL (mock)

```ts
Product { id: "VP-2026-7F92A18D", name, sku, batch, originState, price, qty, status, createdAt }
Event   { id, productId, type: "CREATED"|"SHIPPED"|"RECEIVED"|"VERIFIED"|"TAMPERED", actor, role, timestamp, signed }
Shipment{ id, from, to, carrier, status, productIds[], events[] }
User    { id, name, role: "FACTORY"|"LOGISTICS"|"RETAILER"|"ADMIN" }
```

Seed: 12 products (mix of AUTHENTIC / IN_TRANSIT / DELIVERED / 1 TAMPERED), 5 shipments, 3 users per role.

---

## 7. DEMO CHECKLIST

- [ ] Login with role picker works in 1 click
- [ ] Dashboard stats match mock data
- [ ] Create product → QR appears + downloads
- [ ] Passport + timeline render correctly
- [ ] Role switch changes available actions
- [ ] Tamper simulation flips status everywhere (list + detail + verify page)
- [ ] `/verify/[id]` page works when QR scanned from phone
- [ ] No console errors; works offline (no CDN deps)