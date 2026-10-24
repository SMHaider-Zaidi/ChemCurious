import { NextResponse } from "next/server";
import { Molecule, ensureDbSynced } from "@/lib/db";
import { parseSdf, inferGeometry } from "@/lib/pubchem";

function normalizeMoleculeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function GET(
  request: Request,
  context: { params: Promise<{ name: string }> }
) {
  const params = await context.params;
  const requestedName = params?.name;

  if (!requestedName) {
    return NextResponse.json(
      { error: "INVALID_REQUEST", message: "Molecule name is required" },
      { status: 400 }
    );
  }

  const cleanName = decodeURIComponent(requestedName).trim();
  const normalizedName = normalizeMoleculeName(cleanName);

  // 1. Live PubChem Multi-Step Retrieval Pipeline
  try {
    // Step 1: Resolve Compound Name to CID (with formula fallback)
    let cid: number | null = null;
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

    if (cid) {
      // Step 2: Fetch 3D conformer SDF, fall back to 2D conformer SDF
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

      if (sdfRes.ok) {
        const sdf = await sdfRes.text();
        if (sdf && sdf.trim().length > 0) {
          // Step 3: Fetch Structural Metadata for Info Card
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
          };

          // Cache fresh structure in DB in background
          try {
            await ensureDbSynced();
            await Molecule.upsert({
              molecule: normalizedName,
              formula,
              category: "basic",
              description: `PubChem CID ${cid}: ${iupacName}`,
              atoms: parsed.atoms,
              bonds: parsed.bonds,
            });
          } catch {
            // Non-fatal if DB is offline or table issue
          }

          return NextResponse.json(responsePayload, { status: 200 });
        }
      }
    }
  } catch (pubChemErr: any) {
    console.warn(`PubChem live retrieval error for "${cleanName}":`, pubChemErr.message);
  }

  // 2. Database Fallback (if PubChem had network issue or offline)
  try {
    await ensureDbSynced();
    const moleculeRecord = await Molecule.findOne({
      where: { molecule: normalizedName },
    });

    if (moleculeRecord) {
      const recordData = moleculeRecord.get({ plain: true });
      const atoms = Array.isArray(recordData.atoms) ? recordData.atoms : [];
      const bonds = Array.isArray(recordData.bonds) ? recordData.bonds : [];
      const geo = inferGeometry(recordData.formula || cleanName, atoms.length);

      return NextResponse.json(
        {
          name: cleanName,
          formula: recordData.formula || cleanName,
          category: recordData.category || "basic",
          description: recordData.description || `Structure for ${cleanName}`,
          atoms,
          bonds,
          geometry: geo.geometry,
          bondAngles: geo.bondAngles,
          recordType: "3d",
        },
        { status: 200 }
      );
    }
  } catch (dbErr: any) {
    console.warn("Database fallback also unavailable:", dbErr.message);
  }

  // 3. Molecule Not Found
  return NextResponse.json(
    {
      error: "NOT_FOUND",
      message: "Molecule not found. Please verify the chemical name or formula.",
    },
    { status: 404 }
  );
}
