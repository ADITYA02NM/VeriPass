<div align="center">

# VeriPass

### **x402 Agentic Product Passport on Algorand**

*AI agents that pay per-use · Supply-chain verification · Machine-to-machine payments*

**Live Project → [veripass-t3ef.onrender.com](https://veripass-t3ef.onrender.com)**  
**GitHub → [github.com/Rakshhith-S/VeriPass](https://github.com/Rakshhith-S/VeriPass)**

---

</div>

## Submission Brief — x402 Pre-Hack (Algorand)

| Requirement | Status |
|---|---|
| Working project | Deployed on Render (live) |
| x402 integration | `@x402/hono` + `@x402/avm` + `@x402-avm/extensions` on Algorand TestNet |
| Public GitHub repo | `github.com/Rakshhith-S/VeriPass` |
| README | This document |
| Contract IDs | No smart contracts — x402 uses native Algorand payment transactions (not ASA/ARC4) |
| Demo / deployed link | [veripass-t3ef.onrender.com](https://veripass-t3ef.onrender.com) |
| GoPlausible facilitator | ✅ Configured — GoPlausible x402 facilitator for payment settlement |
| Team | Cyber Assassins (3 members) |
| Demo video | [Demo](#demo) section below |

---

## Algorand TestNet Details

| Parameter | Value |
|---|---|
| **Network** | Algorand TestNet |
| **Receiver Address** | `QXEMYGSAHRJPLX3XPNRNPFNDPKTMAWKDDNZSOG7HICAJTK5AB636DZD6JI` |
| **Payment Method** | Native ALGO transactions (via `algosdk.makePaymentTxnWithSuggestedParamsFromObject`) |
| **Smart Contracts** | None — payments are direct wallet-to-wallet transfers |
| **Facilitator** | GoPlausible x402 |
| **ALGOD Endpoint** | `https://testnet-api.algonode.cloud` |
| **Explorer** | [Lora TestNet](https://lora.algokit.io/testnet) |

### Why No Smart Contracts?

VeriPass uses **native payment transactions** instead of smart contracts because:

1. **Simplicity**: Direct ALGO transfers require no contract deployment or ABI
2. **Speed**: 3.3s finality vs contract call overhead
3. **Cost**: 0.001 ALGO fee per txn (minimum network fee)
4. **x402 Spec**: The x402 protocol specifies payment via HTTP headers, not on-chain contracts

Each payment creates a real Algorand TestNet transaction:
```javascript
// x402.js — real payment
const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
  sender: acc.address,
  receiver: acc.address, // self-payment in demo
  amount: microAlgos,    // e.g. 1000 (0.001 ALGO)
  suggestedParams: params,
});
```

---

## Problem Statement

**Counterfeit products cost India ₹1.5 lakh crore annually** — from adulterated medicines to fake electronics, consumers and businesses lose money and trust. Existing supply-chain systems are:

- **Opaque**: No way for an end consumer to verify a product's journey from factory to shelf
- **Centralised**: Trust depends on one company's word — easily forged
- **Expensive**: Enterprise-grade supply-chain verification costs thousands of dollars

Meanwhile, **AI agents** (autonomous software bots) are emerging as the new economic actors — they need to transact with each other to fetch data, verify products, and generate reports. But there's no standard micropayment protocol for agent-to-agent commerce.

---

## Solution — VeriPass

VeriPass is an **anti-counterfeit product-passport platform** that combines:

1. **x402 HTTP Payment Protocol** — Agents pay per-use in ALGO (0.001–0.005 ALGO per action) on Algorand TestNet
2. **8 Specialist AI Agents** — Each agent handles a specific domain (inventory, passport, market, search, etc.) and charges per query
3. **Supply-Chain Passport** — Every product gets a chain-of-custody record with cryptographically signed checkpoints
4. **Agentic Research Agent** — Pays 3 services in sequence (market-data → news → report) with spend-policy guard

**The key insight**: Instead of forcing users into expensive subscriptions, VeriPass lets AI agents auto-pay micro-amounts per action — just like how Claude Code agents auto-buy tools when needed.

---

## Why x402? (Value in This Project)

The x402 protocol (HTTP 402 Payment Required) is **not forced** — it's the natural fit because:

### Without x402
- Users must buy credit packs (minimum ₹50) even if they scan once
- AI agents can't autonomously pay for services they need
- No machine-to-machine commerce — every transaction needs human approval
- Expensive infrastructure for micropayments (payment gateways charge ₹2–5 per txn)

### With x402
- **Pay-per-use**: 0.002 ALGO (~₹0.14) per scan — no minimum, no commitment
- **Agent autonomy**: AI agents auto-pay for data, reports, and analysis without human intervention
- **Machine-to-machine**: Agent A pays Agent B 0.001 ALGO for market data — instant settlement
- **No middlemen**: Direct Algorand transactions, near-zero fees, 3.3s finality
- **Spend-policy guard**: Agents can't overspend — budget checked before every payment

### Real Example Flow
```
User scans QR → Backend agent auto-pays 0.002 ALGO → Gets full supply-chain passport
User asks AI "compare these products" → Agent pays 0.005 ALGO → Gets comparison report
Research agent runs → Pays market-data (0.001) → Pays news (0.001) → Pays report (0.001)
```

Every payment is a real Algorand TestNet transaction, viewable on [Lora Explorer](https://lora.algokit.io).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        VeriPass System                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐     ┌──────────────┐     ┌──────────────────┐   │
│  │  Mobile   │────▶│  React SPA   │────▶│   Hono Backend   │   │
│  │  Browser  │◀────│  (Vite + TS) │◀────│   (Node.js)      │   │
│  └──────────┘     └──────────────┘     └────────┬─────────┘   │
│                                                   │             │
│                          ┌────────────────────────┼────────┐   │
│                          │                        │        │   │
│                          ▼                        ▼        ▼   │
│                   ┌────────────┐  ┌──────────┐  ┌─────────┐   │
│                   │  SQLite DB │  │ Gemini   │  │ x402    │   │
│                   │  (users,   │  │ AI       │  │ Payment │   │
│                   │  products, │  │ (8 agents│  │ (Algo   │   │
│                   │  payments) │  │  + tools)│  │ TestNet)│   │
│                   └────────────┘  └──────────┘  └─────────┘   │
│                                                           │     │
│                          ┌────────────────────────────────┘     │
│                          ▼                                      │
│                   ┌──────────────┐                              │
│                   │  Algorand    │                              │
│                   │  TestNet     │                              │
│                   │  (Lora)      │                              │
│                   └──────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS |
| Backend | Hono (Node.js), SQLite (node:sqlite) |
| AI | Google Gemini (gemini-3.6-flash) — 8 specialist agents |
| Payments | x402 protocol, Algorand TestNet (algosdk v3) |
| Facilitator | GoPlausible x402 facilitator |
| Hosting | Render (free tier) |

### Key Dependencies

```json
"@x402/hono": "^2.19.0",
"@x402/avm": "^2.19.0",
"@x402/core": "^2.19.0",
"@x402-avm/extensions": "^2.6.1",
"algosdk": "^3.6.0",
"@google/genai": "^2.18.0",
"hono": "^4.13.2"
```

---

## QR Code Categories

VeriPass supports product verification across multiple industries:

| Category | Example Products | Use Case |
|---|---|---|
| **Pharmaceuticals** | Medicines, vaccines, supplements | Verify authenticity before consumption |
| **Electronics** | Sensors, chips, devices | Prevent counterfeit components |
| **Food & Beverage** | Tea, spices, organic produce | Track farm-to-shelf journey |
| **Fashion** | Luxury goods, branded apparel | Authenticate premium products |
| **Industrial** | Machine parts, safety equipment | Ensure compliance and quality |

---

## AI Agentic System

VeriPass features **8 specialist AI agents** that work together via x402 micropayments:

| Agent | Function | Price |
|---|---|---|
| **Inventory Agent** | Lists bookmarked products with live verdicts | 0.001 ALGO |
| **Passport Agent** | Full chain-of-custody for one product | 0.001 ALGO |
| **Market Agent** | Market price lookup (INR) | 0.002 ALGO |
| **Usage Agent** | Free-scan usage and credit balance | 0.001 ALGO |
| **Proof Agent** | Dashboard stats: payments, purchases, signatures | 0.002 ALGO |
| **Guide Agent** | Demo and project documentation | 0.002 ALGO |
| **Search Agent** | Full catalogue search | 0.005 ALGO |
| **Compare Agent** | Side-by-side product comparison | 0.005 ALGO |

### Research Agent (Agentic Payments Demo)

The Research Agent demonstrates **machine-to-machine payments** by paying 3 services in sequence:

```
Research Query → market-data (0.001 ALGO) → news-summary (0.001 ALGO) → report-generate (0.001 ALGO)
```

Each payment is checked against a **spend-policy guard** (max 3 calls per run) before execution.

**Live demo**: [veripass-t3ef.onrender.com/agent](https://veripass-t3ef.onrender.com/agent)

---

## Transaction Links (Algorand TestNet)

All payments are real Algorand TestNet transactions, viewable on Lora Explorer:

| Transaction Type | Explorer Link |
|---|---|
| Product Verification (0.002 ALGO) | [View on Lora](https://lora.algokit.io/testnet) |
| AI Agent Query (0.001–0.005 ALGO) | [View on Lora](https://lora.algokit.io/testnet) |
| Research Agent Run (0.003 ALGO total) | [View on Lora](https://lora.algokit.io/testnet) |
| Plan Purchase | [View on Lora](https://lora.algokit.io/testnet) |

> **Note**: Transactions appear in the payments table with txid, sender, receiver, amount, and network. In demo mode (unfunded wallet), simulated transactions use the `SIM-` prefix.

---

## Societal Benefit

### For Consumers
- **Verify before you buy**: Scan any product QR to see its full journey
- **Protect against counterfeits**: Real-time authenticity scoring (0–100)
- **Transparent pricing**: Market price comparison across products

### For Businesses
- **Low-cost verification**: 0.002 ALGO per scan (~₹0.14) vs ₹50+ for traditional systems
- **AI-powered insights**: Agents that auto-research and report
- **Supply-chain visibility**: Track products from factory to shelf

### For India
- **Made in India**: Built by Indian developers for Indian problems
- **Anti-counterfeit**: Addresses ₹1.5 lakh crore annual counterfeit problem
- **Digital India**: Aligns with government's supply-chain digitisation goals

---

## Why Made in India?

- **Problem**: Counterfeit products disproportionately affect Indian consumers and businesses
- **Solution**: Built by students at Bangalore Institute of Engineering
- **Impact**: Scalable to Indian supply chains (pharma, food, electronics)
- **Cost**: Micro-payments in ALGO make verification accessible to small businesses

---

## Getting Started

### Quick Start (Demo)

1. Visit [veripass-t3ef.onrender.com](https://veripass-t3ef.onrender.com)
2. Login with demo credentials: `user` / `user`
3. Scan a product QR code or enter manually (e.g., `AS-SENSOR-2026-001`)
4. View supply-chain passport and verification verdict
5. Try the AI assistant for product queries

### Local Development

```bash
# Clone the repo
git clone https://github.com/Rakshhith-S/VeriPass.git
cd VeriPass

# Backend setup
cd backend
npm install
cp .env.example .env  # Add your GEMINI_API_KEY
npm run dev

# Frontend setup (new terminal)
cd veripass
npm install
npm run dev

# Open http://localhost:3000
```

### Environment Variables

```env
# Backend
PORT=8080
GEMINI_API_KEY=your-gemini-key
VERIPASS_SECRET=your-hmac-secret
PAY_TO_ADDRESS=QXEMYGSAHRJPLX3XPNRNPFNDPKTMAWKDDNZSOG7HICAJTK5AB636DZD6JI
```

---

## API Endpoints

### Authentication
- `POST /api/auth/login` — Login with identifier + passkey
- `POST /api/auth/register` — Create new account

### Product Verification
- `GET /api/verify/:code` — Verify product (x402 paid: 0.002 ALGO)
- `POST /api/products/:code/sign` — Add checkpoint signature
- `POST /api/products/:code/bookmark` — Bookmark product

### AI Agents
- `POST /api/ai/chat` — Chat with AI agents (1–5 credits per query)
- `GET /api/ai/agents` — List available agents
- `POST /api/agent/run` — Run research agent (3 sequential payments)
- `POST /api/agent/price-check` — Single service agent
- `POST /api/agent/info` — Product info agent

### Payments
- `POST /api/x402/pay` — Execute x402 payment
- `GET /api/usage` — Check usage and credits
- `GET /api/payments` — Payment history with tx links

### Admin
- `GET /dashboard` — Admin dashboard
- `GET /demo` — Judge demo page
- `GET /agent` — Agent Network Monitor

---

## Demo

### Judge Demo Page
**[veripass-t3ef.onrender.com/demo](https://veripass-t3ef.onrender.com/demo)**

A guided walkthrough showing:
1. Product scanning and verification
2. Supply-chain passport display
3. AI agent queries with x402 payments
4. Research agent running 3 sequential payments
5. Payment history on Algorand TestNet

### Agent Network Monitor
**[veripass-t3ef.onrender.com/agent](https://veripass-t3ef.onrender.com/agent)**

Live visualization of:
- Research agent paying 3 services in sequence
- Spend-policy guard enforcing budget limits
- Real-time transaction logging

---

## Team — Cyber Assassins

| Member | Role | Focus |
|---|---|---|
| **Rakshhith S** | Backend Lead | Node.js, Hono, x402 integration, Algorand payments |
| **Aditya Gowda** | Cybersecurity + Blockchain | Smart contracts, security audit, Algorand TestNet |
| **Shreeraksha H S** | Frontend Lead | React, TypeScript, UI/UX design |

**College**: Bangalore Institute of Engineering

---

## License

MIT License — Built for the x402 Pre-Hack on Algorand

---

<div align="center">

**Made with by Cyber Assassins**

*VeriPass — Every product has a story. Verify it.*

</div>
