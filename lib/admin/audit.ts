// Simple audit logger for admin actions
import { AuditLog, ensureDbSynced } from "@/lib/db";

export type AuditOutcome = "SUCCESS" | "FAILURE";

export interface AuditLogPayload {
  action: string;
  actor: { id: string | number; email: string; role: string };
  outcome: AuditOutcome;
  failureReason?: string;
  metadata?: Record<string, any>;
}

/**
 * Persist audit log to MySQL audit_logs table.
 */
export async function logAudit(payload: AuditLogPayload): Promise<void> {
  try {
    if (process.env.NODE_ENV !== "production") {
      console.log("[AUDIT]", JSON.stringify({ timestamp: new Date().toISOString(), ...payload }));
    }

    await ensureDbSynced();

    await AuditLog.create({
      userId: typeof payload.actor?.id === "number" ? payload.actor.id : Number(payload.actor?.id) || null,
      userEmail: payload.actor?.email || "system@chemcurious.com",
      action: payload.action,
      entityType: payload.metadata?.entityType || "system",
      entityId: String(payload.metadata?.entityId || "0"),
      beforeState: payload.metadata?.beforeState || null,
      afterState:
        payload.outcome === "FAILURE"
          ? { status: "FAILED", reason: payload.failureReason }
          : payload.metadata?.afterState || payload.metadata || null,
      ipAddress: payload.metadata?.ipAddress || null,
    });
  } catch (e) {
    console.error("Failed to persist audit log:", e);
  }
}
