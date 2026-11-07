// Simple audit logger for admin actions
import type { CurrentUser } from "@/lib/admin/types";

export type AuditOutcome = "SUCCESS" | "FAILURE";

export interface AuditLogPayload {
  action: string;
  actor: { id: string | number; email: string; role: string };
  outcome: AuditOutcome;
  failureReason?: string;
  metadata?: Record<string, any>;
}

/**
 * Persist audit log. Replace console.log with real DB persistence as needed.
 */
export async function logAudit(payload: AuditLogPayload): Promise<void> {
  try {
    const entry = {
      timestamp: new Date().toISOString(),
      ...payload,
    };
    // Placeholder: write to console in dev, replace with DB insert.
    if (process.env.NODE_ENV !== "production") {
      console.log("[AUDIT]", JSON.stringify(entry));
    }
    // TODO: integrate with actual audit table via ORM.
  } catch (e) {
    console.error("Failed to log audit", e);
  }
}
