import React from "react";
import { cleanReactionEquation } from "@/lib/reaction-equation";

function formatMolecularFormula(
  formula: string,
  keyPrefix: string
): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const regex = /([A-Z][a-z]?)(\d*)/g;
  let match: RegExpExecArray | null;
  let index = 0;
  let lastIndex = 0;

  while ((match = regex.exec(formula)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <React.Fragment key={`${keyPrefix}-txt-${index}`}>
          {formula.slice(lastIndex, match.index)}
        </React.Fragment>
      );
    }
    nodes.push(
      <React.Fragment key={`${keyPrefix}-el-${index}`}>{match[1]}</React.Fragment>
    );
    if (match[2]) {
      nodes.push(
        <sub key={`${keyPrefix}-sub-${index}`}>{match[2]}</sub>
      );
    }
    lastIndex = regex.lastIndex;
    index += 1;
  }

  if (lastIndex < formula.length) {
    nodes.push(
      <React.Fragment key={`${keyPrefix}-tail`}>{formula.slice(lastIndex)}</React.Fragment>
    );
  }

  if (nodes.length === 0) {
    return [formula];
  }

  return nodes;
}

function formatTerm(term: string, keyPrefix: string): React.ReactNode[] {
  const trimmed = term.trim();
  if (!trimmed) return [];

  const withCoefficient = trimmed.match(/^(\d+)([A-Z].*)$/);
  if (withCoefficient) {
    return [
      <React.Fragment key={`${keyPrefix}-coef`}>{withCoefficient[1]}</React.Fragment>,
      ...formatMolecularFormula(withCoefficient[2], `${keyPrefix}-f`),
    ];
  }

  if (/[A-Z][a-z]?\d/.test(trimmed) || /^[A-Z][a-z]?/.test(trimmed)) {
    return formatMolecularFormula(trimmed, keyPrefix);
  }

  return [trimmed];
}

function formatSide(side: string, sideKey: string): React.ReactNode[] {
  const terms = side.split(/\s*\+\s*/).filter(Boolean);
  const nodes: React.ReactNode[] = [];

  terms.forEach((term, index) => {
    if (index > 0) {
      nodes.push(
        <React.Fragment key={`${sideKey}-plus-${index}`}> + </React.Fragment>
      );
    }
    nodes.push(
      ...formatTerm(term, `${sideKey}-term-${index}`)
    );
  });

  return nodes;
}

/**
 * Formats a chemical equation or molecular formula with HTML subscripts for
 * stoichiometric numbers inside formulas. Leading coefficients stay normal size.
 */
export function formatChemicalFormula(formula: string, conditions?: string | null): React.ReactNode {
  const trimmed = cleanReactionEquation(formula, conditions).trim();
  if (!trimmed) return null;

  const arrowMatch = trimmed.match(/^(.*)(\s*(?:->|→|<->|=)\s*)(.*)$/);
  if (!arrowMatch) {
    return <>{formatTerm(trimmed, "single")}</>;
  }

  const [, left, arrow, right] = arrowMatch;
  const displayArrow = arrow.includes("->") ? " → " : arrow.trim() === "=" ? " = " : ` ${arrow.trim()} `;

  return (
    <>
      {formatSide(left, "left")}
      <React.Fragment key="arrow">{displayArrow}</React.Fragment>
      {formatSide(right, "right")}
    </>
  );
}

export function formatSpeciesLabel(
  coefficient: number,
  molecule: string,
  formula?: string | null
): React.ReactNode {
  const chemical = (formula || molecule).trim();
  const looksChemical =
    Boolean(formula) ||
    /^(\d+)?[A-Z][a-z]?(\d|$)/.test(chemical) ||
    /[A-Z][a-z]?\d/.test(chemical);

  if (looksChemical) {
    const term = coefficient > 1 ? `${coefficient}${chemical}` : chemical;
    return formatChemicalFormula(term);
  }

  if (coefficient > 1) {
    return (
      <>
        {coefficient}
        {" × "}
        {molecule}
      </>
    );
  }

  return molecule;
}

export function buildReactionEquation(reaction: {
  reactants: Array<{ molecule: string; coefficient: number; data?: { formula?: string } | null }>;
  products: Array<{ molecule: string; coefficient: number; data?: { formula?: string } | null }>;
}): string {
  const sideToString = (
    entries: Array<{ molecule: string; coefficient: number; data?: { formula?: string } | null }>
  ) =>
    entries
      .map((entry) => {
        const label = entry.data?.formula || entry.molecule;
        return entry.coefficient > 1 ? `${entry.coefficient}${label}` : label;
      })
      .join(" + ");

  return `${sideToString(reaction.reactants)} -> ${sideToString(reaction.products)}`;
}
