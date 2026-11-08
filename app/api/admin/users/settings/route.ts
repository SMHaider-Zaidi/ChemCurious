import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/admin-guard";
import { getSystemSetting, setSystemSetting, isStudentRankVisible, ensureDbSynced } from "@/lib/db";
import { z } from "zod";
import { validateBody } from "@/lib/api-utils";

const settingsSchema = z.object({
  showStudentRank: z.boolean(),
});

// GET /api/admin/users/settings
async function handleGet() {
  await ensureDbSynced();
  const showStudentRank = await isStudentRankVisible();
  return NextResponse.json({ showStudentRank });
}

// PUT /api/admin/users/settings
async function handlePut(req: Request) {
  await ensureDbSynced();
  const { data, response } = await validateBody(req, settingsSchema);
  if (response) return response;
  if (!data) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  await setSystemSetting("show_student_rank", String(data.showStudentRank));
  return NextResponse.json({ showStudentRank: data.showStudentRank });
}

export const GET = withAdmin(handleGet, { roles: ["admin"] });
export const PUT = withAdmin(handlePut, { roles: ["admin"] });
