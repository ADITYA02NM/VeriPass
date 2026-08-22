# PROMPT 3D — VeriPass Landing Page (Pixelated · Vibrant · Animated)

> Feed this prompt to your AI builder (v0 / Bolt / Claude / Cursor) to generate the 3D landing page.
> **Demo deadline: 3 days.** Everything must work with mock data, no backend required.

---

## 1. PROJECT CONTEXT (paste into every generation)

**Product:** VeriPass — Digital Product Passport for India.
**Mission:** Every product made in India gets a QR-scannable digital passport that proves authenticity and tracks its journey from factory → logistics → retailer → customer. Built for the Indian import/export market, aligned with the "Made in India" initiative (the Indian answer to the EU's Digital Product Passport).
**Audience:** Manufacturers, exporters, importers, retailers, and consumers in India.
**Demo goal:** A judge opens the site → is visually blown away → scans a QR card → sees the passport → understands the story in 30 seconds.

---

## 2. VISUAL DIRECTION (non-negotiable)

| Aspect | Requirement |
|---|---|
| **Style** | **Pixelated / voxel / low-poly retro-futuristic** — think Minecraft-meets-Tron, crisp blocky edges, NOT smooth glossy 3D |
| **Color palette** | **Vibrant, high-energy, Indian-inspired:** Saffron `#FF9933`, India Green `#138808`, Deep Blue `#1A237E`, Magenta `#E91E63`, Cyan `#00E5FF`, warm cream `#FFF8E7` background. High contrast, neon-on-dark sections alternating with light sections |
| **Lighting** | **Animated light** — moving light beams, pulsing emissive glows, light rays sweeping across the scene, volumetric-ish god rays (cheap fake: additive sprites) |
| **Motion** | **Free-flowing** — floating voxel particles drifting upward, orbiting product cubes, smooth sine-wave bobbing, mouse-parallax camera, scroll-driven camera moves. Nothing static |
| **Typography** | Chunky pixel/retro display font for headings (e.g. "Press Start 2P" or "VT323" accents) + clean sans (Inter) for body. Hindi accent text optional (e.g. "मेड इन इंडिया") |
| **Audio** | Optional: subtle synthwave loop with mute toggle (skip if time is tight) |

---

## 3. TECH STACK

- **React + Next.js (App Router) + TypeScript** (or plain Vite + React if faster)
- **Three.js + @react-three/fiber + @react-three/drei** for the 3D scene
- **Tailwind CSS** for layout/UI overlay
- **Framer Motion** for DOM animations (text reveals, section transitions)
- No backend needed — all data mocked in a local `data.ts`

---

## 4. PAGE STRUCTURE (single-page, scroll-driven)

### 4.1 Hero — "Scan. Verify. Trust."
- Full-screen 3D scene: a **giant rotating voxel QR cube** (made of small cubes, emissive edges) floating above a pixelated grid floor
- Light beams sweep across the cube; voxel particles float up like embers
- Headline: **"Every Made-in-India product deserves a passport."**
- Sub: "Scan the QR. Verify authenticity. Track the journey — factory to doorstep."
- CTAs: `Scan a Product` (scrolls to demo section) + `For Businesses` (scrolls to features)
- Mouse parallax: camera tilts toward cursor; scroll rotates the cube
- Floating badges orbiting the cube: `AUTHENTIC ✓` · `MADE IN INDIA` · `TRACKED`

### 4.2 Marquee strip
- Infinite scrolling ticker: "🇮🇳 MADE IN INDIA · FACTORY → LOGISTICS → RETAILER → CUSTOMER · IMPORT / EXPORT READY · QR VERIFIED ·" (repeating, pixel font, saffron/green alternating)

### 4.3 "What is VeriPass?" — the story
- 3 voxel icons (blocky, animated): **QR Cube** (scan), **Route Path** (track), **Shield** (verify)
- 3 short cards: "Scan any product QR", "See its full journey", "Know it's genuine"
- One-liner: "The Indian answer to the EU Digital Product Passport — built for our factories, our exports, our market."

### 4.4 Features grid (6 blocks, hover-glow)
1. **QR Passport** — every product gets a unique scannable passport
2. **Supply-chain tracking** — factory → logistics → retailer, every checkpoint signed
3. **Anti-counterfeit** — tamper detection, AUTHENTIC vs SUSPICIOUS verdicts
4. **Import/Export ready** — documentation + compliance records in one place
5. **Made in India badge** — verified origin, export-ready proof
6. **Role-based access** — factory, logistics, retailer, consumer modes

### 4.5 Live demo section (THE judge moment)
- Embedded interactive: a **3D product card** (voxel box) with a real QR code rendered on it
- Buttons: `Scan` (simulates scan with a sweeping laser line animation) → passport panel slides in with status `AUTHENTIC 98/100` and a mini journey timeline (Factory ✓ → Logistics ✓ → Retailer ✓)
- Second card: `Tampered product` → scan → `TAMPERED 54/100` with red pulsing warning
- This section must work with ZERO backend (pure frontend state machine)

### 4.6 "Made in India" section
- Big pixel-art Indian flag wave (animated, blocky) or tricolor light beams
- Headline: "Made in India. Verified for the world."
- Copy: "As the EU rolls out product passports, India leads with its own — helping exporters prove origin and quality, and helping buyers trust what they import."

### 4.7 CTA + Footer
- Big glowing CTA: `Get your product passport →` (mailto or #)
- Footer: logo, links (Web App, Android App, Docs), "Made with 🇮🇳 in India"

---

## 5. ANIMATION CHECKLIST (must all be present)

- [ ] Rotating voxel QR cube (continuous, emissive edges)
- [ ] Sweeping light beams / god rays across hero
- [ ] Floating particle field (voxel dust rising)
- [ ] Mouse parallax camera
- [ ] Scroll-driven camera movement (cube rotates faster / camera dives)
- [ ] Marquee ticker
- [ ] Section reveal animations (staggered, spring)
- [ ] Scan laser animation in demo section
- [ ] Status pulse animations (green glow AUTHENTIC / red alarm TAMPERED)
- [ ] Hover glow on feature cards
- [ ] Smooth color transitions between sections (neon-dark ↔ cream-light)

---

## 6. PERFORMANCE (demo-day critical)

- Target 60fps on a mid laptop; fallback: reduce pixel ratio / particle count on low-end
- Lazy-load the 3D scene (show static gradient + CSS animation first)
- All assets inline or local — NO external CDN dependencies at demo time (offline-safe)
- Bundle under ~1.5MB gzipped if possible

---

## 7. DEMO CHECKLIST

- [ ] Loads in < 3s on venue Wi-Fi (or fully offline)
- [ ] Hero impresses in first 5 seconds
- [ ] Demo section: scan → AUTHENTIC works with one click
- [ ] Tamper demo: TAMPERED state shows clearly
- [ ] All text readable, no color-only status indicators
- [ ] Works on 1366×768 laptop + phone browser
- [ ] No console errors

---

## 8. SAMPLE COPY (use or improve)

- Hero: **"Every Made-in-India product deserves a passport."**
- Sub: "Scan the QR. Verify authenticity. Track the journey — factory to doorstep."
- Feature tagline: "The Indian answer to the EU Digital Product Passport."
- CTA: "Get your product passport →"