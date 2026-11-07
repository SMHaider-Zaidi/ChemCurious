import { describe, expect, it } from "vitest";
import { formatChemText, formatFormulaToken, htmlToPlainText, looksLikeFormula } from "../chemFormat";

describe("formatFormulaToken", () => {
  it("subscripts digits in formulas", () => {
    expect(formatFormulaToken("H2SO4")).toBe("H<sub>2</sub>SO<sub>4</sub>");
    expect(formatFormulaToken("Ca(OH)2")).toBe("Ca(OH)<sub>2</sub>");
    expect(formatFormulaToken("Al2(SO4)3")).toBe("Al<sub>2</sub>(SO<sub>4</sub>)<sub>3</sub>");
  });
  it("superscripts charges", () => {
    expect(formatFormulaToken("Fe3+")).toBe("Fe<sup>3+</sup>");
    expect(formatFormulaToken("SO42-")).toBe("SO<sub>4</sub><sup>2−</sup>");
    expect(formatFormulaToken("H+")).toBe("H<sup>+</sup>");
    expect(formatFormulaToken("OH-")).toBe("OH<sup>−</sup>");
    expect(formatFormulaToken("NH4+")).toBe("NH<sub>4</sub><sup>+</sup>");
  });
  it("leaves plain English alone", () => {
    expect(looksLikeFormula("Water")).toBe(false);
    expect(looksLikeFormula("Hello")).toBe(false);
    expect(formatFormulaToken("Water")).toBe("Water");
  });
});

describe("formatChemText", () => {
  it("keeps leading coefficients normal", () => {
    expect(formatChemText("2H2O")).toBe("2H<sub>2</sub>O");
    expect(formatChemText("2H2 + O2 -> 2H2O")).toBe("2H<sub>2</sub> + O<sub>2</sub> → 2H<sub>2</sub>O");
  });
  it("converts arrows", () => {
    expect(formatChemText("A <=> B")).toBe("A ⇌ B");
    expect(formatChemText("A <-> B")).toBe("A ↔ B");
    expect(formatChemText("A => B")).toBe("A ⇒ B");
  });
  it("handles hydrates", () => {
    expect(formatChemText("CuSO4.5H2O")).toBe("CuSO<sub>4</sub>·5H<sub>2</sub>O");
  });
  it("keeps state symbols normal", () => {
    expect(formatChemText("Ag+(aq) + Cl-(aq)")).toBe("Ag<sup>+</sup>(aq) + Cl<sup>−</sup>(aq)");
  });
  it("escapes HTML", () => {
    expect(formatChemText("<b>H2</b>")).toContain("&lt;b&gt;");
  });
});

describe("htmlToPlainText", () => {
  it("strips tags", () => {
    expect(htmlToPlainText("<p>H<sub>2</sub>O</p>")).toBe("H 2 O".replace(/ +/g, " ").trim());
    expect(htmlToPlainText("")).toBe("");
  });
});
