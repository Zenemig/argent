import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

let mockPathname = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>
      {children as React.ReactNode}
    </a>
  ),
}));

vi.mock("@/components/sync-status", () => ({
  SyncStatus: () => <div data-testid="sync-status" />,
}));

vi.mock("@/components/logo", () => ({
  Logo: () => <div data-testid="logo" />,
}));

import { SidebarNav } from "./sidebar-nav";

describe("SidebarNav", () => {
  it("renders logo and navigation items", () => {
    render(<SidebarNav />);
    expect(screen.getByTestId("logo")).toBeDefined();
    expect(screen.getByText("dashboard")).toBeDefined();
    expect(screen.getByText("gear")).toBeDefined();
    expect(screen.getByText("stats")).toBeDefined();
    expect(screen.getByText("settings")).toBeDefined();
  });

  it("renders links to correct paths", () => {
    render(<SidebarNav />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/");
    expect(hrefs).toContain("/gear");
    expect(hrefs).toContain("/stats");
    expect(hrefs).toContain("/settings");
  });

  it("renders user menu when provided", () => {
    render(<SidebarNav userMenu={<div data-testid="user-menu">Menu</div>} />);
    expect(screen.getByTestId("user-menu")).toBeDefined();
  });

  it("renders sync status", () => {
    render(<SidebarNav />);
    expect(screen.getByTestId("sync-status")).toBeDefined();
  });
});
