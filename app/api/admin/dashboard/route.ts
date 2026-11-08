import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/admin-guard";
import {
  Molecule,
  Reaction,
  Chapter,
  Question,
  User,
  QuizAttempt,
  AuditLog,
  sequelize,
  ensureDbSynced,
} from "@/lib/db";
import { Op } from "sequelize";
import type { DashboardStats, LeaderboardEntry, AuditLogEntry } from "@/lib/admin/types";

async function handleGet(req: Request, user: any) {
  try {
    await ensureDbSynced();

    const fetchStatusCounts = async (model: any) => {
      try {
        return (await model.findAll({
          attributes: [
            "status",
            [sequelize.fn("COUNT", sequelize.col("id")), "count"],
          ],
          group: ["status"],
          raw: true,
        })) as { status: string; count: number }[];
      } catch {
        const total = await model.count().catch(() => 0);
        return [{ status: "published", count: total }];
      }
    };

    // 1. Total & Status Counts in Parallel
    const [
      moleculeCounts,
      reactionCounts,
      chapterCounts,
      questionCounts,
      studentCount,
      quizAttemptCount,
    ] = await Promise.all([
      fetchStatusCounts(Molecule),
      fetchStatusCounts(Reaction),
      fetchStatusCounts(Chapter),
      fetchStatusCounts(Question),
      User.count({ where: { role: "student" } }).catch(() => User.count()),
      QuizAttempt.count().catch(() => 0),
    ]);

    const formatContent = (rows: { status: string; count: number }[]) => {
      const result = { published: 0, draft: 0, archived: 0 };
      rows.forEach((r) => {
        const key = r.status as "published" | "draft" | "archived";
        if (result[key] !== undefined) {
          result[key] = Number(r.count);
        }
      });
      return result;
    };

    const moleculeStats = formatContent(moleculeCounts);
    const reactionStats = formatContent(reactionCounts);
    const chapterStats = formatContent(chapterCounts);
    const questionStats = formatContent(questionCounts);

    const counts = {
      molecules: moleculeStats.published + moleculeStats.draft + moleculeStats.archived,
      reactions: reactionStats.published + reactionStats.draft + reactionStats.archived,
      chapters: chapterStats.published + chapterStats.draft + chapterStats.archived,
      questions: questionStats.published + questionStats.draft + questionStats.archived,
      students: studentCount,
      quizAttempts: quizAttemptCount,
    };

    const content = {
      chapters: chapterStats,
      questions: questionStats,
      reactions: reactionStats,
      molecules: moleculeStats,
    };

    // 2. Attempts Metrics (Last 7d & 30d)
    const now = new Date();
    const date7d = new Date(now.getTime() - 7 * 86400000);
    const date30d = new Date(now.getTime() - 30 * 86400000);

    let attempts30dRecords: any[] = [];
    try {
      attempts30dRecords = await QuizAttempt.findAll({
        where: {
          createdAt: {
            [Op.gte]: date30d,
          },
        },
        attributes: ["id", "userId", "percentage", "createdAt"],
        raw: true,
      });
    } catch {
      attempts30dRecords = [];
    }

    const attempts7d = attempts30dRecords.filter(
      (a) => new Date(a.createdAt as any) >= date7d
    );

    const avgPercentage =
      attempts30dRecords.length > 0
        ? Math.round(
            (attempts30dRecords.reduce((sum, a) => sum + Number(a.percentage || 0), 0) /
              attempts30dRecords.length) *
              10
          ) / 10
        : 0;

    const attempts = {
      last7Days: attempts7d.length,
      last30Days: attempts30dRecords.length,
      avgPercentage,
      activeStudents30d: new Set(attempts30dRecords.map((a) => a.userId)).size,
    };

    // 3. Attempts by Day (Last 30 Days)
    const dayMap = new Map<string, { count: number; totalPct: number }>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000).toISOString().split("T")[0]!;
      dayMap.set(d, { count: 0, totalPct: 0 });
    }

    attempts30dRecords.forEach((a) => {
      const day = new Date(a.createdAt as any).toISOString().split("T")[0];
      if (day && dayMap.has(day)) {
        const entry = dayMap.get(day)!;
        entry.count += 1;
        entry.totalPct += Number(a.percentage || 0);
      }
    });

    const attemptsByDay = Array.from(dayMap.entries()).map(([date, data]) => ({
      date,
      attempts: data.count,
      avgPercentage:
        data.count > 0 ? Math.round((data.totalPct / data.count) * 10) / 10 : 0,
    }));

    // 4. Top Students
    let topStudentsRaw: any[] = [];
    try {
      topStudentsRaw = await QuizAttempt.findAll({
        attributes: [
          "userId",
          [sequelize.fn("AVG", sequelize.col("percentage")), "avgPercentage"],
          [sequelize.fn("MAX", sequelize.col("percentage")), "bestPercentage"],
          [sequelize.fn("COUNT", sequelize.col("id")), "attempts"],
          [sequelize.fn("COUNT", sequelize.fn("DISTINCT", sequelize.col("chapter_id"))), "chaptersAttempted"],
          [sequelize.fn("MAX", sequelize.col("created_at")), "lastActiveAt"],
        ],
        group: ["user_id"],
        limit: 5,
        raw: true,
      });
    } catch {
      try {
        topStudentsRaw = await QuizAttempt.findAll({
          attributes: [
            "userId",
            [sequelize.fn("AVG", sequelize.col("percentage")), "avgPercentage"],
            [sequelize.fn("MAX", sequelize.col("percentage")), "bestPercentage"],
            [sequelize.fn("COUNT", sequelize.col("id")), "attempts"],
            [sequelize.fn("MAX", sequelize.col("created_at")), "lastActiveAt"],
          ],
          group: ["user_id"],
          limit: 5,
          raw: true,
        });
      } catch {
        topStudentsRaw = [];
      }
    }

    const topUserIds = topStudentsRaw.map((r: any) => r.userId).filter(Boolean);
    const topUsers = topUserIds.length > 0
      ? await User.findAll({
          where: { id: { [Op.in]: topUserIds } },
          attributes: ["id", "name", "institution"],
          raw: true,
        }).catch(() => [])
      : [];

    const userMap = new Map(topUsers.map((u) => [u.id, u]));

    const topStudents: LeaderboardEntry[] = topStudentsRaw.map((r: any, idx: number) => {
      const u = userMap.get(r.userId) || { name: `Student #${r.userId}`, institution: "ChemCurious" };
      const avg = Math.round(Number(r.avgPercentage || 0) * 10) / 10;
      const best = Math.round(Number(r.bestPercentage || 0) * 10) / 10;
      return {
        rank: idx + 1,
        userId: Number(r.userId),
        name: u.name,
        institution: u.institution,
        points: Math.round(Number(r.chaptersAttempted || 1) * best),
        avgPercentage: avg,
        bestPercentage: best,
        attempts: Number(r.attempts || 0),
        chaptersAttempted: Number(r.chaptersAttempted || 0),
        lastActiveAt: r.lastActiveAt ? new Date(r.lastActiveAt).toISOString() : null,
      };
    });

    // 5. Recent Activity from Audit Logs
    const auditWhere: any = {};
    if (user.role === "staff") {
      auditWhere.userId = user.id;
    }

    let recentLogs: any[] = [];
    try {
      recentLogs = await AuditLog.findAll({
        where: auditWhere,
        order: [["id", "DESC"]],
        limit: 10,
        raw: true,
      });
    } catch {
      recentLogs = [];
    }

    const recentActivity: AuditLogEntry[] = recentLogs.map((log: any) => ({
      id: Number(log.id),
      action: log.action,
      actor: {
        id: log.userId ? Number(log.userId) : null,
        name: log.userEmail?.split("@")[0] || "Admin",
        email: log.userEmail || "",
      },
      entityType: log.entityType,
      entityId: log.entityId,
      timestamp: log.createdAt ? new Date(log.createdAt).toISOString() : new Date().toISOString(),
      oldValue: log.beforeState || null,
      newValue: log.afterState || null,
      ipAddress: log.ipAddress || null,
    }));

    const response: DashboardStats = {
      counts,
      content,
      attempts,
      attemptsByDay,
      topStudents,
      recentActivity,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Dashboard API aggregation error:", error);
    return NextResponse.json(
      { error: "Failed to generate dashboard statistics", details: error.message },
      { status: 500 }
    );
  }
}

export const GET = withAdmin(handleGet);
