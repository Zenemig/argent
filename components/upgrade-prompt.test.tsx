import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/app/(app)/settings/actions", () => ({
  joinWaitlist: vi.fn(),
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

  it("renders Join Waitlist button", () => {
    render(<UpgradePrompt />);
    const cta = screen.getByText("cta");
    expect(cta.closest("button")).toBeDefined();
  });
});
