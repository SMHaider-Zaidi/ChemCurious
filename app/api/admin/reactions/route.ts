import { safeIsoDate } from "@/lib/api-utils";
import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/admin-guard';
import { withAdminTx } from '@/lib/admin/withAdminTx';
import { Reaction, Molecule } from '@/lib/db';
import { reactionInputSchema } from '@/lib/admin/schemas/reaction';
import { sanitizeRich } from '@/lib/admin/sanitizeRich';
import { parsePagination, validateBody } from '@/lib/api-utils';
import { Op } from 'sequelize';

// GET /api/admin/reactions?q=&category=&status=&page=&pageSize=
async function handleGet(req: Request) {
  const url = new URL(req.url);
  const searchParams = url.searchParams;
  const { page, pageSize, offset, limit } = parsePagination(searchParams);

  const q = searchParams.get('q')?.trim();
  const category = searchParams.get('category')?.trim();
  const status = searchParams.get('status')?.trim();

  const where: any = {};

  if (q) {
    where[Op.or] = [
      { name: { [Op.like]: `%${q}%` } },
      { description: { [Op.like]: `%${q}%` } },
    ];
  }

  if (category && ['organic', 'inorganic'].includes(category)) {
    where.category = category;
  }

  if (status && ['draft', 'published', 'archived'].includes(status)) {
    where.status = status;
  }

  const { count, rows } = await Reaction.findAndCountAll({
    where,
    offset,
    limit,
    order: [['id', 'DESC']],
  });

  // Collect all molecule IDs needed for reactants and products
  const moleculeIds = new Set<number>();
  rows.forEach((r: any) => {
    const rawReactants = typeof r.reactants === 'string' ? JSON.parse(r.reactants) : r.reactants || [];
    const rawProducts = typeof r.products === 'string' ? JSON.parse(r.products) : r.products || [];
    if (Array.isArray(rawReactants)) {
      rawReactants.forEach((m: any) => m?.moleculeId && moleculeIds.add(Number(m.moleculeId)));
    }
    if (Array.isArray(rawProducts)) {
      rawProducts.forEach((m: any) => m?.moleculeId && moleculeIds.add(Number(m.moleculeId)));
    }
  });

  const molecules = moleculeIds.size > 0
    ? await Molecule.findAll({
        where: { id: Array.from(moleculeIds) },
        attributes: ['id', 'molecule', 'formula'],
      })
    : [];

  const moleculeMap = new Map<number, { molecule: string; formula: string }>();
  molecules.forEach((m: any) => {
    moleculeMap.set(m.id, { molecule: m.molecule, formula: m.formula });
  });

  const data = rows.map((r: any) => {
    const rawReactants = typeof r.reactants === 'string' ? JSON.parse(r.reactants) : r.reactants || [];
    const rawProducts = typeof r.products === 'string' ? JSON.parse(r.products) : r.products || [];

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

    return {
      id: r.id,
      name: r.name,
      category: r.category,
      description: r.description || '',
      conditions: r.conditions || '',
      reactants: enrichedReactants,
      products: enrichedProducts,
      status: r.status,
      reactantCount: enrichedReactants.length,
      productCount: enrichedProducts.length,
      createdAt: safeIsoDate(r.createdAt, new Date().toISOString())!,
      updatedAt: safeIsoDate(r.updatedAt, new Date().toISOString())!,
    };
  });

  return NextResponse.json({
    data,
    page,
    pageSize,
    total: count,
  });
}

// POST /api/admin/reactions
async function handlePost(req: Request, user: any, { tx }: { tx: any }) {
  const { data, response } = await validateBody(req, reactionInputSchema);
  if (response) return response;
  if (!data) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

  const existing = await Reaction.findOne({
    where: { name: data.name },
    transaction: tx,
  });
  if (existing) {
    return NextResponse.json(
      { error: `A reaction with the name "${data.name}" already exists in the catalog. Please choose a different name.` },
      { status: 409 }
    );
  }

  const sanitizedDescription = data.description ? sanitizeRich(data.description) : null;
  const sanitizedConditions = data.conditions ? sanitizeRich(data.conditions) : null;

  const moleculeIds = new Set<number>();
  if (Array.isArray(data.reactants)) data.reactants.forEach((m: any) => m?.moleculeId && moleculeIds.add(Number(m.moleculeId)));
  if (Array.isArray(data.products)) data.products.forEach((m: any) => m?.moleculeId && moleculeIds.add(Number(m.moleculeId)));

  const molecules = moleculeIds.size > 0
    ? await Molecule.findAll({ where: { id: Array.from(moleculeIds) }, attributes: ['id', 'molecule', 'formula'], transaction: tx })
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

  const created = await Reaction.create(
    {
      name: data.name,
      category: data.category,
      description: sanitizedDescription,
      conditions: sanitizedConditions,
      reactants: enrichedReactants,
      products: enrichedProducts,
      status: data.status || 'draft',
      createdBy: user.id,
      updatedBy: user.id,
    },
    { transaction: tx }
  );

  return NextResponse.json(
    {
      id: created.id,
      name: created.name,
      category: created.category,
      description: created.description || '',
      conditions: created.conditions || '',
      reactants: enrichedReactants,
      products: enrichedProducts,
      status: created.status,
      reactantCount: enrichedReactants.length,
      productCount: enrichedProducts.length,
      createdAt: safeIsoDate(created.createdAt, new Date().toISOString())!,
      updatedAt: safeIsoDate(created.updatedAt, new Date().toISOString())!,
    },
    { status: 201 }
  );
}

export const GET = withAdmin(handleGet);
export const POST = withAdminTx(handlePost, { action: 'CREATE_REACTION' });
