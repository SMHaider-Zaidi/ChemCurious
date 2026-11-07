import { withAdminTx } from "@/lib/admin/withAdminTx";
import { NextResponse } from "next/server";
import { chapterReorderSchema } from "@/lib/admin/schemas/chapter";
import { Chapter } from "@/lib/db";

/** POST /api/admin/quizzes/chapters/reorder – reorders chapters for a class level */
export const POST = withAdminTx(
  async (req, user, ctx) => {
    const body = await req.json();
    const parsed = chapterReorderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }
    const { classLevel, orderedIds } = parsed.data;
    const tx = ctx?.tx;

    // Update each chapter's sequential chapterNumber according to new orderedIds
    for (let i = 0; i < orderedIds.length; i++) {
      const chapterId = orderedIds[i];
      await Chapter.update(
        { chapterNumber: i + 1 },
        { where: { id: chapterId, class: classLevel }, transaction: tx }
      );
    }

    return NextResponse.json({ success: true, classLevel, orderedIds }, { status: 200 });
  },
  { action: "CHAPTER_REORDER", description: "Reorder chapters in class" }
);
