import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

let mockTier = "free";

vi.mock("@/hooks/useUserTier", () => ({
  useUserTier: () => ({
    tier: mockTier,
    isProUser: mockTier === "pro",
    isAuthenticated: mockTier !== "guest",
  }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { ProGate } from "./pro-gate";

describe("ProGate", () => {
  it("renders children for pro users", () => {
    mockTier = "pro";
    render(
      <ProGate>
        <span data-testid="child">Pro content</span>
      </ProGate>,
    );
    expect(screen.getByTestId("child")).toBeDefined();
  });

  it("renders UpgradePrompt for free users", () => {
    mockTier = "free";
    render(
      <ProGate>
        <span data-testid="child">Pro content</span>
      </ProGate>,
    );
    expect(screen.queryByTestId("child")).toBeNull();
    // UpgradePrompt renders the title key
    expect(screen.getByText("title")).toBeDefined();
  });

  it("renders nothing for free users when hidePrompt is true", () => {
    mockTier = "free";
    const { container } = render(
      <ProGate hidePrompt>
        <span data-testid="child">Pro content</span>
      </ProGate>,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing for guest users", () => {
    mockTier = "guest";
    const { container } = render(
      <ProGate>
        <span data-testid="child">Pro content</span>
      </ProGate>,
    );
    expect(container.innerHTML).toBe("");
  });
});
