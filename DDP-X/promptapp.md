# PROMPT APP — VeriPass Android App (Scan · Verify · Sign · Pay)

> Feed this prompt to your AI builder (Android Studio / Gemini / Cursor / Claude) to generate the Android app.
> **Demo deadline: 3 days.** Mock backend (local JSON or in-app data) — must work on a demo phone with zero internet dependency.

---

## 1. PROJECT CONTEXT (paste into every generation)

**Product:** VeriPass — Digital Product Passport for India.
**Mission:** Android app where anyone scans a product QR and instantly sees its authenticity + full journey (factory → logistics → retailer). Built for the Indian market — "Made in India" verification for consumers, and checkpoint signing for supply-chain roles.
**Roles (mode switcher in-app):**
- **Consumer** (default): scan → view result → bookmark → pay (optional premium verification)
- **Factory**: creates products, signs production checkpoints
- **Logistics**: signs pickup/delivery checkpoints
- **Retailer**: signs receipt checkpoints
**Demo goal:** Judge opens app → logs in (1 tap) → scans QR card → sees AUTHENTIC passport → switches to Logistics mode → signs a checkpoint → sees the timeline update. Under 60 seconds.

---

## 2. DESIGN DIRECTION

| Aspect | Requirement |
|---|---|
| **Style** | **Cool, user-friendly, modern** — dark theme with vibrant accents (saffron `#FF9933`, green `#138808`, cyan `#00E5FF`), rounded cards, smooth Material 3 motion |
| **Layout** | Bottom navigation: **Home · Scan · Bookmarks · Profile** (Consumer). Role modes add a **Sign** tab |
| **Status** | Big, unmissable verdict screen: `AUTHENTIC` (green glow) / `SUSPICIOUS` (amber) / `TAMPERED` (red alarm) / `UNKNOWN` (gray) — icon + text + color |
| **Language** | English primary; Hindi subtitle on verdict ("प्रमाणित" for AUTHENTIC) |
| **Feel** | Fast, one-thumb friendly, satisfying haptics + animations on scan success |

---

## 3. TECH STACK

- **Kotlin + Jetpack Compose** (Material 3, dark theme)
- **Camera:** CameraX + ML Kit barcode scanning (or `zxing-android-embedded` if faster)
- **QR generation:** `zxing` core (for factory mode creating product QRs)
- **Data:** Room database + mock seed (products, events, bookmarks); optional Retrofit stub for future API
- **Auth:** fake login — any email + OTP screen that accepts any 6 digits (demo), or one-tap "Continue as Guest"
- **Min SDK:** 26 (Android 8+) · Target: latest stable

---

## 4. SCREENS

### 4.1 Onboarding + Login (minimal but efficient)
- 2-slide onboarding (swipeable): "Scan any product" / "See its true journey" / "Made in India, verified"
- Login: phone number or email → OTP screen (accepts ANY 6-digit code in demo) → done
- **Role mode switcher** on profile: Consumer / Factory / Logistics / Retailer (demo-friendly, one tap)
- Guest mode: "Skip — just scan" (consumer features only)

### 4.2 Home
- Greeting + role badge
- Quick scan button (big, center, glowing)
- Recent scans (last 5, with status chips)
- Bookmarks preview
- "Made in India" banner card (tricolor gradient)

### 4.3 Scan (the core)
- Full-screen camera viewfinder with animated corner brackets + scanning laser line
- Auto-detect QR → haptic buzz → navigate to Result
- Handle: no QR found, invalid QR, offline mode (mock lookup)
- Torch toggle + gallery picker (scan from image) — great for demo fallback

### 4.4 Result / Passport (the wow screen)
- **Verdict hero:** giant status with glow animation + score ring (e.g. `AUTHENTIC · 98/100`)
- Product card: name, batch, origin state, `🇮🇳 Made in India` badge
- **Journey timeline:** Factory ✓ → Logistics ✓ → Retailer ✓ (each: actor, timestamp, signature icon)
- **Documents:** certificates with hash (tap to expand)
- Actions: `Bookmark` (heart), `Verify again`, `Share passport`, `Pay ₹5 for detailed report` (mock UPI-style sheet → success toast)
- Tampered case: red alarm screen with "Do not purchase" warning + report button

### 4.5 Bookmarks
- Grid/list of saved products with status chips
- Tap → result screen · swipe to remove · search

### 4.6 Pay (mock, demo-safe)
- Bottom sheet: "Detailed verification report — ₹5" → UPI-style payment sheet (any UPI ID accepted) → success animation → unlocks extra fields (materials, certifications, customs docs)
- Clearly labeled demo payment — no real money

### 4.7 Role mode: Sign (Factory / Logistics / Retailer)
- **Factory:** `+ New Product` (name, batch, origin) → generates QR → `Sign production` checkpoint
- **Logistics:** list of pending shipments → `Scan shipment QR` → `Sign pickup` / `Sign delivery`
- **Retailer:** `Scan incoming product` → `Receive & sign` → status becomes DELIVERED
- Every sign: timestamp + actor name + signature confirmation dialog → timeline updates everywhere
- **Debug mode** (hidden in Profile → tap logo 5×, or visible toggle for demo): `Simulate tamper on product X`, `Reset demo data`, `Force status AUTHENTIC/TAMPERED`, `Show all mock products` — this is the "debug app" for the live demo

---

## 5. DEMO FLOW (must work, fully offline)

1. Open app → onboarding → login (any OTP) → Home
2. Tap Scan → scan printed QR card (or pick from gallery) → AUTHENTIC verdict + timeline
3. Bookmark it → appears in Bookmarks
4. Pay ₹5 (mock UPI) → detailed report unlocks
5. Switch to Logistics mode → sign a checkpoint → timeline shows new signature
6. Debug mode → simulate tamper → rescan → TAMPERED alarm
7. Factory mode → create product → QR generated → sign production

---

## 6. MOCK DATA (seeded in Room on first launch)

```kotlin
Product(id: "VP-2026-7F92A18D", name: "AstraSense Sensor", batch: "AS-2026-001",
        origin: "Pune, Maharashtra", status: AUTHENTIC, score: 98)
Product(id: "VP-2026-3C81B4E2", name: "AstraSense Sensor", batch: "AS-2026-002",
        origin: "Pune, Maharashtra", status: TAMPERED, score: 54)
Event(productId, type: CREATED|SHIPPED|RECEIVED|VERIFIED|TAMPERED, actor, role, timestamp)
```

Seed: 8 products (6 AUTHENTIC, 1 IN_TRANSIT, 1 TAMPERED), full event chains, 2 bookmarks.

---

## 7. DEMO CHECKLIST

- [ ] Installs on demo phone (APK ready, ~30MB max)
- [ ] Login ≤ 5 seconds (any OTP)
- [ ] Scan works: camera + gallery fallback
- [ ] AUTHENTIC verdict screen is impressive (animation + glow)
- [ ] TAMPERED alarm screen is unmistakable
- [ ] Bookmark + Pay (mock) work
- [ ] Role switch → Sign flow works, timeline updates
- [ ] Debug mode: tamper simulation + data reset
- [ ] Fully offline (no network calls at demo time)
- [ ] No crashes on rotation / background-resume