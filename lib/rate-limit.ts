/**
 * In-memory rate limiter for API routes.
 * Resets automatically when the counter window expires.
 */

interface RateLimitOptions {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum number of requests allowed within the window */
  max: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number; // Unix timestamp (ms)
}

// In-memory store; resets on server restart (acceptable for edge-rate-limiting)
const store = new Map<string, RateLimitEntry>();

/**
 * Check whether a key is within its rate limit.
 * Automatically creates or resets the window when expired.
 */
export function checkRateLimit(
  key: string,
  opts: RateLimitOptions
): { success: boolean; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // No entry or window expired — start a fresh window
    store.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { success: true, resetAt: now + opts.windowMs };
  }

  if (entry.count >= opts.max) {
    // Limit exceeded
    return { success: false, resetAt: entry.resetAt };
  }

  // Increment counter within current window
  entry.count++;
  return { success: true, resetAt: entry.resetAt };
}

/**
 * Reset the rate-limit counter for a key (e.g. after a successful login).
 */
export function resetRateLimit(key: string): void {
  store.delete(key);
}

