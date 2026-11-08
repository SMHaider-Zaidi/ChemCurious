import { safeIsoDate } from "@/lib/api-utils";
import { NextResponse } from "next/server";
import { withAdminTx } from "@/lib/admin/withAdminTx";
import { Reaction } from "@/lib/db";
import { z } from "zod";
import { validateBody } from "@/lib/api-utils";

const statusSchema = z.object({
  status: z.enum(["draft", "published", "archived"]),
});

async function handlePatch(
  req: Request,
  user: any,
  { params, tx }: { params: Promise<{ id: string }>; tx: any }
) {
  const { id } = await params;
  const reaction = await Reaction.findByPk(Number(id), { transaction: tx });
  if (!reaction) {
    return NextResponse.json({ error: "Reaction not found" }, { status: 404 });
  }

  const { data, response } = await validateBody(req, statusSchema);
  if (response) return response;
  if (!data) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  await reaction.update({ status: data.status, updatedBy: user.id }, { transaction: tx });

  const rawReactants = typeof reaction.reactants === "string" ? JSON.parse(reaction.reactants) : reaction.reactants || [];
  const rawProducts = typeof reaction.products === "string" ? JSON.parse(reaction.products) : reaction.products || [];

  return NextResponse.json({
    id: reaction.id,
    name: reaction.name,
    category: reaction.category,
    description: reaction.description || "",
    conditions: reaction.conditions || "",
    reactants: rawReactants,
    products: rawProducts,
    status: reaction.status,
    reactantCount: Array.isArray(rawReactants) ? rawReactants.length : 0,
    productCount: Array.isArray(rawProducts) ? rawProducts.length : 0,
    createdAt: safeIsoDate(reaction.createdAt, new Date().toISOString())!,
    updatedAt: safeIsoDate(reaction.updatedAt, new Date().toISOString())!,
  });
}

export const PATCH = withAdminTx(handlePatch, { action: "SET_REACTION_STATUS" });
