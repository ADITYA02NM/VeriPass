/**
 * VeriPass — API client (same-origin fetch, localStorage session)
 * Backend contract: /api/auth/login, /api/me, /api/products,
 * /api/verify/:code (x402 paid endpoint), /api/usage, /api/x402/pay,
 * /api/products/:code/sign
 */

export interface UserInfo {
  identifier: string;
  name: string;
  role: 'User' | 'Producer' | 'Logistics' | 'Retailer';
  origin: string;
}

export interface Verdict {
  status: string;
  label: string;
  color: string;
  icon: string;
  score: number;
}

export interface TimelineEntry {
  id: number;
  kind: 'production' | 'shipment' | 'receipt' | 'alert';
  label: string;
  signedBy: string | null;
  signerRole: string | null;
  timestamp: string;
  note: string | null;
  icon: string;
}

export interface X402Info {
  provider: string;
  freeLimit: number;
  used: number;
}

export interface ProductPayload {
  code: string;
  name: string;
  batchId: string;
  origin: string;
  details: string;
  icon: string;
  verdict: Verdict;
  timeline: TimelineEntry[];
  x402: X402Info;
}

export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  batchId: string;
  origin: string;
  scannedAt: string;
  icon: string;
  status: string;
  verdict: string;
  color: string;
  signedCount: number;
}

export interface UsageInfo {
  ownerKey: string;
  freeLimit: number;
  used: number;
  charged: boolean;
  priceAlgo: string;
}

export interface PayResult {
  ok: boolean;
  txId: string;
  round: number;
  amount: string;
  network: string;
  sender: string;
  receiver: string;
  xPaySignature: string;
  note: string;
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

const TOKEN_KEY = 'veripass_token';
const USER_KEY = 'veripass_user';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession(token: string, user: UserInfo) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getCachedUser(): UserInfo | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as UserInfo) : null;
  } catch {
    return null;
  }
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const cached = getCachedUser();
  if (cached) headers['x-user-id'] = cached.identifier;

  const res = await fetch(path, { ...init, headers });
  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  if (!res.ok) {
    const message =
      (body as { error?: string } | null)?.error ||
      (body as { message?: string } | null)?.message ||
      `Request failed (${res.status})`;
    throw new ApiError(res.status, message, body);
  }
  return body as T;
}

export function login(identifier: string, passkey: string) {
  return apiFetch<{ token: string; user: UserInfo }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, passkey }),
  });
}

export function loginWithWallet(walletAddress: string) {
  return apiFetch<{ token: string; user: UserInfo & { walletAddress?: string } }>('/api/auth/wallet', {
    method: 'POST',
    body: JSON.stringify({ walletAddress }),
  });
}

export function register(identifier: string, passkey: string, name?: string, origin?: string, role?: string) {
  return apiFetch<{ token: string; user: UserInfo }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ identifier, passkey, name, origin, role }),
  });
}

export function getMe() {
  return apiFetch<{ user: UserInfo }>('/api/me');
}

export function getProducts() {
  return apiFetch<{ role: string; products: InventoryItem[] }>('/api/products');
}

export function verifyProduct(code: string, xPaySignature?: string) {
  const headers: Record<string, string> = {};
  if (xPaySignature) headers['X-Pay-Signature'] = xPaySignature;
  return apiFetch<ProductPayload>(`/api/verify/${encodeURIComponent(code)}`, { headers });
}

export function getUsage() {
  return apiFetch<UsageInfo>('/api/usage');
}

export function payX402(purpose: 'verify' | 'ai' | 'agent' = 'verify') {
  return apiFetch<PayResult>('/api/x402/pay', {
    method: 'POST',
    body: JSON.stringify({ purpose }),
  });
}

export function signProduct(code: string) {
  return apiFetch<{ ok: boolean; signedBy: string; signerRole: string; product: ProductPayload }>(
    `/api/products/${encodeURIComponent(code)}/sign`,
    { method: 'POST' }
  );
}

export function bookmarkProduct(code: string) {
  return apiFetch<{ ok: boolean; bookmarked: boolean; code: string }>(
    `/api/products/${encodeURIComponent(code)}/bookmark`,
    { method: 'POST' }
  );
}

export function terminateSession() {
  return apiFetch<{ ok: boolean; reset: boolean; ownerKey: string; freeLimit: number; used: number }>(
    '/api/session/terminate',
    { method: 'POST' }
  );
}

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function aiChat(message: string, history: AiChatMessage[], xPaySignature?: string) {
  const headers: Record<string, string> = {};
  if (xPaySignature) headers['x-pay-signature'] = xPaySignature;
  return apiFetch<{ ok: boolean; reply: string; cost: number }>('/api/ai/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify({ message, history }),
  });
}

export interface PaymentRecord {
  txid: string;
  amount: string;
  network: string;
  round: number;
  sender: string;
  receiver: string;
  createdAt: string;
  loraUrl: string | null;
}

export interface SpendingInfo {
  spendLimit: number;
  totalSpent: number;
  walletAddress: string | null;
  remaining: number;
}

export function getPayments() {
  return apiFetch<{ payments: PaymentRecord[] }>('/api/payments');
}

export function getSpending() {
  return apiFetch<SpendingInfo>('/api/spending');
}

export function setSpendingLimit(limit: number) {
  return apiFetch<{ ok: boolean; spendLimit: number }>('/api/spending/limit', {
    method: 'POST',
    body: JSON.stringify({ limit }),
  });
}