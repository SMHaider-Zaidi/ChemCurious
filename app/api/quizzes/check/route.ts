import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, STUDENT_SESSION_COOKIE, LEGACY_SESSION_COOKIE } from "@/lib/auth";
import { Chapter, Question, User, ensureDbSynced } from "@/lib/db";

const OPTION_KEYS = ["A", "B", "C", "D"] as const;

// POST /api/quizzes/check
// Grades a single answer on the server and returns feedback for immediate review.
export async function POST(req: Request) {
  try {
    await ensureDbSynced();
    const cookieStore = await cookies();
    const token = cookieStore.get(STUDENT_SESSION_COOKIE)?.value || cookieStore.get(LEGACY_SESSION_COOKIE)?.value;
    const session = token ? verifyToken(token) : null;
    if (!session?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const user = await User.findByPk(session.id, { attributes: ["id", "role"] });
    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "Only students may check answers" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const questionId = Number((body as any)?.questionId);
    const selectedOption = String((body as any)?.selectedOption ?? "").toUpperCase();

    if (!Number.isInteger(questionId) || questionId <= 0) {
      return NextResponse.json({ error: "Invalid question" }, { status: 400 });
    }
    if (!(OPTION_KEYS as readonly string[]).includes(selectedOption)) {
      return NextResponse.json({ error: "Invalid option" }, { status: 400 });
    }

    const question = await Question.findByPk(questionId, {
      attributes: ["id", "chapterId", "correctOption", "explanation", "status"],
    });
    if (!question || question.status === "draft") {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const chapter = await Chapter.findByPk(question.chapterId, {
      attributes: ["id", "status"],
    });
    if (!chapter || chapter.status === "draft") {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const correctOption = String(question.correctOption || "A").toUpperCase();
    const correctIndex = (OPTION_KEYS as readonly string[]).indexOf(correctOption);

    return NextResponse.json({
      isCorrect: selectedOption === correctOption,
      correctAnswer: correctIndex === -1 ? 0 : correctIndex,
      explanation: question.explanation || "",
    });
  } catch (error) {
    console.error("Quiz answer check error:", error);
    return NextResponse.json({ error: "Failed to check answer" }, { status: 500 });
  }
}
