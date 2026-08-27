<div align="center">

# ⚡ VeriPass

<img src="https://raw.githubusercontent.com/ADITYA02NM/VeriPass/main/assets/passport-banner.svg" alt="VeriPass Banner" width="600" />

### x402 Agentic Product Passport on Algorand

**Verify any product's authenticity and supply-chain provenance with AI-powered agents and micropayments.**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat&logo=typescript)](https://typescriptlang.org)
[![Algorand](https://img.shields.io/badge/Algorand-TestNet-000000?style=flat)](https://algorand.co)
[![x402](https://img.shields.io/badge/x402-Protocol-FF6B35?style=flat)](https://x402.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat)](https://opensource.org/licenses/MIT)

[📺 Watch Demo](https://www.youtube.com/shorts/pzOABdKjVbA) · [🌐 Live App](https://veripass-t3ef.onrender.com) · [💻 GitHub](https://github.com/ADITYA02NM/VeriPass) · [📝 Devpost](https://devpost.com/software/veripass) · [⚡ DoraHacks](https://dorahacks.io/buidl/48115/)

</div>

---

## 🎯 The Problem

<div align="center">

> **Counterfeit products cost India ₹1.5 lakh crore annually** — and there's no affordable way for consumers or AI agents to verify product authenticity and supply-chain provenance in real time.

VeriPass solves this with the **x402 HTTP Payment Protocol** — AI agents pay per-use in ALGO to verify products, check history, and analyze supply chains. No subscriptions. Just trust.

<img src="https://raw.githubusercontent.com/ADITYA02NM/VeriPass/main/assets/passport-icon.svg" alt="Passport Icon" width="120" />

</div>

---

## 🏗️ Architecture

<div align="center">

<img src="https://raw.githubusercontent.com/ADITYA02NM/VeriPass/main/assets/ai-agents.svg" alt="AI Agents" width="400" />

</div>

```
┌──────────────────────────────────────────────────────────────┐
│                     🎨 React 19 Frontend                     │
│  QR Scanner · Passport View · AI Chat · Wallet · Dashboard   │
└──────────────────────┬───────────────────────────────────────┘
                       │ REST API
┌──────────────────────▼───────────────────────────────────────┐
│                  ⚡ Hono Backend (Node.js)                   │
│  Auth · Products · Payments · Signatures · Admin              │
├──────────────────────────────────────────────────────────────┤
│  🤖 7 AI Agents (Google Gemini)  ·  💰 x402 Micropayments   │
├──────────────────────────────────────────────────────────────┤
│  🗄️ SQLite (node:sqlite — zero native deps)                 │
└──────────────────────┬───────────────────────────────────────┘
                       │ x402 Payments
┌──────────────────────▼───────────────────────────────────────┐
│              🔗 Algorand TestNet · Pera Wallet                │
│         GoPlausible Facilitator · Lora Explorer               │
└──────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

### 🔍 Product Verification
- **QR Code Scanning** — Scan any product code to verify authenticity
- **Supply-Chain Passport** — Full chain-of-custody with cryptographically signed checkpoints
- **Verdict Engine** — Confidence score (0–100) with color-coded trust badges

### 🤖 AI Agent System (7 Specialist Agents)
- **Inventory Agent** — Stock management and alerts
- **Passport Agent** — Product history and provenance
- **Market Agent** — Pricing intelligence and trends
- **Usage Agent** — Product lifecycle analysis
- **Proof Agent** — Verification and authentication
- **Search Agent** — Product discovery and recommendations
- **Compare Agent** — Cross-product analysis

### 💰 x402 Micropayments
- **Pay-per-use** — 0.002–0.005 ALGO per AI action
- **No subscriptions** — Just trust and pay
- **On-chain receipts** — Every payment verified on Algorand TestNet
- **Spend-policy guard** — Budget limits and spending caps

### ✍️ Digital Signatures
- **ed25519 key pairs** — Producer/Logistics/Retailer sign checkpoints
- **Cryptographic proof** — Tamper-evident supply-chain records

### 🔐 Security
- **HMAC-signed tokens** — Server-side session management
- **OTP email verification** — Password reset and 2FA
- **Backup codes** — Account recovery
- **Biometric toggle** — WebAuthn support

---

## 🚀 Quick Start

### 🌐 Live Demo

**[veripass-t3ef.onrender.com](https://veripass-t3ef.onrender.com)**

Demo credentials:
| Username | Password | Role |
|----------|----------|------|
| `user` | `user` | Buyer/Scanner |
| `pro` | `pro` | Producer |
| `log` | `log` | Logistics |
| `ret` | `ret` | Retailer |
| `ravi` | `ravi` | User |

### 📋 Judge Demo Page

**[veripass-t3ef.onrender.com/demo](https://veripass-t3ef.onrender.com/demo)** — Grid of 15 product QR tiles for quick walkthrough.

### 🌐 Agent Network Monitor

**[veripass-t3ef.onrender.com/agent](https://veripass-t3ef.onrender.com/agent)** — Live visualization of AI agent payments.

> ⚠️ **Note**: Render cold-starts on first visit. Wait 15–20 seconds if the page appears blank.

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS |
| Backend | Hono (Node.js), SQLite (built-in) |
| AI | Google Gemini (7 specialist agents + orchestrator) |
| Payments | x402 Protocol, Algorand TestNet, Pera Wallet |
| Security | HMAC tokens, ed25519 signatures, WebAuthn |
| Infrastructure | Render (auto-deploy from GitHub) |

---

## 📁 Project Structure

```
VeriPass/
├── backend/
│   ├── server.js          # Main Hono server (all routes)
│   ├── db.js              # SQLite schema + seed data
│   ├── auth.js            # HMAC JWT auth + password hashing
│   ├── ai.js              # 7 AI agents + Gemini integration
│   ├── agents.js          # Research Agent + x402 demo
│   ├── x402.js            # Algorand payment execution
│   └── data/              # SQLite DB + wallet config
├── veripass/
│   └── src/
│       ├── App.tsx        # SPA router + state management
│       ├── screens/       # 13 screens (Login, Scan, AI Chat, etc.)
│       ├── components/    # TopBar, BottomNav, PassportAnimation
│       └── lib/           # API client, Pera wallet, x402 pay
├── assets/                # SVG icons and banners
└── render.yaml            # Render Blueprint (auto-deploy)
```

---

## 🎬 Demo Workflow

1. 🔐 **Login** — Sign in with `user` / `user`
2. 📱 **Scan** — Open `/demo`, tap a QR tile, scan with phone camera
3. 🛂 **Passport** — View full supply-chain history and verdict
4. 🤖 **AI Chat** — Ask AI agents about the product (auto-pays 0.003 ALGO)
5. 🔬 **Research Agent** — Run 3 sequential x402 payments
6. 💰 **Wallet** — Check spending history on Algorand TestNet
7. 📦 **Vault** — View bookmarked products
8. ✍️ **Signatures** — Create ed25519 key pair and sign checkpoint
9. 🔗 **Verify** — Re-scan to see updated verification record

---

## 📡 API Endpoints

<details>
<summary>🔐 Authentication (11 endpoints)</summary>

- `POST /api/auth/login` — Login with identifier + passkey
- `POST /api/auth/register` — Create new account
- `POST /api/auth/wallet` — Login via Pera Wallet
- `POST /api/auth/send-otp` — Send OTP to email
- `POST /api/auth/verify-otp` — Verify OTP code
- `POST /api/auth/reset-password` — Reset password via OTP
- `POST /api/auth/google` — Login/register via Google OAuth
- `POST /api/auth/link-wallet` — Link mnemonic to derive wallet
- `POST /api/auth/backup-codes/generate` — Generate 8 backup codes
- `GET /api/auth/backup-codes` — List backup codes
- `POST /api/auth/backup-codes/use` — Mark backup code as used

</details>

<details>
<summary>🛡️ Security</summary>

- `POST /api/biometric/toggle` — Enable/disable biometric auth

</details>

<details>
<summary>✍️ Digital Signatures (Producer/Logistics/Retailer)</summary>

- `GET /api/signatures` — List digital signatures
- `POST /api/signatures/create` — Create ed25519 key pair
- `POST /api/signatures/sign` — Sign data with stored key
- `POST /api/signatures/revoke` — Revoke a signature

</details>

<details>
<summary>📦 Product Verification</summary>

- `GET /api/verify/:code` — Verify product (0.002 ALGO)
- `POST /api/products/:code/sign` — Add checkpoint signature
- `POST /api/products/:code/bookmark` — Bookmark product

</details>

<details>
<summary>🤖 AI Agents</summary>

- `POST /api/ai/chat` — Chat with AI agents (0.003–0.005 ALGO)
- `GET /api/ai/agents` — List available agents
- `POST /api/agent/run` — Run research agent (3 sequential payments)
- `POST /api/agent/price-check` — Single service agent
- `POST /api/agent/info` — Product info agent

</details>

<details>
<summary>💰 Payments & Wallet</summary>

- `POST /api/x402/pay` — Execute x402 payment
- `GET /api/usage` — Check usage stats
- `GET /api/payments` — Payment history with tx links
- `GET /api/spending` — Spending limit and balance
- `POST /api/spending/limit` — Set AI spending cap

</details>

<details>
<summary>🔧 Admin</summary>

- `GET /dashboard` — Admin dashboard
- `GET /demo` — Judge demo page
- `GET /agent` — Agent Network Monitor

</details>

---

## 🧪 TestNet Accounts

| Account | Address | Role |
|---|---|---|
| 🏦 **Platform Receiver** | `NYRK2742GDQ...SPNT7ZOPM` | Merchant |
| 👤 **User** | `QSOFH5G2PS...T5Y4QWEI746B7E` | Buyer/Scanner |
| 🏭 **Producer** | `EKLDBPKGIN...4X3QWGFQCYJ5V4` | Producer |
| 🚚 **Logistics** | `RCZT2Z3WKA...HCXW4ZQP54ZE` | Logistics |
| 🏪 **Retailer** | `HFHJPLT3QW...2ACYOKRO4KCU` | Retailer |

> 💡 Fund wallets via the [Lora TestNet Faucet](https://lora.algokit.io/testnet/fund)

---

## 👥 Team — Cyber Assassins

<table>
<tr>
<td align="center">

<img src="https://raw.githubusercontent.com/ADITYA02NM/VeriPass/main/assets/team-icon.svg" alt="Team" width="100" />

</td>
<td>

| Member | Role | Focus |
|---|---|---|
| 👑 **Priyanka Meenkeri** | **Team Lead / Design** | UI/UX Design, Visual Identity, Branding |
| ⚙️ **Member 1** | Backend Lead | Node.js, Hono, x402 integration, Algorand payments |
| 🔐 **Member 2** | Cybersecurity + Blockchain | Smart contracts, security audit, Algorand TestNet |
| 🎨 **Member 3** | Frontend Lead | React, TypeScript, UI/UX design |

**🏛️ College**: Bangalore Institute of Engineering

</td>
</tr>
</table>

---

## 🏆 Hackathon Submissions

| Hackathon | Link | Status |
|-----------|------|--------|
| **Devpost** | [veripass on devpost](https://devpost.com/software/veripass) | ✅ Submitted |
| **DoraHacks** | [veripass on dorahacks](https://dorahacks.io/buidl/48115/) | ✅ Submitted |

---

## 📄 License

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

MIT License — Built for the x402 Pre-Hack on Algorand

---

<img src="https://raw.githubusercontent.com/ADITYA02NM/VeriPass/main/assets/passport-footer.svg" alt="VeriPass" width="80" />

**Made with ❤️ by Cyber Assassins**

*VeriPass — Every product has a story. Verify it.* 🛂

[📺 Watch Demo](https://www.youtube.com/shorts/pzOABdKjVbA) · [🌐 Live App](https://veripass-t3ef.onrender.com) · [💻 GitHub](https://github.com/ADITYA02NM/VeriPass) · [📝 Devpost](https://devpost.com/software/veripass) · [⚡ DoraHacks](https://dorahacks.io/buidl/48115/)

</div>
