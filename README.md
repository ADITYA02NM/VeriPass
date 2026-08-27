<div align="center">

<img src="https://raw.githubusercontent.com/ADITYA02NM/VeriPass/main/assets/passport-banner.svg" alt="VeriPass Passport" width="100%" />

# 🛂 VeriPass

### **x402 Agentic Product Passport on Algorand**

<p>
  <img src="https://img.shields.io/badge/🚀_Live_App-veripass.onrender.com-00C853?style=for-the-badge&logo=render&logoColor=white" alt="Live App" />
  <img src="https://img.shields.io/badge/GitHub-ADITYA02NM/VeriPass-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
  <img src="https://img.shields.io/badge/Blockchain-Algorand-000000?style=for-the-badge&logo=algorand&logoColor=white" alt="Algorand" />
  <img src="https://img.shields.io/badge/Protocol-x402-FF6B35?style=for-the-badge&logo=http&logoColor=white" alt="x402" />
  <img src="https://img.shields.io/badge/AI-Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License" />
</p>

<p>
  <strong>🤖 AI agents that pay per-use</strong> ·
  <strong>📦 Supply-chain verification</strong> ·
  <strong>💰 Machine-to-machine payments</strong>
</p>

---

### 🎬 Demo Video

[![VeriPass Demo](https://img.shields.io/badge/▶_Watch_Demo-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/shorts/pzOABdKjVbA)

> 📱 **Made in India** 🇮🇳 — Built by students at Bangalore Institute of Engineering

---

</div>

## 📋 Submission Brief — x402 Pre-Hack (Algorand)

<table>
<tr>
<td>

| Requirement | Status |
|---|---|
| ✅ Working project | Deployed on Render (live) |
| ✅ x402 integration | `@x402/hono` + `@x402/avm` on Algorand TestNet |
| ✅ Public GitHub repo | `github.com/ADITYA02NM/VeriPass` |
| ✅ README | This document |
| ✅ Smart Contracts | Native Algorand payments (not ASA/ARC4) |
| ✅ Demo link | [veripass-t3ef.onrender.com](https://veripass-t3ef.onrender.com) |
| ✅ GoPlausible facilitator | Configured for payment settlement |
| ✅ Team | Cyber Assassins (4 members) |
| ✅ Demo video | [YouTube Shorts](https://www.youtube.com/shorts/pzOABdKjVbA) |

</td>
<td align="center">

<img src="https://raw.githubusercontent.com/ADITYA02NM/VeriPass/main/assets/passport-icon.svg" alt="Passport Icon" width="150" />

</td>
</tr>
</table>

---

## ⛓️ Algorand TestNet Details

| Parameter | Value |
|---|---|
| 🌐 **Network** | Algorand TestNet |
| 📬 **Platform Receiver** | `NYRK2742GDQ...SPNT7ZOPM` |
| 💳 **Payment Method** | Native ALGO transactions |
| 📜 **Smart Contracts** | None — direct wallet-to-wallet transfers |
| 🏦 **Facilitator** | GoPlausible x402 |
| 🔗 **ALGOD Endpoint** | `https://testnet-api.algonode.cloud` |
| 🔍 **Explorer** | [Lora TestNet](https://lora.algokit.io/testnet) |
| 🏛️ **Platform Account** | [View Transactions](https://lora.algokit.io/testnet/account/NYRK2742GDQ7KIRNGWCHKVUKVUZTFDXVKWXT3N5HTAV6IMWWDSPNT7ZOPM) |

### 🤔 Why No Smart Contracts?

VeriPass uses **native payment transactions** because:

| Benefit | Description |
|---|---|
| ⚡ **Speed** | 3.3s finality vs contract call overhead |
| 💰 **Cost** | 0.001 ALGO fee per txn (minimum network fee) |
| 🔧 **Simplicity** | No contract deployment or ABI needed |
| 📡 **x402 Spec** | Protocol specifies HTTP header payments, not on-chain contracts |

```javascript
// x402.js — user wallet pays platform receiver
const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
  sender: userWallet.address,    // per-user wallet
  receiver: PLATFORM_RECEIVER,   // platform fee collection
  amount: microAlgos,            // e.g. 2000 (0.002 ALGO)
  suggestedParams: params,
});
```

---

## 🔍 Problem Statement

<div align="center">

### 💸 Counterfeit products cost India **₹1.5 lakh crore annually**

</div>

From adulterated medicines to fake electronics, consumers and businesses lose money and trust:

| Problem | Impact |
|---|---|
| 🌫️ **Opaque** | No way for consumers to verify a product's journey from factory to shelf |
| 🏢 **Centralised** | Trust depends on one company's word — easily forged |
| 💰 **Expensive** | Enterprise supply-chain verification costs thousands of dollars |

Meanwhile, **AI agents** (autonomous software bots) need to transact with each other to fetch data, verify products, and generate reports — but there's no standard micropayment protocol for agent-to-agent commerce.

---

## 💡 Solution — VeriPass

VeriPass is an **anti-counterfeit product-passport platform** that combines:

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   🛂 PASSPORT        🤖 AI AGENTS       💰 x402 PAYMENTS           │
│   ─────────────      ─────────────      ───────────────            │
│   Chain-of-custody   7 specialist       Pay-per-use in ALGO        │
│   with crypto        agents that        (0.002–0.005 ALGO)         │
│   signed checkpoints auto-research      on Algorand TestNet        │
│                                         ───────────────            │
│                                         Machine-to-machine         │
│                                         commerce                    │
│                                                                     │
│   🔬 RESEARCH AGENT  📦 PRODUCT        📱 MOBILE FIRST             │
│   ─────────────      ─────────────      ───────────────            │
│   Pays 3 services    Every product     Pera Wallet integration     │
│   in sequence        gets a unique     React SPA with real-time    │
│   (market→news→      verification      QR scanning                 │
│    report)           passport                                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Insight**: Instead of forcing users into expensive subscriptions, VeriPass lets AI agents auto-pay micro-amounts per action — just like how Claude Code agents auto-buy tools when needed.

---

## 🚀 Why x402? (Value in This Project)

The x402 protocol (HTTP 402 Payment Required) is **not forced** — it's the natural fit:

<table>
<tr>
<td width="50%">

### ❌ Without x402

- Users must buy credit packs (minimum ₹50)
- AI agents can't autonomously pay for services
- No machine-to-machine commerce
- Expensive payment gateway infrastructure

</td>
<td width="50%">

### ✅ With x402

- **Pay-per-use**: 0.002 ALGO (~₹0.14) per scan
- **Agent autonomy**: Auto-pay without human intervention
- **Machine-to-machine**: Agent A pays Agent B instantly
- **No middlemen**: Direct Algorand transactions

</td>
</tr>
</table>

### 🔄 Real Example Flow

```
📱 User scans QR → 🤖 Agent auto-pays 0.002 ALGO → 📦 Gets full supply-chain passport
🗣️ User asks AI "compare these products" → 🤖 Agent pays 0.005 ALGO → 📊 Gets comparison
🔬 Research agent runs → 💰 market-data (0.003) → 📰 news (0.003) → 📄 report (0.003)
```

Every payment is a real Algorand TestNet transaction, viewable on [Lora Explorer](https://lora.algokit.io/testnet/account/NYRK2742GDQ7KIRNGWCHKVUKVUZTFDXVKWXT3N5HTAV6IMWWDSPNT7ZOPM).

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         🛂 VeriPass System                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐     ┌──────────────┐     ┌──────────────────┐        │
│  │ 📱 Mobile │────▶│ ⚛️ React SPA  │────▶│ 🔥 Hono Backend  │        │
│  │  Browser  │◀────│  (Vite + TS) │◀────│   (Node.js)      │        │
│  │  + Pera   │     └──────────────┘     └────────┬─────────┘        │
│  │  Wallet   │                                   │                  │
│  └──────────┘     ┌──────────────────────────────┼────────┐        │
│                    │                              │        │        │
│                    ▼                              ▼        ▼        │
│             ┌────────────┐  ┌──────────┐  ┌─────────────┐          │
│             │ 🗃️ SQLite  │  │ 🤖 Gemini│  │ 💰 x402     │          │
│             │  DB        │  │  AI      │  │  Payment    │          │
│             │  (users,   │  │ (7 agents│  │  (Algo      │          │
│             │  products, │  │  + tools)│  │  TestNet)   │          │
│             │  payments) │  └──────────┘  └──────┬──────┘          │
│             └────────────┘                       │                  │
│                    ┌──────────────────────────────┘                 │
│                    ▼                                                │
│             ┌──────────────┐                                        │
│             │ ⛓️ Algorand  │                                        │
│             │   TestNet    │                                        │
│             │   (Lora)     │                                        │
│             └──────────────┘                                        │
└─────────────────────────────────────────────────────────────────────┘
```

### 🛠️ Tech Stack

| Layer | Technology | Badge |
|---|---|---|
| 🎨 Frontend | React 19, Vite, TypeScript, Tailwind CSS | `react` `vite` `tailwind` |
| 🔗 Wallet | Pera WalletConnect | `pera` |
| 🔥 Backend | Hono (Node.js), SQLite (node:sqlite) | `hono` `sqlite` |
| 🤖 AI | Google Gemini (gemini-3.6-flash) — 7 agents | `gemini` |
| 💰 Payments | x402 protocol, Algorand TestNet (algosdk v3) | `x402` `algorand` |
| 🏦 Facilitator | GoPlausible x402 facilitator | `goplausible` |
| ☁️ Hosting | Render (free tier) | `render` |

### 📦 Key Dependencies

```json
{
  "@x402/hono": "^2.19.0",
  "@x402/avm": "^2.19.0",
  "@x402/core": "^2.19.0",
  "@x402-avm/extensions": "^2.6.1",
  "algosdk": "^3.6.0",
  "@google/genai": "^2.18.0",
  "@perawallet/connect": "^1.6.0",
  "hono": "^4.13.2"
}
```

---

## 📱 QR Code Categories

VeriPass supports product verification across multiple industries:

| Category | Example Products | Use Case | Icon |
|---|---|---|---|
| 💊 **Pharmaceuticals** | Medicines, vaccines, supplements | Verify authenticity before consumption | 💊 |
| 📱 **Electronics** | Sensors, chips, devices | Prevent counterfeit components | 📱 |
| 🍵 **Food & Beverage** | Tea, spices, organic produce | Track farm-to-shelf journey | 🍵 |
| 👗 **Fashion** | Luxury goods, branded apparel | Authenticate premium products | 👗 |
| ⚙️ **Industrial** | Machine parts, safety equipment | Ensure compliance and quality | ⚙️ |

---

## 🤖 AI Agentic System

VeriPass features **7 specialist AI agents** that work together via x402 micropayments:

<table>
<tr>
<td>

| Agent | Function | Price |
|---|---|---|
| 📦 **Inventory** | Lists bookmarked products with verdicts | 0.003 ALGO |
| 🛂 **Passport** | Full chain-of-custody for one product | 0.003 ALGO |
| 📈 **Market** | Market price lookup (INR) | 0.004 ALGO |
| 📊 **Usage** | Usage stats and wallet balance | 0.003 ALGO |
| ✅ **Proof** | Dashboard stats: payments & signatures | 0.004 ALGO |
| 🔍 **Search** | Full catalogue search | 0.005 ALGO |
| ⚖️ **Compare** | Side-by-side product comparison | 0.005 ALGO |

</td>
<td align="center">

<img src="https://raw.githubusercontent.com/ADITYA02NM/VeriPass/main/assets/ai-agents.svg" alt="AI Agents" width="200" />

</td>
</tr>
</table>

### 🔬 Research Agent (Agentic Payments Demo)

Demonstrates **machine-to-machine payments** by paying 3 services in sequence:

```
🔬 Research Query → 📈 market-data (0.003 ALGO) → 📰 news-summary (0.003 ALGO) → 📄 report-generate (0.003 ALGO)
```

Each payment is checked against a **spend-policy guard** (max 3 calls per run) before execution.

**🌐 Live demo**: [veripass-t3ef.onrender.com/agent](https://veripass-t3ef.onrender.com/agent)

---

## 🔗 Transaction Links (Algorand TestNet)

All payments are real Algorand TestNet transactions:

| Transaction Type | Amount | Explorer |
|---|---|---|
| 📦 Product Verification | 0.002 ALGO | [View Account](https://lora.algokit.io/testnet/account/NYRK2742GDQ7KIRNGWCHKVUKVUZTFDXVKWXT3N5HTAV6IMWWDSPNT7ZOPM) |
| 🤖 AI Agent Query | 0.003–0.005 ALGO | [View Account](https://lora.algokit.io/testnet/account/NYRK2742GDQ7KIRNGWCHKVUKVUZTFDXVKWXT3N5HTAV6IMWWDSPNT7ZOPM) |
| 🔬 Research Agent Run | 0.009 ALGO total | [View Account](https://lora.algokit.io/testnet/account/NYRK2742GDQ7KIRNGWCHKVUKVUZTFDXVKWXT3N5HTAV6IMWWDSPNT7ZOPM) |
| 📋 History Lookup | 0.001 ALGO | [View Account](https://lora.algokit.io/testnet/account/NYRK2742GDQ7KIRNGWCHKVUKVUZTFDXVKWXT3N5HTAV6IMWWDSPNT7ZOPM) |

> 💡 All transactions are direct wallet-to-wallet ALGO transfers. Each user has a unique TestNet wallet.

---

## 🌍 Societal Benefit

<table>
<tr>
<td width="33%">

### 👥 For Consumers

- 🔍 **Verify before you buy**
- 🛡️ **Protect against counterfeits**
- 💰 **Transparent pricing**

</td>
<td width="33%">

### 🏢 For Businesses

- 💸 **Low-cost verification** (~₹0.14/scan)
- 🤖 **AI-powered insights**
- 📦 **Supply-chain visibility**

</td>
<td width="33%">

### 🇮🇳 For India

- 🏠 **Made in India**
- 🚫 **Anti-counterfeit**
- 💻 **Digital India**

</td>
</tr>
</table>

---

## 🇮🇳 Why Made in India?

| Aspect | Description |
|---|---|
| 🎯 **Problem** | Counterfeit products disproportionately affect Indian consumers |
| 🛠️ **Solution** | Built by students at Bangalore Institute of Engineering |
| 📈 **Impact** | Scalable to Indian supply chains (pharma, food, electronics) |
| 💰 **Cost** | Micro-payments in ALGO make verification accessible to all |

---

## 🚀 Getting Started

### ⚡ Quick Start (Demo)

1. 🌐 Visit [veripass-t3ef.onrender.com](https://veripass-t3ef.onrender.com)
2. 🔐 Login: `user` / `user` or connect via **Pera Wallet**
3. 📱 Scan a product QR code or enter manually (e.g., `AS-SENSOR-2026-001`)
4. 📦 View supply-chain passport and verification verdict
5. 🤖 Try the AI assistant for product queries

### 💻 Local Development

```bash
# 📥 Clone the repo
git clone https://github.com/ADITYA02NM/VeriPass.git
cd VeriPass

# 🔧 Backend setup
cd backend
npm install
cp .env.example .env  # Add your GEMINI_API_KEY
npm run dev

# 🎨 Frontend setup (new terminal)
cd veripass
npm install
npm run dev

# 🌐 Open http://localhost:3000
```

### 🔐 Environment Variables

```env
# Backend
PORT=8080
GEMINI_API_KEY=your-gemini-key
VERIPASS_SECRET=your-hmac-secret
```

> 💡 Wallet addresses and payment config are in `backend/data/wallets.json` (gitignored).

### 🧪 TestNet Accounts

| Account | Address | Role |
|---|---|---|
| 🏦 **Platform Receiver** | `NYRK2742GDQ...SPNT7ZOPM` | Merchant |
| 👤 **User** | `QSOFH5G2PS...T5Y4QWEI746B7E` | Buyer/Scanner |
| 🏭 **Producer** | `EKLDBPKGIN...4X3QWGFQCYJ5V4` | Producer |
| 🚚 **Logistics** | `RCZT2Z3WKA...HCXW4ZQP54ZE` | Logistics |
| 🏪 **Retailer** | `HFHJPLT3QW...2ACYOKRO4KCU` | Retailer |

> 💡 Fund wallets via the [Lora TestNet Faucet](https://lora.algokit.io/testnet/fund)

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

## 🎬 Demo

### 📋 Judge Demo Page

**[veripass-t3ef.onrender.com/demo](https://veripass-t3ef.onrender.com/demo)**

A guided walkthrough showing:

1. 📱 Product scanning and verification
2. 🛂 Supply-chain passport display
3. 🤖 AI agent queries with x402 payments
4. 🔬 Research agent running 3 sequential payments
5. 💰 Payment history on Algorand TestNet

### 🌐 Agent Network Monitor

**[veripass-t3ef.onrender.com/agent](https://veripass-t3ef.onrender.com/agent)**

Live visualization of:

- 🔬 Research agent paying 3 services in sequence
- 🛡️ Spend-policy guard enforcing budget limits
- 📊 Real-time transaction logging

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

## 📄 License

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

MIT License — Built for the x402 Pre-Hack on Algorand

---

<img src="https://raw.githubusercontent.com/ADITYA02NM/VeriPass/main/assets/passport-footer.svg" alt="VeriPass" width="80" />

**Made with ❤️ by Cyber Assassins**

*VeriPass — Every product has a story. Verify it.* 🛂

[📺 Watch Demo](https://www.youtube.com/shorts/pzOABdKjVbA) · [🌐 Live App](https://veripass-t3ef.onrender.com) · [💻 GitHub](https://github.com/ADITYA02NM/VeriPass)

</div>
