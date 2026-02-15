import { describe, it, expect } from "vitest";
import { accountDeletedTemplate } from "./account-deleted";

describe("accountDeletedTemplate", () => {
  const defaultProps = {
    email: "user@example.com",
    locale: "en" as const,
  };

  it("returns subject and html", () => {
    const result = accountDeletedTemplate(defaultProps);
    expect(result.subject).toBe("Your Argent account has been deleted");
    expect(result.html).toContain("<!DOCTYPE html>");
  });

  it("includes account deleted heading", () => {
    const result = accountDeletedTemplate(defaultProps);
    expect(result.html).toContain("Account Deleted");
  });

  it("includes deletion body text", () => {
    const result = accountDeletedTemplate(defaultProps);
    expect(result.html).toContain("permanently deleted");
  });

  it("includes contact information", () => {
    const result = accountDeletedTemplate(defaultProps);
    expect(result.html).toContain("support@argent.photo");
  });

  it("does not include any action buttons or links", () => {
    const result = accountDeletedTemplate(defaultProps);
    expect(result.html).not.toContain("class=\"btn\"");
  });

  it("renders Spanish when locale is es", () => {
    const result = accountDeletedTemplate({ ...defaultProps, locale: "es" });
    expect(result.subject).toBe("Tu cuenta de Argent ha sido eliminada");
    expect(result.html).toContain("Cuenta Eliminada");
  });
});
