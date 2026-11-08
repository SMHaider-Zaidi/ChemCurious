import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/admin-guard";
import { User, QuizAttempt, Question, QuizAttemptAnswer, sequelize } from "@/lib/db";
import { Op } from "sequelize";
import type { LeaderboardResponse, LeaderboardEntry, LeaderboardMetric } from "@/lib/admin/types";

// GET /api/admin/leaderboard?metric=&classLevel=&chapterId=&period=&institution=&limit=
async function handleGet(req: Request) {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;

    const metric: LeaderboardMetric = (searchParams.get("metric") as LeaderboardMetric) || "points";
    const period = (searchParams.get("period") as "7d" | "30d" | "all") || "all";
    const rawLimit = parseInt(searchParams.get("limit") || "50", 10);
    const limit = isNaN(rawLimit) || rawLimit < 1 ? 50 : Math.min(200, rawLimit);
    const institution = searchParams.get("institution")?.trim();
    const chapterId = searchParams.get("chapterId");

    const attemptWhere: any = {};

    if (period === "7d") {
      attemptWhere.createdAt = { [Op.gte]: new Date(Date.now() - 7 * 86400000) };
    } else if (period === "30d") {
      attemptWhere.createdAt = { [Op.gte]: new Date(Date.now() - 30 * 86400000) };
    }

    if (chapterId) {
      attemptWhere.chapterId = Number(chapterId);
    }

    const attempts = await QuizAttempt.findAll({
      where: attemptWhere,
      attributes: [
        "userId",
        [sequelize.fn("AVG", sequelize.col("percentage")), "avgPercentage"],
        [sequelize.fn("MAX", sequelize.col("percentage")), "bestPercentage"],
        [sequelize.fn("COUNT", sequelize.col("id")), "attempts"],
        [sequelize.fn("COUNT", sequelize.fn("DISTINCT", sequelize.col("chapter_id"))), "chaptersAttempted"],
        [sequelize.fn("MAX", sequelize.col("created_at")), "lastActiveAt"],
      ],
      group: ["userId"],
      raw: true,
    });

    const userIds = attempts.map((a: any) => Number(a.userId));
    const userWhere: any = {
      id: { [Op.in]: userIds },
      role: "student",
    };

    if (institution) {
      userWhere.institution = institution;
    }

    const students = userIds.length > 0
      ? await User.findAll({
          where: userWhere,
          attributes: ["id", "name", "institution"],
          raw: true,
        })
      : [];

    const userMap = new Map(students.map((s) => [s.id, s]));

    let entries: LeaderboardEntry[] = attempts
      .filter((a: any) => userMap.has(Number(a.userId)))
      .map((a: any) => {
        const u = userMap.get(Number(a.userId))!;
        const avg = Math.round(Number(a.avgPercentage || 0) * 10) / 10;
        const best = Math.round(Number(a.bestPercentage || 0) * 10) / 10;
        const chaptersCount = Number(a.chaptersAttempted || 1);
        const points = Math.round(chaptersCount * best);

        return {
          rank: 1,
          userId: Number(a.userId),
          name: u.name,
          institution: u.institution,
          points,
          avgPercentage: avg,
          bestPercentage: best,
          attempts: Number(a.attempts || 0),
          chaptersAttempted: chaptersCount,
          lastActiveAt: a.lastActiveAt ? new Date(a.lastActiveAt).toISOString() : null,
        };
      });

    // Sort by metric
    entries.sort((a, b) => {
      if (metric === "average") {
        if (b.avgPercentage !== a.avgPercentage) return b.avgPercentage - a.avgPercentage;
      } else if (metric === "attempts") {
        if (b.attempts !== a.attempts) return b.attempts - a.attempts;
      } else {
        if (b.points !== a.points) return b.points - a.points;
      }
      return b.bestPercentage - a.bestPercentage;
    });

    // Assign rank
    entries = entries.slice(0, limit).map((e, idx) => ({
      ...e,
      rank: idx + 1,
    }));

    const response: LeaderboardResponse = {
      metric,
      period,
      generatedAt: new Date().toISOString(),
      data: entries,
    };

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("Leaderboard API Error:", err);
    return NextResponse.json(
      { error: "Failed to generate leaderboard", details: err.message },
      { status: 500 }
    );
  }
}

export const GET = withAdmin(handleGet);
