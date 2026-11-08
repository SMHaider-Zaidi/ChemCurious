import { safeIsoDate } from "@/lib/api-utils";
// Admin API: Chapter detail CRUD
// Path: /api/admin/quizzes/chapters/[id]
import { NextResponse } from "next/server";
import { withAdminTx } from "@/lib/admin/withAdminTx";
import { Chapter, Question } from "@/lib/db";
import { z } from "zod";
import { validateBody } from "@/lib/api-utils";

const chapterSchema = z.object({
  classLevel: z.coerce.number().int().optional(),
  order: z.coerce.number().int().optional(),
  title: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  publishedAt: z.string().nullable().optional(),
});

async function handleGet(req: Request, user: any, context: any) {
  const params = await context?.params;
  const id = Number(params?.id);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const chapter = await Chapter.findByPk(id);
  if (!chapter) return NextResponse.json({ error: "Chapter not found" }, { status: 404 });

  const totalQuestions = await Question.count({ where: { chapterId: id } });
  const publishedQuestions = await Question.count({
    where: { chapterId: id, status: "published" },
  });

  return NextResponse.json({
    id: chapter.id,
    classLevel: chapter.class,
    order: chapter.chapterNumber,
    title: chapter.chapterTitle,
    status: chapter.status,
    publishedAt: safeIsoDate(chapter.publishedAt, null),
    questionCount: totalQuestions,
    publishedQuestionCount: publishedQuestions,
    createdAt: safeIsoDate(chapter.createdAt, new Date().toISOString())!,
    updatedAt: safeIsoDate(chapter.updatedAt, new Date().toISOString())!,
  });
}

async function handlePut(req: Request, user: any, context: any) {
  const params = await context?.params;
  const id = Number(params?.id);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data, response } = await validateBody(req, chapterSchema.partial());
  if (response) return response;

  const chapter = await Chapter.findByPk(id);
  if (!chapter) return NextResponse.json({ error: "Chapter not found" }, { status: 404 });

  const updateFields: any = {};
  if (data?.classLevel !== undefined) updateFields.class = data.classLevel;
  if (data?.order !== undefined) updateFields.chapterNumber = data.order;
  if (data?.title !== undefined) updateFields.chapterTitle = data.title.trim();
  if (data?.status !== undefined) {
    updateFields.status = data.status;
    if (data.status === "published" && !chapter.publishedAt) {
      updateFields.publishedAt = new Date();
    }
  }

  await chapter.update(updateFields);

  const totalQuestions = await Question.count({ where: { chapterId: id } });
  const publishedQuestions = await Question.count({
    where: { chapterId: id, status: "published" },
  });

  return NextResponse.json({
    id: chapter.id,
    classLevel: chapter.class,
    order: chapter.chapterNumber,
    title: chapter.chapterTitle,
    status: chapter.status,
    publishedAt: safeIsoDate(chapter.publishedAt, null),
    questionCount: totalQuestions,
    publishedQuestionCount: publishedQuestions,
    createdAt: safeIsoDate(chapter.createdAt, new Date().toISOString())!,
    updatedAt: safeIsoDate(chapter.updatedAt, new Date().toISOString())!,
  });
}

async function handleDelete(req: Request, user: any, context: any) {
  const params = await context?.params;
  const id = Number(params?.id);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Delete associated questions first
  await Question.destroy({ where: { chapterId: id } });
  const deleted = await Chapter.destroy({ where: { id } });

  return NextResponse.json({ deleted: Boolean(deleted) });
}

export const GET = withAdminTx(handleGet, { action: "CHAPTER_GET" });
export const PUT = withAdminTx(handlePut, { action: "CHAPTER_UPDATE" });
export const DELETE = withAdminTx(handleDelete, { action: "CHAPTER_DELETE", description: "Admin delete chapter" });
