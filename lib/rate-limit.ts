interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory rate limiter cache (per-instance)
const rateLimitMap = new Map<string, RateLimitRecord>();

export interface RateLimitOptions {
  windowMs?: number; // Time window in milliseconds (default 15 minutes)
  max?: number; // Max requests allowed per window (default 10)
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * In-memory rate limiter per key (e.g. IP + email or IP + endpoint).
 * Note: Memory state is per-instance and resets on server restart.
 */
export function checkRateLimit(key: string, options: RateLimitOptions = {}): RateLimitResult {
  const windowMs = options.windowMs ?? 15 * 60 * 1000;
  const max = options.max ?? 10;
  const now = Date.now();

  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimitMap.set(key, newRecord);
    return {
      success: true,
      limit: max,
      remaining: max - 1,
      resetAt: newRecord.resetAt,
    };
  }

  if (record.count >= max) {
    return {
      success: false,
      limit: max,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }

  record.count += 1;
  return {
    success: true,
    limit: max,
    remaining: max - record.count,
    resetAt: record.resetAt,
  };
}

/**
 * Resets rate limit for a specific key (e.g. upon successful authentication).
 */
export function resetRateLimit(key: string): void {
  rateLimitMap.delete(key);
}
