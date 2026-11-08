import { safeIsoDate } from "@/lib/api-utils";
import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/admin-guard";
import { AuditLog, User, ensureDbSynced } from "@/lib/db";
import { parsePagination } from "@/lib/api-utils";
import { Op } from "sequelize";
import type { AuditLogEntry, Paginated } from "@/lib/admin/types";

// GET /api/admin/audit-logs (Admin only)
async function handleGet(req: Request) {
  await ensureDbSynced();

  const url = new URL(req.url);
  const searchParams = url.searchParams;
  const { page, pageSize, offset, limit } = parsePagination(searchParams);

  const entityType = searchParams.get("entityType")?.trim();
  const action = searchParams.get("action")?.trim();
  const actorId = searchParams.get("actorId")?.trim();
  const from = searchParams.get("from")?.trim();
  const to = searchParams.get("to")?.trim();
  const q = searchParams.get("q")?.trim();

  const where: any = {};

  if (entityType) where.entityType = entityType;
  if (action) where.action = action;
  if (actorId) where.userId = Number(actorId);

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt[Op.gte] = new Date(from);
    if (to) where.createdAt[Op.lte] = new Date(to);
  }

  if (q) {
    where[Op.or] = [
      { action: { [Op.like]: `%${q}%` } },
      { entityType: { [Op.like]: `%${q}%` } },
      { entityId: { [Op.like]: `%${q}%` } },
      { userEmail: { [Op.like]: `%${q}%` } },
    ];
  }

  const { count, rows: logs } = await AuditLog.findAndCountAll({
    where,
    include: [{ model: User, as: "actor", attributes: ["id", "name", "email"], required: false }],
    offset,
    limit,
    order: [["id", "DESC"]],
  });

  const data: AuditLogEntry[] = logs.map((log: any) => {
    let oldVal: any = null;
    let newVal: any = null;
    try {
      oldVal = typeof log.beforeState === "string" ? JSON.parse(log.beforeState) : log.beforeState;
    } catch {
      oldVal = log.beforeState;
    }
    try {
      newVal = typeof log.afterState === "string" ? JSON.parse(log.afterState) : log.afterState;
    } catch {
      newVal = log.afterState;
    }

    return {
      id: Number(log.id),
      action: log.action,
      actor: {
        id: log.actor?.id || log.userId || null,
        name: log.actor?.name || (log.userEmail ? log.userEmail.split("@")[0] : "System"),
        email: log.actor?.email || log.userEmail || "",
      },
      entityType: log.entityType,
      entityId: String(log.entityId),
      timestamp: safeIsoDate(log.createdAt, new Date().toISOString())!,
      oldValue: oldVal ?? null,
      newValue: newVal ?? null,
      ipAddress: log.ipAddress || null,
    };
  });

  const response: Paginated<AuditLogEntry> = {
    data,
    page,
    pageSize,
    total: count,
  };

  return NextResponse.json(response);
}

export const GET = withAdmin(handleGet, { roles: ["admin"] });
