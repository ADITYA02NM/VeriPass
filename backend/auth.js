/**
 * VeriPass — shared authentication (HMAC-signed tokens)
 * Single source of truth for signToken, verifyToken, auth, ownerKey.
 * Used by server.js, ai.js, and agents.js.
 */
import { createHash, createHmac, randomBytes, scryptSync } from 'node:crypto';

const SECRET = (() => {
  const s = process.env.VERIPASS_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('VERIPASS_SECRET environment variable is required in production');
    }
    console.warn('[auth] ⚠️  VERIPASS_SECRET not set — using demo fallback. Set VERIPASS_SECRET for production.');
    return 'veripass-demo-secret-2026';
  }
  return s;
})();

// ---- Token signing & verification ----

export function signToken(identifier, role) {
  const body = Buffer.from(JSON.stringify({ identifier, role, exp: Date.now() + 24 * 3600e3 }))
    .toString('base64url');
  const sig = createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyToken(token) {
  if (!token) return null;
  const [body, sig] = String(token).split('.');
  if (!body || !sig) return null;
  const expected = createHmac('sha256', SECRET).update(body).digest();
  const got = Buffer.from(sig, 'base64url');
  if (expected.length !== got.length || !createHash('sha256').update(expected).digest().equals(createHash('sha256').update(got).digest())) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function auth(c) {
  const token = (c.req.header('authorization') || '').replace(/^Bearer\s+/i, '');
  return verifyToken(token);
}

export function ownerKey(c) {
  const u = auth(c);
  return (u && u.identifier) || c.req.header('x-user-id') || 'anon';
}

// ---- Password hashing (Node crypto, no npm deps) ----

const SALT_LEN = 32;
const HASH_LEN = 64;

export function hashPasskey(passkey) {
  const salt = randomBytes(SALT_LEN).toString('hex');
  const hash = scryptSync(String(passkey), salt, HASH_LEN).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPasskey(passkey, stored) {
  if (!stored || !passkey) return false;
  // Plaintext fallback for demo users seeded before hashing was introduced
  if (!stored.includes(':')) return String(passkey) === stored;
  const [salt, hash] = stored.split(':');
  const derived = scryptSync(String(passkey), salt, HASH_LEN).toString('hex');
  // Timing-safe comparison
  const a = Buffer.from(derived, 'hex');
  const b = Buffer.from(hash, 'hex');
  if (a.length !== b.length) return false;
  return createHash('sha256').update(a).digest().equals(createHash('sha256').update(b).digest());
}
