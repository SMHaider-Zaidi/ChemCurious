import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/admin-guard";
import { fetchDirectFromPubChem } from "@/lib/pubchem";
import { z } from "zod";
import { validateBody } from "@/lib/api-utils";
import type { Atom, Bond, PubChemResult } from "@/lib/admin/types";

const querySchema = z.object({
  query: z.string().min(1, "Search query is required"),
});

async function handlePost(req: Request) {
  const { data, response } = await validateBody(req, querySchema);
  if (response) return response;
  if (!data) return NextResponse.json({ error: "Invalid query" }, { status: 400 });

  try {
    const result = await fetchDirectFromPubChem(data.query);

    const atoms: Atom[] = (result.atoms || []).map((a) => ({
      element: a.element,
      x: a.x ?? (a.position ? a.position[0] : 0),
      y: a.y ?? (a.position ? a.position[1] : 0),
      z: a.z ?? (a.position ? a.position[2] : 0),
    }));

    const bonds: Bond[] = (result.bonds || []).map((b) => ({
      source: b.source ?? b.from ?? 0,
      target: b.target ?? b.to ?? 0,
      order: (b.order === 2 ? 2 : b.order === 3 ? 3 : 1) as 1 | 2 | 3,
    }));

    const responsePayload: PubChemResult = {
      name: result.name,
      formula: result.formula,
      description: null,
      cid: result.cid || null,
      iupacName: result.iupacName || null,
      molecularWeight: result.molecularWeight || null,
      atoms,
      bonds,
    };

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch molecule from PubChem" },
      { status: 404 }
    );
  }
}

export const POST = withAdmin(handlePost);
