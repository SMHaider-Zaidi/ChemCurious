import { safeIsoDate } from "@/lib/api-utils";
import { NextResponse } from "next/server";
import { withAdminTx } from "@/lib/admin/withAdminTx";
import { User, QuizAttempt } from "@/lib/db";
import { z } from "zod";
import { validateBody } from "@/lib/api-utils";
import { Op } from "sequelize";

const roleSchema = z.object({
  role: z.enum(["student", "staff", "admin"]),
});

async function handlePatch(
  req: Request,
  user: any,
  { params, tx }: { params: Promise<{ id: string }> | { id: string }; tx: any }
) {
  const resolvedParams = await params;
  const targetId = Number(resolvedParams?.id);

  if (targetId === user.id) {
    return NextResponse.json(
      { error: "You cannot change your own role." },
      { status: 422 }
    );
  }

  const target = await User.findByPk(targetId, { transaction: tx });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { data, response } = await validateBody(req, roleSchema);
  if (response) return response;
  if (!data) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  // If demoting an admin, ensure at least one other active admin remains
  if (target.role === "admin" && data.role !== "admin") {
    const adminCount = await User.count({
      where: {
        role: "admin",
        status: { [Op.ne]: "suspended" } as any,
        id: { [Op.ne]: target.id },
      },
      transaction: tx,
    });

    if (adminCount === 0) {
      return NextResponse.json(
        { error: "Cannot change role: System requires at least one active administrator." },
        { status: 422 }
      );
    }
  }

  // Use direct DB update to bypass any unrelated validation on other fields
  await User.update(
    { role: data.role },
    { where: { id: target.id }, transaction: tx }
  );

  let attemptCount = 0;
  try {
    attemptCount = await QuizAttempt.count({
      where: { userId: target.id },
      transaction: tx,
    });
  } catch {
    attemptCount = 0;
  }

  return NextResponse.json({
    id: target.id,
    name: target.name,
    email: target.email,
    institution: target.institution,
    role: data.role,
    status: target.status,
    createdAt: safeIsoDate(target.createdAt, new Date().toISOString())!,
    lastLoginAt: safeIsoDate(target.lastLoginAt, null),
    attemptCount,
  });
}

export const PATCH = withAdminTx(handlePatch, {
  action: "UPDATE_USER_ROLE",
  roles: ["admin"],
});
