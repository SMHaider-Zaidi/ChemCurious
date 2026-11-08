import { safeIsoDate } from "@/lib/api-utils";
import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/admin-guard";
import { User, QuizAttempt, sequelize } from "@/lib/db";
import { parsePagination } from "@/lib/api-utils";
import { Op } from "sequelize";
import type { StudentSummary, Paginated } from "@/lib/admin/types";

// GET /api/admin/students?q=&classLevel=&institution=&activeWithin=&sort=&page=&pageSize=
async function handleGet(req: Request) {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const { page, pageSize, offset, limit } = parsePagination(searchParams);

    const q = searchParams.get("q")?.trim();
    const institution = searchParams.get("institution")?.trim();
    const activeWithin = searchParams.get("activeWithin"); // 7 or 30

    const userWhere: any = { role: "student" };

    if (q) {
      userWhere[Op.or] = [
        { name: { [Op.like]: `%${q}%` } },
        { email: { [Op.like]: `%${q}%` } },
        { institution: { [Op.like]: `%${q}%` } },
      ];
    }

    if (institution) {
      userWhere.institution = institution;
    }

    if (activeWithin) {
      const days = Number(activeWithin);
      if (!isNaN(days) && days > 0) {
        const cutoff = new Date(Date.now() - days * 86400000);
        userWhere.lastLoginAt = { [Op.gte]: cutoff };
      }
    }

    const { count, rows: students } = await User.findAndCountAll({
      where: userWhere,
      attributes: ["id", "name", "email", "institution", "status", "lastLoginAt"],
      offset,
      limit,
      order: [["id", "DESC"]],
      raw: true,
    });

    const studentIds = students.map((s) => s.id);

    // Fetch QuizAttempt aggregations for these students
    const attemptAggs = studentIds.length > 0
      ? await QuizAttempt.findAll({
          where: { userId: { [Op.in]: studentIds } },
          attributes: [
            "userId",
            [sequelize.fn("COUNT", sequelize.col("id")), "attempts"],
            [sequelize.fn("COUNT", sequelize.fn("DISTINCT", sequelize.col("chapter_id"))), "chaptersAttempted"],
            [sequelize.fn("AVG", sequelize.col("percentage")), "avgPercentage"],
            [sequelize.fn("MAX", sequelize.col("percentage")), "bestPercentage"],
            [sequelize.fn("MAX", sequelize.col("created_at")), "lastAttemptAt"],
          ],
          group: ["userId"],
          raw: true,
        })
      : [];

    const aggMap = new Map<number, any>();
    attemptAggs.forEach((a: any) => {
      aggMap.set(Number(a.userId), a);
    });

    const data: StudentSummary[] = students.map((s) => {
      const agg = aggMap.get(s.id);
      const attempts = agg ? Number(agg.attempts || 0) : 0;
      const chaptersAttempted = agg ? Number(agg.chaptersAttempted || 0) : 0;
      const avgPercentage = agg ? Math.round(Number(agg.avgPercentage || 0) * 10) / 10 : 0;
      const bestPercentage = agg ? Math.round(Number(agg.bestPercentage || 0) * 10) / 10 : 0;
      const points = Math.round(chaptersAttempted * bestPercentage);
      const lastActiveAt = agg?.lastAttemptAt || s.lastLoginAt
        ? new Date(agg?.lastAttemptAt || s.lastLoginAt).toISOString()
        : null;

      return {
        id: s.id,
        name: s.name,
        email: s.email,
        institution: s.institution,
        status: s.status,
        attempts,
        chaptersAttempted,
        avgPercentage,
        bestPercentage,
        points,
        lastActiveAt,
      };
    });

    const response: Paginated<StudentSummary> = {
      data,
      page,
      pageSize,
      total: count,
    };

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("Admin Students API Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch students list", details: err.message },
      { status: 500 }
    );
  }
}

export const GET = withAdmin(handleGet);
