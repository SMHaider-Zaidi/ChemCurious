import { safeIsoDate } from "@/lib/api-utils";
// Admin API: Chapters CRUD
// Path: /api/admin/quizzes/chapters
import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/admin-guard";
import { Chapter, Question } from "@/lib/db";
import type { Paginated } from "@/lib/admin/types";
import { Op } from "sequelize";

/** Helper to parse pagination query params */
function parsePagination(req: Request): { page: number; pageSize: number } {
  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const pageSize = Number(url.searchParams.get("pageSize")) || 50;
  return { page, pageSize };
}

// GET /api/admin/quizzes/chapters?classLevel=9&page=1&pageSize=50
async function handleGet(req: Request, user: any) {
  const { page, pageSize } = parsePagination(req);
  const url = new URL(req.url);
  const classLevel = url.searchParams.get("classLevel");
  const status = url.searchParams.get("status");
  const q = url.searchParams.get("q")?.trim();

  const where: any = {};
  if (classLevel) {
    where.class = Number(classLevel);
  }
  if (status && ["draft", "published", "archived"].includes(status)) {
    where.status = status;
  }
  if (q) {
    where.chapterTitle = { [Op.like]: `%${q}%` };
  }

  const { count, rows } = await Chapter.findAndCountAll({
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    order: [
      ["class", "ASC"],
      ["chapterNumber", "ASC"],
      ["id", "ASC"],
    ],
  });

  // Calculate question counts for returned chapters
  const chapterIds = rows.map((r: any) => r.id);
  const questions = chapterIds.length > 0
    ? await Question.findAll({
        where: { chapterId: chapterIds },
        attributes: ["chapterId", "status"],
      })
    : [];

  const countMap = new Map<number, { total: number; published: number }>();
  for (const q of questions) {
    const qObj = q as any;
    const prev = countMap.get(qObj.chapterId) || { total: 0, published: 0 };
    prev.total += 1;
    if (qObj.status === "published") {
      prev.published += 1;
    }
    countMap.set(qObj.chapterId, prev);
  }

  const mappedData = rows.map((ch: any) => {
    const stats = countMap.get(ch.id) || { total: 0, published: 0 };
    return {
      id: ch.id,
      classLevel: ch.class,
      order: ch.chapterNumber,
      title: ch.chapterTitle,
      status: ch.status,
      publishedAt: safeIsoDate(ch.publishedAt, null),
      questionCount: stats.total,
      publishedQuestionCount: stats.published,
      createdAt: safeIsoDate(ch.createdAt, new Date().toISOString())!,
      updatedAt: safeIsoDate(ch.updatedAt, new Date().toISOString())!,
    };
  });

  const result: Paginated<any> = {
    data: mappedData,
    page,
    pageSize,
    total: count,
  };
  return NextResponse.json(result);
}

// POST /api/admin/quizzes/chapters (body: ChapterInput)
async function handlePost(req: Request, user: any) {
  const body = await req.json();
  const classLevel = Number(body.classLevel) || 9;

  // Auto-assign next chapter number if order is not specified
  let chapterNumber = body.order ? Number(body.order) : undefined;
  if (!chapterNumber || isNaN(chapterNumber)) {
    const maxChapter = await Chapter.max("chapterNumber", {
      where: { class: classLevel },
    });
    chapterNumber = (typeof maxChapter === "number" && !isNaN(maxChapter) ? maxChapter : 0) + 1;
  }

  const title = (body.title || "").trim();
  const status = body.status || "draft";

  const created = await Chapter.create({
    class: classLevel,
    chapterNumber,
    chapterTitle: title,
    status,
    publishedAt: status === "published" ? new Date() : (body.publishedAt ? new Date(body.publishedAt) : null),
  });

  return NextResponse.json(
    {
      id: created.id,
      classLevel: created.class,
      order: created.chapterNumber,
      title: created.chapterTitle,
      status: created.status,
      publishedAt: safeIsoDate(created.publishedAt, null),
      questionCount: 0,
      publishedQuestionCount: 0,
      createdAt: safeIsoDate(created.createdAt, new Date().toISOString())!,
      updatedAt: safeIsoDate(created.updatedAt, new Date().toISOString())!,
    },
    { status: 201 }
  );
}

export const GET = withAdmin(handleGet);
export const POST = withAdmin(handlePost);
