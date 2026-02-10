import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { UpgradePrompt } from "./upgrade-prompt";

describe("UpgradePrompt", () => {
  it("renders title and description", () => {
    render(<UpgradePrompt />);
    expect(screen.getByText("title")).toBeDefined();
    expect(screen.getByText("description")).toBeDefined();
  });

  it("renders all three benefit items", () => {
    render(<UpgradePrompt />);
    expect(screen.getByText("featureSync")).toBeDefined();
    expect(screen.getByText("featureMultiDevice")).toBeDefined();
    expect(screen.getByText("featureBackup")).toBeDefined();
  });

  it("renders CTA link pointing to /pricing", () => {
    render(<UpgradePrompt />);
    const cta = screen.getByText("cta");
    expect(cta.closest("a")).toBeDefined();
    expect(cta.closest("a")?.getAttribute("href")).toBe("/pricing");
  });
});
