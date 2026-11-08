// Admin API: Chapter status update (PATCH)
// Path: /api/admin/quizzes/chapters/[id]/status
import { NextResponse } from "next/server";
import { withAdminTx } from "@/lib/admin/withAdminTx";
import { Chapter, Question } from "@/lib/db";
import { z } from "zod";
import { validateBody } from "@/lib/api-utils";
import type { ContentStatus } from "@/lib/admin/types";

const statusSchema = z.object({
  status: z.enum(["draft", "published", "archived"]),
});

async function handlePatch(
  req: Request,
  user: any,
  { params, tx }: { params: Promise<{ id: string }>; tx: any }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data, response } = await validateBody(req, statusSchema);
  if (response) return response;
  if (!data) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const chapter = await Chapter.findByPk(Number(id), { transaction: tx });
  if (!chapter) return NextResponse.json({ error: "Chapter not found" }, { status: 404 });

  // Publishing needs ≥ 1 published question
  if (data.status === "published") {
    const publishedQuestionsCount = await Question.count({
      where: { chapterId: chapter.id, status: "published" },
      transaction: tx,
    });
    if (publishedQuestionsCount === 0) {
      return NextResponse.json(
        { error: "Cannot publish chapter: It must contain at least one published question." },
        { status: 422 }
      );
    }
  }

  await chapter.update(
    {
      status: data.status as ContentStatus,
      publishedAt: data.status === "published" ? new Date() : chapter.publishedAt,
    },
    { transaction: tx }
  );

  return NextResponse.json(chapter);
}

export const PATCH = withAdminTx(handlePatch, { action: "CHAPTER_STATUS_UPDATE" });
