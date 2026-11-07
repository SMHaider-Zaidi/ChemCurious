import { withAdminTx } from "@/lib/admin/withAdminTx";
import { NextResponse } from "next/server";
import { Question } from "@/lib/db";
import { bulkImportRequestSchema } from "@/lib/admin/schemas/bulk-import";
import { sanitizeRich } from "@/lib/admin/sanitizeRich";
import { validateBody } from "@/lib/api-utils";

/** POST /api/admin/quizzes/questions/bulk-import
 *  Accepts BulkImportRequest, sanitizes rich text fields, and inserts into DB when dryRun is false.
 */
async function handlePost(req: Request, user: any, ctx: any) {
  const url = new URL(req.url);
  const isDryRun = url.searchParams.get("dryRun") === "true";

  const { data, response } = await validateBody(req, bulkImportRequestSchema);
  if (response) return response;
  if (!data) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const sanitizedRows = data.rows.map((row) => ({
    chapterId: data.chapterId,
    questionText: sanitizeRich(row.text),
    optionA: sanitizeRich(row.options.A),
    optionB: sanitizeRich(row.options.B),
    optionC: sanitizeRich(row.options.C),
    optionD: sanitizeRich(row.options.D),
    correctOption: row.correct,
    explanation: row.explanation ? sanitizeRich(row.explanation) : null,
    difficulty: row.difficulty || "easy",
    topic: row.topic || "",
    marks: row.marks || 1,
    status: (row as any).status || "draft",
    imageUrl: null,
    createdBy: user?.id || null,
    updatedBy: user?.id || null,
  }));

  if (!isDryRun) {
    await Question.bulkCreate(sanitizedRows, { transaction: ctx?.tx });
  }

  const result = {
    dryRun: isDryRun,
    valid: sanitizedRows.length,
    invalid: 0,
    inserted: isDryRun ? 0 : sanitizedRows.length,
    errors: [],
  };
  return NextResponse.json(result, { status: 201 });
}

export const POST = withAdminTx(handlePost, { action: "BULK_IMPORT_QUESTIONS" });
