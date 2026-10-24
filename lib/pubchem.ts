export interface MoleculeData {
  cid?: number;
  name: string;
  formula: string;
  iupacName?: string;
  molecularWeight?: string;
  recordType?: "3d" | "2d";
  sdf?: string;
  geometry?: string;
  bondAngles?: string;
  atoms: Array<{
    element: string;
    position: [number, number, number];
    x?: number;
    y?: number;
    z?: number;
    color?: string;
  }>;
  bonds: Array<{
    from: number;
    to: number;
    source?: number;
    target?: number;
    order?: number;
    type?: "single" | "double" | "triple";
  }>;
}

const COMMON_GEOMETRIES: Record<string, { geometry: string; bondAngles?: string }> = {
  h2o: { geometry: "Bent", bondAngles: "104.5°" },
  water: { geometry: "Bent", bondAngles: "104.5°" },
  co2: { geometry: "Linear", bondAngles: "180°" },
  "carbon dioxide": { geometry: "Linear", bondAngles: "180°" },
  ch4: { geometry: "Tetrahedral", bondAngles: "109.5°" },
  methane: { geometry: "Tetrahedral", bondAngles: "109.5°" },
  nh3: { geometry: "Trigonal Pyramidal", bondAngles: "107°" },
  ammonia: { geometry: "Trigonal Pyramidal", bondAngles: "107°" },
  so2: { geometry: "Bent", bondAngles: "119°" },
  "sulfur dioxide": { geometry: "Bent", bondAngles: "119°" },
  so3: { geometry: "Trigonal Planar", bondAngles: "120°" },
  "sulfur trioxide": { geometry: "Trigonal Planar", bondAngles: "120°" },
  bf3: { geometry: "Trigonal Planar", bondAngles: "120°" },
  c6h6: { geometry: "Planar Hexagonal", bondAngles: "120°" },
  benzene: { geometry: "Planar Hexagonal", bondAngles: "120°" },
  caffeine: { geometry: "Fused Heterocyclic Planar", bondAngles: "120° / 109.5°" },
  aspirin: { geometry: "Planar Aromatic with Substituents", bondAngles: "120° / 109.5°" },
  glucose: { geometry: "Pyranose Ring (Chair Conformation)", bondAngles: "109.5°" },
  ethanol: { geometry: "Tetrahedral Centers (sp³)", bondAngles: "109.5°" },
  c2h5oh: { geometry: "Tetrahedral Centers (sp³)", bondAngles: "109.5°" },
  c2h6o: { geometry: "Tetrahedral Centers (sp³)", bondAngles: "109.5°" },
  nacl: { geometry: "Linear Diatomic / Ionic Lattice", bondAngles: "N/A (Ionic)" },
  "sodium chloride": { geometry: "Linear Diatomic / Ionic Lattice", bondAngles: "N/A (Ionic)" },
  caco3: { geometry: "Trigonal Planar Carbonate with Ca²⁺", bondAngles: "120°" },
  "calcium carbonate": { geometry: "Trigonal Planar Carbonate with Ca²⁺", bondAngles: "120°" },
  hcl: { geometry: "Linear", bondAngles: "180°" },
  "hydrogen chloride": { geometry: "Linear", bondAngles: "180°" },
  o2: { geometry: "Linear", bondAngles: "180°" },
  oxygen: { geometry: "Linear", bondAngles: "180°" },
  n2: { geometry: "Linear", bondAngles: "180°" },
  nitrogen: { geometry: "Linear", bondAngles: "180°" },
  h2: { geometry: "Linear", bondAngles: "180°" },
  hydrogen: { geometry: "Linear", bondAngles: "180°" },
};

export function inferGeometry(nameOrFormula: string, atomCount?: number, recordType?: "3d" | "2d"): {
  geometry: string;
  bondAngles: string;
} {
  const key = nameOrFormula.trim().toLowerCase().replace(/[\s\-_]/g, "");
  for (const [known, val] of Object.entries(COMMON_GEOMETRIES)) {
    if (known.replace(/[\s\-_]/g, "") === key) {
      return {
        geometry: val.geometry,
        bondAngles: val.bondAngles || "Determined by VSEPR",
      };
    }
  }

  if (atomCount === 2) {
    return { geometry: "Linear Diatomic", bondAngles: "180°" };
  }
  if (atomCount === 3) {
    return { geometry: "Bent / Linear", bondAngles: "104.5° - 180°" };
  }
  if (atomCount === 4) {
    return { geometry: "Trigonal Planar / Pyramidal", bondAngles: "107° - 120°" };
  }
  if (atomCount === 5) {
    return { geometry: "Tetrahedral", bondAngles: "109.5°" };
  }

  return {
    geometry: recordType === "2d" ? "Planar Structure (2D)" : "Polyatomic Spatial Network",
    bondAngles: "Conformer-Optimized",
  };
}

export function parseSdf(sdf: string): {
  numAtoms: number;
  numBonds: number;
  atoms: Array<{ element: string; position: [number, number, number]; x: number; y: number; z: number }>;
  bonds: Array<{ from: number; to: number; source: number; target: number; order: number; type: "single" | "double" | "triple" }>;
} {
  const lines = sdf.split(/\r?\n/);
  let v2000Index = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("V2000")) {
      v2000Index = i;
      break;
    }
  }

  if (v2000Index === -1) {
    return { numAtoms: 0, numBonds: 0, atoms: [], bonds: [] };
  }

  const countsLine = lines[v2000Index];
  const numAtoms = parseInt(countsLine.substring(0, 3).trim(), 10) || 0;
  const numBonds = parseInt(countsLine.substring(3, 6).trim(), 10) || 0;

  const atoms: Array<{ element: string; position: [number, number, number]; x: number; y: number; z: number }> = [];
  for (let i = 0; i < numAtoms; i++) {
    const line = lines[v2000Index + 1 + i];
    if (!line) continue;
    const x = parseFloat(line.substring(0, 10).trim()) || 0;
    const y = parseFloat(line.substring(10, 20).trim()) || 0;
    const z = parseFloat(line.substring(20, 30).trim()) || 0;
    const element = line.substring(31, 34).trim() || "C";
    atoms.push({ element, position: [x, y, z], x, y, z });
  }

  const bonds: Array<{
    from: number;
    to: number;
    source: number;
    target: number;
    order: number;
    type: "single" | "double" | "triple";
  }> = [];

  for (let i = 0; i < numBonds; i++) {
    const line = lines[v2000Index + 1 + numAtoms + i];
    if (!line) continue;
    const from = (parseInt(line.substring(0, 3).trim(), 10) || 1) - 1;
    const to = (parseInt(line.substring(3, 6).trim(), 10) || 1) - 1;
    const order = parseInt(line.substring(6, 9).trim(), 10) || 1;
    bonds.push({
      from,
      to,
      source: from,
      target: to,
      order,
      type: order === 2 ? "double" : order === 3 ? "triple" : "single",
    });
  }

  return { numAtoms, numBonds, atoms, bonds };
}

/**
 * Direct browser fallback fetcher for PubChem REST API in case internal Next.js API route is unavailable
 */
export async function fetchDirectFromPubChem(query: string): Promise<MoleculeData> {
  const trimmed = query.trim();
  if (!trimmed) {
    throw new Error("Molecule name or formula is required");
  }

  // Step 1: Resolve Name to CID (with formula fallback)
  let cid: number | null = null;
  const nameUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(trimmed)}/cids/JSON`;
  const nameRes = await fetch(nameUrl);

  if (nameRes.ok) {
    const json = await nameRes.json();
    cid = json.IdentifierList?.CID?.[0] || null;
  }

  if (!cid) {
    const formulaUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/fastformula/${encodeURIComponent(trimmed)}/cids/JSON`;
    const formulaRes = await fetch(formulaUrl);
    if (formulaRes.ok) {
      const json = await formulaRes.json();
      cid = json.IdentifierList?.CID?.[0] || null;
    }
  }

  if (!cid) {
    throw new Error("Molecule not found. Please verify the chemical name or formula.");
  }

  // Step 2: Fetch 3D conformer SDF, fall back to 2D
  let recordType: "3d" | "2d" = "3d";
  let sdfRes = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/record/SDF?record_type=3d`);

  if (!sdfRes.ok) {
    sdfRes = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/record/SDF?record_type=2d`);
    recordType = "2d";
  }

  if (!sdfRes.ok) {
    throw new Error("Structure data could not be retrieved from PubChem for this compound.");
  }

  const sdf = await sdfRes.text();
  if (!sdf || sdf.trim().length === 0) {
    throw new Error("Empty structure payload received from PubChem.");
  }

  // Step 3: Fetch Structural Properties
  let formula = trimmed;
  let iupacName = trimmed;
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
    // Non-fatal if properties fail
  }

  const parsed = parseSdf(sdf);
  const geo = inferGeometry(formula || trimmed, parsed.atoms.length, recordType);

  return {
    cid,
    name: trimmed,
    formula,
    iupacName,
    molecularWeight,
    recordType,
    sdf,
    geometry: geo.geometry,
    bondAngles: geo.bondAngles,
    atoms: parsed.atoms,
    bonds: parsed.bonds,
  };
}

/**
 * Universal molecule fetcher that queries the internal API route first,
 * falling back to direct PubChem REST API in the browser if needed.
 */
export async function fetchMoleculeData(searchQuery: string): Promise<MoleculeData> {
  const trimmed = searchQuery.trim();
  if (!trimmed) {
    throw new Error("Molecule name is required");
  }

  try {
    const res = await fetch(`/api/molecules/${encodeURIComponent(trimmed)}`);
    const data = await res.json();

    if (res.ok && data && (data.sdf || data.atoms?.length)) {
      const geo = inferGeometry(data.formula || data.name || trimmed, data.atoms?.length, data.recordType);
      return {
        ...data,
        name: data.name || data.molecule || trimmed,
        formula: data.formula || trimmed,
        geometry: data.geometry || geo.geometry,
        bondAngles: data.bondAngles || geo.bondAngles,
      };
    }

    if (data?.message) {
      throw new Error(data.message);
    }
    if (data?.error === "NOT_FOUND") {
      throw new Error("Molecule not found. Please verify the chemical name or formula.");
    }
  } catch (apiErr: any) {
    // If it's explicitly a NOT_FOUND message from the server, rethrow it
    if (apiErr.message && apiErr.message.includes("Molecule not found")) {
      throw apiErr;
    }
    console.warn("Internal API route encountered an issue, falling back to direct PubChem PUG REST...", apiErr.message);
  }

  // Client-side fallback to PubChem
  return await fetchDirectFromPubChem(trimmed);
}
