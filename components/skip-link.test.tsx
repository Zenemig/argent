import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { SkipLink } from "./skip-link";

describe("SkipLink", () => {
  it("renders link targeting #main-content", () => {
    render(<SkipLink />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "#main-content");
  });

  it("is visually hidden by default", () => {
    render(<SkipLink />);
    const link = screen.getByRole("link");
    expect(link.className).toContain("sr-only");
  });

  it("renders translated text", () => {
    render(<SkipLink />);
    expect(screen.getByText("skipToMain")).toBeInTheDocument();
  });
});
