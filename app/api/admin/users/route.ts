import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/admin-guard";
import { User, QuizAttempt, AuditLog, isStudentRankVisible, setSystemSetting, sequelize } from "@/lib/db";
import { parsePagination } from "@/lib/api-utils";
import { Op } from "sequelize";
import type { AdminUser, Paginated, CurrentUser } from "@/lib/admin/types";

// GET /api/admin/users?q=&role=&status=&page=&pageSize=&action= (Admin only)
async function handleGet(req: Request) {
  const url = new URL(req.url);
  const searchParams = url.searchParams;

  // Support lightweight settings read: ?action=settings
  if (searchParams.get("action") === "settings") {
    const showStudentRank = await isStudentRankVisible();
    return NextResponse.json({ showStudentRank });
  }

  const { page, pageSize, offset, limit } = parsePagination(searchParams);

  const q = searchParams.get("q")?.trim();
  const role = searchParams.get("role")?.trim();
  const status = searchParams.get("status")?.trim();

  const where: any = {};

  if (q) {
    where[Op.or] = [
      { name: { [Op.like]: `%${q}%` } },
      { email: { [Op.like]: `%${q}%` } },
      { institution: { [Op.like]: `%${q}%` } },
    ];
  }

  if (role && ["student", "staff", "admin"].includes(role)) {
    where.role = role;
  }

  if (status && ["active", "suspended"].includes(status)) {
    where.status = status;
  }

  const { count, rows: users } = await User.findAndCountAll({
    where,
    attributes: ["id", "name", "email", "institution", "role", "status", "createdAt", "lastLoginAt"],
    offset,
    limit,
    order: [["id", "DESC"]],
    raw: true,
  });

  const userIds = users.map((u) => u.id);

  // Fetch attempt counts per user
  const attempts = userIds.length > 0
    ? await QuizAttempt.findAll({
        where: { userId: { [Op.in]: userIds } },
        attributes: ["userId", [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
        group: ["userId"],
        raw: true,
      })
    : [];

  const attemptCountMap = new Map<number, number>();
  attempts.forEach((a: any) => {
    attemptCountMap.set(Number(a.userId), Number(a.count || 0));
  });

  const data: AdminUser[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    institution: u.institution,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
    lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt).toISOString() : null,
    attemptCount: attemptCountMap.get(u.id) || 0,
  }));

  const showStudentRank = await isStudentRankVisible();

  const response: Paginated<AdminUser> & { settings: { showStudentRank: boolean } } = {
    data,
    page,
    pageSize,
    total: count,
    settings: {
      showStudentRank,
    },
  };

  return NextResponse.json(response);
}

// PATCH /api/admin/users - Updates system settings (e.g. showStudentRank)
async function handlePatch(req: Request, user: CurrentUser) {
  try {
    const body = await req.json();
    let newSettingValue: boolean | undefined;

    if (body.settings && typeof body.settings.showStudentRank === "boolean") {
      newSettingValue = body.settings.showStudentRank;
    } else if (typeof body.showStudentRank === "boolean") {
      newSettingValue = body.showStudentRank;
    }

    if (newSettingValue === undefined) {
      return NextResponse.json(
        { error: "Missing showStudentRank boolean value in settings" },
        { status: 400 }
      );
    }

    const previousValue = await isStudentRankVisible();
    await setSystemSetting("show_student_rank", newSettingValue ? "true" : "false");

    // Audit log
    try {
      await AuditLog.create({
        userId: user.id,
        userEmail: user.email,
        action: "update_settings",
        entityType: "system_settings",
        entityId: "show_student_rank",
        beforeState: { showStudentRank: previousValue },
        afterState: { showStudentRank: newSettingValue },
        ipAddress: req.headers.get("x-forwarded-for") || null,
      });
    } catch (auditErr) {
      console.warn("Failed to create audit log for setting change:", auditErr);
    }

    return NextResponse.json({
      success: true,
      settings: {
        showStudentRank: newSettingValue,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to update settings", details: err.message },
      { status: 500 }
    );
  }
}

export const GET = withAdmin(handleGet, { roles: ["admin"] });
export const PATCH = withAdmin(handlePatch, { roles: ["admin"] });

