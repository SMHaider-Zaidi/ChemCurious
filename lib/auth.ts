import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "chemcurious-fallback-secret-2026-very-secure-key";

/**
 * Hashes a plain-text password using Node.js pbkdf2.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verifies a plain-text password against a stored PBKDF2 hash.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split(":");
    if (parts.length !== 2) return false;
    const [salt, hash] = parts;
    const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
    return hash === verifyHash;
  } catch (e) {
    return false;
  }
}

/**
 * Signs a payload using HMAC-SHA256, returning a URL-safe stateless JWT token.
 * Defaults to 24-hour expiration.
 */
export function signToken(payload: any, expiresInSeconds: number = 86400): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const enrichedPayload = { ...payload, exp };
  const base64Payload = Buffer.from(JSON.stringify(enrichedPayload)).toString("base64url");
  
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${base64Payload}`)
    .digest("base64url");
    
  return `${header}.${base64Payload}.${signature}`;
}

/**
 * Verifies and decodes a signed JWT token. Returns payload or null if invalid/expired.
 */
export function verifyToken(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, base64Payload, signature] = parts;
    
    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${base64Payload}`)
      .digest("base64url");
      
    if (signature !== expectedSignature) {
      return null;
    }
    
    const payload = JSON.parse(Buffer.from(base64Payload, "base64url").toString("utf8"));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null; // Expired
    }
    
    return payload;
  } catch (error) {
    return null;
  }
}
