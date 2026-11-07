import { NextResponse } from "next/server";
import { Reaction, Molecule, ensureDbSynced } from "@/lib/db";

type Atom = { element: string; x: number; y: number; z: number };
type Bond = { source: number; target: number; order?: number };
type MoleculeData = { atoms: Atom[]; bonds: Bond[]; formula?: string };

const ELEMENT_MAP: Record<number, string> = {
  1: "H",
  6: "C",
  7: "N",
  8: "O",
  9: "F",
  11: "Na",
  16: "S",
  17: "Cl",
  20: "Ca",
  26: "Fe",
  30: "Zn",
};

const NAME_ALIASES: Record<string, string> = {
  chlorine: "cl2",
  "chlorine gas": "cl2",
  oxygen: "o2",
  "oxygen gas": "o2",
  hydrogen: "h2",
  "hydrogen gas": "h2",
  nitrogen: "n2",
  "nitrogen gas": "n2",
};

const SIMPLE_FALLBACKS: Record<string, MoleculeData> = {
  water: {
    formula: "H2O",
    atoms: [
      { element: "O", x: 0, y: 0, z: 0 },
      { element: "H", x: -0.9, y: 0.6, z: 0 },
      { element: "H", x: 0.9, y: 0.6, z: 0 },
    ],
    bonds: [
      { source: 0, target: 1, order: 1 },
      { source: 0, target: 2, order: 1 },
    ],
  },
  methane: {
    formula: "CH4",
    atoms: [
      { element: "C", x: 0, y: 0, z: 0 },
      { element: "H", x: 1.2, y: 0.7, z: 0.2 },
      { element: "H", x: -1.2, y: -0.3, z: 0.4 },
      { element: "H", x: 0.2, y: -1.2, z: -0.8 },
      { element: "H", x: -0.3, y: 0.8, z: -1.1 },
    ],
    bonds: [
      { source: 0, target: 1, order: 1 },
      { source: 0, target: 2, order: 1 },
      { source: 0, target: 3, order: 1 },
      { source: 0, target: 4, order: 1 },
    ],
  },
  ammonia: {
    formula: "NH3",
    atoms: [
      { element: "N", x: 0, y: 0, z: 0 },
      { element: "H", x: 1.1, y: 0.2, z: 0 },
      { element: "H", x: -0.5, y: 1.0, z: 0 },
      { element: "H", x: -0.5, y: -0.9, z: 0 },
    ],
    bonds: [
      { source: 0, target: 1, order: 1 },
      { source: 0, target: 2, order: 1 },
      { source: 0, target: 3, order: 1 },
    ],
  },
  "carbon dioxide": {
    formula: "CO2",
    atoms: [
      { element: "C", x: 0, y: 0, z: 0 },
      { element: "O", x: -1.4, y: 0, z: 0 },
      { element: "O", x: 1.4, y: 0, z: 0 },
    ],
    bonds: [
      { source: 0, target: 1, order: 2 },
      { source: 0, target: 2, order: 2 },
    ],
  },
  "sodium chloride": {
    formula: "NaCl",
    atoms: [
      { element: "Na", x: 0, y: 0, z: 0 },
      { element: "Cl", x: 2.3, y: 0, z: 0 },
    ],
    bonds: [{ source: 0, target: 1, order: 1 }],
  },
  "calcium oxide": {
    formula: "CaO",
    atoms: [
      { element: "Ca", x: 0, y: 0, z: 0 },
      { element: "O", x: 2.3, y: 0, z: 0 },
    ],
    bonds: [{ source: 0, target: 1, order: 2 }],
  },
  "calcium carbonate": {
    formula: "CaCO3",
    atoms: [
      { element: "Ca", x: 0, y: 2.1, z: 0 },
      { element: "C", x: 0, y: -0.8, z: 0 },
      { element: "O", x: 0, y: 0.2, z: 0 },
      { element: "O", x: -1.2, y: -1.6, z: 0 },
      { element: "O", x: 1.2, y: -1.6, z: 0 },
    ],
    bonds: [
      { source: 1, target: 2, order: 2 },
      { source: 1, target: 3, order: 1 },
      { source: 1, target: 4, order: 1 },
    ],
  },
  cl2: {
    formula: "Cl2",
    atoms: [
      { element: "Cl", x: -0.9, y: 0, z: 0 },
      { element: "Cl", x: 0.9, y: 0, z: 0 },
    ],
    bonds: [{ source: 0, target: 1, order: 1 }],
  },
  o2: {
    formula: "O2",
    atoms: [
      { element: "O", x: -0.7, y: 0, z: 0 },
      { element: "O", x: 0.7, y: 0, z: 0 },
    ],
    bonds: [{ source: 0, target: 1, order: 2 }],
  },
  h2: {
    formula: "H2",
    atoms: [
      { element: "H", x: -0.4, y: 0, z: 0 },
      { element: "H", x: 0.4, y: 0, z: 0 },
    ],
    bonds: [{ source: 0, target: 1, order: 1 }],
  },
  n2: {
    formula: "N2",
    atoms: [
      { element: "N", x: -0.75, y: 0, z: 0 },
      { element: "N", x: 0.75, y: 0, z: 0 },
    ],
    bonds: [{ source: 0, target: 1, order: 3 }],
  },
};

const FORMULA_FALLBACKS: Record<string, MoleculeData> = {
  H2O: SIMPLE_FALLBACKS.water,
  CH4: SIMPLE_FALLBACKS.methane,
  CO2: SIMPLE_FALLBACKS["carbon dioxide"],
  NH3: SIMPLE_FALLBACKS.ammonia,
  NaCl: SIMPLE_FALLBACKS["sodium chloride"],
  CaO: SIMPLE_FALLBACKS["calcium oxide"],
  CaCO3: SIMPLE_FALLBACKS["calcium carbonate"],
  Cl2: SIMPLE_FALLBACKS.cl2,
  O2: SIMPLE_FALLBACKS.o2,
  H2: SIMPLE_FALLBACKS.h2,
  N2: SIMPLE_FALLBACKS.n2,
};

function normalizeMoleculeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function getFallbackStructure(name: string, formula?: string): MoleculeData | null {
  const normalizedName = normalizeMoleculeName(name);
  const aliasKey = NAME_ALIASES[normalizedName] || normalizedName;

  const directFallback = SIMPLE_FALLBACKS[aliasKey];
  if (directFallback) {
    return directFallback;
  }

  const compact = aliasKey.replace(/\s+/g, "");
  const compactFallback = SIMPLE_FALLBACKS[compact];
  if (compactFallback) {
    return compactFallback;
  }

  if (formula) {
    const normalizedFormula = formula.replace(/\s+/g, "").toUpperCase();
    return FORMULA_FALLBACKS[normalizedFormula] || null;
  }

  return null;
}

async function fetchMoleculeFromPubChem(name: string): Promise<MoleculeData | null> {
  const normalizedName = normalizeMoleculeName(name);
  const fallback = getFallbackStructure(normalizedName);
  if (fallback) {
    return fallback;
  }

  try {
    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(normalizedName)}/JSON?record_type=3d`;
    let response = await fetch(url);
    let is2D = false;

    if (!response.ok) {
      const fallbackUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(normalizedName)}/JSON`;
      response = await fetch(fallbackUrl);
      is2D = true;
    }

    if (!response.ok) {
      throw new Error(`PubChem returned status ${response.status} for "${name}"`);
    }

    const payload = await response.json();
    const compound = payload.PC_Compounds?.[0];
    if (!compound) {
      throw new Error(`No compound record found in PubChem response for "${name}"`);
    }

    const atomCount = compound.atoms?.element?.length || 0;
    const aidArray = compound.atoms?.aid || [];
    const conformer = compound.coords?.[0]?.conformers?.[0];
    const xCoords = Array.isArray(conformer?.x) ? conformer.x : [];
    const yCoords = Array.isArray(conformer?.y) ? conformer.y : [];
    const zCoords = Array.isArray(conformer?.z) && conformer.z.length > 0 ? conformer.z : new Array(atomCount).fill(0);

    const atoms: Atom[] = [];
    for (let index = 0; index < atomCount; index += 1) {
      const atomicNumber = compound.atoms?.element?.[index];
      const elementSymbol = ELEMENT_MAP[atomicNumber] || "X";
      atoms.push({
        element: elementSymbol,
        x: xCoords[index] || 0,
        y: yCoords[index] || 0,
        z: is2D ? 0 : (zCoords[index] || 0),
      });
    }

    const bonds: Bond[] = [];
    const bondAid1 = compound.bonds?.aid1 || [];
    const bondAid2 = compound.bonds?.aid2 || [];
    const bondOrder = compound.bonds?.order || [];
    const indexByAid = new Map<number, number>();
    aidArray.forEach((aid: number, index: number) => {
      indexByAid.set(aid, index);
    });

    bondAid1.forEach((aid1: number, index: number) => {
      const aid2 = bondAid2[index];
      const source = indexByAid.get(aid1) ?? aid1 - 1;
      const target = indexByAid.get(aid2) ?? aid2 - 1;
      bonds.push({
        source,
        target,
        order: bondOrder[index] || 1,
      });
    });

    const props = compound.props || [];
    const formulaProp = props.find((prop: any) => prop.urn?.label === "Molecular Formula");
    const formula = formulaProp?.value?.sval || undefined;

    return {
      atoms,
      bonds,
      formula,
    };
  } catch (error: any) {
    console.warn(`Failed to fetch dynamic 3D structure for "${name}":`, error.message);
    return getFallbackStructure(name);
  }
}

export async function GET() {
  try {
    await ensureDbSynced();

    const reactions = await Reaction.findAll();

    // Helper to safely parse JSON or array components
    const parseJsonArray = (raw: any): any[] => {
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      if (typeof raw === "string") {
        try {
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return [];
    };

    // Collect all molecule IDs and molecule names from all reactions
    const referencedMoleculeIds = new Set<number>();
    const moleculeNamesSet = new Set<string>();

    reactions.forEach((reaction) => {
      const reactants = parseJsonArray(reaction.reactants);
      const products = parseJsonArray(reaction.products);

      reactants.forEach((entry) => {
        if (entry.moleculeId) referencedMoleculeIds.add(Number(entry.moleculeId));
        if (entry.molecule) moleculeNamesSet.add(normalizeMoleculeName(entry.molecule));
      });

      products.forEach((entry) => {
        if (entry.moleculeId) referencedMoleculeIds.add(Number(entry.moleculeId));
        if (entry.molecule) moleculeNamesSet.add(normalizeMoleculeName(entry.molecule));
      });
    });

    // Fetch all molecules from DB with geometry and formulas
    const moleculeRecords = await Molecule.findAll({
      attributes: ["id", "molecule", "formula", "atoms", "bonds"],
    });

    const moleculeById = new Map<number, any>();
    const moleculeDataMap: Record<string, MoleculeData> = {};

    moleculeRecords.forEach((record: any) => {
      const normalizedName = normalizeMoleculeName(record.molecule);
      const atoms = parseJsonArray(record.atoms);
      const bonds = parseJsonArray(record.bonds);
      const data: MoleculeData = {
        atoms,
        bonds,
        formula: record.formula,
      };
      moleculeById.set(record.id, {
        id: record.id,
        molecule: record.molecule,
        formula: record.formula,
        atoms,
        bonds,
      });
      moleculeDataMap[normalizedName] = data;
      if (record.formula) {
        moleculeDataMap[normalizeMoleculeName(record.formula)] = data;
      }
    });

    // Check for missing molecules that need PubChem dynamic fetching
    const normalizedMoleculeNames = Array.from(moleculeNamesSet);
    const missingMoleculeNames = normalizedMoleculeNames.filter((name) => !moleculeDataMap[name]);

    if (missingMoleculeNames.length > 0) {
      await Promise.all(
        missingMoleculeNames.map(async (name) => {
          const fetchedData = await fetchMoleculeFromPubChem(name);
          if (!fetchedData) {
            return;
          }

          try {
            await Molecule.upsert({
              molecule: name,
              formula: fetchedData.formula || name,
              category: "basic",
              description: `Dynamically compiled 3D data structure for ${name}.`,
              atoms: fetchedData.atoms,
              bonds: fetchedData.bonds,
            });

            moleculeDataMap[name] = fetchedData;
            console.log(`Cached dynamic molecule geometry for "${name}"`);
          } catch (dbError: any) {
            console.error(`Failed to cache molecule "${name}":`, dbError.message);
          }
        })
      );
    }

    const resolveComponent = (entry: any) => {
      let molRecord: any = null;
      if (entry.moleculeId) {
        molRecord = moleculeById.get(Number(entry.moleculeId));
      }
      if (!molRecord && entry.molecule) {
        const norm = normalizeMoleculeName(entry.molecule);
        molRecord = moleculeRecords.find(
          (m: any) => normalizeMoleculeName(m.molecule) === norm || normalizeMoleculeName(m.formula) === norm
        );
      }

      const moleculeName = entry.molecule || molRecord?.molecule || molRecord?.formula || "Unknown";
      const formula = molRecord?.formula || entry.formula || moleculeName;
      const key = normalizeMoleculeName(moleculeName);
      const atoms = parseJsonArray(molRecord?.atoms);
      const bonds = parseJsonArray(molRecord?.bonds);
      const cached = moleculeDataMap[key] || moleculeDataMap[normalizeMoleculeName(formula)] || null;
      const data: MoleculeData | null = atoms.length
        ? { atoms, bonds, formula }
        : cached;

      return {
        moleculeId: entry.moleculeId || molRecord?.id,
        molecule: moleculeName,
        formula,
        coefficient: Number(entry.coefficient) || 1,
        data,
      };
    };

    const enrichedReactions = reactions.map((reaction) => {
      const plainReaction = reaction.get({ plain: true });
      const rawReactants = parseJsonArray(plainReaction.reactants);
      const rawProducts = parseJsonArray(plainReaction.products);

      const enrichedReactants = rawReactants.map(resolveComponent);
      const enrichedProducts = rawProducts.map(resolveComponent);

      return {
        ...plainReaction,
        category:
          typeof plainReaction.category === "string" && plainReaction.category.trim()
            ? plainReaction.category.trim().toLowerCase()
            : undefined,
        reactants: enrichedReactants,
        products: enrichedProducts,
      };
    });

    return NextResponse.json({ reactions: enrichedReactions }, { status: 200 });
  } catch (error: any) {
    console.error("Reaction route failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch reactions", details: error.message },
      { status: 500 }
    );
  }
}