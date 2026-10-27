import { NextResponse } from "next/server";
import { Op } from "sequelize";
import { Molecule, ensureDbSynced } from "@/lib/db";
import { parseSdf, inferGeometry } from "@/lib/pubchem";

function normalizeMoleculeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || searchParams.get("name");

  if (!query) {
    return NextResponse.json(
      { error: "INVALID_REQUEST", message: "Molecule query or name parameter is required" },
      { status: 400 }
    );
  }

  const cleanName = query.trim();
  const normalizedName = normalizeMoleculeName(cleanName);
  const isNumeric = /^\d+$/.test(cleanName);
  const numericCid = isNumeric ? parseInt(cleanName, 10) : null;

  // 1. DB Lookup First (Read-Through Cache)
  try {
    await ensureDbSynced();
    const whereConditions: any[] = [
      { molecule: normalizedName },
      { formula: cleanName },
      { formula: cleanName.toUpperCase() },
      { iupacName: cleanName },
      { iupacName: normalizedName },
    ];

    if (numericCid !== null) {
      whereConditions.push({ cid: numericCid });
    }

    const cachedRecord = await Molecule.findOne({
      where: {
        [Op.or]: whereConditions,
      },
    });

    if (cachedRecord) {
      const recordData = cachedRecord.get({ plain: true });
      const atoms = Array.isArray(recordData.atoms) ? recordData.atoms : [];
      const bonds = Array.isArray(recordData.bonds) ? recordData.bonds : [];
      const geo = inferGeometry(
        recordData.formula || cleanName,
        atoms.length,
        (recordData.recordType as any) || "3d"
      );

      return NextResponse.json(
        {
          cid: recordData.cid ?? null,
          name: recordData.molecule || cleanName,
          formula: recordData.formula || cleanName,
          iupacName: recordData.iupacName || recordData.molecule || cleanName,
          molecularWeight: recordData.molecularWeight || "Unknown",
          recordType: recordData.recordType || "3d",
          sdf: recordData.sdf || null,
          atoms,
          bonds,
          geometry: geo.geometry,
          bondAngles: geo.bondAngles,
          source: "database",
        },
        { status: 200 }
      );
    }
  } catch (dbErr: any) {
    console.warn("Database first-lookup skipped or failed:", dbErr.message);
  }

  // 2. PubChem Fallback + Auto-Persistence
  try {
    let cid: number | null = numericCid;

    if (!cid) {
      const nameUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(cleanName)}/cids/JSON`;
      const nameRes = await fetch(nameUrl);

      if (nameRes.ok) {
        const nameJson = await nameRes.json();
        cid = nameJson.IdentifierList?.CID?.[0] || null;
      }

      if (!cid) {
        const formulaUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/fastformula/${encodeURIComponent(cleanName)}/cids/JSON`;
        const formulaRes = await fetch(formulaUrl);
        if (formulaRes.ok) {
          const formulaJson = await formulaRes.json();
          cid = formulaJson.IdentifierList?.CID?.[0] || null;
        }
      }
    }

    if (!cid) {
      return NextResponse.json(
        {
          error: "NOT_FOUND",
          message: "Molecule not found. Please verify the chemical name or formula.",
        },
        { status: 404 }
      );
    }

    let recordType: "3d" | "2d" = "3d";
    let sdfRes = await fetch(
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/record/SDF?record_type=3d`
    );

    if (!sdfRes.ok) {
      sdfRes = await fetch(
        `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/record/SDF?record_type=2d`
      );
      recordType = "2d";
    }

    if (!sdfRes.ok) {
      return NextResponse.json(
        {
          error: "NOT_FOUND",
          message: "Structure data could not be retrieved from molecular database for this compound.",
        },
        { status: 404 }
      );
    }

    const sdf = await sdfRes.text();
    if (!sdf || sdf.trim().length === 0) {
      return NextResponse.json(
        {
          error: "NOT_FOUND",
          message: "Empty structure payload received from molecular database.",
        },
        { status: 404 }
      );
    }

    let formula = cleanName;
    let iupacName = cleanName;
    let molecularWeight = "Unknown";

    try {
      const propUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/IUPACName,MolecularFormula,MolecularWeight/JSON`;
      const propRes = await fetch(propUrl);
      if (propRes.ok) {
        const propJson = await propRes.json();
        const props = propJson.PropertyTable?.Properties?.[0] || {};
        if (props.MolecularFormula) formula = props.MolecularFormula;
        if (props.IUPACName) iupacName = props.IUPACName;
        if (props.MolecularWeight !== undefined) molecularWeight = String(props.MolecularWeight);
      }
    } catch {
      // Non-critical metadata failure
    }

    const parsed = parseSdf(sdf);
    const geo = inferGeometry(formula || cleanName, parsed.atoms.length, recordType);

    const responsePayload = {
      cid,
      name: cleanName,
      formula,
      iupacName,
      molecularWeight,
      recordType,
      sdf,
      atoms: parsed.atoms,
      bonds: parsed.bonds,
      geometry: geo.geometry,
      bondAngles: geo.bondAngles,
      source: "pubchem_persisted",
    };

    try {
      await ensureDbSynced();
      await Molecule.upsert({
        molecule: normalizedName,
        formula,
        category: "basic",
        description: `CID ${cid}: ${iupacName}`,
        cid,
        iupacName,
        molecularWeight,
        sdf,
        recordType,
        atoms: parsed.atoms,
        bonds: parsed.bonds,
      });
      console.log(`Successfully cached "${cleanName}" (CID: ${cid}) to local MySQL database.`);
    } catch (saveErr: any) {
      console.warn(`Auto-persistence to DB failed for "${cleanName}":`, saveErr.message);
    }

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (err: any) {
    console.error(`Molecule retrieval exception for "${cleanName}":`, err.message);
    return NextResponse.json(
      {
        error: "SERVER_ERROR",
        message: "An unexpected error occurred while resolving the molecule structure.",
      },
      { status: 500 }
    );
  }
}
