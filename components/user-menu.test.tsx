import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@/lib/user-avatar", () => ({
  getUserAvatar: () => ({
    icon: "camera" as const,
    bgColor: "bg-[#F2B5A7]",
    iconColor: "text-[#6B2A1A]",
  }),
}));

vi.mock("@/app/(app)/settings/actions", () => ({
  signOut: vi.fn(),
  joinWaitlist: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/lib/avatar", () => ({
  clearGlobalAvatarKey: vi.fn(),
}));

import { UserMenu } from "./user-menu";
import userEvent from "@testing-library/user-event";

describe("UserMenu", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders avatar button with aria-label from email", () => {
    render(
      <UserMenu userId="user-1" email="test@example.com" tier="free" />,
    );
    expect(
      screen.getByRole("button", { name: "test@example.com" }),
    ).toBeDefined();
  });

  it("uses displayName for aria-label when provided", () => {
    render(
      <UserMenu
        userId="user-1"
        email="test@example.com"
        tier="free"
        displayName="John Doe"
      />,
    );
    expect(
      screen.getByRole("button", { name: "John Doe" }),
    ).toBeDefined();
  });

  it("renders avatar image when avatarUrl is provided", () => {
    const { container } = render(
      <UserMenu
        userId="user-1"
        email="test@example.com"
        tier="free"
        avatarUrl="blob:http://localhost/avatar"
      />,
    );
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img!.getAttribute("src")).toBe("blob:http://localhost/avatar");
  });

  it("does not render img when avatarUrl is null", () => {
    const { container } = render(
      <UserMenu
        userId="user-1"
        email="test@example.com"
        tier="free"
        avatarUrl={null}
      />,
    );
    expect(container.querySelector("img")).toBeNull();
  });

  it("renders settings link in dropdown menu", async () => {
    const user = userEvent.setup();
    render(
      <UserMenu userId="user-1" email="test@example.com" tier="free" />,
    );
    await user.click(screen.getByRole("button", { name: "test@example.com" }));
    const settingsItem = screen.getByText("settings");
    expect(settingsItem).toBeDefined();
    expect(settingsItem.closest("a")).toBeDefined();
    expect(settingsItem.closest("a")!.getAttribute("href")).toBe("/settings");
  });
});
