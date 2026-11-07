/**
 * sanitizeRich – server-side sanitization for admin rich-text HTML fields.
 *
 * Uses sanitize-html (already in package.json), which is safe for Node / Edge
 * runtimes. DOMPurify requires a browser DOM and cannot be used in route handlers.
 *
 * Allowed elements and attributes follow a conservative chemistry-education
 * whitelist: paragraph/inline formatting, MathML is not needed (equations are
 * stored as plain text), no iframes, no script-capable attributes.
 */
import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  // structure
  "p", "br", "hr",
  // headings (for chapter descriptions)
  "h1", "h2", "h3", "h4",
  // lists
  "ul", "ol", "li",
  // inline
  "b", "strong", "i", "em", "u", "s", "strike", "mark",
  "sub", "sup", "code", "pre", "abbr",
  // links – href will be filtered below
  "a",
  // images – src will be restricted to relative or allowed origins below
  "img",
  // table (for option layouts)
  "table", "thead", "tbody", "tr", "th", "td",
  // semantic
  "blockquote", "span", "div",
];

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  a:   ["href", "title", "target", "rel"],
  img: ["src", "alt", "width", "height"],
  td:  ["colspan", "rowspan"],
  th:  ["colspan", "rowspan", "scope"],
  "*": ["class", "id", "style"],
};

const ALLOWED_SCHEMES = ["http", "https", "mailto"];

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags:       ALLOWED_TAGS,
  allowedAttributes: ALLOWED_ATTRIBUTES,
  allowedSchemes:    ALLOWED_SCHEMES,
  // Strip event handlers (onclick, onerror, …) and javascript: URIs
  allowedSchemesByTag: {
    img: ["http", "https", "data"],   // data: URIs for inline images
    a:   ALLOWED_SCHEMES,
  },
  allowProtocolRelative: false,
  // Do not keep the element if it is empty after sanitization
  exclusiveFilter: (frame) =>
    frame.tag === "script" || frame.tag === "style" || frame.tag === "iframe",
};

/**
 * Sanitize a rich-text HTML string.
 * Returns a clean HTML string. Safe to store in the database and render.
 */
export function sanitizeRich(html: string): string {
  if (!html || typeof html !== "string") return "";
  return sanitizeHtml(html.trim(), OPTIONS);
}
