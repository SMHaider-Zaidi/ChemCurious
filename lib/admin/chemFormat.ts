// Converts typed chemistry shorthand into sanitized HTML with real <sub>/<sup> marks.
// Pure functions — safe to unit test and reuse outside the editor.

export const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const sub = (d: string) => `<sub>${d}</sub>`;
const sup = (d: string) => `<sup>${d.replace(/-/g, '−')}</sup>`;

const ARROWS: [RegExp, string][] = [
  [/<=>/g, '⇌'],
  [/<->/g, '↔'],
  [/=>/g, '⇒'],
  [/->/g, '→'],
];

const STATE_RE = /\((?:s|l|g|aq)\)$/;

/** True when a word looks like a chemical formula/ion rather than English. */
export function looksLikeFormula(token: string): boolean {
  const body = token.replace(STATE_RE, '');
  return /^[A-Z][A-Za-z0-9()]*\d*[+-]?$/.test(body) && (/[0-9(]/.test(body) || /[+-]$/.test(body));
}

/** Formats one formula token, e.g. "SO42-" -> SO<sub>4</sub><sup>2−</sup>. */
export function formatFormulaToken(token: string): string {
  if (!looksLikeFormula(token)) return escapeHtml(token);
  const state = token.match(STATE_RE)?.[0] ?? '';
  let body = state ? token.slice(0, -state.length) : token;
  let charge = '';
  const cm = body.match(/(\d*)([+-])$/);
  if (cm) {
    body = body.slice(0, -cm[0].length);
    let digits = cm[1] ?? '';
    // Disambiguate count vs charge: Fe3+ (one element) -> charge 3+;
    // NH4+ (two elements) -> 4 is an atom count; SO42- -> 4 count, 2 charge.
    const elementCount = (body.match(/[A-Z][a-z]?/g) ?? []).length;
    if (elementCount >= 2) {
      if (digits.length > 1) {
        body += digits.slice(0, -1);
        digits = digits.slice(-1);
      } else {
        body += digits;
        digits = '';
      }
    }
    charge = sup(digits + cm[2]);
  }
  const html = escapeHtml(body).replace(/([A-Za-z)])(\d+)/g, (_, a: string, d: string) => a + sub(d));
  return html + charge + state;
}

/**
 * Converts a typed string to chemistry HTML.
 * "2H2 + O2 -> 2H2O" -> "2H<sub>2</sub> + O<sub>2</sub> → 2H<sub>2</sub>O"
 * Handles arrows, hydrates (CuSO4.5H2O), charges, and leaves plain English alone.
 */
export function formatChemText(input: string): string {
  if (!input) return '';
  let s = input;
  for (const [re, arrow] of ARROWS) s = s.replace(re, ` ${arrow} `);
  s = s.replace(/[ \t]+/g, ' ');
  return s
    .split(/(\s+)/)
    .map((word) => {
      if (/^\s*$/.test(word) || word.length === 0) return word;
      if (ARROWS.some(([, a]) => word === a)) return word;
      // Trailing punctuation (",", ";", ":") stays outside the formula.
      const trail = word.match(/([,;:])$/)?.[1] ?? '';
      const body = trail ? word.slice(0, -1) : word;
      // Leading coefficient stays normal: 2H2O -> 2 + H2O
      const coef = body.match(/^(\d+)(?=[A-Z(])/)?.[1] ?? '';
      const rest = coef ? body.slice(coef.length) : body;
      // Hydrates: CuSO4.5H2O -> CuSO4·5H2O
      const parts = rest.split('.');
      const formatted = parts
        .map((p, i) => {
          const innerCoef = i > 0 ? (p.match(/^(\d+)(?=[A-Z(])/)?.[1] ?? '') : '';
          const inner = innerCoef ? p.slice(innerCoef.length) : p;
          return innerCoef + formatFormulaToken(inner);
        })
        .join('·');
      return coef + formatted + trail;
    })
    .join('');
}

/** Strips HTML tags, returning plain text (for validation and search). */
export function htmlToPlainText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Unicode formula helper (e.g. for simple label display) */
const SUB_MAP: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
};
export function formatFormulaUnicode(formula?: string | null): string {
  if (!formula || typeof formula !== 'string') return '';
  return formula.replace(/([A-Za-z)\]])(\d+)/g, (_, a: string, d: string) => {
    const subs = d.split('').map((char) => SUB_MAP[char] ?? char).join('');
    return a + subs;
  });
}
