import { safeIsoDate } from "@/lib/api-utils";
import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/admin-guard";
import { User, QuizAttempt, QuizAttemptAnswer, Question, Chapter } from "@/lib/db";
import { Op } from "sequelize";

// GET /api/admin/students/:id
async function handleGet(req: Request, user: any, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await User.findByPk(Number(id));

  if (!student || student.role !== "student") {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const rawAttempts = await QuizAttempt.findAll({
    where: { userId: student.id },
    include: [{ model: Chapter, as: "chapter", attributes: ["id", "chapterTitle", "class"] }],
    order: [["createdAt", "DESC"]],
  });

  let totalScore = 0;
  let totalMaxScore = 0;
  let highestPercentage = 0;
  const chaptersAttemptedSet = new Set<number>();
  const chapterStatsMap = new Map<
    number,
    { title: string; classLevel: number; attempts: number; best: number; totalPct: number; last: string }
  >();

  const attempts = rawAttempts.map((att: any) => {
    const ch = att.chapter;
    const chId = att.chapterId || att.quizId || 0;
    const chTitle = ch?.chapterTitle || att.chapterName || (chId ? `Chapter ${chId}` : "Quiz Assessment");
    const numPercentage = Number(att.percentage || 0);

    if (chId) {
      chaptersAttemptedSet.add(chId);
      const existing = chapterStatsMap.get(chId) || {
        title: chTitle,
        classLevel: ch?.class || 9,
        attempts: 0,
        best: 0,
        totalPct: 0,
        last: safeIsoDate(att.createdAt, new Date().toISOString())!,
      };
      existing.attempts += 1;
      existing.best = Math.max(existing.best, numPercentage);
      existing.totalPct += numPercentage;
      chapterStatsMap.set(chId, existing);
    }

    totalScore += Number(att.score || 0);
    totalMaxScore += Number(att.totalQuestions || 0);
    highestPercentage = Math.max(highestPercentage, numPercentage);

    return {
      id: att.id,
      chapterId: chId,
      chapterTitle: chTitle,
      classLevel: ch?.class || null,
      score: Number(att.score || 0),
      totalQuestions: Number(att.totalQuestions || 0),
      percentage: numPercentage,
      timeSpentSeconds: att.timeSpentSeconds || null,
      completedAt: safeIsoDate(att.createdAt, new Date().toISOString())!,
      hasAnswerDetail: Boolean(att.answersDetail),
    };
  });

  const totalAttemptPctSum = attempts.reduce((sum, a) => sum + Number(a.percentage || 0), 0);
  const avgPercentage =
    attempts.length > 0
      ? Math.round((totalAttemptPctSum / attempts.length) * 10) / 10
      : 0;

  const points = Math.round(Array.from(chapterStatsMap.values()).reduce((sum, c) => sum + c.best, 0));

  const chapterPerformance = Array.from(chapterStatsMap.entries()).map(([cid, stat]) => ({
    chapterId: cid,
    title: stat.title,
    classLevel: stat.classLevel as any,
    attempts: stat.attempts,
    bestPercentage: stat.best,
    avgPercentage: stat.attempts > 0 ? Math.round((stat.totalPct / stat.attempts) * 10) / 10 : 0,
    lastAttemptAt: stat.last,
  }));

  // Activity by day (last 30 days)
  const activityMap = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().split("T")[0];
    activityMap.set(d, 0);
  }

  for (const att of attempts) {
    const dateStr = att.completedAt.split("T")[0];
    if (activityMap.has(dateStr)) {
      activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + 1);
    }
  }

  const activityByDay = Array.from(activityMap.entries()).map(([date, count]) => ({
    date,
    attempts: count,
  }));

  // Topic accuracy & weak topics calculation
  const rawAttemptIds = rawAttempts.map((a: any) => a.id);
  let topicAccuracy: { topic: string; answers: number; accuracy: number }[] = [];
  let weakTopics: { topic: string; accuracy: number; questionsAnswered: number }[] = [];

  if (rawAttemptIds.length > 0) {
    const studentAnswers = await QuizAttemptAnswer.findAll({
      where: { attemptId: { [Op.in]: rawAttemptIds } },
      include: [
        {
          model: Question,
          as: "question",
          attributes: ["id", "topic"],
        },
      ],
    });

    if (studentAnswers.length > 0) {
      const sTopicMap = new Map<string, { total: number; correct: number }>();
      studentAnswers.forEach((ans: any) => {
        const t = (ans.question?.topic || "General Chemistry").trim() || "General Chemistry";
        const cur = sTopicMap.get(t) || { total: 0, correct: 0 };
        cur.total += 1;
        if (ans.isCorrect) cur.correct += 1;
        sTopicMap.set(t, cur);
      });

      topicAccuracy = Array.from(sTopicMap.entries())
        .map(([topic, stat]) => ({
          topic,
          answers: stat.total,
          accuracy: stat.total > 0 ? Math.round((stat.correct / stat.total) * 1000) / 10 : 0,
        }))
        .sort((a, b) => b.answers - a.answers);

      weakTopics = topicAccuracy
        .filter((t) => t.accuracy < 70)
        .map((t) => ({
          topic: t.topic,
          accuracy: t.accuracy,
          questionsAnswered: t.answers,
        }))
        .sort((a, b) => a.accuracy - b.accuracy);
    } else if (chaptersAttemptedSet.size > 0) {
      const chQuestions = await Question.findAll({
        where: { chapterId: Array.from(chaptersAttemptedSet) },
        attributes: ["id", "topic", "difficulty"],
      });

      const sTopicMap = new Map<string, number>();
      chQuestions.forEach((q: any) => {
        const t = (q.topic || "General Chemistry").trim() || "General Chemistry";
        sTopicMap.set(t, (sTopicMap.get(t) || 0) + 1);
      });

      const baseScore = avgPercentage || 50;
      topicAccuracy = Array.from(sTopicMap.entries())
        .map(([topic, qCount]) => ({
          topic,
          answers: qCount * attempts.length,
          accuracy: Math.max(15, Math.min(95, Math.round(baseScore * 10) / 10)),
        }))
        .sort((a, b) => b.answers - a.answers);

      weakTopics = topicAccuracy
        .filter((t) => t.accuracy < 70)
        .map((t) => ({
          topic: t.topic,
          accuracy: t.accuracy,
          questionsAnswered: t.answers,
        }))
        .sort((a, b) => a.accuracy - b.accuracy);
    }
  }

  return NextResponse.json({
    profile: {
      id: student.id,
      name: student.name,
      email: student.email,
      institution: student.institution,
      status: student.status,
      createdAt: safeIsoDate(student.createdAt, new Date().toISOString())!,
      lastLoginAt: safeIsoDate(student.lastLoginAt, null),
    },
    totals: {
      attempts: attempts.length,
      chaptersAttempted: chaptersAttemptedSet.size,
      avgPercentage,
      bestPercentage: highestPercentage,
      points,
      lastActiveAt: attempts[0]?.completedAt || (student.lastLoginAt ? new Date(student.lastLoginAt).toISOString() : null),
    },
    attempts,
    chapterPerformance,
    topicAccuracy,
    weakTopics,
    activityByDay,
  });
}

export const GET = withAdmin(handleGet);
