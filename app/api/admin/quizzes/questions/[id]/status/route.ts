import { withAdminTx } from "@/lib/admin/withAdminTx";
import { NextResponse } from "next/server";
import { Question, Chapter } from "@/lib/db";
import { z } from "zod";
import { validateBody } from "@/lib/api-utils";
import { htmlToPlainText } from "@/lib/admin/chemFormat";

// PATCH /api/admin/quizzes/questions/:id/status
const statusSchema = z.object({
  status: z.enum(["draft", "published", "archived"]),
});

async function handlePatch(req: Request, user: any, ctx: any) {
  const params = await ctx?.params;
  const id = Number(params?.id);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data, response } = await validateBody(req, statusSchema);
  if (response) return response;
  if (!data) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const question = await Question.findByPk(id);
  if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  await question.update({
    status: data.status,
    updatedBy: user?.id || null,
  });

  const chapter = await Chapter.findByPk(question.chapterId, {
    attributes: ["id", "chapterTitle", "class"],
  });

  return NextResponse.json({
    id: question.id,
    chapterId: question.chapterId,
    classLevel: chapter?.class ?? 9,
    chapterTitle: chapter?.chapterTitle ?? `Chapter #${question.chapterId}`,
    text: question.questionText,
    textPlain: htmlToPlainText(question.questionText || ""),
    options: {
      A: question.optionA,
      B: question.optionB,
      C: question.optionC,
      D: question.optionD,
    },
    correct: question.correctOption,
    explanation: question.explanation || "",
    difficulty: question.difficulty || "easy",
    topic: question.topic || "",
    marks: question.marks ?? 1,
    status: question.status,
    questionImageUrl: question.imageUrl || null,
    createdAt: question.createdAt ? new Date(question.createdAt).toISOString() : new Date().toISOString(),
  });
}

export const PATCH = withAdminTx(handlePatch, { action: "PATCH_QUESTION_STATUS" });
