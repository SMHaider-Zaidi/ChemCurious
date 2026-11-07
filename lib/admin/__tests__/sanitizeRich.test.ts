import { describe, it, expect } from "vitest";
import { sanitizeRich } from "../sanitizeRich";

describe("sanitizeRich", () => {
  it("passes clean text through unchanged", () => {
    const input = "<p>Hello <strong>chemistry</strong></p>";
    expect(sanitizeRich(input)).toBe(input);
  });

  it("strips <script> tags (XSS via script injection)", () => {
    const input = '<p>Safe</p><script>alert("xss")</script>';
    const out = sanitizeRich(input);
    expect(out).not.toContain("<script");
    expect(out).not.toContain("alert");
    expect(out).toContain("<p>Safe</p>");
  });

  it("strips javascript: href (XSS via link)", () => {
    const input = '<a href="javascript:alert(1)">click</a>';
    const out = sanitizeRich(input);
    expect(out).not.toContain("javascript:");
  });

  it("strips onerror attribute (XSS via event handler)", () => {
    const input = '<img src="x" onerror="alert(1)">';
    const out = sanitizeRich(input);
    expect(out).not.toContain("onerror");
  });

  it("strips <iframe> tags", () => {
    const input = '<iframe src="https://evil.com"></iframe>';
    const out = sanitizeRich(input);
    expect(out).not.toContain("iframe");
  });

  it("strips data-uri script injection", () => {
    const input = '<object data="data:text/html,<script>alert(1)</script>"></object>';
    const out = sanitizeRich(input);
    expect(out).not.toContain("<object");
    expect(out).not.toContain("<script");
  });

  it("preserves allowed img with data: src", () => {
    const input = '<img src="data:image/png;base64,abc123" alt="diagram">';
    const out = sanitizeRich(input);
    expect(out).toContain("data:image/png");
  });

  it("returns empty string for null-like input", () => {
    expect(sanitizeRich("")).toBe("");
  });

  it("strips style and class scrub to allowed", () => {
    const input = '<div class="foo" onclick="evil()">text</div>';
    const out = sanitizeRich(input);
    expect(out).not.toContain("onclick");
    expect(out).toContain("text");
  });
});
