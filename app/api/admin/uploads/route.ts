import { withAdminTx } from "@/lib/admin/withAdminTx";
import { withAdmin } from "@/lib/admin-guard";
import { NextResponse } from "next/server";

/** POST /api/admin/uploads – accepts a multipart file (≤5 MB) and returns its URL */
export const POST = withAdminTx(async (req, user, ctx) => {
  // In a real app, parse multipart, store file, return URL.
  // Here we just echo a placeholder.
  return NextResponse.json({ url: "https://example.com/mock-upload" }, { status: 201 });
});
