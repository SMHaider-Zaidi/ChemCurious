import { safeIsoDate } from "@/lib/api-utils";
import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/admin-guard";
import { withAdminTx } from "@/lib/admin/withAdminTx";
import { Molecule, sequelize } from "@/lib/db";
import { parsePagination, validateBody } from "@/lib/api-utils";
import { moleculeInputSchema } from "@/lib/admin/schemas/molecule";
import { sanitizeRich } from "@/lib/admin/sanitizeRich";
import { Op } from "sequelize";

// GET /api/admin/molecules?q=&category=&status=&page=&pageSize=
async function handleGet(req: Request) {
  const url = new URL(req.url);
  const searchParams = url.searchParams;
  const { page, pageSize, offset, limit } = parsePagination(searchParams);

  const q = searchParams.get("q")?.trim();
  const category = searchParams.get("category")?.trim();
  const status = searchParams.get("status")?.trim();

  const where: any = {};

  if (q) {
    where[Op.or] = [
      { molecule: { [Op.like]: `%${q}%` } },
      { formula: { [Op.like]: `%${q}%` } },
      { iupacName: { [Op.like]: `%${q}%` } },
    ];
  }

  if (category) {
    where.category = category;
  }

  if (status && ["draft", "published", "archived"].includes(status)) {
    where.status = status;
  }

  const { count, rows } = await Molecule.findAndCountAll({
    where,
    offset,
    limit,
    order: [["id", "DESC"]],
  });

  const data = rows.map((m) => {
    const rawAtoms = typeof m.atoms === "string" ? JSON.parse(m.atoms) : m.atoms || [];
    const rawBonds = typeof m.bonds === "string" ? JSON.parse(m.bonds) : m.bonds || [];
    return {
      id: m.id,
      name: m.molecule,
      formula: m.formula,
      category: m.category,
      description: m.description || "",
      atoms: rawAtoms,
      bonds: rawBonds,
      atomCount: Array.isArray(rawAtoms) ? rawAtoms.length : 0,
      bondCount: Array.isArray(rawBonds) ? rawBonds.length : 0,
      status: m.status,
      origin: m.cid ? "cache" : "portal",
      createdAt: safeIsoDate(m.createdAt, new Date().toISOString())!,
      updatedAt: safeIsoDate(m.updatedAt, new Date().toISOString())!,
    };
  });

  return NextResponse.json({
    data,
    page,
    pageSize,
    total: count,
  });
}

// POST /api/admin/molecules
async function handlePost(req: Request, user: any, { tx }: { tx: any }) {
  const { data, response } = await validateBody(req, moleculeInputSchema);
  if (response) return response;
  if (!data) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  // Check unique molecule name
  const existing = await Molecule.findOne({
    where: { molecule: data.name },
    transaction: tx,
  });

  if (existing) {
    return NextResponse.json(
      { error: "A molecule with this name already exists", field: "name" },
      { status: 409 }
    );
  }

  const sanitizedDescription = data.description ? sanitizeRich(data.description) : null;

  const created = await Molecule.create(
    {
      molecule: data.name,
      formula: data.formula,
      category: data.category,
      description: sanitizedDescription,
      atoms: data.atoms,
      bonds: data.bonds || [],
      status: data.status || "draft",
      createdBy: user.id,
      updatedBy: user.id,
    },
    { transaction: tx }
  );

  return NextResponse.json(
    {
      id: created.id,
      name: created.molecule,
      formula: created.formula,
      category: created.category,
      description: created.description || "",
      atoms: created.atoms,
      bonds: created.bonds,
      atomCount: Array.isArray(created.atoms) ? created.atoms.length : 0,
      bondCount: Array.isArray(created.bonds) ? created.bonds.length : 0,
      status: created.status,
      origin: "portal",
      createdAt: safeIsoDate(created.createdAt, new Date().toISOString())!,
      updatedAt: safeIsoDate(created.updatedAt, new Date().toISOString())!,
    },
    { status: 201 }
  );
}

export const GET = withAdmin(handleGet);
export const POST = withAdminTx(handlePost, { action: "CREATE_MOLECULE" });
