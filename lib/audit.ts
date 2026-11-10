/**
 * Utility helpers for request auditing.
 * Separate from lib/admin/audit.ts (which handles structured audit-log persistence).
 */

/**
 * Extract the real client IP from the incoming request headers.
 * Handles common reverse-proxy header conventions.
 *
 * @returns The IP address string, or null when not determinable.
 */
export function getClientIp(request: Request): string | null {
  // Standard reverse-proxy header
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  // Nginx / Cloudflare real-IP header
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  // Cloudflare connecting IP
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) {
    return cfIp.trim();
  }

  return null;
}

