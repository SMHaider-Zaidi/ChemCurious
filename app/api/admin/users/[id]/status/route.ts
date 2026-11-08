import { safeIsoDate } from "@/lib/api-utils";
import { NextResponse } from "next/server";
import { withAdminTx } from "@/lib/admin/withAdminTx";
import { User, QuizAttempt } from "@/lib/db";
import { z } from "zod";
import { validateBody } from "@/lib/api-utils";
import { Op } from "sequelize";

const statusSchema = z.object({
  status: z.enum(["active", "suspended"]),
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
      { error: "You cannot suspend your own account" },
      { status: 422 }
    );
  }

  const target = await User.findByPk(targetId, { transaction: tx });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { data, response } = await validateBody(req, statusSchema);
  if (response) return response;
  if (!data) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  // If suspending an admin, ensure at least one other active admin remains
  if (target.role === "admin" && data.status === "suspended") {
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
        { error: "Cannot suspend user: System requires at least one active administrator." },
        { status: 422 }
      );
    }
  }

  await User.update(
    { status: data.status },
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
    role: target.role,
    status: target.status,
    createdAt: safeIsoDate(target.createdAt, new Date().toISOString())!,
    lastLoginAt: safeIsoDate(target.lastLoginAt, null),
    attemptCount,
  });
}

export const PATCH = withAdminTx(handlePatch, {
  action: "UPDATE_USER_STATUS",
  roles: ["admin"],
});
