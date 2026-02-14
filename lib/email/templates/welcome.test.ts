import { describe, it, expect } from "vitest";
import { welcomeTemplate } from "./welcome";

describe("welcomeTemplate", () => {
  const defaultProps = {
    email: "user@example.com",
    locale: "en" as const,
  };

  it("returns subject and html", () => {
    const result = welcomeTemplate(defaultProps);
    expect(result.subject).toBe("Welcome to Argent");
    expect(result.html).toContain("<!DOCTYPE html>");
  });

  it("includes welcome heading", () => {
    const result = welcomeTemplate(defaultProps);
    expect(result.html).toContain("Welcome to Argent!");
  });

  it("includes dashboard CTA", () => {
    const result = welcomeTemplate(defaultProps);
    expect(result.html).toContain("Go to Dashboard");
  });

  it("includes feature highlights", () => {
    const result = welcomeTemplate(defaultProps);
    expect(result.html).toContain("cameras and lenses");
    expect(result.html).toContain("XMP sidecar");
  });

  it("does not include a token or confirmation URL", () => {
    const result = welcomeTemplate(defaultProps);
    expect(result.html).not.toContain("token_hash");
  });

  it("renders Spanish when locale is es", () => {
    const result = welcomeTemplate({ ...defaultProps, locale: "es" });
    expect(result.subject).toBe("Bienvenido a Argent");
    expect(result.html).toContain("¡Bienvenido a Argent!");
    expect(result.html).toContain("Ir al Panel");
  });
});
