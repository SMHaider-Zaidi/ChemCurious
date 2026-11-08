import { Transaction } from "sequelize";
import { AuditLog } from "./db";

const SENSITIVE_KEYS = new Set([
  "password",
  "password_hash",
  "passwordhash",
  "token",
  "reset_token",
  "resettoken",
  "reset_token_expiry",
  "resettokenexpiry",
  "secret",
]);

/**
 * Recursively deep-strips sensitive credential fields from audit state objects.
 */
export function sanitizeAuditState(val: any): any {
  if (val === null || val === undefined) return null;
  if (typeof val !== "object") return val;

  if (Array.isArray(val)) {
    return val.map(sanitizeAuditState);
  }

  const sanitized: Record<string, any> = {};
  for (const [key, v] of Object.entries(val)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = sanitizeAuditState(v);
    }
  }
  return sanitized;
}

export interface LogAuditParams {
  userId?: number | null;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string | number;
  beforeState?: any;
  afterState?: any;
  ipAddress?: string | null;
  transaction?: Transaction;
}

/**
 * Appends an audit log record within the caller's Sequelize transaction.
 */
export async function logAudit({
  userId,
  userEmail,
  action,
  entityType,
  entityId,
  beforeState = null,
  afterState = null,
  ipAddress = null,
  transaction,
}: LogAuditParams): Promise<AuditLog> {
  return await AuditLog.create(
    {
      userId: userId ?? null,
      userEmail,
      action,
      entityType,
      entityId: String(entityId),
      beforeState: sanitizeAuditState(beforeState),
      afterState: sanitizeAuditState(afterState),
      ipAddress: ipAddress ?? null,
    },
    { transaction }
  );
}

/**
 * Extracts client IP from incoming Next.js Request headers.
 */
export function getClientIp(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || null;
  }
  return req.headers.get("x-real-ip") || null;
}
