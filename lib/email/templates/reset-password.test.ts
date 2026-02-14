import { describe, it, expect } from "vitest";
import { resetPasswordTemplate } from "./reset-password";

describe("resetPasswordTemplate", () => {
  const defaultProps = {
    confirmation_url: "https://argent.photo/auth/confirm?token_hash=xyz789&type=recovery",
    locale: "en" as const,
  };

  it("returns subject and html", () => {
    const result = resetPasswordTemplate(defaultProps);
    expect(result.subject).toBe("Reset your password");
    expect(result.html).toContain("<!DOCTYPE html>");
  });

  it("includes reset URL in a link", () => {
    const result = resetPasswordTemplate(defaultProps);
    expect(result.html).toContain("token_hash=xyz789");
    expect(result.html).toContain('href="');
  });

  it("includes the CTA button", () => {
    const result = resetPasswordTemplate(defaultProps);
    expect(result.html).toContain("Reset Password");
  });

  it("includes safety notice about ignoring", () => {
    const result = resetPasswordTemplate(defaultProps);
    expect(result.html).toContain("safely ignore");
  });

  it("renders Spanish when locale is es", () => {
    const result = resetPasswordTemplate({ ...defaultProps, locale: "es" });
    expect(result.subject).toBe("Restablece tu contraseña");
    expect(result.html).toContain("Restablecer Contraseña");
    expect(result.html).toContain("ignorar este correo");
  });
});
