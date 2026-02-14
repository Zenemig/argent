import { describe, it, expect } from "vitest";
import { magicLinkTemplate } from "./magic-link";

describe("magicLinkTemplate", () => {
  const defaultProps = {
    confirmation_url: "https://argent.photo/auth/confirm?token_hash=ml456&type=magiclink",
    locale: "en" as const,
  };

  it("returns subject and html", () => {
    const result = magicLinkTemplate(defaultProps);
    expect(result.subject).toBe("Your login link");
    expect(result.html).toContain("<!DOCTYPE html>");
  });

  it("includes magic link URL", () => {
    const result = magicLinkTemplate(defaultProps);
    expect(result.html).toContain("token_hash=ml456");
    expect(result.html).toContain('href="');
  });

  it("includes the CTA button", () => {
    const result = magicLinkTemplate(defaultProps);
    expect(result.html).toContain("Sign In");
  });

  it("renders Spanish when locale is es", () => {
    const result = magicLinkTemplate({ ...defaultProps, locale: "es" });
    expect(result.subject).toBe("Tu enlace de acceso");
    expect(result.html).toContain("Iniciar Sesión");
  });
});
