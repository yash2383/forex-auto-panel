import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "default-super-secret-key-1234567890-forex-auto-panel";

function base64url(str) {
  return Buffer.from(str).toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlDecode(str) {
  let s = str.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) {
    s += "=";
  }
  return Buffer.from(s, "base64").toString();
}

/**
 * Hash a password using pbkdf2 with salt
 * @param {string} password 
 * @returns {string} salt:hash format
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verify password against salt:hash string
 * @param {string} password 
 * @param {string} storedPassword 
 * @returns {boolean} True if matched
 */
export function verifyPassword(password, storedPassword) {
  if (!storedPassword || !storedPassword.includes(":")) return false;
  const [salt, hash] = storedPassword.split(":");
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === verifyHash;
}

/**
 * Sign a JWT token using HS256 algorithm natively
 * @param {object} payload 
 * @param {number} expiresInSeconds 
 * @returns {string} Signed JWT token
 */
export function signJwt(payload, expiresInSeconds = 86400) {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload = { ...payload, exp };
  
  const tokenParts = [
    base64url(JSON.stringify(header)),
    base64url(JSON.stringify(fullPayload))
  ];
  
  const signatureInput = tokenParts.join(".");
  const signature = crypto.createHmac("sha256", JWT_SECRET)
    .update(signatureInput)
    .digest();
  
  tokenParts.push(base64url(signature));
  return tokenParts.join(".");
}

/**
 * Verify a JWT token natively
 * @param {string} token 
 * @returns {object|null} Decoded payload or null
 */
export function verifyJwt(token) {
  try {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    const [headerB64, payloadB64, signatureB64] = parts;
    const signatureInput = `${headerB64}.${payloadB64}`;
    const expectedSignature = crypto.createHmac("sha256", JWT_SECRET)
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
