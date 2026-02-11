import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Logo, LogoIcon } from "./logo";

describe("Logo", () => {
  it("renders an SVG with aria-label", () => {
    render(<Logo />);
    const svg = screen.getByRole("img", { name: "Argent" });
    expect(svg).toBeDefined();
    expect(svg.tagName).toBe("svg");
  });

  it("applies custom className", () => {
    render(<Logo className="h-12" />);
    const svg = screen.getByRole("img", { name: "Argent" });
    expect(svg.getAttribute("class")).toContain("h-12");
  });
});

describe("LogoIcon", () => {
  it("renders an SVG with aria-label", () => {
    render(<LogoIcon />);
    const svg = screen.getByRole("img", { name: "Argent" });
    expect(svg).toBeDefined();
    expect(svg.tagName).toBe("svg");
  });

  it("applies custom className", () => {
    render(<LogoIcon className="h-16" />);
    const svg = screen.getByRole("img", { name: "Argent" });
    expect(svg.getAttribute("class")).toContain("h-16");
  });
});
