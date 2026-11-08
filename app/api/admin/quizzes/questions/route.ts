// Admin API: Questions CRUD
// Path: /api/admin/quizzes/questions
import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/admin-guard";
import { Question, Chapter } from "@/lib/db";
import { questionInputSchema } from "@/lib/admin/schemas/question";
import { sanitizeRich } from "@/lib/admin/sanitizeRich";
import { htmlToPlainText } from "@/lib/admin/chemFormat";
import { validateBody, parsePagination, safeIsoDate } from "@/lib/api-utils";
import type { Question as ClientQuestion } from "@/lib/admin/types";
import { Op } from "sequelize";

function mapQuestionToClient(
  q: any,
  chapterMap?: Map<number, { title: string; class: number }>
): ClientQuestion {
  const ch = chapterMap?.get(q.chapterId);
  return {
    id: q.id,
    chapterId: q.chapterId,
    classLevel: ((ch?.class ?? 9) as any),
    chapterTitle: ch?.title ?? `Chapter #${q.chapterId}`,
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

// GET /api/admin/quizzes/questions?chapterId=123&page=1&pageSize=20
async function handleGet(req: Request, user: any) {
  const url = new URL(req.url);
  const { page, pageSize } = parsePagination(url.searchParams);
  const chapterId = url.searchParams.get("chapterId");
  const status = url.searchParams.get("status");
  const difficulty = url.searchParams.get("difficulty");
  const topic = url.searchParams.get("topic")?.trim();
  const q = url.searchParams.get("q")?.trim();

  const where: any = {};
  if (chapterId) where.chapterId = Number(chapterId);
  if (status && ["draft", "published", "archived"].includes(status)) where.status = status;
  if (difficulty && ["easy", "medium", "hard"].includes(difficulty)) where.difficulty = difficulty;
  if (topic) where.topic = { [Op.like]: `%${topic}%` };
  if (q) {
    where[Op.or] = [
      { questionText: { [Op.like]: `%${q}%` } },
      { topic: { [Op.like]: `%${q}%` } },
    ];
  }

  const { count, rows } = await Question.findAndCountAll({
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    order: [["id", "DESC"]],
  });

  // Fetch chapter details for context
  const chapterIds = Array.from(new Set(rows.map((r: any) => r.chapterId)));
  const chapters = chapterIds.length > 0
    ? await Chapter.findAll({
        where: { id: chapterIds },
        attributes: ["id", "chapterTitle", "class"],
      })
    : [];

  const chapterMap = new Map<number, { title: string; class: number }>();
  chapters.forEach((c: any) => {
    chapterMap.set(c.id, { title: c.chapterTitle, class: c.class });
  });

  const data = rows.map((r: any) => mapQuestionToClient(r, chapterMap));

  return NextResponse.json({ data, page, pageSize, total: count });
}

// POST /api/admin/quizzes/questions (body: QuestionInput)
async function handlePost(req: Request, user: any) {
  const { data, response } = await validateBody(req, questionInputSchema);
  if (response) return response;
  if (!data) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const chapter = await Chapter.findByPk(data.chapterId);
  if (!chapter) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  const created = await Question.create({
    chapterId: data.chapterId,
    questionText: sanitizeRich(data.text),
    optionA: sanitizeRich(data.options.A),
    optionB: sanitizeRich(data.options.B),
    optionC: sanitizeRich(data.options.C),
    optionD: sanitizeRich(data.options.D),
    correctOption: data.correct,
    explanation: data.explanation ? sanitizeRich(data.explanation) : null,
    difficulty: data.difficulty,
    topic: data.topic,
    marks: data.marks,
    status: data.status,
    imageUrl: data.questionImageUrl || null,
    createdBy: user?.id || null,
    updatedBy: user?.id || null,
  });

  const chapterMap = new Map<number, { title: string; class: number }>([
    [chapter.id, { title: chapter.chapterTitle, class: chapter.class }],
  ]);

  return NextResponse.json(mapQuestionToClient(created, chapterMap), { status: 201 });
}

export const GET = withAdmin(handleGet);
export const POST = withAdmin(handlePost);
