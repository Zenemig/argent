import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { LiveRegion } from "./live-region";

describe("LiveRegion", () => {
  it("renders with polite politeness by default", () => {
    render(<LiveRegion>Test content</LiveRegion>);
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-live", "polite");
  });

  it("supports assertive politeness", () => {
    render(<LiveRegion politeness="assertive">Alert!</LiveRegion>);
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-live", "assertive");
  });

  it("has aria-atomic true by default", () => {
    render(<LiveRegion>Content</LiveRegion>);
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-atomic", "true");
  });

  it("is visually hidden", () => {
    render(<LiveRegion>Hidden announcement</LiveRegion>);
    const region = screen.getByRole("status");
    expect(region.className).toContain("sr-only");
  });

  it("renders children", () => {
    render(<LiveRegion>Syncing complete</LiveRegion>);
    expect(screen.getByText("Syncing complete")).toBeInTheDocument();
  });
});
