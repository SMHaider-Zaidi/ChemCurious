import { withAdmin } from "@/lib/admin-guard";
import { NextResponse } from "next/server";

/** GET /api/admin/me – returns current admin user */
export const GET = withAdmin(async (req, user) => {
  // Return current user data (already sanitized by guard)
  return NextResponse.json(user);
});
