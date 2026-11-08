import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, STUDENT_SESSION_COOKIE, LEGACY_SESSION_COOKIE } from "@/lib/auth";
import { Chapter, Question, QuizAttempt, QuizAttemptAnswer, User, ensureDbSynced } from "@/lib/db";
import { Op } from "sequelize";

const OPTION_KEYS = ["A", "B", "C", "D"] as const;

function normalizeOption(value: unknown): "A" | "B" | "C" | "D" | null {
  const normalized = String(value ?? "").toUpperCase();
  return (OPTION_KEYS as readonly string[]).includes(normalized)
    ? (normalized as "A" | "B" | "C" | "D")
    : null;
}

// POST /api/quizzes/submit
export async function POST(req: Request) {
  try {
    await ensureDbSynced();
    const cookieStore = await cookies();
    const token = cookieStore.get(STUDENT_SESSION_COOKIE)?.value || cookieStore.get(LEGACY_SESSION_COOKIE)?.value;
    const session = token ? verifyToken(token) : null;
    if (!session?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const user = await User.findByPk(session.id, { attributes: ["id", "role"] });
    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "Only students may submit quiz attempts" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid quiz submission" }, { status: 400 });
    }

    const chapterId = Number((body as any).chapterId ?? (body as any).quizId);
    if (!Number.isInteger(chapterId) || chapterId <= 0) {
      return NextResponse.json({ error: "Invalid quiz submission" }, { status: 400 });
    }

    const chapter = await Chapter.findByPk(chapterId, {
      attributes: ["id", "chapterTitle", "status"],
    });
    if (!chapter || chapter.status === "draft") {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const questions = await Question.findAll({
      where: { chapterId, status: { [Op.ne]: "draft" } },
      attributes: ["id", "correctOption"],
      order: [["id", "ASC"]],
    });

    if (questions.length === 0) {
      return NextResponse.json({ error: "No questions available for this quiz" }, { status: 400 });
    }

    const submittedAnswers = Array.isArray((body as any).answers) ? (body as any).answers : [];
    const selectedByQuestion = new Map<number, "A" | "B" | "C" | "D" | null>();
    for (const answer of submittedAnswers) {
      const questionId = Number(answer?.questionId);
      if (!Number.isInteger(questionId) || questionId <= 0) continue;
      selectedByQuestion.set(questionId, normalizeOption(answer?.selectedOption));
    }

    // Grade against the database answer key; never trust client-supplied scores.
    const gradedAnswers = questions.map((question) => {
      const submitted = selectedByQuestion.get(Number(question.id)) ?? null;
      const correctOption = String(question.correctOption || "A").toUpperCase();
      return {
        questionId: Number(question.id),
        selectedOption: submitted,
        isCorrect: submitted !== null && submitted === correctOption,
      };
    });

    const score = gradedAnswers.filter((answer) => answer.isCorrect).length;
    const totalQuestions = gradedAnswers.length;
    const percentage = Math.round(((score / totalQuestions) * 100) * 100) / 100;

    const attempt = await QuizAttempt.create({
      userId: Number(session.id),
      quizId: chapterId,
      chapterId,
      chapterName: String(chapter.chapterTitle),
      score,
      totalQuestions,
      percentage,
    });

    try {
      await QuizAttemptAnswer.bulkCreate(
        gradedAnswers.map((answer) => ({
          attemptId: attempt.id,
          questionId: answer.questionId,
          selectedOption: answer.selectedOption,
          isCorrect: answer.isCorrect,
        }))
      );
    } catch (err) {
      console.error("Failed to save detailed quiz attempt answers:", err);
    }

    return NextResponse.json({
      success: true,
      attemptId: attempt.id,
      score,
      totalQuestions,
      percentage,
      results: gradedAnswers,
    });
  } catch (error) {
    console.error("Quiz submission error:", error);
    return NextResponse.json({ error: "Failed to submit quiz" }, { status: 500 });
  }
}
