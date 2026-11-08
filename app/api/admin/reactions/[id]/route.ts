import { safeIsoDate } from "@/lib/api-utils";
import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/admin-guard";
import { withAdminTx } from "@/lib/admin/withAdminTx";
import { Reaction, Molecule } from "@/lib/db";
import { reactionInputSchema } from "@/lib/admin/schemas/reaction";
import { sanitizeRich } from "@/lib/admin/sanitizeRich";
import { validateBody } from "@/lib/api-utils";
import { Op } from "sequelize";

// GET /api/admin/reactions/:id
async function handleGet(req: Request, user: any, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reaction = await Reaction.findByPk(Number(id));
  if (!reaction) {
    return NextResponse.json({ error: "Reaction not found" }, { status: 404 });
  }

  const rawReactants = typeof reaction.reactants === "string" ? JSON.parse(reaction.reactants) : reaction.reactants || [];
  const rawProducts = typeof reaction.products === "string" ? JSON.parse(reaction.products) : reaction.products || [];

  const moleculeIds = new Set<number>();
  if (Array.isArray(rawReactants)) rawReactants.forEach((m: any) => m?.moleculeId && moleculeIds.add(Number(m.moleculeId)));
  if (Array.isArray(rawProducts)) rawProducts.forEach((m: any) => m?.moleculeId && moleculeIds.add(Number(m.moleculeId)));

  const molecules = moleculeIds.size > 0
    ? await Molecule.findAll({ where: { id: Array.from(moleculeIds) }, attributes: ["id", "molecule", "formula"] })
    : [];

  const moleculeMap = new Map<number, { molecule: string; formula: string }>();
  molecules.forEach((m: any) => moleculeMap.set(m.id, { molecule: m.molecule, formula: m.formula }));

  const enrichedReactants = Array.isArray(rawReactants)
    ? rawReactants.map((item: any) => ({
        moleculeId: Number(item.moleculeId),
        molecule: item.molecule || moleculeMap.get(Number(item.moleculeId))?.formula || moleculeMap.get(Number(item.moleculeId))?.molecule || '',
        coefficient: Number(item.coefficient) || 1,
      }))
    : [];

  const enrichedProducts = Array.isArray(rawProducts)
    ? rawProducts.map((item: any) => ({
        moleculeId: Number(item.moleculeId),
        molecule: item.molecule || moleculeMap.get(Number(item.moleculeId))?.formula || moleculeMap.get(Number(item.moleculeId))?.molecule || '',
        coefficient: Number(item.coefficient) || 1,
      }))
    : [];

  return NextResponse.json({
    id: reaction.id,
    name: reaction.name,
    category: reaction.category,
    description: reaction.description || "",
    conditions: reaction.conditions || "",
    reactants: enrichedReactants,
    products: enrichedProducts,
    status: reaction.status,
    reactantCount: enrichedReactants.length,
    productCount: enrichedProducts.length,
    createdAt: safeIsoDate(reaction.createdAt, new Date().toISOString())!,
    updatedAt: safeIsoDate(reaction.updatedAt, new Date().toISOString())!,
  });
}

// PUT /api/admin/reactions/:id
async function handlePut(
  req: Request,
  user: any,
  { params, tx }: { params: Promise<{ id: string }>; tx: any }
) {
  const { id } = await params;
  const reaction = await Reaction.findByPk(Number(id), { transaction: tx });
  if (!reaction) {
    return NextResponse.json({ error: "Reaction not found" }, { status: 404 });
  }

  const { data, response } = await validateBody(req, reactionInputSchema);
  if (response) return response;
  if (!data) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const existing = await Reaction.findOne({
    where: { name: data.name, id: { [Op.ne]: reaction.id } },
    transaction: tx,
  });
  if (existing) {
    return NextResponse.json(
      { error: `A reaction with the name "${data.name}" already exists. Please choose a different name.` },
      { status: 409 }
    );
  }

  const sanitizedDescription = data.description ? sanitizeRich(data.description) : null;
  const sanitizedConditions = data.conditions ? sanitizeRich(data.conditions) : null;

  const moleculeIds = new Set<number>();
  if (Array.isArray(data.reactants)) data.reactants.forEach((m: any) => m?.moleculeId && moleculeIds.add(Number(m.moleculeId)));
  if (Array.isArray(data.products)) data.products.forEach((m: any) => m?.moleculeId && moleculeIds.add(Number(m.moleculeId)));

  const molecules = moleculeIds.size > 0
    ? await Molecule.findAll({ where: { id: Array.from(moleculeIds) }, attributes: ["id", "molecule", "formula"], transaction: tx })
    : [];

  const moleculeMap = new Map<number, { molecule: string; formula: string }>();
  molecules.forEach((m: any) => moleculeMap.set(m.id, { molecule: m.molecule, formula: m.formula }));

  const enrichedReactants = Array.isArray(data.reactants)
    ? data.reactants.map((item: any) => ({
        moleculeId: Number(item.moleculeId),
        molecule: item.molecule || moleculeMap.get(Number(item.moleculeId))?.molecule || moleculeMap.get(Number(item.moleculeId))?.formula || '',
        formula: moleculeMap.get(Number(item.moleculeId))?.formula || '',
        coefficient: Number(item.coefficient) || 1,
      }))
    : [];

  const enrichedProducts = Array.isArray(data.products)
    ? data.products.map((item: any) => ({
        moleculeId: Number(item.moleculeId),
        molecule: item.molecule || moleculeMap.get(Number(item.moleculeId))?.molecule || moleculeMap.get(Number(item.moleculeId))?.formula || '',
        formula: moleculeMap.get(Number(item.moleculeId))?.formula || '',
        coefficient: Number(item.coefficient) || 1,
      }))
    : [];

  await reaction.update(
    {
      name: data.name,
      category: data.category,
      description: sanitizedDescription,
      conditions: sanitizedConditions,
      reactants: enrichedReactants,
      products: enrichedProducts,
      status: data.status || reaction.status,
      updatedBy: user.id,
    },
    { transaction: tx }
  );

  return NextResponse.json({
    id: reaction.id,
    name: reaction.name,
    category: reaction.category,
    description: reaction.description || "",
    conditions: reaction.conditions || "",
    reactants: enrichedReactants,
    products: enrichedProducts,
    status: reaction.status,
    reactantCount: enrichedReactants.length,
    productCount: enrichedProducts.length,
    createdAt: safeIsoDate(reaction.createdAt, new Date().toISOString())!,
    updatedAt: safeIsoDate(reaction.updatedAt, new Date().toISOString())!,
  });
}

// DELETE /api/admin/reactions/:id (Admin only)
async function handleDelete(
  req: Request,
  user: any,
  { params, tx }: { params: Promise<{ id: string }>; tx: any }
) {
  const { id } = await params;
  const reaction = await Reaction.findByPk(Number(id), { transaction: tx });
  if (!reaction) {
    return NextResponse.json({ error: "Reaction not found" }, { status: 404 });
  }

  await reaction.destroy({ transaction: tx });
  return new NextResponse(null, { status: 204 });
}

export const GET = withAdmin(handleGet);
export const PUT = withAdminTx(handlePut, { action: "UPDATE_REACTION" });
export const DELETE = withAdminTx(handleDelete, { action: "DELETE_REACTION", roles: ["admin"] });
