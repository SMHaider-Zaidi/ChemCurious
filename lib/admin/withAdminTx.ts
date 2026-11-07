// Shared wrapper for admin routes that need a DB transaction and audit logging.
import { withAdmin } from "@/lib/admin-guard";
import type { AdminHandler } from "@/lib/admin-guard";
import type { Role } from "@/lib/admin/types";
import { sequelize } from "@/lib/db";
import { logAudit } from "@/lib/admin/audit";

/**
 * Higher‑order function that wraps a handler with admin guard, a transaction,
 * and an audit log. The handler receives the transaction as part of the context.
 */
export function withAdminTx<TContext = any>(
  handler: AdminHandler<TContext & { tx: any }>,
  options: { action: string; description?: string; roles?: Role[] } = { action: "UNKNOWN" }
) {
  return withAdmin(
    async (req, user, ctx) => {
      const tx = await sequelize.transaction();
      try {
        const result = await handler(req, user, { ...(ctx as any), tx });
        await tx.commit();
        // Log success audit
        await logAudit({
          action: options.action,
          actor: { id: user.id, email: user.email, role: user.role },
          outcome: "SUCCESS",
          metadata: { description: options.description },
        });
        return result;
      } catch (err: any) {
        await tx.rollback();
        // Log failure audit
        await logAudit({
          action: options.action,
          actor: { id: user.id, email: user.email, role: user.role },
          outcome: "FAILURE",
          failureReason: err.message,
          metadata: { description: options.description },
        });
        throw err; // let withAdmin handle response
      }
    },
    { roles: options.roles }
  );
}
