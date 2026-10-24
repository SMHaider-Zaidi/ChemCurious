const ARROW_PATTERN = /(?:<->|<=>|→|->|=)/;
const ARROW_SPLIT_PATTERN = /\s*(?:<->|<=>|→|->|=)\s*/;

const DEFAULT_CONDITION_TOKENS = [
  "heat",
  "heating",
  "light",
  "sunlight",
  "uv",
  "electricity",
  "electrolysis",
  "combustion",
  "burning",
  "catalyst",
  "conc",
  "concentrated",
  "dilute",
  "delta",
  "∆",
  "Δ",
  "pt",
  "ni",
  "pd",
  "fe",
  "v2o5",
  "mno2",
  "h2so4",
  "h2so4he",
  "hcl",
  "alcl3",
  "fecl3",
  "h3po4",
  "p2o5",
  "ozonide",
  "enzyme",
  "pressure",
  "reflux",
  "steam",
  "he",
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeToken(value: string): string {
  return value.replace(/[^a-z0-9∆Δ]/gi, "").toLowerCase();
}

function parseConditionTokens(conditions?: string | null): string[] {
  if (!conditions) return [];

  return conditions
    .replace(/^conditions:\s*/i, "")
    .split(/[,;/]+|\s+and\s+/i)
    .map((part) => part.trim())
    .filter((part) => part && !/^none$/i.test(part));
}

function conditionTokenSet(conditions?: string | null): string[] {
  const tokens = new Set<string>(DEFAULT_CONDITION_TOKENS);

  parseConditionTokens(conditions).forEach((part) => {
    const normalized = normalizeToken(part);
    if (normalized && normalized !== "none") {
      tokens.add(normalized);
    }
    part.split(/\s+/).forEach((word) => {
      const normalizedWord = normalizeToken(word);
      if (normalizedWord && normalizedWord !== "none") {
        tokens.add(normalizedWord);
      }
    });
  });

  return [...tokens].filter((token) => token.length >= 2).sort((a, b) => b.length - a.length);
}

function looksLikeChemicalTerm(term: string): boolean {
  const compact = term.replace(/\s+/g, "");
  return /^(\d+)?(\(([A-Z][a-z]?\d*)+\)\d*|[A-Z][a-z]?\d*|\([A-Za-z0-9=≡\-]+\)|[A-Za-z0-9=≡\-]+)+$/.test(
    compact
  );
}

function isConditionOnlySegment(segment: string, tokens: string[]): boolean {
  const bits = segment
    .split(/[,+/]+/)
    .map((bit) => bit.trim())
    .filter(Boolean);

  if (bits.length === 0) return true;

  return bits.every((bit) => {
    const normalized = normalizeToken(bit);
    return tokens.includes(normalized) || (!looksLikeChemicalTerm(bit) && /[a-z]/.test(bit));
  });
}

function stripLeadingConditionPrefixes(products: string, tokens: string[]): string {
  let remaining = products.trim();
  let changed = true;

  while (changed && remaining) {
    changed = false;
    remaining = remaining.replace(/^[\s,;:/()\-→>]+/, "");

    for (const token of tokens) {
      const prefixMatch = remaining.match(new RegExp(`^(${escapeRegExp(token)})`, "i"));
      if (!prefixMatch) continue;

      const remainder = remaining.slice(prefixMatch[0].length).replace(/^[\s,;:/()\-→>]+/, "");
      if (!remainder) continue;

      const firstTerm = remainder.split(/\s*\+\s*/)[0]?.trim() || "";
      if (looksLikeChemicalTerm(firstTerm) || remainder.includes("+")) {
        remaining = remainder;
        changed = true;
        break;
      }
    }
  }

  return remaining.trim();
}

/**
 * Pulls catalyst/condition text out of a description field or equation string.
 */
export function extractReactionConditions(
  conditionsOrDescription?: string | null,
  equation?: string | null
): string | undefined {
  const fromField = (conditionsOrDescription || "").trim();
  let fromDescription: string | undefined;

  if (fromField) {
    const labeled = fromField.match(/^conditions:\s*(.+)$/i);
    if (labeled && labeled[1] && !/^none$/i.test(labeled[1].trim())) {
      fromDescription = labeled[1].trim();
    } else if (
      DEFAULT_CONDITION_TOKENS.some((token) => normalizeToken(fromField).includes(token)) &&
      fromField.length < 80
    ) {
      fromDescription = fromField.replace(/^conditions:\s*/i, "").trim();
    }
  }

  const tokens = conditionTokenSet(fromDescription);
  const embedded: string[] = [];

  if (equation && ARROW_PATTERN.test(equation)) {
    const parts = equation.split(ARROW_SPLIT_PATTERN).map((part) => part.trim()).filter(Boolean);
    parts.slice(1, -1).forEach((part) => {
      if (isConditionOnlySegment(part, tokens) || !looksLikeChemicalTerm(part.split(/\s*\+\s*/)[0] || part)) {
        parseConditionTokens(part).forEach((token) => {
          if (!/^none$/i.test(token)) embedded.push(token);
        });
      }
    });
  }

  const unique = [...new Set([...(fromDescription ? parseConditionTokens(fromDescription) : []), ...embedded])];
  return unique.length ? unique.join(", ") : undefined;
}

/**
 * Strips catalysts and condition tokens that were written over the reaction arrow
 * (e.g. "CH3COOH + C2H5OH -> H2SO4, Heat -> CH3COOC2H5 + H2O").
 */
export function cleanReactionEquation(nameOrFormula: string, conditions?: string | null): string {
  const raw = (nameOrFormula || "").trim();
  if (!raw) return "";

  const tokens = conditionTokenSet(conditions);

  if (!ARROW_PATTERN.test(raw)) {
    return raw;
  }

  const parts = raw.split(ARROW_SPLIT_PATTERN).map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return raw;

  const left = parts[0];
  let productIndex = parts.length - 1;

  while (productIndex > 1 && isConditionOnlySegment(parts[productIndex], tokens)) {
    productIndex -= 1;
  }

  const omittedMiddles = parts.slice(1, productIndex);
  const extraConditions = omittedMiddles.join(", ");
  let right = stripLeadingConditionPrefixes(parts[productIndex], conditionTokenSet(`${conditions || ""}, ${extraConditions}`));

  if (!right) {
    right = parts[productIndex];
  }

  return `${left} -> ${right}`;
}

export function formatConditionsLabel(conditions?: string | null): string | undefined {
  const cleaned = (conditions || "").replace(/^conditions:\s*/i, "").trim();
  if (!cleaned || /^none$/i.test(cleaned)) return undefined;
  return `Conditions: ${cleaned}`;
}

type Species = {
  molecule: string;
  coefficient: number;
  data?: { formula?: string } | null;
};

function speciesSideToString(entries: Species[]): string {
  return entries
    .map((entry) => {
      const label = entry.molecule;
      return entry.coefficient > 1 ? `${entry.coefficient}${label}` : label;
    })
    .join(" + ");
}

/**
 * Prefers a sanitized original equation (keeps formula notation). Falls back to
 * reconstructing from reactant/product arrays so conditions never leak in.
 */
export function getDisplayReactionEquation(reaction: {
  name?: string | null;
  description?: string | null;
  conditions?: string | null;
  reactants?: Species[];
  products?: Species[];
}): string {
  const conditions = extractReactionConditions(
    reaction.conditions || reaction.description,
    reaction.name
  );
  const cleanedName = cleanReactionEquation(reaction.name || "", conditions);

  if (ARROW_PATTERN.test(cleanedName)) {
    return cleanedName;
  }

  if (reaction.reactants?.length && reaction.products?.length) {
    return `${speciesSideToString(reaction.reactants)} -> ${speciesSideToString(reaction.products)}`;
  }

  return cleanedName;
}
