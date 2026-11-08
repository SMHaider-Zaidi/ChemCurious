import { safeIsoDate } from "@/lib/api-utils";
import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/admin-guard";
import { withAdminTx } from "@/lib/admin/withAdminTx";
import { Molecule, Reaction } from "@/lib/db";
import { moleculeInputSchema } from "@/lib/admin/schemas/molecule";
import { sanitizeRich } from "@/lib/admin/sanitizeRich";
import { validateBody } from "@/lib/api-utils";
import { Op } from "sequelize";

// GET /api/admin/molecules/:id
async function handleGet(req: Request, user: any, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const molecule = await Molecule.findByPk(Number(id));
  if (!molecule) {
    return NextResponse.json({ error: "Molecule not found" }, { status: 404 });
  }

  const rawAtoms = typeof molecule.atoms === "string" ? JSON.parse(molecule.atoms) : molecule.atoms || [];
  const rawBonds = typeof molecule.bonds === "string" ? JSON.parse(molecule.bonds) : molecule.bonds || [];

  return NextResponse.json({
    id: molecule.id,
    name: molecule.molecule,
    formula: molecule.formula,
    category: molecule.category,
    description: molecule.description || "",
    atoms: rawAtoms,
    bonds: rawBonds,
    atomCount: Array.isArray(rawAtoms) ? rawAtoms.length : 0,
    bondCount: Array.isArray(rawBonds) ? rawBonds.length : 0,
    status: molecule.status,
    origin: molecule.cid ? "cache" : "portal",
    createdAt: safeIsoDate(molecule.createdAt, new Date().toISOString())!,
    updatedAt: safeIsoDate(molecule.updatedAt, new Date().toISOString())!,
  });
}

// PUT /api/admin/molecules/:id
async function handlePut(
  req: Request,
  user: any,
  { params, tx }: { params: Promise<{ id: string }>; tx: any }
) {
  const { id } = await params;
  const molecule = await Molecule.findByPk(Number(id), { transaction: tx });
  if (!molecule) {
    return NextResponse.json({ error: "Molecule not found" }, { status: 404 });
  }

  const { data, response } = await validateBody(req, moleculeInputSchema);
  if (response) return response;
  if (!data) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  // If renaming, check conflicts and reactions usage
  if (data.name !== molecule.molecule) {
    const existing = await Molecule.findOne({
      where: { molecule: data.name, id: { [Op.ne]: molecule.id } },
      transaction: tx,
    });
    if (existing) {
      return NextResponse.json(
        { error: "A molecule with this name already exists", field: "name" },
        { status: 409 }
      );
    }
  }

  const sanitizedDescription = data.description ? sanitizeRich(data.description) : null;

  await molecule.update(
    {
      molecule: data.name,
      formula: data.formula,
      category: data.category,
      description: sanitizedDescription,
      atoms: data.atoms,
      bonds: data.bonds || [],
      status: data.status || molecule.status,
      updatedBy: user.id,
    },
    { transaction: tx }
  );

  const rawAtoms = typeof molecule.atoms === "string" ? JSON.parse(molecule.atoms) : molecule.atoms || [];
  const rawBonds = typeof molecule.bonds === "string" ? JSON.parse(molecule.bonds) : molecule.bonds || [];

  return NextResponse.json({
    id: molecule.id,
    name: molecule.molecule,
    formula: molecule.formula,
    category: molecule.category,
    description: molecule.description || "",
    atoms: rawAtoms,
    bonds: rawBonds,
    atomCount: Array.isArray(rawAtoms) ? rawAtoms.length : 0,
    bondCount: Array.isArray(rawBonds) ? rawBonds.length : 0,
    status: molecule.status,
    origin: molecule.cid ? "cache" : "portal",
    createdAt: safeIsoDate(molecule.createdAt, new Date().toISOString())!,
    updatedAt: safeIsoDate(molecule.updatedAt, new Date().toISOString())!,
  });
}

// DELETE /api/admin/molecules/:id (Admin only)
async function handleDelete(
  req: Request,
  user: any,
  { params, tx }: { params: Promise<{ id: string }>; tx: any }
) {
  const { id } = await params;
  const molecule = await Molecule.findByPk(Number(id), { transaction: tx });
  if (!molecule) {
    return NextResponse.json({ error: "Molecule not found" }, { status: 404 });
  }

  // Check if used in any reactions
  const reactions = await Reaction.findAll({ transaction: tx });
  const usingReactions: string[] = [];
  for (const r of reactions) {
    const reactants: any[] = typeof r.reactants === "string" ? JSON.parse(r.reactants) : r.reactants || [];
    const products: any[] = typeof r.products === "string" ? JSON.parse(r.products) : r.products || [];
    const inReactants = reactants.some((item) => item.moleculeId === molecule.id || item.molecule === molecule.molecule);
    const inProducts = products.some((item) => item.moleculeId === molecule.id || item.molecule === molecule.molecule);
    if (inReactants || inProducts) {
      usingReactions.push(r.name);
    }
  }

  if (usingReactions.length > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete molecule because it is used in reactions: ${usingReactions.join(", ")}`,
        details: { reactions: usingReactions },
      },
      { status: 409 }
    );
  }

  await molecule.destroy({ transaction: tx });
  return new NextResponse(null, { status: 204 });
}

export const GET = withAdmin(handleGet);
export const PUT = withAdminTx(handlePut, { action: "UPDATE_MOLECULE" });
export const DELETE = withAdminTx(handleDelete, { action: "DELETE_MOLECULE", roles: ["admin"] });
