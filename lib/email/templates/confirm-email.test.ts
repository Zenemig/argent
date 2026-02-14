import { describe, it, expect } from "vitest";
import { confirmEmailTemplate } from "./confirm-email";

describe("confirmEmailTemplate", () => {
  const defaultProps = {
    confirmation_url: "https://argent.photo/auth/confirm?token_hash=abc123&type=email",
    locale: "en" as const,
  };

  it("returns subject and html", () => {
    const result = confirmEmailTemplate(defaultProps);
    expect(result.subject).toBe("Confirm your email");
    expect(result.html).toContain("<!DOCTYPE html>");
  });

  it("includes confirmation URL in a link", () => {
    const result = confirmEmailTemplate(defaultProps);
    // & is escaped to &amp; in HTML attributes (correct behavior)
    expect(result.html).toContain("token_hash=abc123");
    expect(result.html).toContain('href="');
  });

  it("includes the CTA button", () => {
    const result = confirmEmailTemplate(defaultProps);
    expect(result.html).toContain("Confirm Email");
  });

  it("includes fallback link text", () => {
    const result = confirmEmailTemplate(defaultProps);
    expect(result.html).toContain("copy and paste this link");
  });

  it("renders Spanish when locale is es", () => {
    const result = confirmEmailTemplate({ ...defaultProps, locale: "es" });
    expect(result.subject).toBe("Confirma tu correo electrónico");
    expect(result.html).toContain("Confirmar Correo");
    expect(result.html).toContain("copia y pega este enlace");
  });
});
