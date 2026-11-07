import { QuizAttempt, User, isStudentRankVisible, sequelize } from "@/lib/db";
import { Op } from "sequelize";

export interface StudentRankResult {
  enabled: boolean;
  currentRank: number | null;
  totalStudents: number;
  points: number;
  bestPercentage: number;
  attemptsCount: number;
  chaptersAttempted: number;
}

/**
 * Computes a student's leaderboard rank among all enrolled active students.
 * Conforms to the Leaderboard calculation rules:
 * - points = sum of best attempt percentages across attempted chapters
 * - rank ordered by points DESC, then bestPercentage DESC, then avgPercentage DESC
 */
export async function getStudentRank(studentId: number): Promise<StudentRankResult> {
  const visible = await isStudentRankVisible();
  if (!visible) {
    return {
      enabled: false,
      currentRank: null,
      totalStudents: 0,
      points: 0,
      bestPercentage: 0,
      attemptsCount: 0,
      chaptersAttempted: 0,
    };
  }

  try {
    // 1. Get all active student accounts
    const students = await User.findAll({
      where: { role: "student", status: "active" },
      attributes: ["id"],
      raw: true,
    });
    const totalStudents = students.length;
    const studentIds = students.map((s) => s.id);

    if (studentIds.length === 0) {
      return {
        enabled: true,
        currentRank: null,
        totalStudents: 0,
        points: 0,
        bestPercentage: 0,
        attemptsCount: 0,
        chaptersAttempted: 0,
      };
    }

    // 2. Query each student's best score per chapter
    const chapterBestAttempts = await QuizAttempt.findAll({
      where: {
        userId: { [Op.in]: studentIds },
      },
      attributes: [
        "userId",
        "chapterId",
        [sequelize.fn("MAX", sequelize.col("percentage")), "bestChapterPercentage"],
      ],
      group: ["userId", "chapterId"],
      raw: true,
    });

    // 3. Query overall metrics per student
    const studentAggregates = await QuizAttempt.findAll({
      where: {
        userId: { [Op.in]: studentIds },
      },
      attributes: [
        "userId",
        [sequelize.fn("AVG", sequelize.col("percentage")), "overallAvg"],
        [sequelize.fn("MAX", sequelize.col("percentage")), "overallBest"],
        [sequelize.fn("COUNT", sequelize.col("id")), "totalAttempts"],
      ],
      group: ["userId"],
      raw: true,
    });

    const aggMap = new Map<number, { overallAvg: number; overallBest: number; totalAttempts: number }>();
    studentAggregates.forEach((a: any) => {
      aggMap.set(Number(a.userId), {
        overallAvg: Number(a.overallAvg || 0),
        overallBest: Number(a.overallBest || 0),
        totalAttempts: Number(a.totalAttempts || 0),
      });
    });

    // Accumulate points per student (sum of best percentage across chapters)
    const pointsMap = new Map<number, { points: number; chaptersCount: number }>();
    chapterBestAttempts.forEach((row: any) => {
      const uid = Number(row.userId);
      const best = Number(row.bestChapterPercentage || 0);
      const curr = pointsMap.get(uid) || { points: 0, chaptersCount: 0 };
      curr.points += best;
      curr.chaptersCount += 1;
      pointsMap.set(uid, curr);
    });

    // Build ranked list for students who have attempted quizzes
    const rankedList: {
      userId: number;
      points: number;
      bestPercentage: number;
      avgPercentage: number;
      attemptsCount: number;
      chaptersAttempted: number;
    }[] = [];

    studentIds.forEach((uid) => {
      const p = pointsMap.get(uid);
      const agg = aggMap.get(uid);
      if (p && agg && agg.totalAttempts > 0) {
        rankedList.push({
          userId: uid,
          points: Math.round(p.points * 10) / 10,
          bestPercentage: Math.round(agg.overallBest * 10) / 10,
          avgPercentage: Math.round(agg.overallAvg * 10) / 10,
          attemptsCount: agg.totalAttempts,
          chaptersAttempted: p.chaptersCount,
        });
      }
    });

    // Sort descending by points, then bestPercentage, then avgPercentage
    rankedList.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.bestPercentage !== a.bestPercentage) return b.bestPercentage - a.bestPercentage;
      return b.avgPercentage - a.avgPercentage;
    });

    // Find current student's index
    const studentIndex = rankedList.findIndex((item) => item.userId === Number(studentId));

    if (studentIndex === -1) {
      // Student has no attempts yet
      return {
        enabled: true,
        currentRank: null,
        totalStudents,
        points: 0,
        bestPercentage: 0,
        attemptsCount: 0,
        chaptersAttempted: 0,
      };
    }

    const target = rankedList[studentIndex];
    return {
      enabled: true,
      currentRank: studentIndex + 1,
      totalStudents,
      points: target.points,
      bestPercentage: target.bestPercentage,
      attemptsCount: target.attemptsCount,
      chaptersAttempted: target.chaptersAttempted,
    };
  } catch (err) {
    console.error("Error computing student rank:", err);
    return {
      enabled: true,
      currentRank: null,
      totalStudents: 0,
      points: 0,
      bestPercentage: 0,
      attemptsCount: 0,
      chaptersAttempted: 0,
    };
  }
}
