import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, STUDENT_SESSION_COOKIE, LEGACY_SESSION_COOKIE } from "@/lib/auth";
import { QuizAttempt, QuizAttemptAnswer, User, ensureDbSynced } from "@/lib/db";

// POST /api/quizzes/submit
export async function POST(req: Request) {
  try {
    await ensureDbSynced();
    const cookieStore = await cookies();
    const token = cookieStore.get(STUDENT_SESSION_COOKIE)?.value || cookieStore.get(LEGACY_SESSION_COOKIE)?.value;
    const session = token ? verifyToken(token) : null;
    if (!session?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const user = await User.findByPk(session.id, { attributes: ["id", "role"] });
    if (!user || user.role !== "student") return NextResponse.json({ error: "Only students may submit quiz attempts" }, { status: 403 });

    const body = await req.json();
    const { quizId, chapterName, score, totalQuestions, chapterId, answers } = body;
    if (!quizId || !chapterName || !Number.isInteger(score) || !Number.isInteger(totalQuestions) || totalQuestions <= 0) {
      return NextResponse.json({ error: "Invalid quiz submission" }, { status: 400 });
    }
    const percentage = Math.round(((score / totalQuestions) * 100) * 100) / 100;

    const attempt = await QuizAttempt.create({
      userId: Number(session.id),
      quizId: Number(quizId),
      chapterId: Number(chapterId || quizId) || null,
      chapterName: String(chapterName),
      score,
      totalQuestions,
      percentage,
    });

    if (Array.isArray(answers) && answers.length > 0) {
      const answerRows = answers
        .filter((a: any) => a && a.questionId && !isNaN(Number(a.questionId)))
        .map((a: any) => ({
          attemptId: attempt.id,
          questionId: Number(a.questionId),
          selectedOption: (["A", "B", "C", "D"].includes(a.selectedOption) ? a.selectedOption : null) as any,
          isCorrect: Boolean(a.isCorrect),
        }));

      if (answerRows.length > 0) {
        try {
          await QuizAttemptAnswer.bulkCreate(answerRows);
        } catch (err) {
          console.error("Failed to save detailed quiz attempt answers:", err);
        }
      }
    }

    return NextResponse.json({ success: true, attemptId: attempt.id });
  } catch {
    return NextResponse.json({ error: "Failed to submit quiz" }, { status: 500 });
  }
}
