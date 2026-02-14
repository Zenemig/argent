import { describe, it, expect } from "vitest";
import { escapeHtml, logoSvg, baseLayout } from "./utils";

describe("escapeHtml", () => {
  it("escapes ampersands", () => {
    expect(escapeHtml("a & b")).toBe("a &amp; b");
  });

  it("escapes angle brackets", () => {
    expect(escapeHtml("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;",
    );
  });

  it("escapes quotes", () => {
    expect(escapeHtml('"hello" & \'world\'')).toBe(
      "&quot;hello&quot; &amp; &#39;world&#39;",
    );
  });

  it("returns empty string for empty input", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("passes through safe strings unchanged", () => {
    expect(escapeHtml("hello world 123")).toBe("hello world 123");
  });
});

describe("logoSvg", () => {
  it("returns an img tag pointing to hosted logo", () => {
    const logo = logoSvg();
    expect(logo).toContain("<img");
    expect(logo).toContain('alt="Argent"');
    expect(logo).toContain("https://argent.photo/icons/logo-email.png");
  });
});

describe("baseLayout", () => {
  it("includes HTML5 doctype", () => {
    const html = baseLayout("<p>Test</p>", "en");
    expect(html).toContain("<!DOCTYPE html>");
  });

  it("sets lang attribute to locale", () => {
    const html = baseLayout("<p>Test</p>", "es");
    expect(html).toContain('lang="es"');
  });

  it("includes the content in the card", () => {
    const content = "<h1>Hello</h1><p>World</p>";
    const html = baseLayout(content, "en");
    expect(html).toContain(content);
  });

  it("includes the logo image", () => {
    const html = baseLayout("<p>Test</p>", "en");
    expect(html).toContain("<img");
    expect(html).toContain("argent.photo/icons/logo-email.png");
  });

  it("includes English footer text for en locale", () => {
    const html = baseLayout("<p>Test</p>", "en");
    expect(html).toContain("The film photographer");
  });

  it("includes Spanish footer text for es locale", () => {
    const html = baseLayout("<p>Test</p>", "es");
    expect(html).toContain("fotógrafo analógico");
  });

  it("includes responsive meta viewport", () => {
    const html = baseLayout("<p>Test</p>", "en");
    expect(html).toContain('name="viewport"');
  });

  it("includes color-scheme meta for dark/light support", () => {
    const html = baseLayout("<p>Test</p>", "en");
    expect(html).toContain('name="color-scheme"');
    expect(html).toContain("dark light");
  });
});
