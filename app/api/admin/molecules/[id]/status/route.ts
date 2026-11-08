import { safeIsoDate } from "@/lib/api-utils";
import { NextResponse } from "next/server";
import { withAdminTx } from "@/lib/admin/withAdminTx";
import { Molecule } from "@/lib/db";
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
  const molecule = await Molecule.findByPk(Number(id), { transaction: tx });
  if (!molecule) {
    return NextResponse.json({ error: "Molecule not found" }, { status: 404 });
  }

  const { data, response } = await validateBody(req, statusSchema);
  if (response) return response;
  if (!data) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  await molecule.update({ status: data.status, updatedBy: user.id }, { transaction: tx });

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

export const PATCH = withAdminTx(handlePatch, { action: "SET_MOLECULE_STATUS" });
