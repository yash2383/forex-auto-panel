import * as crypto from 'crypto';

const JWT_SECRET =
  process.env.JWT_SECRET || 'default-super-secret-key-1234567890-tradebot';

function base64url(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input;
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64urlDecode(str: string): string {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) {
    s += '=';
  }
  return Buffer.from(s, 'base64').toString();
}

/**
 * Hash a password using pbkdf2 with salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify password against salt:hash string
 */
export function verifyPassword(
  password: string,
  storedPassword: string,
): boolean {
  if (!storedPassword || !storedPassword.includes(':')) return false;
  const [salt, hash] = storedPassword.split(':');
  const verifyHash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  return hash === verifyHash;
}

/**
 * Sign a JWT token using HS256 algorithm natively
 */
export function signJwt(
  payload: Record<string, any>,
  expiresInSeconds = 86400,
): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload = { ...payload, exp };

  const tokenParts = [
    base64url(JSON.stringify(header)),
    base64url(JSON.stringify(fullPayload)),
  ];

  const signatureInput = tokenParts.join('.');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(signatureInput)
    .digest();

  tokenParts.push(base64url(signature));
  return tokenParts.join('.');
}

/**
 * Verify a JWT token natively
 */
export function verifyJwt(token: string): Record<string, any> | null {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const signatureInput = `${headerB64}.${payloadB64}`;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(signatureInput)
      .digest();
    const expectedSignatureB64 = base64url(expectedSignature);

    if (signatureB64 !== expectedSignatureB64) {
      return null;
    }

    const payload = JSON.parse(base64urlDecode(payloadB64));
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}
