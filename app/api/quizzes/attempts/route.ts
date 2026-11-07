import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, STUDENT_SESSION_COOKIE, LEGACY_SESSION_COOKIE } from "@/lib/auth";
import { QuizAttempt, User, ensureDbSynced } from "@/lib/db";
import { getStudentRank } from "@/lib/student-rank";

export async function GET() {
  try {
    await ensureDbSynced();
    const cookieStore = await cookies();
    const token = cookieStore.get(STUDENT_SESSION_COOKIE)?.value || cookieStore.get(LEGACY_SESSION_COOKIE)?.value;
    const session = token ? verifyToken(token) : null;
    if (!session?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const user = await User.findByPk(session.id, { attributes: ["id", "name", "email", "role"] });
    if (!user || user.role !== "student") return NextResponse.json({ error: "User not found or not a student" }, { status: 404 });
    const attempts = await QuizAttempt.findAll({ where: { userId: Number(session.id) }, order: [["createdAt", "DESC"]], raw: true });
    const rank = await getStudentRank(Number(session.id));
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email }, attempts, rank });
  } catch (error) {
    console.error("Quiz attempts API error:", error);
    return NextResponse.json({ error: "Failed to load quiz attempts" }, { status: 500 });
  }
}
