// Admin API: Question detail CRUD
// Path: /api/admin/quizzes/questions/[id]
import { withAdminTx } from "@/lib/admin/withAdminTx";
import { NextResponse } from "next/server";
import { Question, Chapter } from "@/lib/db";
import { questionInputSchema } from "@/lib/admin/schemas/question";
import { sanitizeRich } from "@/lib/admin/sanitizeRich";
import { htmlToPlainText } from "@/lib/admin/chemFormat";
import { validateBody, safeIsoDate } from "@/lib/api-utils";
import type { Question as ClientQuestion } from "@/lib/admin/types";

function mapQuestionToClient(
  q: any,
  chapter?: { title: string; class: number } | null
): ClientQuestion {
  return {
    id: q.id,
    chapterId: q.chapterId,
    classLevel: ((chapter?.class ?? 9) as any),
    chapterTitle: chapter?.title ?? `Chapter #${q.chapterId}`,
    text: q.questionText,
    textPlain: htmlToPlainText(q.questionText || ""),
    options: {
      A: q.optionA,
      B: q.optionB,
      C: q.optionC,
      D: q.optionD,
    },
    correct: q.correctOption,
    explanation: q.explanation || "",
    difficulty: q.difficulty || "easy",
    topic: q.topic || "",
    marks: q.marks ?? 1,
    status: q.status || "draft",
    questionImageUrl: q.imageUrl || null,
    createdAt: safeIsoDate(q.createdAt ?? q.created_at, new Date().toISOString())!,
    updatedAt: safeIsoDate(q.updatedAt ?? q.updated_at, null),
  };
}

// GET /api/admin/quizzes/questions/:id
async function handleGet(req: Request, user: any, ctx: any) {
  const params = await ctx?.params;
  const id = Number(params?.id);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const question = await Question.findByPk(id);
  if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  const chapter = await Chapter.findByPk(question.chapterId, {
    attributes: ["id", "chapterTitle", "class"],
  });

  return NextResponse.json(
    mapQuestionToClient(
      question,
      chapter ? { title: chapter.chapterTitle, class: chapter.class } : null
    )
  );
}

// PUT /api/admin/quizzes/questions/:id
async function handlePut(req: Request, user: any, ctx: any) {
  const params = await ctx?.params;
  const id = Number(params?.id);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data, response } = await validateBody(req, questionInputSchema);
  if (response) return response;
  if (!data) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const question = await Question.findByPk(id);
  if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  const updateFields: any = {
    updatedBy: user?.id || null,
  };

  if (data.chapterId !== undefined) updateFields.chapterId = data.chapterId;
  if (data.text !== undefined) updateFields.questionText = sanitizeRich(data.text);
  if (data.options?.A !== undefined) updateFields.optionA = sanitizeRich(data.options.A);
  if (data.options?.B !== undefined) updateFields.optionB = sanitizeRich(data.options.B);
  if (data.options?.C !== undefined) updateFields.optionC = sanitizeRich(data.options.C);
  if (data.options?.D !== undefined) updateFields.optionD = sanitizeRich(data.options.D);
  if (data.correct !== undefined) updateFields.correctOption = data.correct;
  if (data.explanation !== undefined) {
    updateFields.explanation = data.explanation ? sanitizeRich(data.explanation) : null;
  }
  if (data.difficulty !== undefined) updateFields.difficulty = data.difficulty;
  if (data.topic !== undefined) updateFields.topic = data.topic;
  if (data.marks !== undefined) updateFields.marks = data.marks;
  if (data.status !== undefined) updateFields.status = data.status;
  if (data.questionImageUrl !== undefined) updateFields.imageUrl = data.questionImageUrl;

  await question.update(updateFields);

  const chapter = await Chapter.findByPk(question.chapterId, {
    attributes: ["id", "chapterTitle", "class"],
  });

  return NextResponse.json(
    mapQuestionToClient(
      question,
      chapter ? { title: chapter.chapterTitle, class: chapter.class } : null
    )
  );
}

// DELETE /api/admin/quizzes/questions/:id
async function handleDelete(req: Request, user: any, ctx: any) {
  const params = await ctx?.params;
  const id = Number(params?.id);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const deleted = await Question.destroy({ where: { id } });
  return NextResponse.json({ deleted: Boolean(deleted) });
}

export const GET = withAdminTx(handleGet, { action: "GET_QUESTION" });
export const PUT = withAdminTx(handlePut, { action: "UPDATE_QUESTION" });
export const DELETE = withAdminTx(handleDelete, { action: "DELETE_QUESTION" });
